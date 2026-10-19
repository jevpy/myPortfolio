// Display size only: selection and topic totals remain uncapped.
export const BLOG_PAGE_SIZE = 12;

function resolvePage(raw, pageCount) {
  if (typeof raw !== 'string' || !/^[0-9]+$/.test(raw)) return 1;
  const digits = raw.replace(/^0+/, '');
  if (!digits) return 1;
  const last = String(pageCount);
  // Compare decimal strings before conversion to avoid precision loss/overflow.
  if (digits.length > last.length || (digits.length === last.length && digits > last)) return pageCount;
  return Number(digits);
}

export function paginateBlogArticles(articles, rawPage) {
  const pageCount = Math.max(1, Math.ceil(articles.length / BLOG_PAGE_SIZE));
  const page = resolvePage(rawPage, pageCount);
  const offset = (page - 1) * BLOG_PAGE_SIZE;
  const items = articles.slice(offset, offset + BLOG_PAGE_SIZE);
  const windowTokens = [];
  const start = Math.max(2, Math.min(page - 2, pageCount - 5));
  const end = Math.min(pageCount - 1, start + 4);
  const pages = pageCount <= 9 ? Array.from({ length: pageCount }, (_, i) => i + 1) :
    [1, ...Array.from({ length: end - start + 1 }, (_, i) => start + i), pageCount];
  for (const value of pages) {
    const previous = windowTokens.at(-1);
    if (typeof previous === 'number' && value - previous > 1) windowTokens.push('ellipsis');
    windowTokens.push(value);
  }
  return { page, pageCount, offset, items, range: articles.length ? [offset + 1, offset + items.length] : [0, 0], windowTokens };
}

function readingHref(url, query) {
  return `${url.pathname}${query.size ? `?${query}` : ''}#reading`;
}

export function readingPageHref(url, page) {
  const query = new URLSearchParams(url.search);
  query.set('page', String(page));
  return readingHref(url, query);
}

export function readingTopicHref(url, key) {
  const query = new URLSearchParams(url.search);
  query.delete('page');
  query.delete('topic');
  if (key) query.set('topic', key);
  return readingHref(url, query);
}
