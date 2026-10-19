import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatController, buildPayload, validateReply, readReply, retryDelay } from '../src/scripts/chatbot-controller.mjs';
import { createKnowledge } from '../src/lib/chatbot/knowledge.mjs';
import { homeCopy, projects } from '../src/i18n/home.ts';
import { readFile } from 'node:fs/promises';
import { chatbotCopy } from '../src/i18n/chatbot.mjs';
// Minimal DOM double: text assignment creates no elements; HTML sinks fail loudly.
class TestElement {
  constructor(tagName) { this.tagName = tagName; this.children = []; this.attributes = {}; this.dataset = {}; this.className = ''; this.text = ''; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  set innerHTML(_value) { throw new Error('HTML must never be parsed'); }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
}
const dom = { createElement: tag => new TestElement(tag) };
test('requested privacy copy is absent, while the real input label remains', async () => {
  for (const locale of ['en', 'es']) {
    assert.equal(Object.hasOwn(chatbotCopy[locale], 'privacy'), false);
    assert.doesNotMatch(JSON.stringify(chatbotCopy[locale]), /Groq|retention|retención/);
  }
  const component = await readFile(new URL('../src/components/PortfolioChatbot.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(component, /chatbot-privacy|copy\.privacy/);
  assert.match(component, /<label for="portfolio-chatbot-question">\{copy.inputLabel\}<\/label>/);
  assert.match(component, /<input id="portfolio-chatbot-question"/);
});

test('shared decorative sphere preserves all 16 header circles and wires all four marks', async () => {
  const sphere = await readFile(new URL('../src/components/BrandSphere.astro', import.meta.url), 'utf8');
  assert.match(sphere, /viewBox="0 0 40 40"/);
  assert.match(sphere, /fill="currentColor"/);
  assert.match(sphere, /aria-hidden="true"/);
  assert.match(sphere, /focusable="false"/);
  assert.match(sphere, /class=\{className\}/);
  const circles = [...sphere.matchAll(/<circle\b[^>]*>/g)].map(([circle]) => [
    ...circle.matchAll(/(?:cx|cy|r)="([\d.]+)"/g),
  ].map(match => Number(match[1])));
  assert.deepEqual(circles, [
    [20, 7, 1.6], [28.5, 11, 1.1], [33, 18.5, 1.7], [31, 27, 1.1],
    [24, 33, 1.9], [15, 32, 1.1], [8, 26, 1.6], [6.5, 17.5, 1.2],
    [11, 9.5, 1.6], [17, 14, 1], [25, 16, 1.3], [28.5, 22, 1],
    [21, 24, 1.5], [15, 22, 1], [20, 20, 1.2], [24.5, 12.5, .9],
  ]);
  assert.equal((sphere.match(/class="brand-dot-accent"/g) ?? []).length, 2);
  assert.doesNotMatch(sphere, /<script|<style|tabindex|role=|<title/);
  for (const [path, count] of [['views/HomePage', 1], ['components/BlogChrome', 1], ['components/PortfolioChatbot', 2]]) {
    const source = await readFile(new URL(`../src/${path}.astro`, import.meta.url), 'utf8');
    assert.match(source, /import BrandSphere from /);
    assert.equal((source.match(/<BrandSphere\b/g) ?? []).length, count);
    assert.doesNotMatch(source, /viewBox="0 0 40 40"/);
  }
});

test('assistant titles and open labels are concise and the dialog stays labelled', async () => {
  assert.deepEqual(['en', 'es'].map(locale => [chatbotCopy[locale].title, chatbotCopy[locale].open]),
    [['Assistant', 'Open assistant'], ['Asistente', 'Abrir asistente']]);
  const component = await readFile(new URL('../src/components/PortfolioChatbot.astro', import.meta.url), 'utf8');
  assert.match(component, /data-chatbot-launcher aria-label=\{copy.open\}/);
  assert.match(component, /aria-labelledby="portfolio-chatbot-title"/);
  assert.match(component, /<h2 id="portfolio-chatbot-title">\{copy.title\}<\/h2>/);
  assert.doesNotMatch(component, />JP|chatbot-mark/);
});
test('runtime message renderer creates native paragraphs with literal malicious text and authored anchors', async () => {
  const { renderChatMessage } = await import('../src/scripts/portfolio-chatbot.mjs');
  for (const locale of ['en', 'es']) {
    const malicious = '<script>alert(1)</script>\n<img src=x onerror=alert(2)> [link](javascript:alert(3))';
    const message = { id: 7, role: 'assistant', text: `First line\ncontinues.\r\n\r\n${malicious}\n\nLast paragraph.`, links: knowledge[locale].links };
    const item = renderChatMessage(dom, message, chatbotCopy[locale]);
    assert.equal(item.dataset.messageId, '7');
    assert.equal(item.children[0].textContent, chatbotCopy[locale].assistant);
    const paragraphs = item.children.filter(child => child.tagName === 'p');
    assert.deepEqual(paragraphs.map(p => p.textContent), ['First line\ncontinues.', malicious, 'Last paragraph.']);
    assert.ok(paragraphs.every(p => p.children.length === 0));
    const anchors = item.children.filter(child => child.tagName === 'a');
    assert.deepEqual(anchors.map(a => [a.attributes.href, a.textContent]), knowledge[locale].links.map(l => [l.href, l.label]));
    assert.ok(item.children.every(child => ['strong', 'p', 'a'].includes(child.tagName)));
  }
});
test('paragraph rendering handles single text, whitespace separators and notices without duplicate author labels', async () => {
  const { renderChatMessage } = await import('../src/scripts/portfolio-chatbot.mjs');
  for (const [text, expected] of [['Only one.', ['Only one.']], ['One.\n \n\nTwo.', ['One.', 'Two.']]]) {
    const item = renderChatMessage(dom, { id: 0, role: 'notice', text, links: [] }, chatbotCopy.en);
    assert.deepEqual(item.children.map(p => p.textContent), expected);
    assert.ok(item.children.every(p => p.tagName === 'p'));
  }
});
test('widget welcome is localized without changing shared fallback intro or later notices', async () => {
  const { renderChatMessage } = await import('../src/scripts/portfolio-chatbot.mjs');
  for (const locale of ['en', 'es']) {
    const copy = chatbotCopy[locale];
    const initial = { id: 0, role: 'notice', text: copy.intro, links: [] };
    assert.equal(renderChatMessage(dom, initial, copy).textContent, copy.welcomeIntro);
    assert.equal(initial.text, copy.intro);
    assert.equal(renderChatMessage(dom, { ...initial, id: 8 }, copy).textContent, copy.intro);
  }
});
const knowledge = createKnowledge({ homeCopy, projects });
for (const locale of ['en', 'es']) {
  test(`${locale} network and cooldown follow-ups use pre-append history and retain visible bytes`, async () => {
    let calls = 0; let payload;
    const c = createChatController({ knowledge, locale, clock: () => 0,
      fetch: async (_url, options) => { calls++; payload = JSON.parse(options.body); throw new Error('offline'); } });
    c.preset('projects');
    const brief = locale === 'es' ? 'sí' : 'yes';
    await c.submit(brief);
    assert.match(c.snapshot().messages.at(-1).text, /CRM.*Course Notes/s);
    assert.equal(payload.history[0].content, chatbotCopy[locale].presets[0].label);
    await c.submit('CRM');
    const before = c.snapshot().messages;
    await c.submit(brief);
    assert.equal(calls, 1);
    assert.deepEqual(c.snapshot().messages.slice(0, before.length), before);
    assert.equal(c.snapshot().messages.at(-2).text, brief);
    assert.ok(c.snapshot().messages.at(-1).text.includes(knowledge[locale].projects[0].features[1]));
    const initialState = { messages: [
      { id: 1, role: 'user', text: 'CRM', links: [] },
      { id: 2, role: 'assistant', text: 'Want details? CRM uses Docker and won $900000.', links: [] },
    ] };
    const network = createChatController({ knowledge, locale, initialState,
      fetch: async (_url, options) => { payload = JSON.parse(options.body); throw new Error('offline'); } });
    await network.submit(brief);
    assert.deepEqual(payload.history.map(t => t.content), initialState.messages.slice(0, 2).map(t => t.text));
    assert.ok(network.snapshot().messages.at(-1).text.includes(knowledge[locale].projects[0].features[2]));
    assert.doesNotMatch(network.snapshot().messages.at(-1).text, /900000|Docker/);
  });
}

const good = (text = 'Public reply', extra = {}) => new Response(JSON.stringify({ text, links: [], mode: 'ai', provenance: 'groq', retryAfterSeconds: 0, ...extra }));
const make = (options = {}) => createChatController({ knowledge, locale: 'es', ...options });
test('four presets are local even with healthy fetch; invalid topic safe', async () => {
  let calls = 0;
  const c = make({ fetch: () => { calls++; return good(); } });
  for (const topic of ['projects', 'tech', 'experience', 'contact']) assert.equal(c.preset(topic), true);
  assert.equal(c.preset('garbage'), false);
  assert.equal(calls, 0); assert.equal(c.snapshot().messages.length, 9);
  assert.match(c.snapshot().messages.at(-1).text, /correo|email|gmail/);
});
test('one request in flight, history preserved, localized request and recovery', async () => {
  let resolve; let calls = 0; let payload;
  const c = make({ fetch: (_url, init) => { calls++; payload = JSON.parse(init.body); return new Promise(r => { resolve = r; }); } });
  c.preset('tech'); const before = c.snapshot().messages;
  const first = c.submit('¿Cómo usa Laravel el CRM?'); assert.equal(await c.submit('Duplicate'), false);
  assert.equal(c.snapshot().busy, true); c.preset('contact');
  resolve(good('<b>plain</b>')); await first;
  assert.equal(calls, 1); assert.equal(payload.locale, 'es'); assert.ok(payload.history.length <= 6);
  assert.deepEqual(c.snapshot().messages.slice(0, before.length), before);
  assert.equal(c.snapshot().messages.at(-1).text, '<b>plain</b>'); assert.equal(c.snapshot().busy, false);
});
test('429 cooldown skips manual and preset calls, next visitor question recovers', async () => {
  let now = 1000; let calls = 0;
  const c = make({ clock: () => now, fetch: async () => ++calls === 1 ? new Response('secret provider error', { status: 429, headers: { 'Retry-After': '2' } }) : good('Recovered') });
  await c.submit('tech'); const prior = c.snapshot().messages;
  await c.submit('experience'); c.preset('projects'); assert.equal(calls, 1);
  assert.deepEqual(c.snapshot().messages.slice(0, prior.length), prior);
  now += 2001; await c.submit('projects'); assert.equal(calls, 2);
  assert.equal(c.snapshot().messages.at(-1).text, 'Recovered');
  assert.equal(c.snapshot().messages.filter(m => m.text === chatbotCopy.es.intro).length, 1);
});
test('network failures and timeout abort preserve messages without revealing errors', async () => {
  let signal;
  const c = make({ deadlineMs: 10, fetch: (_url, init) => { signal = init.signal; return new Promise(() => {}); } });
  await c.submit('contact'); assert.equal(signal.aborted, true); assert.equal(c.snapshot().busy, false);
  assert.match(c.snapshot().messages.at(-1).text, /gmail/);
  const d = make({ fetch: async () => { throw new Error('sk-secret'); } });
  await d.submit('unknown'); assert.ok(!JSON.stringify(d.snapshot()).includes('sk-secret'));
});
test('dispose cancels request without reset or late reply', async () => {
  const c = make({ fetch: () => new Promise(() => {}) });
  const p = c.submit('projects'); const before = c.snapshot().messages; c.dispose(); await p;
  assert.deepEqual(c.snapshot().messages, before); assert.equal(c.snapshot().busy, false);
  assert.equal(await c.submit('projects'), false);
});
test('input rejects blank/oversized safely with no network', async () => {
  const c = make({ fetch: () => { throw new Error('must not fetch'); } });
  assert.equal(await c.submit(' '), false); assert.equal(await c.submit('x'.repeat(1001)), false);
  assert.match(c.snapshot().messages.at(-1).text, /no está indicada/);
});
test('history and actual UTF8 body bounded including worst case unicode', () => {
  const history = Array.from({ length: 90 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: '😀'.repeat(1000) }));
  const body = buildPayload('en', '😀'.repeat(500), history);
  assert.ok(body.history.length <= 6);
  assert.ok(body.history.reduce((n, m) => n + m.content.length, body.message.length) <= 6000);
  assert.ok(new TextEncoder().encode(JSON.stringify(body)).length <= 16384);
  assert.ok(body.history.every(m => m.content.length <= 1000));
});
test('response validates mode, provenance, length, delay and exact public links only', () => {
  const base = { text: '<script>alert(1)</script>', links: [], mode: 'local', provenance: 'public-knowledge', retryAfterSeconds: 0 };
  assert.equal(validateReply(base, knowledge.es).text, base.text);
  for (const patch of [{ mode: 'fake' }, { provenance: 'groq' }, { retryAfterSeconds: -1 }, { retryAfterSeconds: 86401 }, { text: 'x'.repeat(4001) }, { text: 'sk-abcdefghijklmno' }, { links: [{ id: 'contact', href: 'javascript:alert(1)', label: 'Contact' }] }, { links: [{ id: 'contact', href: 'https://evil.test/', label: 'Contact' }] }, { links: [{ id: 'email', href: 'data:text/plain,hi', label: 'Email' }] }]) assert.throws(() => validateReply({ ...base, ...patch }, knowledge.es));
  assert.deepEqual(validateReply({ ...base, links: knowledge.es.links }, knowledge.es).links, knowledge.es.links);
});
test('stream response limited; malformed reply falls back without unsafe URLs', async () => {
  await assert.rejects(readReply(new Response('x'.repeat(65537))));
  await assert.rejects(readReply(new Response('{')));
  const c = make({ fetch: async () => good('leaked error', { links: [{ id: 'x', href: 'https://evil.test', label: 'x' }] }) });
  await c.submit('contact'); assert.ok(!JSON.stringify(c.snapshot()).includes('evil.test'));
  assert.ok(!JSON.stringify(c.snapshot()).includes('leaked error'));
});
test('Retry-After seconds/date and JSON delays bounded to 24h', () => {
  assert.equal(retryDelay('9999999', 0), 86400);
  assert.equal(retryDelay(new Date(5000).toUTCString(), 1000), 4);
  assert.equal(retryDelay(null, 0), 60);
});
test('memory transcript bounded and guided JSON cooldown honored', async () => {
  let calls = 0;
  const c = make({ fetch: async () => { calls++; return good('Guided', { mode: 'local', provenance: 'public-knowledge', retryAfterSeconds: 60 }); } });
  await c.submit('projects'); await c.submit('contact'); assert.equal(calls, 1);
  for (let i = 0; i < 100; i++) c.preset('contact');
  assert.ok(c.snapshot().messages.length <= 80);
});
test('429 JSON delay applies when header absent; English copy and bounded cooldown', async () => {
  let now = 1000; let calls = 0;
  const c = make({ locale: 'en', clock: () => now, fetch: async () => ++calls === 1
    ? new Response(JSON.stringify({ retryAfterSeconds: 2, error: 'private detail' }), { status: 429 }) : good('Recovered') });
  await c.submit('contact'); assert.equal(c.snapshot().cooldownUntil, 3000);
  assert.equal(c.snapshot().messages[0].text, chatbotCopy.en.intro);
  assert.ok(!JSON.stringify(c.snapshot()).includes('private detail'));
  now = 3001; await c.submit('experience'); assert.equal(calls, 2);
});
test('deadline covers streaming body; cancellation stops reader', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); }, cancel() { cancelled = true; } }));
  const c = make({ deadlineMs: 10, fetch: async () => response });
  await c.submit('contact'); assert.equal(cancelled, true); assert.equal(c.snapshot().busy, false);
  assert.match(c.snapshot().messages.at(-1).text, /gmail/);
});
test('400/500 and malformed response show only local public copy', async () => {
  for (const response of [new Response('secret', { status: 500 }), good('secret', { mode: 'unexpected' })]) {
    const c = make({ fetch: async () => response }); await c.submit('contact');
    assert.ok(!JSON.stringify(c.snapshot()).includes('secret')); assert.match(c.snapshot().messages.at(-1).text, /gmail/);
  }
});
test('server invalid request is an unknown reply, not a provider/network failure', async () => {
  const c = make({ fetch: async () => new Response('private validation error', { status: 400 }) });
  await c.submit('contact'); assert.match(c.snapshot().messages.at(-1).text, /no está indicada/);
  assert.equal(c.snapshot().cooldownUntil, 0);
});
test('layout mounts once after existing content; SSR projection uses escaped attributes', async () => {
  const component = await readFile(new URL('../src/components/PortfolioChatbot.astro', import.meta.url), 'utf8');
  assert.ok(component.includes('data-knowledge={JSON.stringify(knowledge)}'));
  assert.ok(component.includes('aria-modal="false"')); assert.ok(component.includes('role="log"'));
  for (const layout of ['PortfolioLayout', 'BlogLayout']) {
    const text = await readFile(new URL(`../src/layouts/${layout}.astro`, import.meta.url), 'utf8');
    assert.equal((text.match(/<PortfolioChatbot /g) || []).length, 1);
    assert.ok(text.indexOf('<PortfolioChatbot ') > text.indexOf('<slot />'));
  }
});
test('widget keeps localized starter labels, scoped keyboard safeguards and finite motion', async () => {
  for (const locale of ['en', 'es']) {
    const copy = chatbotCopy[locale];
    assert.ok(copy.identity && copy.welcome && copy.intro && copy.you && copy.assistant);
    assert.deepEqual(copy.presets.map(p => p.topic), ['projects', 'tech', 'experience', 'contact', 'cv']);
    assert.ok(copy.presets.every(p => typeof p.label === 'string' && typeof p.description === 'string' && p.description.length > 0));
    const c = make({ locale, fetch: () => { throw new Error('presets must stay local'); } });
    for (const preset of copy.presets) {
      assert.equal(c.preset(preset.topic), true);
      assert.equal(c.snapshot().messages.at(-2).text, preset.label);
    }
  }
  const css = await readFile(new URL('../src/styles/chatbot.css', import.meta.url), 'utf8');
  assert.match(css, /--chatbot-base: var\(--bg, #080910\)/);
  assert.match(css, /--chatbot-accent: var\(--lavender, #C4B5FD\)/);
  assert.match(css, /\[hidden\].*display: none !important/);
  assert.match(css, /min-width: 44px; min-height: 44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /z-index: 20/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /infinite|chatbot-privacy|chatbot-mark/);
  assert.match(css, /\.chatbot-sphere\s*\{[^}]*color: #fff/s);
  assert.match(css, /\.chatbot-panel:not\(\[hidden\]\) \.chatbot-sphere/);
  const sphereAnimations = [...css.matchAll(/animation:\s*(chatbot-sphere-[^;]+);/g)];
  assert.equal(sphereAnimations.length, 2);
  assert.ok(sphereAnimations.every(([, value]) => /\s1$/.test(value)));
  assert.match(css, /@keyframes chatbot-sphere-turn[^\n]*rotate\(/);
  assert.doesNotMatch(css, /\.chatbot-sphere[^{}]*\{[^}]*display: none/s);
  const component = await readFile(new URL('../src/components/PortfolioChatbot.astro', import.meta.url), 'utf8');
  assert.match(component, /role="group" aria-label=\{copy.options\}/);
  assert.match(component, /\{p.description\}/);
  assert.match(component, /aria-expanded="false"/);
  assert.match(component, /data-chatbot-close aria-label=\{copy.close\}/);
  const source = await readFile(new URL('../src/scripts/portfolio-chatbot.mjs', import.meta.url), 'utf8');
  assert.match(source, /log.append\(renderChatMessage\(document, message, copy\)\)/);
  assert.match(source, /input.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /restoreFocus.focus/);
  assert.match(source, /window.visualViewport/);
  assert.match(source, /event.persisted/);
});
test('offline and cooldown paths share portfolio refusals and clarifications without erasing transcript', async () => {
  for (const locale of ['en', 'es']) {
    let calls = 0;
    const c = make({ locale, clock: () => 0, fetch: async () => { calls++; throw new Error('offline'); } });
    c.preset('projects');
    const before = c.snapshot().messages;
    await c.submit('Write a recipe for CRM Maia Consultores');
    assert.equal(c.snapshot().messages.at(-1).text, chatbotCopy[locale].scopeReject);
    await c.submit('What is React?');
    assert.equal(c.snapshot().messages.at(-1).text, chatbotCopy[locale].scopeClarify);
    assert.equal(calls, 1); // Second submission uses the existing local cooldown.
    assert.deepEqual(c.snapshot().messages.slice(0, before.length), before);
    assert.ok(c.snapshot().messages.at(-1).links.every(link => knowledge[locale].links.some(k => k.href === link.href)));
  }
});

test('DOM glue uses plain text and no transcript storage or global HTML injection', async () => {
  const source = await readFile(new URL('../src/scripts/portfolio-chatbot.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes('textContent'));
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|sessionStorage|document\.cookie/);
  assert.equal((source.match(/localStorage/g) ?? []).length, 1);
  assert.match(source, /storage: \(\) => window\.localStorage/);
  assert.ok(source.includes('pagehide')); assert.ok(source.includes('Escape'));
});

test('daily guard counts manual failures/cooldown once, not presets/invalid/busy/disposed; rehydrates across locales', async () => {
  let now = Date.parse('2024-02-29T04:59:59Z'); let resolve; let calls = 0;
  const storage = { value: null, getItem() { return this.value; }, setItem(_key, value) { this.value = value; } };
  const c = make({ clock: () => now, storage, fetch: () => { calls++; return new Promise(r => { resolve = r; }); } });
  c.preset('projects'); c.preset('contact');
  await c.submit(' '); await c.submit('x'.repeat(1001));
  const pending = c.submit('CRM'); assert.equal(await c.submit('busy'), false);
  assert.equal(JSON.parse(storage.value).count, 1);
  resolve(new Response('failure', { status: 503 })); await pending;
  for (let i = 0; i < 14; i++) assert.equal(await c.submit('yes'), true);
  assert.equal(calls, 1); assert.equal(c.snapshot().exhausted, true);
  const transcript = c.snapshot().messages;
  assert.equal(await c.submit('sixteenth'), false); assert.deepEqual(c.snapshot().messages, transcript);
  assert.equal(c.preset('contact'), true); assert.equal(JSON.parse(storage.value).count, 15);
  c.dispose(); assert.equal(await c.submit('disposed'), false); assert.equal(c.refresh(), false);
  const en = make({ locale: 'en', clock: () => now, storage, initialState: c.snapshot(), fetch: async () => good('Guided', { mode: 'local', provenance: 'public-knowledge' }) });
  assert.equal(await en.submit('blocked'), false);
  now += 1000; en.refresh(); assert.equal(en.snapshot().exhausted, false);
  assert.equal(await en.submit('CRM'), true); assert.equal(JSON.parse(storage.value).count, 1);
});
test('AI and disabled-AI guided replies consume once per question, not internal response work', async () => {
  for (const mode of ['ai', 'local']) {
    let calls = 0;
    const storage = { value: null, getItem() { return this.value; }, setItem(_key, value) { this.value = value; } };
    const c = make({ storage, clock: () => 0, fetch: async () => {
      calls++; return good('Answer after internal model attempts', { mode, provenance: mode === 'ai' ? 'groq' : 'public-knowledge' });
    } });
    for (let i = 0; i < 15; i++) assert.equal(await c.submit('CRM'), true);
    assert.equal(calls, 15); assert.equal(JSON.parse(storage.value).count, 15);
    assert.equal(await c.submit('CRM'), false); assert.equal(calls, 15);
  }
});
test('storage refresh and old exhausted BFCache fallback state do not reset same day', async () => {
  let now = Date.parse('2024-02-29T04:59:59Z');
  const storage = { value: null, getItem() { return this.value; }, setItem(_key, value) { this.value = value; } };
  let state;
  const c = make({ clock: () => now, storage, onChange: s => { state = s; } });
  storage.value = JSON.stringify({ day: '2024-02-28', count: 15 });
  c.refresh(); assert.equal(state.exhausted, true);
  storage.getItem = () => { throw Error('denied'); };
  const restored = make({ clock: () => now, storage, initialState: c.snapshot() });
  assert.equal(restored.snapshot().exhausted, true);
  now += 3 * 86400000; restored.refresh(); assert.equal(restored.snapshot().exhausted, false);
});
test('completion UI is nonnumeric, owned refresh listeners restore disabled composer', async () => {
  for (const locale of ['en', 'es']) {
    assert.equal(typeof chatbotCopy[locale].completion, 'string');
    assert.doesNotMatch(chatbotCopy[locale].completion ?? '', /\d|quota|limit|remaining|cuota|restant/i);
  }
  const source = await readFile(new URL('../src/scripts/portfolio-chatbot.mjs', import.meta.url), 'utf8');
  assert.match(source, /input.disabled = state.exhausted/);
  assert.match(source, /state.busy \|\| state.exhausted/);
  assert.match(source, /controller.refresh\(\)/);
  for (const event of ['storage', 'focus', 'visibilitychange']) assert.ok(source.includes(`'${event}'`));
  assert.match(source, /lifetime.abort\(\)/);
  assert.doesNotMatch(source, /setInterval|remaining|state\.quota\.count/);
  const component = await readFile(new URL('../src/components/PortfolioChatbot.astro', import.meta.url), 'utf8');
  assert.match(component, /data-chatbot-contact/);
});

test('boot lifecycle refreshes composer on storage/open/focus/visibility and owns terminal/BFCache listeners', async () => {
  class Element extends EventTarget {
    constructor() { super(); this.children = []; this.dataset = {}; this.attributes = {}; this.style = { setProperty() {} }; this.value = ''; this.isConnected = true; }
    append(child) { this.children.push(child); }
    setAttribute(key, value) { this.attributes[key] = value; }
    focus() { document.activeElement = this; }
    fire(type, detail = {}) { this.dispatchEvent(Object.assign(new Event(type), detail)); }
  }
  const original = new Map(['window', 'document', 'HTMLElement', 'HTMLButtonElement', 'HTMLFormElement', 'HTMLInputElement'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const oldClock = Date.now; let now = Date.parse('2024-02-29T04:59:59Z');
  Date.now = () => now;
  try {
    for (const locale of ['en', 'es']) {
      now = Date.parse('2024-02-29T04:59:59Z');
      const root = new Element(); root.dataset = { locale, knowledge: JSON.stringify(knowledge) };
      const nodes = Object.fromEntries(['launcher', 'panel', 'close', 'form', 'input', 'send', 'log', 'status', 'contact'].map(key => [key, new Element()]));
      root.querySelector = selector => nodes[selector.slice(14, -1)];
      const preset = new Element(); preset.dataset.chatbotPreset = 'contact';
      root.querySelectorAll = () => [preset];
      const win = new Element(); let raw = JSON.stringify({ day: '2024-02-28', count: 15 }); let denied = false;
      win.localStorage = { getItem() { if (denied) throw Error('denied'); return raw; }, setItem(_key, value) { raw = value; } };
      const doc = new Element(); doc.createElement = () => new Element(); doc.querySelectorAll = () => [root];
      for (const key of ['HTMLElement', 'HTMLButtonElement', 'HTMLFormElement', 'HTMLInputElement']) globalThis[key] = Element;
      globalThis.window = win; globalThis.document = doc;
      await import(`../src/scripts/portfolio-chatbot.mjs?lifecycle=${locale}`);
      assert.equal(root.dataset.initialized, 'true');
      assert.equal(nodes.input.disabled, true); assert.equal(nodes.send.disabled, true);
      assert.equal(nodes.status.textContent, chatbotCopy[locale].completion);
      assert.equal(nodes.contact.hidden, false);
      nodes.launcher.fire('click'); assert.equal(doc.activeElement, nodes.contact);
      preset.fire('click'); const transcriptLength = nodes.log.children.length;
      assert.equal(transcriptLength, 3); assert.equal(JSON.parse(raw).count, 15);
      denied = true; win.fire('pagehide', { persisted: true });
      now += 1000; win.fire('pageshow', { persisted: true });
      assert.equal(nodes.input.disabled, false); assert.equal(nodes.contact.hidden, true);
      assert.equal(nodes.log.children.length, transcriptLength);
      denied = false; raw = JSON.stringify({ day: '2024-02-29', count: 15 });
      win.fire('storage', { key: 'portfolio-chat-daily-v1' }); assert.equal(nodes.input.disabled, true);
      now += 86400000; win.fire('focus'); assert.equal(nodes.input.disabled, false);
      raw = JSON.stringify({ day: '2024-03-01', count: 15 }); doc.fire('visibilitychange');
      assert.equal(nodes.input.disabled, true);
      now += 3 * 86400000; nodes.launcher.fire('click'); assert.equal(nodes.input.disabled, false);
      assert.equal(nodes.input.placeholder, chatbotCopy[locale].placeholder);
      assert.doesNotMatch(nodes.status.textContent, /\d/);
      win.fire('pagehide', { persisted: false });
      raw = JSON.stringify({ day: '2024-03-04', count: 15 });
      win.fire('storage', { key: 'portfolio-chat-daily-v1' }); win.fire('focus'); doc.fire('visibilitychange');
      win.fire('pageshow', { persisted: true }); nodes.launcher.fire('click');
      assert.equal(nodes.input.disabled, false); // No terminal listeners or resurrection.
    }
  } finally {
    Date.now = oldClock;
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
test('CV preset renders in both locales and offers Spanish and English PDF downloads', async () => {
  const { renderChatMessage } = await import('../src/scripts/portfolio-chatbot.mjs');
  const component = await readFile(new URL('../src/components/PortfolioChatbot.astro', import.meta.url), 'utf8');
  assert.match(component, /copy\.presets\.map\(p => <button type="button" data-chatbot-preset=\{p\.topic\}>/);
  const expected = {
    en: { label: 'Download CV', links: [['/resume.pdf', 'CV (English)'], ['/resume_es.pdf', 'CV (Spanish)']] },
    es: { label: 'Descargar CV', links: [['/resume_es.pdf', 'CV en español'], ['/resume.pdf', 'CV en inglés']] },
  };
  for (const locale of ['en', 'es']) {
    const copy = chatbotCopy[locale];
    assert.equal(copy.presets.find(p => p.topic === 'cv')?.label, expected[locale].label);
    const c = createChatController({ knowledge, locale, fetch: () => { throw new Error('CV preset must stay local'); } });
    assert.equal(c.preset('cv'), true);
    const [question, reply] = c.snapshot().messages.slice(-2);
    assert.equal(question.text, expected[locale].label);
    assert.equal(reply.text.split('\n')[0], copy.cvDownload);
    assert.deepEqual(reply.links.map(l => [l.href, l.label]), expected[locale].links);
    // Server-provided local replies with the same CV links pass the client allowlist.
    assert.deepEqual(validateReply({ ...reply, mode: 'local', provenance: 'public-knowledge', retryAfterSeconds: 0 },
      knowledge[locale]).links, reply.links);
    const anchors = renderChatMessage(dom, reply, copy).children.filter(child => child.tagName === 'a');
    assert.deepEqual(anchors.map(a => [a.attributes.href, a.textContent, a.attributes.download]),
      expected[locale].links.map(([href, label]) => [href, label, '']));
  }
  // Page links never gain a download attribute.
  const page = renderChatMessage(dom, { id: 3, role: 'assistant', text: 'x', links: knowledge.en.links.slice(0, 1) }, chatbotCopy.en);
  assert.equal(page.children.find(child => child.tagName === 'a').attributes.download, undefined);
});
test('assistant **bold** markers render as native strong text, never as parsed HTML', async () => {
  const { renderChatMessage } = await import('../src/scripts/portfolio-chatbot.mjs');
  const text = 'The **Course Notes Generator** is a CLI and **AI Learning** is a <b>platform</b>.\n\nUnclosed **marker stays literal.';
  const item = renderChatMessage(dom, { id: 3, role: 'assistant', text, links: [] }, chatbotCopy.en);
  const [first, second] = item.children.filter(child => child.tagName === 'p');
  assert.equal(first.textContent, 'The Course Notes Generator is a CLI and AI Learning is a <b>platform</b>.');
  assert.deepEqual(first.children.filter(c => c.tagName === 'strong').map(c => c.textContent), ['Course Notes Generator', 'AI Learning']);
  assert.ok(first.children.every(c => ['span', 'strong'].includes(c.tagName) && c.children.length === 0));
  assert.equal(second.textContent, 'Unclosed **marker stays literal.');
  assert.equal(second.children.length, 0);
});
