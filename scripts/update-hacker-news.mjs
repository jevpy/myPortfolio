import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_BASE, requestJson, articleFromHit } from './hacker-news.mjs';
import { WINDOW_SECONDS, SCHEMA_VERSION, selectArticles, emptySnapshot, validateSnapshot, normalizeSnapshot, mergeHistory } from '../src/data/hacker-news.mjs';
import { collectDevto } from './devto.mjs';
import { collectInfoq } from './infoq.mjs';
export { API_BASE };

// Bounded discovery: 25 queries x 2 pages x 100 hits, not an exhaustive index.
export const SEARCH_QUERIES = Object.freeze([
  'LLM', 'artificial intelligence', 'machine learning', 'AI agent',
  'coding agent', 'harness', 'inference', 'fine tuning',
  'security', 'vulnerability', 'CVE', 'cryptography',
  'Kubernetes', 'AWS', 'cloud infrastructure', 'Terraform',
  'software engineering', 'distributed systems', 'code review', 'software architecture',
  'web development', 'JavaScript', 'n8n', 'OAuth', 'API integration',
]);
const HITS_PER_PAGE = 100;
const MAX_PAGES = 2;

const DEFAULT_OUTPUT = fileURLToPath(new URL('../src/data/hacker-news.json', import.meta.url));
function bounded(name, value, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw Error(`Invalid ${name} (expected ${min}..${max})`);
}
export async function collectHackerNews({ fetchImpl = globalThis.fetch, now = new Date(), concurrency = 4, maxScan = 5000, timeoutMs = 5000, attempts = 3, retryDelayMs = 200 } = {}) {
  bounded('concurrency', concurrency, 1, 20);
  bounded('maxScan', maxScan, 1, 5000);
  bounded('timeoutMs', timeoutMs, 1, 30000);
  bounded('attempts', attempts, 1, 3);
  bounded('retryDelayMs', retryDelayMs, 0, 5000);
  const clock = new Date(now).getTime() / 1000;
  if (!Number.isFinite(clock)) throw Error('Invalid collection clock');
  if (typeof fetchImpl !== 'function') throw Error('fetch is required');
  const options = { fetchImpl, timeoutMs, attempts, retryDelayMs };
  const candidates = [];
  let jobs = SEARCH_QUERIES.map(query => ({ query, page: 0 }));
  let scanned = 0;
  for (let page = 0; page < MAX_PAGES && jobs.length && scanned < maxScan; page++) {
    const next = [];
    for (let offset = 0; offset < jobs.length && scanned < maxScan; offset += concurrency) {
      const batch = jobs.slice(offset, offset + concurrency);
      const results = await Promise.allSettled(batch.map(async job => {
        const params = new URLSearchParams({ query: job.query, tags: 'story', restrictSearchableAttributes: 'title', numericFilters: `created_at_i>=${Math.ceil(clock - WINDOW_SECONDS)},created_at_i<=${Math.floor(clock)}`, hitsPerPage: String(HITS_PER_PAGE), page: String(job.page) });
        const response = await requestJson(`search_by_date?${params}`, options);
        if (!response || !Array.isArray(response.hits) || response.hits.length > HITS_PER_PAGE || !Number.isSafeInteger(response.nbPages) || response.nbPages < 0 || response.nbPages > 10000 || response.page !== job.page || (response.nbPages === 0 ? response.hits.length !== 0 || job.page !== 0 : job.page >= response.nbPages)) throw Error('Invalid search pagination schema');
        // Validate all fetched shapes, even those beyond an optional scan limit.
        return { ...job, nbPages: response.nbPages, articles: response.hits.map(hit => articleFromHit(hit, clock)) };
      }));
      const failed = results.find(result => result.status === 'rejected');
      if (failed) throw failed.reason;
      for (const result of results) {
        const value = result.value;
        for (const article of value.articles) {
          if (scanned++ < maxScan && article) candidates.push(article);
        }
        if (value.nbPages > page + 1) next.push({ query: value.query, page: page + 1 });
      }
    }
    jobs = next;
  }
  return candidates;
}

export const PROVIDERS = Object.freeze({ hn: collectHackerNews, devto: collectDevto, infoq: collectInfoq });
export async function collectArticles({ now = new Date(), providers = PROVIDERS, ...options } = {}) {
  const clock = new Date(now).getTime() / 1000;
  if (!Number.isFinite(clock)) throw Error('Invalid collection clock');
  const candidates = [];
  // Every enabled provider must succeed before selection or any filesystem write.
  for (const source of Object.keys(PROVIDERS)) {
    if (typeof providers[source] !== 'function') throw Error(`Missing provider: ${source}`);
    try {
      const rows = await providers[source]({ ...options, now }, clock);
      if (!Array.isArray(rows)) throw Error('Invalid provider result');
      candidates.push(...rows);
    } catch {
      // Never expose upstream response bodies, request URLs or arbitrary messages.
      throw Error(`Source ${source} failed`);
    }
  }
  return selectArticles(candidates);
}

// A missing file starts an empty history; an unreadable one aborts the refresh
// so a corrupt snapshot can never silently erase the accumulated history.
export async function readHistory(outputPath, fileSystem = fs) {
  let bytes;
  try { bytes = await fileSystem.readFile(outputPath, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  let value;
  try { value = JSON.parse(bytes); }
  catch { throw Error('Stored news history is not valid JSON'); }
  return (value?.schemaVersion === SCHEMA_VERSION ? validateSnapshot(value) : normalizeSnapshot(value)).articles;
}

export async function refreshHackerNews({ outputPath = DEFAULT_OUTPUT, fileSystem = fs, now = () => new Date(), ...options } = {}) {
  const refreshedAt = now();
  if (!(refreshedAt instanceof Date) || !Number.isFinite(refreshedAt.getTime())) throw Error('Invalid refresh clock');
  const fresh = await collectArticles({ ...options, now: refreshedAt });
  const articles = mergeHistory(fresh, await readHistory(outputPath, fileSystem));
  const snapshot = validateSnapshot({ ...emptySnapshot(), updatedAt: refreshedAt.toISOString(), articles });
  const bytes = `${JSON.stringify(snapshot, null, 2)}\n`;
  const temporary = `${outputPath}.${randomUUID()}.tmp`;
  let created = false;
  try {
    // Same-directory exclusive temporary file, followed by one atomic rename.
    // The old output is never opened for writing or deleted as a fallback.
    await fileSystem.writeFile(temporary, bytes, { encoding: 'utf8', flag: 'wx' });
    created = true;
    await fileSystem.rename(temporary, outputPath);
    created = false;
  } catch (error) {
    // A failed write can leave a partial temporary file. EEXIST must never cause
    // another process's exclusive temporary file to be removed.
    if (created || error.code !== 'EEXIST') {
      try { await fileSystem.unlink(temporary); }
      catch (cleanupError) { if (cleanupError.code !== 'ENOENT') throw new AggregateError([error, cleanupError], 'Refresh failed and temporary cleanup failed'); }
    }
    throw error;
  }
  return snapshot;
}

// Importing this module never fetches, writes, or starts a CLI.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  refreshHackerNews().then(snapshot => {
    console.log(`Updated ${snapshot.articles.length} news articles at ${snapshot.updatedAt}`);
  }).catch(error => {
    console.error(`News refresh failed: ${error.message}`);
    process.exitCode = 1;
  });
}
