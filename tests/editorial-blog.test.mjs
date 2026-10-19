import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { displayArticleTitle, articleHostname } from '../src/data/article-presentation.mjs';
import { getRecentArticles, discussionUrl, validateSnapshot, isArticleDestination } from '../src/data/hacker-news.mjs';
import { classifyArticle, CATEGORIES } from '../src/data/article-topics.mjs';
import { blogCopy, blogTopics, resolveBlogTopic, filterBlogArticles, blogTagLabel } from '../src/i18n/blog.ts';

const blog = await readFile(new URL('../src/views/BlogPage.astro', import.meta.url), 'utf8');

test('pagination validates decimal requests, clamps safely and never caps totals', async () => {
  const { paginateBlogArticles, BLOG_PAGE_SIZE, readingPageHref, readingTopicHref } = await import('../src/data/blog-pagination.mjs');
  assert.equal(BLOG_PAGE_SIZE, 12);
  for (const total of [0, 1, 12, 13, 25, 10000]) {
    const rows = Array.from({ length: total }, (_, i) => i);
    const last = Math.max(1, Math.ceil(total / 12));
    for (const request of [null, '1', '2', String(last), '9'.repeat(400)]) {
      const result = paginateBlogArticles(rows, request);
      const page = request === null ? 1 : request.length > 10 ? last : Math.min(Number(request), last);
      assert.equal(result.page, page);
      assert.equal(result.pageCount, last);
      assert.equal(result.offset, (page - 1) * 12);
      assert.deepEqual(result.items, rows.slice(result.offset, result.offset + 12));
      assert.deepEqual(result.range, total ? [result.offset + 1, result.offset + result.items.length] : [0, 0]);
      assert.ok(result.windowTokens.length <= 9);
      assert.equal(result.windowTokens[0], 1);
      assert.equal(result.windowTokens.at(-1), last);
      assert.ok(result.windowTokens.includes(page));
    }
    for (const invalid of ['0', '-1', '+1', ' 2', '2 ', '1.2', '1e2', '', 'NaN', 'Infinity', '0'.repeat(400)]) {
      assert.equal(paginateBlogArticles(rows, invalid).page, 1, invalid);
    }
    assert.equal(paginateBlogArticles(rows, '0002').page, Math.min(2, last));
  }
  const large = Array(10000).fill(1);
  for (let page = 1; page <= 834; page++) {
    const tokens = paginateBlogArticles(large, String(page)).windowTokens;
    assert.ok(tokens.length <= 9);
    assert.equal(tokens[0], 1);
    assert.equal(tokens.at(-1), 834);
    assert.ok(tokens.includes(page));
    const numbers = tokens.filter(token => typeof token === 'number');
    assert.equal(new Set(numbers).size, numbers.length);
    assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
  }
  const url = new URL('https://example.test/es/blog?topic=ai&page=2&page=3&other=%22%26');
  assert.equal(paginateBlogArticles(Array(25).fill(1), url.searchParams.get('page')).page, 2);
  const pageUrl = new URL(readingPageHref(url, 3), url);
  assert.equal(pageUrl.pathname, '/es/blog');
  assert.deepEqual(pageUrl.searchParams.getAll('page'), ['3']);
  assert.equal(pageUrl.searchParams.get('topic'), 'ai');
  assert.equal(pageUrl.searchParams.get('other'), '"&');
  assert.equal(pageUrl.hash, '#reading');
  const topicUrl = new URL(readingTopicHref(url, 'security'), url);
  assert.equal(topicUrl.searchParams.has('page'), false);
  assert.equal(topicUrl.searchParams.get('topic'), 'security');
  assert.equal(new URL(readingTopicHref(url), url).searchParams.has('topic'), false);
  const rows = Array.from({ length: 40 }, (_, i) => ({ primaryCategory: i < 25 ? 'Security' : 'AI Engineering' }));
  const filtered = filterBlogArticles(rows, resolveBlogTopic('security'));
  assert.equal(filtered.length, 25);
  assert.equal(paginateBlogArticles(filtered, '3').offset, 24);
  assert.equal(blogTopics.reduce((sum, topic) => sum + filterBlogArticles(rows, topic).length, 0), 40);
});

test('SSR pagination wiring and bilingual accessible controls preserve full counts', () => {
  assert.match(blog, /paginateBlogArticles\(articles, Astro.url.searchParams.get\('page'\)\)/);
  assert.match(blog, /pagination.items.map/);
  assert.match(blog, /start=\{pagination.offset \+ 1\}/);
  assert.match(blog, /pagination.offset \+ index \+ 1/);
  assert.match(blog, /pagination.page > 1 && <a/);
  assert.match(blog, /pagination.page < pagination.pageCount && <a/);
  assert.match(blog, /pagination.pageCount > 1 && <nav/);
  assert.match(blog, /token === 'ellipsis' \? <span/);
  assert.match(blog, /allPosts.map\(post/);
  assert.match(blog, /class="blog-pagination" aria-label=\{t.pagination\}/);
  assert.match(blog, /aria-current=\{token === pagination.page \? 'page' : undefined\}/);
  for (const locale of ['en', 'es']) {
    const copy = blogCopy[locale];
    for (const key of ['pagination', 'page', 'previous', 'next']) assert.ok(copy[key]);
    assert.equal(copy.range(13, 24, 25), locale === 'en' ? 'Showing 13–24 of 25' : 'Mostrando 13–24 de 25');
  }
});

test('six bilingual primary topics, safe legacy aliases and separate translated tags', () => {
  assert.deepEqual(blogTopics.map(topic => topic.category), CATEGORIES);
  assert.deepEqual(blogTopics.map(topic => topic.key), ['ai-engineering', 'software-architecture', 'web-development', 'automation-integrations', 'cloud-devops', 'security']);
  for (const topic of blogTopics) {
    assert.ok(topic.en && topic.es);
    assert.equal(resolveBlogTopic(topic.key), topic);
  }
  for (const [alias, key] of Object.entries({ ai: 'ai-engineering', harnesses: 'ai-engineering', development: 'web-development', 'software-engineering': 'software-architecture', cloud: 'cloud-devops' })) {
    assert.equal(resolveBlogTopic(alias)?.key, key);
  }
  for (const unknown of [null, '', 'unknown', '__proto__', 'constructor', 'toString']) assert.equal(resolveBlogTopic(unknown), undefined);
  assert.equal(blogTagLabel('AI', 'es'), 'IA');
  assert.equal(blogTagLabel('Harnesses', 'es'), 'Harnesses');
  assert.equal(blogTagLabel('Agents', 'es'), 'Agentes');
  assert.equal(blogTagLabel('AI', 'en'), 'AI');
});

test('counts and filters partition by primary category, never secondary categories or tags', () => {
  const articles = [
    { primaryCategory: 'Security', categories: ['Security', 'AI Engineering'], tags: ['AI', 'Harnesses'] },
    { primaryCategory: 'AI Engineering', categories: ['AI Engineering', 'Web Development'], tags: ['AI'] },
  ];
  assert.deepEqual(filterBlogArticles(articles, resolveBlogTopic('ai')), [articles[1]]);
  assert.deepEqual(filterBlogArticles(articles, resolveBlogTopic('security')), [articles[0]]);
  assert.deepEqual(filterBlogArticles(articles, resolveBlogTopic('development')), []);
  assert.equal(filterBlogArticles(articles, resolveBlogTopic('unknown')), articles);
  assert.equal(blogTopics.reduce((sum, topic) => sum + filterBlogArticles(articles, topic).length, 0), articles.length);
  assert.match(blog, /filterBlogArticles\(recent, topic\)\.length/);
  assert.match(blog, /article\.tags\.map/);
  assert.doesNotMatch(blog, /article\.categories/);
});

test('all article opening links include one localized new-tab notice and safe target/rel', () => {
  const anchors = [...blog.matchAll(/<a\b[^>]*href=\{(?:article\.url|post\.url)\}[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  assert.equal(anchors.length, 4);
  for (const anchor of anchors) {
    assert.match(anchor, /target="_blank"/);
    assert.match(anchor, /rel="noopener noreferrer"/);
    assert.equal((anchor.match(/\{t\.newTab\}/g) ?? []).length, 1);
    assert.match(anchor, /class="blog-sr-only"/);
    assert.doesNotMatch(anchor, /aria-label|aria-describedby/);
  }
  assert.match(blogCopy.en.newTab, /opens in a new tab/);
  assert.match(blogCopy.es.newTab, /se abre en una pestaña nueva/);
  assert.match(blog, /<a href=\{topicHref\([^)]*\)\} aria-current/);
});

test('current seed has eligible original destinations and honest display dates', async () => {
  const seed=JSON.parse(await readFile(new URL('../src/data/hacker-news.json',import.meta.url),'utf8'));
  assert.deepEqual(validateSnapshot(seed),seed);
  const recent=getRecentArticles(seed,new Date(seed.updatedAt));
  assert.deepEqual(recent,seed.articles);
  for(const row of recent) assert.equal(isArticleDestination(row.url,row.title),true,row.url);
  assert.equal(blogTopics.reduce((sum,topic)=>sum+filterBlogArticles(recent,topic).length,0),recent.length);
  for (const row of recent) {
    assert.equal(row.dateKind,row.source==='hn'?'submitted':'published');
    assert.equal(row.eventAt,row[row.dateKind==='submitted'?'submittedAt':'publishedAt']);
  }
  assert.deepEqual(getRecentArticles(seed,new Date(Date.parse(seed.updatedAt)+8*24*60*60*1000)),[]);
});

test('mixed-source dates use validated eventAt and truthful published/shared labels', () => {
  assert.match(blog, /article\.dateKind === 'published' \? t\.published : t\.shared/);
  assert.match(blog, /datetime=\{article\.eventAt\}/);
  assert.match(blog, /blogDate\(article\.eventAt, locale\)/);
  assert.doesNotMatch(blog, /article\.submittedAt|HN Search|Algolia|Hacker News/);
  assert.equal(blogCopy.en.published, 'Published');
  assert.equal(blogCopy.en.shared, 'Shared');
  assert.equal(blogCopy.es.published, 'Publicado');
  assert.equal(blogCopy.es.shared, 'Compartido');
});

test('removed reading copy has no nodes or locale fields; notebook and live filtering remain', async () => {
  assert.doesNotMatch(blog, /t\.(readingLead|dateNote)|editorial-date-note/);
  for (const locale of ['en', 'es']) {
    assert.equal(Object.hasOwn(blogCopy[locale], 'readingLead'), false);
    assert.equal(Object.hasOwn(blogCopy[locale], 'dateNote'), false);
    assert.ok(blogCopy[locale].notebookLead);
  }
  assert.match(blog, /class="blog-lead">\{t.notebookLead\}/);
  assert.match(blog, /getRecentArticles\(snapshotData, new Date\(\)\)/);
  assert.match(blog, /filterBlogArticles\(recent, selected\)/);
  const css = await readFile(new URL('../src/styles/blog.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /editorial-date-note|\.editorial-reading \.blog-section-head > \.blog-lead/);
  assert.match(css, /\.blog-lead \{/);
});

test('display removes only leading syndication labels, without translation or publisher removal', () => {
  for (const [raw, expected] of [
    ['Show HN: TypeScript compiler', 'TypeScript compiler'],
    ['sHoW hN:\tTypeScript compiler', 'TypeScript compiler'],
    ['Ask HN: AI engineering?', 'AI engineering?'],
    ['ASK HN:AWS infrastructure', 'AWS infrastructure'],
    ['Show HN:', 'Show HN:'],
    ['Ask HN:   ', 'Ask HN:   '],
    ['The Register: AI engineering', 'The Register: AI engineering'],
    ['Una biblioteca de TypeScript', 'Una biblioteca de TypeScript'],
    ['Notes on Show HN: TypeScript', 'Notes on Show HN: TypeScript'],
    ['Hacker News discusses AI', 'Hacker News discusses AI'],
    ['<script>alert(1)</script>', '<script>alert(1)</script>'],
  ]) assert.equal(displayArticleTitle(raw), expected);
});

test('presentation leaves original snapshot titles and publisher URLs unchanged', () => {
  const now = new Date('2026-10-10T12:00:00.000Z');
  const title = 'Show HN: TypeScript compiler';
  const url = 'https://publisher.example/compiler#details';
  const time = now.getTime() / 1000;
  const snapshot = { schemaVersion: 2, updatedAt: now.toISOString(), articles: [{
    id: 1, title, url, time, submittedAt: now.toISOString(), discussionUrl: discussionUrl(1),
    ...classifyArticle(title, url),
  }] };
  const before = JSON.stringify(snapshot);
  const [article] = getRecentArticles(snapshot, now);
  assert.equal(displayArticleTitle(article.title), 'TypeScript compiler');
  assert.equal(article.title, title);
  assert.equal(article.url, url);
  assert.equal(JSON.stringify(snapshot), before);
});

test('hostname is guarded, HTTP(S)-only, credential-free and safely empty for invalid URLs', () => {
  assert.equal(articleHostname('https://Publisher.example:8443/article?q=x#part'), 'publisher.example');
  assert.equal(articleHostname('http://publisher.example/story'), 'publisher.example');
  for (const url of [undefined, null, 42, '', 'not a URL', '/relative',
    'javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/story',
    'ftp://publisher.example/story', 'https://user:secret@publisher.example/',
    'https://user@publisher.example/', 'https://:secret@publisher.example/']) {
    assert.doesNotThrow(() => articleHostname(url));
    assert.equal(articleHostname(url), '');
  }
});

test('both locales share escaped display titles and guarded publisher hostname wiring', async () => {
  for (const [path, locale] of [['../src/pages/blog.astro', 'en'], ['../src/pages/es/blog.astro', 'es']]) {
    const route = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(route, new RegExp(`<BlogPage locale="${locale}"`));
  }
  assert.match(blog, /import \{ displayArticleTitle, articleHostname \} from '\.\.\/data\/article-presentation\.mjs'/);
  assert.match(blog, /<h3><a href=\{article\.url\} target="_blank" rel="noopener noreferrer">\{displayArticleTitle\(article\.title\)\}/);
  assert.match(blog, /\{articleHostname\(article\.url\)\}/);
  assert.doesNotMatch(blog, /new URL\(article\.url\)|set:html|innerHTML|aria-label=\{article\.title\}|\{article\.title\}/);
  assert.match(blog, /getRecentArticles\(snapshotData, new Date\(\)\)/);
});
