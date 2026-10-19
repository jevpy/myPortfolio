import { requestJsonUrl } from './news-http.mjs';
import { makeArticle, safeId, isArticleDestination, isDevtoPostUrl } from '../src/data/hacker-news.mjs';

export const DEV_TAGS = Object.freeze(['ai', 'machinelearning', 'architecture', 'webdev', 'n8n', 'oauth', 'integrations', 'devops', 'security']);
export const PUBLICATION_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export async function collectDevto(options, clock) {
  const candidates = [];
  // Forem's native weekly-popularity retrieval; not a local reaction ranking.
  // Still date-filter every row; the mixed-source collector sorts newest first.
  for (const tag of DEV_TAGS) {
    for (let page = 1; page <= 2; page++) {
      const rows = await requestJsonUrl(`https://dev.to/api/articles?tag=${tag}&top=7&page=${page}&per_page=100`, {
        ...options, headers: { Accept: 'application/vnd.forem.api-v1+json' },
      });
      if (!Array.isArray(rows) || rows.length > 100) throw Error('Invalid DEV response');
      for (const row of rows) {
        if (!row || !safeId(row.id) || typeof row.published_at !== 'string' ||
            !PUBLICATION_ISO.test(row.published_at) || !Number.isFinite(Date.parse(row.published_at)) ||
            !Array.isArray(row.tag_list)) throw Error('Invalid DEV article');
        const url = isArticleDestination(row.canonical_url, row.title) ? row.canonical_url :
          isDevtoPostUrl(row.url) && isArticleDestination(row.url, row.title) ? row.url : null;
        const article = makeArticle({
          source: 'devto', sourceId: String(row.id), title: row.title,
          url,
          eventAt: new Date(row.published_at).toISOString(), sourceTags: row.tag_list,
        }, clock);
        if (article) candidates.push(article);
      }
      if (rows.length < 100) break;
    }
  }
  return candidates;
}
