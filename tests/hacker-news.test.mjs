import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { refreshHackerNews, collectHackerNews, API_BASE, SEARCH_QUERIES } from '../scripts/update-hacker-news.mjs';
import { normalizeSnapshot, validateSnapshot, emptySnapshot, getRecentArticles, selectArticles, makeArticle, WINDOW_SECONDS } from '../src/data/hacker-news.mjs';
import { classifyArticle } from '../src/data/article-topics.mjs';

const date = new Date('2026-10-10T12:00:00.000Z');
const seconds = date.getTime() / 1000;
const now = () => date;
const hit = (id, patch = {}) => ({ objectID: String(id), title: `JavaScript web development ${id}`, url: `https://example.com/${id}`, created_at_i: seconds - id, ...patch });
function mockFetch(hits = [], hook) {
  return async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, API_BASE + '/search_by_date');
    assert.equal(parsed.searchParams.get('tags'), 'story');
    assert.equal(parsed.searchParams.get('restrictSearchableAttributes'), 'title');
    assert.equal(parsed.searchParams.get('numericFilters'), `created_at_i>=${seconds - WINDOW_SECONDS},created_at_i<=${seconds}`);
    assert.equal(options.redirect, 'error');
    return new Response(JSON.stringify(hook ? hook(parsed) : ({ hits, page: 0, nbPages: 1 })));
  };
}
function memoryFs(failAt) {
  const files = new Map([['snapshot.json', 'previous bytes\n']]), calls = [];
  return { files, calls,
    async writeFile(path, bytes, options) { calls.push(['write', path, options]); if (failAt === 'write') throw Error('write failed'); files.set(path, bytes); },
    async rename(from, to) { calls.push(['rename', from, to]); if (failAt === 'rename') throw Error('rename failed'); files.set(to, files.get(from)); files.delete(from); },
    async unlink(path) { calls.push(['unlink', path]); files.delete(path); },
  };
}
const collect = async (options = {}) => selectArticles(await collectHackerNews({ now: date, fetchImpl: mockFetch([hit(1)]), retryDelayMs: 0, ...options }));
const refresh = (options = {}) => refreshHackerNews({ now, fetchImpl: mockFetch([hit(1)]), retryDelayMs: 0, outputPath: 'snapshot.json', fileSystem: memoryFs(), providers: {hn:collectHackerNews,devto:async()=>[],infoq:async()=>[]}, ...options });

test('conservative whole-word classifier, explicit paths only, precedence and bounded tags', () => {
  for (const title of ['A chair in the rain', 'Clouds and weather', 'A server in a fantasy novel', 'Safety harness for climbing', 'Show HN: A city-building game', 'Show HN: Python snake game', 'An AI city-building game', 'Email fails again', 'Electrical transformers on a power grid', 'Fine tuning a piano', 'Evaluation harness for horse racing', 'How I react to weather', 'Property developers in London', 'TV programming schedule', 'Claude Monet paintings']) assert.equal(classifyArticle(title, 'https://ai.example.com/'), null, title);
  assert.equal(classifyArticle('LLM agent evaluation harness and Kubernetes security').primaryCategory, 'Security');
  assert.deepEqual(classifyArticle('LLM agent evaluation harness and Kubernetes security').tags, ['AI', 'Harnesses', 'Agents']);
  assert.equal(classifyArticle('Building an LLM inference pipeline').primaryCategory, 'AI Engineering');
  assert.equal(classifyArticle('Rust compiler vulnerability').primaryCategory, 'Security');
  assert.equal(classifyArticle('Kubernetes deployment architecture').primaryCategory, 'Cloud DevOps');
  assert.equal(classifyArticle('Software architecture and Python').primaryCategory, 'Software Architecture');
  assert.equal(classifyArticle('React 19 hooks for web development').primaryCategory, 'Web Development');
  assert.equal(classifyArticle('Show HN: An AI coding agent debugger').primaryCategory, 'AI Engineering');
  assert.equal(classifyArticle('Artificial intelligence research').primaryCategory, 'AI Engineering');
  assert.equal(classifyArticle('Release notes', 'https://example.com/blog/kubernetes-security').primaryCategory, 'Security');
  assert.equal(classifyArticle('Hackers abuse redirects to push Claude ClickFix attacks', 'https://example.com/news/security/claude-clickfix-attacks/').primaryCategory, 'Security');
  assert.equal(classifyArticle('AI Browser Agents: implementation playbook').primaryCategory, 'AI Engineering');
  assert.equal(classifyArticle('Release notes', 'https://kubernetes.example.com/?q=security'), null);
});

test('raw titles, recency boundaries, canonical dedup, stable newest order without truncation', async () => {
  const hits = [hit(1, { title: '<b>JavaScript web development</b>', _highlightResult: { title: { value: 'invented' } } }), ...Array.from({ length: 14 }, (_, i) => hit(i + 2)), hit(30, { created_at_i: seconds - WINDOW_SECONDS }), hit(31, { created_at_i: seconds - WINDOW_SECONDS - 1 }), hit(32, { created_at_i: seconds + 1 }), hit(33, { dead: true, title: null }), hit(34, { deleted: true, title: null }), hit(35, { url: null }), hit(36, { url: 'javascript:alert(1)' }), hit(37, { url: 'https://example.com:443/1#fragment' }), hit(38, { title: 'Climbing harness' }), hit(1)];
  const articles = await collect({ fetchImpl: mockFetch(hits) });
  assert.equal(articles.length, 16);
  assert.deepEqual(articles.map(a => a.id), [...Array.from({ length: 15 }, (_, i) => `hn:${i + 1}`), 'hn:30']);
  assert.equal(articles[0].title, '<b>JavaScript web development</b>');
  assert.equal(articles[0].submittedAt, new Date((seconds - 1) * 1000).toISOString());
  assert.equal('publishedAt' in articles[0], false);
  const boundaries = await collect({ fetchImpl: mockFetch([hit(30, { created_at_i: seconds - WINDOW_SECONDS }), hit(31, { created_at_i: seconds }), hit(32, { created_at_i: seconds + 1 })]) });
  assert.deepEqual(boundaries.map(a => a.id), ['hn:31', 'hn:30']);
  const ties = await collect({ fetchImpl: mockFetch([hit(9, { created_at_i: seconds }), hit(2, { created_at_i: seconds })]) });
  assert.deepEqual(ties.map(a => a.id), ['hn:2', 'hn:9']);
  const original = 'https://example.com:443/original#section';
  assert.equal((await collect({ fetchImpl: mockFetch([hit(1, { url: original })]) }))[0].url, original);
});

test('sparse and zero refreshes are successful timestamped atomic snapshots', async () => {
  for (const hits of [[], [hit(1)]]) {
    const fs = memoryFs();
    const snapshot = await refresh({ fetchImpl: mockFetch(hits), fileSystem: fs });
    assert.equal(snapshot.updatedAt, date.toISOString());
    assert.equal(snapshot.articles.length, hits.length);
    assert.deepEqual(JSON.parse(fs.files.get('snapshot.json')), snapshot);
    assert.equal(fs.calls[0][2].flag, 'wx');
    assert.equal(fs.calls[1][0], 'rename');
    assert.equal(fs.files.size, 1);
  }
});

test('schema validation, category evidence and honest old-schema normalization', async () => {
  const snapshot = await refresh();
  assert.deepEqual(validateSnapshot(emptySnapshot()), emptySnapshot());
  assert.deepEqual(normalizeSnapshot({ schemaVersion: 1, articles: [hit(1)] }), emptySnapshot());
  for (const patch of [{ schemaVersion: 1 }, { sources: {} }, { selection: {} }, { updatedAt: null }, { updatedAt: 'invalid' }, { articles: Array(11).fill(snapshot.articles[0]) }]) assert.throws(() => validateSnapshot({ ...snapshot, ...patch }));
  for (const patch of [{ categories: ['AI'] }, { primaryCategory: 'AI' }, { publishedAt: date.toISOString() }, { submittedAt: 'bad' }, { time: seconds + 1 }, { time: seconds - WINDOW_SECONDS - 1 }, { url: 'https://user:pass@example.com/' }, { id: 1.5 }, { title: 'Rain falls' }]) assert.throws(() => validateSnapshot({ ...snapshot, articles: [{ ...snapshot.articles[0], ...patch }] }));
  assert.throws(() => validateSnapshot({ ...snapshot, articles: [...snapshot.articles, ...snapshot.articles] }));
  const two = await refresh({ fetchImpl: mockFetch([hit(1), hit(2)]) });
  assert.throws(() => validateSnapshot({ ...two, articles: [...two.articles].reverse() }));
  assert.deepEqual(getRecentArticles(snapshot, date), snapshot.articles);
  assert.deepEqual(getRecentArticles(snapshot, new Date(date.getTime() + WINDOW_SECONDS * 1000)), []);
  assert.deepEqual(getRecentArticles(snapshot, new Date(date.getTime() - 2000)), []);
  assert.deepEqual(getRecentArticles(snapshot, new Date('invalid')), []);
});

test('invalid response, network or failed page retains bytes without writing', async () => {
  for (const payload of [{}, { hits: null, nbPages: 1, page: 0 }, { hits: [], nbPages: -1, page: 0 }, { hits: [], nbPages: 1, page: 7 }, { hits: [{ objectID: 'bad' }], nbPages: 1, page: 0 }, { hits: Array(101).fill(hit(1)), nbPages: 1, page: 0 }, { hits: [hit(1)], nbPages: 0, page: 0 }]) {
    const fs = memoryFs();
    await assert.rejects(refresh({ fetchImpl: mockFetch([], () => payload), fileSystem: fs }));
    assert.equal(fs.files.get('snapshot.json'), 'previous bytes\n'); assert.equal(fs.calls.length, 0);
  }
  const fs = memoryFs();
  await assert.rejects(refresh({ fileSystem: fs, fetchImpl: async () => { throw Error('offline'); } }), /Source hn failed/);
  assert.equal(fs.files.get('snapshot.json'), 'previous bytes\n');
  const pageFs = memoryFs();
  await assert.rejects(refresh({ fileSystem: pageFs, fetchImpl: mockFetch([], parsed => Number(parsed.searchParams.get('page')) === 1 ? {} : { hits: Array.from({ length: 10 }, (_, i) => hit(i + 1)), page: 0, nbPages: 2 }) }));
  assert.equal(pageFs.files.get('snapshot.json'), 'previous bytes\n');
  assert.equal(pageFs.calls.length, 0);
  await assert.rejects(refresh({ now: () => new Date('invalid'), fetchImpl: () => assert.fail('no fetch') }));
});

test('bounded pages, queries, candidates and concurrency independent of completion order', async () => {
  let active = 0, peak = 0, requests = 0;
  const base = mockFetch([], parsed => ({ hits: [hit(1)], page: Number(parsed.searchParams.get('page')), nbPages: 999 }));
  const articles = await collect({ concurrency: 2, fetchImpl: async (...args) => { requests++; active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 1)); active--; return base(...args); } });
  assert.equal(articles.length, 1);
  assert.equal(requests, SEARCH_QUERIES.length * 2);
  assert.equal(peak, 2);
  assert.ok(requests * 100 <= 5000);
  for (const options of [{ concurrency: 0 }, { maxScan: Infinity }, { attempts: 0 }, { timeoutMs: -1 }]) await assert.rejects(collect({ fetchImpl: () => assert.fail('no fetch'), ...options }));
});

test('HTTP retry policy and both header/body timeouts retain old bytes', async () => {
  for (const failure of ['network', 503, 429]) {
    let count = 0;
    const base = mockFetch([hit(1)]);
    assert.equal((await collect({ concurrency: 1, fetchImpl: async (...args) => { if (++count <= 2) { if (failure === 'network') throw Error('offline'); return { ok: false, status: failure }; } return base(...args); } })).length, 1);
    assert.equal(count, SEARCH_QUERIES.length + 2);
  }
  let count = 0;
  await assert.rejects(collect({ concurrency: 1, fetchImpl: async () => { count++; return { ok: false, status: 404 }; } }), /404/);
  assert.equal(count, 1);
  for (const body of [false, true]) {
    const fs = memoryFs(); let signal;
    await assert.rejects(refresh({ concurrency: 1, fileSystem: fs, timeoutMs: 5, attempts: 1, fetchImpl: (_url, options) => { signal = options.signal; return body ? { ok: true, body: {getReader:()=>({read:()=>new Promise(()=>{}),cancel:async()=>{}})} } : new Promise(() => {}); } }), /Source hn failed/);
    assert.equal(signal.aborted, true); assert.equal(fs.files.get('snapshot.json'), 'previous bytes\n');
  }
});

test('failed write/rename preserve old bytes; importing updater has no effects', async () => {
  for (const failAt of ['write', 'rename']) {
    const fs = memoryFs(failAt);
    await assert.rejects(refresh({ fileSystem: fs }), /failed/);
    assert.equal(fs.files.get('snapshot.json'), 'previous bytes\n'); assert.equal(fs.files.size, 1);
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail('import must not fetch');
  try { await import('../scripts/update-hacker-news.mjs?import-safety'); } finally { globalThis.fetch = originalFetch; }
});

test('destination screening precedes selection without banning tool article titles', async () => {
  const rejected = [
    'https://github.com/vscarpenter/gsd-task-manager', 'https://www.github.com/a/b',
    'https://gist.github.com/a/123', 'https://raw.githubusercontent.com/a/b/main/a.md',
    'https://gitlab.com/a/b', 'https://bitbucket.org/a/b',
    'https://huggingface.co/a/model', 'https://huggingface.co/spaces/a/demo', 'https://huggingface.co/datasets/a/data',
    'https://atoll92.github.io/agent-standup/', 'https://a.github.io/', 'https://a.github.io/blog/',
    'https://a.github.io/projects/tool.html', 'https://a.github.io/demo/index.html',
    'https://publisher.example/playground', 'https://publisher.example/demo/tool',
    'https://publisher.example/raw/file.md', 'https://publisher.example/download/tool.zip',
    'https://github.com./a/b', 'https://gist.github.com/a/123/raw',
    'https://huggingface.co/blog/', 'https://huggingface.co/blog/index.html',
    'https://huggingface.space/tool', 'https://codepen.io/author/pen/abc',
    'https://publisher.example/%64emo/tool', 'https://publisher.example/tool.zip?download=1',
    'https://demo.publisher.example/', 'https://playground.publisher.example/',
    'https://publisher.example/demo.html', 'https://publisher.example/playground.html',
    'https://a.github.io/blog/index.html', 'https://a.github.io/blog/slug/playground',
  ];
  const accepted = [
    'https://github.blog/engineering/building-ai-tools/', 'https://huggingface.co/blog/individual-post',
    'https://a.github.io/blog/building-ai-tools', 'https://a.github.io/posts/ai-tools.html',
    'https://a.github.io/articles/ai-tools/', 'https://a.github.io/2026/10/10/ai-tools.html',
    'https://a.github.io/my-blog/posts/ai-tools.html', 'https://a.github.io/blog/ai-tools/index.html',
    'https://a.github.io/2026-10-10-ai-tools.html', 'https://huggingface.co/blog/community/author/ai-tools',
    'https://github.com.publisher.example/article', 'https://notgithub.com/post',
    'https://gitlab.com.publisher.example/article', 'https://huggingface.co.publisher.example/post',
    'https://publisher.example/blog/demo-driven-development', 'https://unknown.example/tool',
  ];
  for (const url of rejected) assert.equal((await collect({ fetchImpl: mockFetch([hit(1, {url})]) })).length, 0, url);
  for (const url of accepted) {
    const [row] = await collect({ fetchImpl: mockFetch([hit(1, {url, title:'Show HN: An AI coding agent debugger'})]) });
    assert.equal(row?.url, url, url);
  }
  const rows = await collect({fetchImpl:mockFetch([...Array.from({length:12},(_,i)=>hit(i+1,{url:rejected[i]})),hit(50)])});
  assert.deepEqual(rows.map(row=>row.id), ['hn:50']);
});

test('historical schema3 validates every original row before destination filtering', async () => {
  const current = await refresh({fetchImpl:mockFetch([hit(1),hit(2),hit(3)])});
  const historical = { ...structuredClone(current), schemaVersion: 3, selection: { windowDays: 7, maxArticles: 10, order: 'newest', classifierVersion: 2 } };
  historical.articles[1].url = 'https://github.com/a/tool';
  assert.throws(()=>validateSnapshot(historical));
  const expected = {...current, articles:[current.articles[0],current.articles[2]]};
  assert.deepEqual(normalizeSnapshot(historical), expected);
  assert.equal(normalizeSnapshot(historical).updatedAt, current.updatedAt);
  for (const patch of [
    {id:'wrong'}, {source:'bad'}, {sourceId:'bad'}, {dateKind:'published'}, {publishedAt:date.toISOString()},
    {submittedAt:'bad'}, {eventAt:'bad'}, {time:seconds+1}, {sourceTags:['ai']},
    {categories:['Security']}, {primaryCategory:'Security'}, {tags:['Security']}, {extra:true},
    {title:'Rain falls'}, {url:'https://user:pass@github.com/a/tool'},
    {time:seconds-WINDOW_SECONDS-1,eventAt:new Date((seconds-WINDOW_SECONDS-1)*1000).toISOString(),submittedAt:new Date((seconds-WINDOW_SECONDS-1)*1000).toISOString()},
    {sourceTags:Array(51).fill('ai')}, {tags:['AI','Agents','invented']}, {url:'https://example.com/1'},
    {sourceId:'1',id:'hn:1',discussionUrl:'https://news.ycombinator.com/item?id=1'},
  ]) {
    const broken=structuredClone(historical); Object.assign(broken.articles[1],patch);
    assert.deepEqual(normalizeSnapshot(broken),emptySnapshot(),JSON.stringify(patch));
  }
  for (const articles of [historical.articles.toReversed(), [...historical.articles,historical.articles[1]], Array(11).fill(historical.articles[1])]) {
    assert.deepEqual(normalizeSnapshot({...historical,articles}),emptySnapshot());
  }
  assert.deepEqual(normalizeSnapshot({...historical,extra:true}),emptySnapshot());
  const old={schemaVersion:2,updatedAt:date.toISOString(),articles:[{id:1,title:'LLM agent harness',url:'https://github.com/a/tool',time:seconds,submittedAt:date.toISOString()}]};
  assert.deepEqual(normalizeSnapshot(old).articles,[]);
});

test('deterministic ten-row schema3 migrates offline, and original overflow remains invalid', async () => {
  const articles = Array.from({length:10}, (_,i) => makeArticle({source:'hn', sourceId:String(i+1), title:'LLM agent harness', url:`https://example.com/post/${i+1}`, eventAt:new Date((seconds-i)*1000).toISOString()}, seconds));
  const historical = {...emptySnapshot(), schemaVersion:3, selection:{windowDays:7,maxArticles:10,order:'newest',classifierVersion:2}, updatedAt:date.toISOString(), articles};
  const migrated = normalizeSnapshot(historical);
  assert.equal(migrated.schemaVersion,4);
  assert.equal('maxArticles' in migrated.selection,false);
  assert.deepEqual(migrated.articles,articles);
  assert.equal(migrated.updatedAt,historical.updatedAt);
  assert.deepEqual(validateSnapshot(migrated),migrated);
  const fs=memoryFs();
  const previous=JSON.stringify(historical);
  fs.files.set('snapshot.json',previous);
  await assert.rejects(refresh({fileSystem:fs,fetchImpl:async()=>{throw Error('offline');}}),/Source hn failed/);
  assert.equal(fs.files.get('snapshot.json'),previous);
  assert.deepEqual(getRecentArticles(JSON.parse(fs.files.get('snapshot.json')),date),articles);
  const overflow = {...historical, articles:[...articles,makeArticle({source:'hn',sourceId:'11',title:'LLM agent harness',url:'https://example.com/post/11',eventAt:new Date((seconds-10)*1000).toISOString()},seconds)]};
  assert.deepEqual(normalizeSnapshot(overflow),emptySnapshot());
  const exclusions = structuredClone(historical);
  exclusions.articles[8].url='https://github.com/a/tool';
  exclusions.articles[9].url='https://a.github.io/tool/';
  assert.deepEqual(normalizeSnapshot(exclusions).articles,articles.slice(0,8));
  for (const selection of [{...historical.selection,maxArticles:11},{windowDays:7,order:'newest',classifierVersion:2}]) assert.deepEqual(normalizeSnapshot({...historical,selection}),emptySnapshot());
});

test('local seed normalizes honestly during migration', async () => {
  const seed = JSON.parse(await readFile(new URL('../src/data/hacker-news.json', import.meta.url), 'utf8'));
  if (seed.schemaVersion === 1) assert.deepEqual(normalizeSnapshot(seed), emptySnapshot());
  else assert.deepEqual(validateSnapshot(seed), seed);
  assert.deepEqual(getRecentArticles(seed, new Date(seed.updatedAt)), seed.articles);
  assert.deepEqual(selectArticles(seed.articles), seed.articles);
});
