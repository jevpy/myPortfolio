import { classifyArticle, CLASSIFIER_VERSION } from './article-topics.mjs';

export const SCHEMA_VERSION = 4;
const LEGACY_SCHEMA3_SELECTION = Object.freeze({ windowDays: 7, maxArticles: 10, order: 'newest', classifierVersion: 2 });
export const WINDOW_SECONDS = 7 * 24 * 60 * 60;
export const SOURCES = Object.freeze({
  hn: Object.freeze({ name: 'HN Search Algolia', url: 'https://news.ycombinator.com/', dateKind: 'submitted' }),
  devto: Object.freeze({ name: 'DEV', url: 'https://dev.to/', dateKind: 'published' }),
  infoq: Object.freeze({ name: 'InfoQ', url: 'https://www.infoq.com/', dateKind: 'published' }),
});
export const SOURCE = SOURCES.hn;
// windowDays bounds collection only; stored history keeps every older article.
export const SELECTION = Object.freeze({ windowDays: 7, order: 'newest', classifierVersion: CLASSIFIER_VERSION });
export const safeId = value => Number.isSafeInteger(value) && value > 0;
export const safeTime = value => Number.isFinite(value) && value >= 0 && value <= 8640000000000;
export const safeTitle = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000;
export function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 8192) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? value : null;
  } catch { return null; }
}
// Editorial screening is deliberately separate from the HTTP transport guard.
// This URL/title heuristic cannot verify bodies or eventual redirect destinations.
const hostWithin = (host, domain) => host === domain || host.endsWith(`.${domain}`);
function destinationUrl(value) {
  try { return safeUrl(value) ? new URL(value) : null; } catch { return null; }
}
export function isDevtoPostUrl(value) {
  const url = destinationUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  return ['dev.to', 'www.dev.to'].includes(host) &&
    /^\/[a-z0-9_-]+\/[a-z0-9_-]+\/?$/i.test(url.pathname) &&
    !/^\/(?:t|tags|top|search|settings|dashboard|api|admin|organizations|pod)\//i.test(url.pathname);
}
export function isArticleDestination(value, title) {
  const url = destinationUrl(value);
  if (!url || !safeTitle(title)) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  let path;
  try { path = decodeURIComponent(url.pathname).toLowerCase(); } catch { return false; }
  if (['github.com', 'githubusercontent.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org',
    'sourceforge.net', 'sr.ht', 'sourcehut.org'].some(domain => hostWithin(host, domain))) return false;
  // File downloads/raw code and explicit interactive destinations, not marketing-domain guesses.
  if (/^(?:demo|demos|playground|playgrounds|raw|download|downloads)\./.test(host) ||
      /\/(?:demo|demos|playground|playgrounds|raw|download|downloads)(?:\.html)?(?:\/|$)/.test(path) ||
      /\.(?:zip|tar|gz|tgz|exe|dmg|msi|apk|wasm|js|mjs|ts|py|json|ipynb|md|txt)$/.test(path)) return false;
  if (['codepen.io', 'jsfiddle.net', 'stackblitz.com', 'codesandbox.io', 'huggingface.co', 'hf.co', 'huggingface.space']
    .some(domain => hostWithin(host, domain))) {
    // Hugging Face's model/dataset/space pages are not posts; its individual blog posts are.
    return ['huggingface.co', 'www.huggingface.co'].includes(host) &&
      /^\/blog\/(?:community\/[^/]+\/)?(?!index(?:\.html)?\/?$)[^/]+\/?$/.test(path);
  }
  if (hostWithin(host, 'dev.to')) return isDevtoPostUrl(value);
  if (hostWithin(host, 'github.io')) {
    // Project roots and blog indexes are not identifiable individual articles.
    return /\/(?:blog|posts|articles)\/(?!index(?:\.html)?(?:\/|$))[^/]+(?:\/index\.html)?\/?$/.test(path) ||
      /\/\d{4}\/\d{2}\/\d{2}\/[^/]+(?:\/index\.html)?\/?$/.test(path) ||
      /\/\d{4}-\d{2}-\d{2}-[^/]+\/?$/.test(path);
  }
  return true; // Unknown publishers remain possible articles; no body is fetched to prove it.
}

// Comparison only: the displayed/stored destination is NEVER rewritten.
export function canonicalUrlKey(value) {
  try {
    if (!safeUrl(value)) return null;
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.href;
  } catch { return null; }
}
export const discussionUrl = id => `https://news.ycombinator.com/item?id=${id}`;
export const articleOrder = (a, b) => b.time - a.time || a.id.localeCompare(b.id, 'en');
export function emptySnapshot() {
  return { schemaVersion: SCHEMA_VERSION, sources: SOURCES, selection: SELECTION, updatedAt: null, articles: [] };
}
export function selectArticles(candidates) {
  const ids = new Set(), urls = new Set();
  return [...candidates].sort((a, b) => articleOrder(a, b) || a.title.localeCompare(b.title, 'en') || a.url.localeCompare(b.url, 'en'))
    .filter(article => {
      const key = canonicalUrlKey(article.url);
      if (ids.has(article.id) || urls.has(key)) return false;
      ids.add(article.id); urls.add(key);
      return true;
    });
}
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
// Semantic shape equality: property insertion order is not part of JSON's contract.
function sameShape(actual, expected) {
  if (actual === expected) return true;
  if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object' || Array.isArray(actual) !== Array.isArray(expected)) return false;
  const keys = Object.keys(expected);
  return Object.keys(actual).length === keys.length && keys.every(key => Object.hasOwn(actual, key) && sameShape(actual[key], expected[key]));
}
export function makeArticle(input, clock) {
  return buildArticle(input, clock, true, true);
}
// The legacy path is private: it relaxes only the new destination rule, never structural validation.
function buildArticle({ source, sourceId, title, url, eventAt, sourceTags = [] }, clock, screenDestination, windowed) {
  if (!Object.hasOwn(SOURCES, source) || typeof sourceId !== 'string' || !sourceId || sourceId.length > 2048 ||
      (source !== 'infoq' && (!/^[1-9]\d*$/.test(sourceId) || !safeId(Number(sourceId)))) ||
      !safeTitle(title) || !validDate(eventAt) || !Array.isArray(sourceTags) || sourceTags.length > 50 ||
      sourceTags.some(tag => typeof tag !== 'string' || tag.length > 100) ||
      source === 'hn' && sourceTags.length > 0 || !Number.isFinite(clock)) throw Error('Invalid source article');
  const time = Date.parse(eventAt) / 1000;
  if (source === 'hn' && !Number.isInteger(time)) throw Error('Invalid submission precision');
  if (!safeUrl(url) || screenDestination && !isArticleDestination(url, title) || time > clock || windowed && time < clock - WINDOW_SECONDS) return null;
  const topics = classifyArticle(title, url, sourceTags);
  if (!topics) return null;
  const dateKind = SOURCES[source].dateKind;
  return {
    id: `${source}:${sourceId}`, source, sourceId, title, url, time, eventAt, dateKind,
    [dateKind === 'submitted' ? 'submittedAt' : 'publishedAt']: eventAt,
    ...(source === 'hn' ? { discussionUrl: discussionUrl(sourceId) } : {}),
    sourceTags: [...sourceTags], ...topics,
  };
}
export function validateSnapshot(value) {
  return validateEnvelope(value, SCHEMA_VERSION, SELECTION, true);
}
// Schema3's original contract is pinned, not inferred from current selection policy.
function validateSchema3(value) {
  return validateEnvelope(value, 3, LEGACY_SCHEMA3_SELECTION, false);
}
function validateEnvelope(value, schemaVersion, selection, screenDestination) {
  if (!value || value.schemaVersion !== schemaVersion || !sameShape(value.sources, SOURCES) ||
      !sameShape(value.selection, selection) || !Array.isArray(value.articles) ||
      schemaVersion === 3 && value.articles.length > LEGACY_SCHEMA3_SELECTION.maxArticles ||
      !(validDate(value.updatedAt) || value.updatedAt === null && value.articles.length === 0)) throw Error('Invalid news snapshot');
  const clock = Date.parse(value.updatedAt) / 1000;
  const articles = value.articles.map(article => {
    // Schema3 stayed a rolling window; schema4 is an accumulated history.
    const rebuilt = buildArticle(article, clock, screenDestination, schemaVersion === 3);
    if (!rebuilt || !sameShape(article, rebuilt)) throw Error('Invalid news article');
    return rebuilt;
  });
  if (!sameShape(selectArticles(articles), articles)) throw Error('Invalid news order or duplicates');
  const snapshot = { schemaVersion, sources: SOURCES, selection, updatedAt: value.updatedAt, articles };
  if (!sameShape(value, snapshot)) throw Error('Unexpected snapshot fields');
  return snapshot;
}
// Pure offline migration: dates and URLs are retained, categories recomputed;
// unmatched entries disappear and duplicate identities/URLs are selected globally.
export function migrateSchema2(value) {
  if (!value || value.schemaVersion !== 2 || !validDate(value.updatedAt) || !Array.isArray(value.articles)) throw Error('Invalid legacy snapshot');
  const clock = Date.parse(value.updatedAt) / 1000;
  const articles = value.articles.map(article => {
    if (!safeId(article.id) || !safeTime(article.time) ||
        article.submittedAt !== new Date(article.time * 1000).toISOString() || 'publishedAt' in article) throw Error('Invalid legacy article');
    return makeArticle({ source: 'hn', sourceId: String(article.id), title: article.title, url: article.url, eventAt: article.submittedAt }, clock);
  }).filter(Boolean);
  return validateSnapshot({ ...emptySnapshot(), updatedAt: value.updatedAt, articles: selectArticles(articles) });
}
export function normalizeSnapshot(value) {
  try {
    if (value?.schemaVersion === 2) return migrateSchema2(value);
    if (value?.schemaVersion === SCHEMA_VERSION) return validateSnapshot(value);
    // Validate ALL original rows, envelope, ordering and duplicates before excluding anything.
    const legacy = validateSchema3(value);
    return validateSnapshot({ ...emptySnapshot(), updatedAt: legacy.updatedAt, articles: legacy.articles.filter(article => isArticleDestination(article.url, article.title)) });
  } catch { return emptySnapshot(); }
}
// Fresh rows replace stored copies with the same id; selection then drops URL duplicates.
export function mergeHistory(fresh, previous) {
  const ids = new Set(fresh.map(article => article.id));
  return selectArticles([...fresh, ...previous.filter(article => !ids.has(article.id))]);
}
export function getArticles(snapshot, now = new Date()) {
  const clock = new Date(now).getTime() / 1000;
  return normalizeSnapshot(snapshot).articles.filter(article => article.time <= clock);
}
export function getRecentArticles(snapshot, now = new Date()) {
  const clock = new Date(now).getTime() / 1000;
  return normalizeSnapshot(snapshot).articles.filter(article => article.time <= clock && article.time >= clock - WINDOW_SECONDS);
}
