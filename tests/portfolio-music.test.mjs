import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createMusicController, musicTracks } from '../src/scripts/portfolio-music.mjs';

class Target {
  listeners = new Map();
  attrs = {};
  value = '70';
  setAttribute(k, v) { this.attrs[k] = v; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(k, fn) { if (!this.listeners.has(k)) this.listeners.set(k, new Set()); this.listeners.get(k).add(fn); }
  removeEventListener(k, fn) { this.listeners.get(k)?.delete(fn); }
  emit(k, e = {}) { for (const fn of this.listeners.get(k) || []) fn({ type: k, ...e }); }
  count() { return [...this.listeners.values()].reduce((n, s) => n + s.size, 0); }
}
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function setup(options = {}) {
  const button = new Target(), mute = new Target(), range = new Target(), select = new Target(), value = {}, label = {}, status = {};
  select.value = 'dreamed';
  const elements = { button, mute, volume: range, value, label, status, track: select };
  const root = { dataset: { locale: options.locale || 'en' }, querySelector: s => elements[s.slice(12, -1)] };
  const doc = new Target(); doc.hidden = false;
  const win = new Target(), media = new Target(), context = new Target(), nodes = [], calls = [];
  let contexts = 0, medias = 0, sources = 0;
  Object.assign(media, { paused: true, plays: 0, pauses: 0, loads: 0,
    play() { this.plays++; calls.push('play'); return Promise.resolve(options.play?.()).then(() => { this.paused = options.paused ?? false; }); },
    pause() { this.pauses++; this.paused = true; this.emit('pause'); }, load() { this.loads++; },
    removeAttribute(k) { if (k === 'src') this.src = ''; },
  });
  Object.assign(context, { currentTime: 12, state: 'suspended', destination: {}, resumes: 0, suspends: 0, closes: 0,
    resume() { this.resumes++; calls.push('resume'); return Promise.resolve(options.resume?.()).then(() => { this.state = options.resumeState || 'running'; }); },
    suspend() { this.suspends++; this.state = 'suspended'; return options.suspend?.() || Promise.resolve(); },
    close() { this.closes++; this.state = 'closed'; return options.close?.() || Promise.resolve(); },
    createGain() { const n = { gain: { value: 0, targets: [], setTargetAtTime(v, t, c) { this.value = v; this.targets.push([v, t, c]); }, cancelScheduledValues() {} }, connect(to) { this.to = to; }, disconnect() { this.disconnected = true; } }; nodes.push(n); return n; },
    createMediaElementSource(m) { assert.equal(m, media); sources++; const n = { connect(to) { this.to = to; }, disconnect() { this.disconnected = true; } }; nodes.push(n); return n; },
  });
  win.navigator = { userActivation: { hasBeenActive: options.activated ?? false } };
  const controller = createMusicController({ root: options.missing ? null : root, doc, win, store: options.store, now: () => options.now ?? 1000, autostart: options.autostart,
    createContext: options.unsupported ? null : options.native ? undefined : () => { contexts++; return context; },
    createMedia: () => { medias++; return media; } });
  return { controller, button, mute, range, select, value, label, status, doc, win, media, context, nodes, calls,
    contexts: () => contexts, medias: () => medias, sources: () => sources,
    adjust(v) { range.value = String(v); range.emit('input'); },
    choose(id) { select.value = id; select.emit('change'); } };
}
const settle = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
const play = async f => { f.button.emit('click'); await settle(); };
const gain = f => f.nodes.find(n => n.gain).gain;

test('mount, missing host, volume and mute do not create audio or start playback', () => {
  const f = setup(); assert.equal(f.range.value, '70'); assert.equal(f.value.textContent, '70%');
  f.adjust(25); f.mute.emit('click'); f.mute.emit('click');
  assert.equal(f.contexts(), 0); assert.equal(f.medias(), 0); assert.equal(f.media.plays, 0);
  assert.equal(f.button.attrs['aria-pressed'], 'false');
  const missing = setup({ missing: true }); assert.equal(missing.doc.count() + missing.win.count(), 0);
});
test('one explicit gesture calls resume and play synchronously, graph is local and reused', async () => {
  const f = setup(); f.button.emit('click');
  assert.deepEqual(f.calls, ['resume', 'play']); assert.equal(f.button.attrs['aria-pressed'], 'false');
  await settle(); assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(gain(f).value, .7);
  assert.equal(f.media.volume, 1); assert.equal(f.media.preload, 'none'); assert.equal(f.media.autoplay, false);
  assert.equal(f.media.loop, true); assert.equal(f.media.src, '/music/portfolio-lofi.mp3');
  assert.equal(f.nodes.find(n => !n.gain).to, f.nodes.find(n => n.gain));
  assert.equal(f.nodes.find(n => n.gain).to, f.context.destination);
  f.button.emit('click'); await settle(); await play(f);
  assert.equal(f.contexts(), 1); assert.equal(f.medias(), 1); assert.equal(f.sources(), 1); assert.equal(f.nodes.length, 2);
});
test('live gain clamps integer volume, zero is muted and restores last nonzero without new playback', async () => {
  const f = setup(); await play(f); const resumes = f.context.resumes, plays = f.media.plays;
  for (const [input, expected] of [[31.6, 32], [200, 100], [-2, 0], ['NaN', 0], [45, 45]]) {
    f.adjust(input); assert.equal(f.range.value, String(expected)); assert.equal(gain(f).value, expected / 100);
    assert.equal(f.mute.attrs['aria-pressed'], String(expected === 0));
  }
  f.mute.emit('click'); assert.equal(gain(f).value, 0); f.mute.emit('click'); assert.equal(gain(f).value, .45);
  assert.equal(f.context.resumes, resumes); assert.equal(f.media.plays, plays); assert.equal(f.contexts(), 1);
  assert.ok(gain(f).targets.every(([v, , c]) => v >= 0 && v <= 1 && c > 0));
  f.button.emit('click'); await settle(); f.adjust(22); await play(f); assert.equal(gain(f).value, .22);
});
test('initial zero restores default 70 and localized accessible volume is synchronized', () => {
  const f = setup({ locale: 'es' }); f.adjust(0); f.mute.emit('click');
  assert.equal(f.range.value, '70'); assert.equal(f.range.attrs['aria-valuetext'], '70%');
  assert.match(f.range.attrs['aria-label'], /volumen/i); assert.match(f.mute.attrs['aria-label'], /silenciar/i);
  assert.equal(f.button.attrs['aria-label'], 'Reproducir música ambiental');
});
for (const stalled of ['resume', 'play']) test(`no early playing while ${stalled} is unsettled`, async () => {
  const d = deferred(), f = setup({ [stalled]: () => d.promise }); f.button.emit('click'); await settle();
  f.media.emit('playing'); assert.equal(f.button.attrs['aria-pressed'], 'false'); assert.equal(f.label.textContent, 'Loading…');
  d.resolve(); await settle(); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
for (const state of ['suspended', 'interrupted', 'closed']) test(`resolved ${state} context never claims playing`, async () => {
  const f = setup({ resumeState: state, locale: 'es' }); await play(f);
  assert.equal(f.button.attrs['aria-pressed'], 'false'); assert.equal(f.media.paused, true); assert.equal(f.label.textContent, 'No disponible');
  assert.match(f.status.textContent, /botón de música/);
  f.context.resume = function () { this.resumes++; this.state = 'running'; return Promise.resolve(); };
  if (state !== 'closed') { await play(f); assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(f.sources(), 1); }
  else { await play(f); assert.equal(f.button.attrs['aria-pressed'], 'false'); assert.equal(f.sources(), 1); }
});
test('resolved play still paused is unavailable, not a false playback label', async () => {
  const f = setup({ paused: true }); await play(f); assert.equal(f.label.textContent, 'Unavailable');
});
for (const stalled of ['resume', 'play']) for (const action of ['pause', 'dispose']) test(`late ${stalled} cannot revive after ${action}`, async () => {
  const d = deferred(), f = setup({ [stalled]: () => d.promise }); f.button.emit('click');
  if (action === 'pause') f.button.emit('click');
  if (action === 'dispose') f.controller.dispose();
  d.resolve(); await settle(); assert.equal(f.media.paused, true); assert.equal(f.button.attrs['aria-pressed'], 'false');
  if (action !== 'dispose') assert.equal(f.context.state, 'suspended');
});
for (const failed of ['resume', 'play']) test(`early ${failed} rejection stops the other late settlement and permits retry only afterwards`, async () => {
  const d = deferred(), other = failed === 'resume' ? 'play' : 'resume';
  const f = setup({ [failed]: () => Promise.reject(Error('private')), [other]: () => d.promise });
  f.button.emit('click'); await settle(); assert.equal(f.label.textContent, 'Unavailable');
  assert.doesNotMatch(f.status.textContent, /private/); f.button.emit('click'); await settle();
  assert.equal(f.context.resumes, 1); assert.equal(f.media.plays, 1);
  d.resolve(); await settle(); assert.equal(f.context.resumes, 2); assert.equal(f.media.plays, 2);
  // Retry also fails, so no stale or retry sound survives.
  assert.equal(f.media.paused, true); assert.equal(f.button.attrs['aria-pressed'], 'false');
});
test('rapid pause/play waits for stale transition and suspend before a single new attempt', async () => {
  const resumes = [], f = setup({ resume: () => { const d = deferred(); resumes.push(d); return d.promise; } });
  f.button.emit('click'); f.button.emit('click'); f.button.emit('click');
  assert.equal(resumes.length, 1); resumes[0].resolve(); await settle();
  assert.equal(resumes.length, 2); resumes[1].resolve(); await settle();
  assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(f.sources(), 1);
});
test('pending suspend serializes restart and disposal cancels waiting restart', async () => {
  const d = deferred(), f = setup({ suspend: () => d.promise }); await play(f);
  f.button.emit('click'); f.button.emit('click'); await settle(); assert.equal(f.context.resumes, 1);
  f.controller.dispose(); d.resolve(); await settle(); assert.equal(f.context.resumes, 1); assert.equal(f.context.closes, 1);
});
test('BFCache retains intent and volume, but paused and fresh pages never resume', async () => {
  const fresh = setup(); fresh.win.emit('pageshow'); fresh.doc.emit('visibilitychange'); assert.equal(fresh.contexts(), 0);
  const f = setup(); await play(f); f.adjust(38);
  f.win.emit('pagehide', { persisted: true }); await settle(); assert.equal(f.context.closes, 0);
  assert.equal(f.media.paused, true); assert.equal(f.context.state, 'suspended');
  f.win.emit('pageshow', { persisted: true }); await settle(); assert.equal(gain(f).value, .38); assert.equal(f.media.plays, 2);
  f.button.emit('click'); await settle(); f.win.emit('pagehide', { persisted: true }); f.win.emit('pageshow'); await settle();
  assert.equal(f.media.plays, 2);
});
test('switching browser tabs keeps music playing and never pauses or suspends it', async () => {
  const f = setup(); await play(f); const { pauses, suspends, plays } = f.media.pauses === undefined ? {} : { pauses: f.media.pauses, suspends: f.context.suspends, plays: f.media.plays };
  f.doc.hidden = true; f.doc.emit('visibilitychange'); await settle();
  assert.equal(f.media.paused, false); assert.equal(f.context.state, 'running'); assert.equal(f.button.attrs['aria-pressed'], 'true');
  assert.equal(f.media.pauses, pauses); assert.equal(f.context.suspends, suspends);
  f.doc.hidden = false; f.doc.emit('visibilitychange'); await settle();
  assert.equal(f.media.plays, plays); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
test('a browser that throttled audio in the background is revived on return, a manual pause is not', async () => {
  const f = setup(); await play(f); f.doc.hidden = true;
  f.context.state = 'suspended'; f.context.emit('statechange'); f.media.paused = true; f.media.emit('pause'); await settle();
  assert.equal(f.label.textContent, 'Pause'); // intent survives a hidden browser-forced interruption
  f.doc.hidden = false; f.doc.emit('visibilitychange'); await settle();
  assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(f.media.paused, false);
  f.button.emit('click'); await settle(); const plays = f.media.plays;
  f.doc.hidden = true; f.doc.emit('visibilitychange'); f.doc.hidden = false; f.doc.emit('visibilitychange'); await settle();
  assert.equal(f.media.plays, plays); assert.equal(f.button.attrs['aria-pressed'], 'false');
});
test('track list is the four local CC0 recordings with unique ids and the original first', () => {
  assert.equal(musicTracks.length, 4); assert.equal(new Set(musicTracks.map(t => t.id)).size, 4);
  assert.equal(musicTracks[0].src, '/music/portfolio-lofi.mp3');
  assert.ok(musicTracks.every(t => /^\/music\/portfolio-[a-z-]+\.mp3$/.test(t.src) && t.title));
});
test('choosing a track before playing stores it silently and the first play uses it', async () => {
  const f = setup(); f.choose('autumn');
  assert.equal(f.contexts(), 0); assert.equal(f.medias(), 0); assert.equal(f.media.plays, 0);
  await play(f); assert.equal(f.media.src, '/music/portfolio-autumn.mp3'); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
test('choosing a track while playing swaps the recording, keeps one graph and the chosen volume', async () => {
  const f = setup(); await play(f); f.adjust(41); const plays = f.media.plays;
  f.choose('clouds'); await settle();
  assert.equal(f.media.src, '/music/portfolio-clouds.mp3'); assert.equal(f.media.plays, plays + 1);
  assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(gain(f).value, .41);
  assert.equal(f.contexts(), 1); assert.equal(f.medias(), 1); assert.equal(f.sources(), 1);
  f.choose('clouds'); await settle(); assert.equal(f.media.plays, plays + 1);
  f.choose('nonexistent'); await settle(); assert.equal(f.media.src, '/music/portfolio-lofi.mp3');
});
test('choosing a track while paused changes the source without starting playback', async () => {
  const f = setup(); await play(f); f.button.emit('click'); await settle(); const plays = f.media.plays;
  f.choose('morning-coffee'); await settle();
  assert.equal(f.media.src, '/music/portfolio-morning-coffee.mp3'); assert.equal(f.media.plays, plays);
  assert.equal(f.button.attrs['aria-pressed'], 'false'); await play(f); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
test('choosing a track during a pending start restarts once with the new recording', async () => {
  const d = deferred(), f = setup({ play: () => d.promise }); f.button.emit('click'); await settle();
  f.choose('autumn'); d.resolve(); await settle();
  assert.equal(f.media.src, '/music/portfolio-autumn.mp3'); assert.equal(f.button.attrs['aria-pressed'], 'true');
  assert.equal(f.sources(), 1);
});
test('choosing a track after disposal does nothing and the selector listener is removed', async () => {
  const f = setup(); await play(f); f.controller.dispose(); await settle();
  assert.equal(f.select.count(), 0); const src = f.media.src; f.choose('autumn'); assert.equal(f.media.src, src);
});
test('native waiting/playing/pause/error and context interruption reflect browser truth', async () => {
  const f = setup(); await play(f); f.media.emit('waiting'); assert.equal(f.button.attrs['aria-pressed'], 'false');
  f.media.emit('playing'); assert.equal(f.button.attrs['aria-pressed'], 'true');
  f.media.paused = true; f.media.emit('pause'); await settle(); assert.equal(f.button.attrs['aria-pressed'], 'false');
  await play(f); f.context.state = 'interrupted'; f.context.emit('statechange'); await settle();
  assert.equal(f.label.textContent, 'Unavailable'); assert.equal(f.media.paused, true);
  await play(f); f.media.emit('error'); await settle(); assert.equal(f.label.textContent, 'Unavailable'); assert.equal(f.media.paused, true);
});
test('terminal cleanup detaches media, disconnects graph, closes once and preserves unrelated listeners', async () => {
  const f = setup(); const unrelated = () => {}; f.win.addEventListener('pageshow', unrelated); await play(f);
  f.win.emit('pagehide', { persisted: false }); f.controller.dispose(); await settle();
  assert.equal(f.context.closes, 1); assert.equal(f.media.src, ''); assert.equal(f.media.loads, 1);
  assert.ok(f.nodes.every(n => n.disconnected)); assert.equal(f.media.count() + f.context.count() + f.doc.count(), 0);
  assert.equal(f.button.count() + f.mute.count() + f.range.count() + f.select.count(), 0); assert.equal(f.win.count(), 1);
});
test('unsupported APIs and suspend/close rejection are handled; retry works when API becomes available', async () => {
  const f = setup({ unsupported: true, locale: 'es' }); await play(f); assert.equal(f.contexts(), 0); assert.equal(f.medias(), 0);
  assert.equal(f.label.textContent, 'No disponible');
  const g = setup({ suspend: () => Promise.reject(Error()), close: () => Promise.reject(Error()) });
  await play(g); g.button.emit('click'); await settle(); await play(g); assert.equal(g.button.attrs['aria-pressed'], 'true');
  g.controller.dispose(); await settle();
});
test('an initially missing native constructor can become available for a localized retry', async () => {
  const f = setup({ native: true, locale: 'es' }); await play(f);
  assert.equal(f.label.textContent, 'No disponible'); assert.equal(f.medias(), 0);
  f.win.AudioContext = function () { return f.context; };
  await play(f); assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(f.status.textContent, '');
  assert.equal(f.sources(), 1);
});
test('simple AudioParam scalar fallback and paused volume preserve chosen level', async () => {
  const f = setup(); await play(f); delete gain(f).setTargetAtTime;
  f.adjust(58); assert.equal(gain(f).value, .58); f.button.emit('click'); await settle();
  f.adjust(16); assert.equal(gain(f).value, .16); await play(f); assert.equal(gain(f).value, .16);
});
test('repeated play/pause keeps media, source, gain and listeners bounded', async () => {
  const f = setup(); await play(f); const listeners = f.media.count() + f.context.count();
  for (let i = 0; i < 100; i++) { f.button.emit('click'); await settle(); await play(f); }
  assert.equal(f.medias(), 1); assert.equal(f.contexts(), 1); assert.equal(f.sources(), 1); assert.equal(f.nodes.length, 2);
  assert.equal(f.media.count() + f.context.count(), listeners); f.controller.dispose();
});
test('terminal cleanup before activation does not load media or create/close context', () => {
  const f = setup(); f.controller.dispose(); f.controller.dispose();
  assert.equal(f.media.loads, 0); assert.equal(f.medias(), 0); assert.equal(f.contexts(), 0); assert.equal(f.context.closes, 0);
  assert.equal(f.button.count() + f.range.count() + f.mute.count() + f.doc.count() + f.win.count(), 0);
});
test('component has native localized range, compact targets, layouts unchanged and no remote code', () => {
  const component = readFileSync(new URL('../src/components/PortfolioMusic.astro', import.meta.url), 'utf8');
  assert.match(component, /type="range"/); assert.match(component, /min="0" max="100" step="1" value="70"/);
  assert.match(component, /aria-label=\{copy.volume\}/); assert.match(component, /data-music-value/);
  assert.match(component, /44px/); assert.match(component, /calc\(100vw - 104px\)/); assert.match(component, /min-width: 0/);
  assert.match(component, /data-music-track/); assert.match(component, /aria-label=\{copy.track\}/); assert.match(component, /musicTracks\.map/);
  assert.match(component, /createMusicController\(\{ root, autostart: true \}\)/);
  assert.match(component, /aria-live="polite"/); assert.match(component, /prefers-reduced-motion/); assert.match(component, /safe-area-inset-left/);
  for (const layout of ['PortfolioLayout', 'BlogLayout']) assert.match(readFileSync(new URL(`../src/layouts/${layout}.astro`, import.meta.url), 'utf8'), /<PortfolioMusic locale=\{locale\} \/>/);
  const script = readFileSync(new URL('../src/scripts/portfolio-music.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /localStorage|fetch\(|https:|createOscillator|setInterval|keydown/);
});
test('approved local recording is original verified MP3 and provenance includes exact hash and license', () => {
  const asset = readFileSync(new URL('../public/music/portfolio-lofi.mp3', import.meta.url));
  assert.equal(asset.length, 8801280); assert.equal(asset[0], 255); assert.equal(asset[1] & 224, 224);
  const hash = createHash('sha256').update(asset).digest('hex');
  assert.equal(hash, 'c5a2e0aa16cd92df54bb76322ab49e83b0bff5c30e751fe74d3a603e3ddb030f');
  const provenance = readFileSync(new URL('../public/music/README.md', import.meta.url), 'utf8');
  assert.ok(provenance.includes(hash)); assert.match(provenance, /HoliznaCC0/); assert.match(provenance, /creativecommons.org\/publicdomain\/zero\/1.0/);
});
test('additional recordings are original verified MP3s whose hashes and licenses are recorded', () => {
  const expected = {
    'portfolio-morning-coffee.mp3': [7680205, '91de2d8f409730a7fa9b0d94f52d5637d7f913e8cee11d54e462a99b06a86758'],
    'portfolio-autumn.mp3': [6794125, 'c12190c1c3587e61580078d01c54d4ab7ab1f742857dc07b9d9d712735631b1a'],
    'portfolio-clouds.mp3': [9188345, 'ae970bdaf997065c5b5ea3520c909514f3a4ed2c84521a83eed1325bffaa26c9'],
  };
  const provenance = readFileSync(new URL('../public/music/README.md', import.meta.url), 'utf8');
  for (const [name, [size, hash]] of Object.entries(expected)) {
    const asset = readFileSync(new URL(`../public/music/${name}`, import.meta.url));
    assert.equal(asset.length, size); assert.equal(asset.subarray(0, 3).toString('latin1'), 'ID3');
    assert.equal(createHash('sha256').update(asset).digest('hex'), hash); assert.ok(provenance.includes(hash));
    assert.ok(musicTracks.some(t => t.src === `/music/${name}`));
  }
});

const memoryStore = (initial = {}) => { const data = { ...initial }; return { data, getItem: k => data[k] ?? null, setItem(k, v) { data[k] = v; } }; };
const KEY = 'portfolio-music';
test('same-tab navigation keeps the song, volume and position and resumes without a new click', async () => {
  const store = memoryStore();
  const first = setup({ store, activated: true }); first.choose('autumn'); first.adjust(40); await play(first);
  first.media.currentTime = 93.5; first.win.emit('pagehide', { persisted: false });
  const saved = JSON.parse(store.data[KEY]);
  assert.deepEqual([saved.track, saved.volume, saved.playing, saved.time], ['autumn', 40, true, 93.5]);
  const next = setup({ store, activated: true, now: 1000 + 5000 }); await settle();
  assert.equal(next.select.value, 'autumn'); assert.equal(next.range.value, '40');
  assert.equal(next.media.src, '/music/portfolio-autumn.mp3'); assert.equal(next.media.currentTime, 93.5);
  assert.equal(next.media.plays, 1); assert.equal(next.button.attrs['aria-pressed'], 'true'); assert.equal(gain(next).value, .4);
});
test('a paused player stays paused on the next page but keeps the volume and song', async () => {
  const store = memoryStore();
  const first = setup({ store, activated: true }); first.choose('clouds'); first.adjust(20); await play(first); await play(first);
  first.win.emit('pagehide', { persisted: false });
  const next = setup({ store, activated: true }); await settle();
  assert.equal(next.select.value, 'clouds'); assert.equal(next.range.value, '20');
  assert.equal(next.contexts(), 0); assert.equal(next.medias(), 0); assert.equal(next.media.plays, 0);
});
test('without browser user activation or with a stale save nothing starts by itself', async () => {
  const store = memoryStore({ [KEY]: JSON.stringify({ track: 'autumn', volume: 55, playing: true, time: 10, at: 1000 }) });
  const blocked = setup({ store, activated: false, now: 2000 }); await settle();
  assert.equal(blocked.select.value, 'autumn'); assert.equal(blocked.range.value, '55');
  assert.equal(blocked.contexts(), 0); assert.equal(blocked.medias(), 0); assert.equal(blocked.button.attrs['aria-pressed'], 'false');
  const stale = setup({ store, activated: true, now: 1000 + 61000 }); await settle();
  assert.equal(stale.contexts(), 0); assert.equal(stale.medias(), 0); assert.equal(stale.range.value, '55');
});
test('unreadable, malformed or throwing storage never breaks the player', async () => {
  for (const store of [{ getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } }, memoryStore({ [KEY]: '{oops' }),
    memoryStore({ [KEY]: JSON.stringify({ track: 'evil', volume: 'x', playing: 'yes', time: -4, at: 'now' }) })]) {
    const f = setup({ store, activated: true }); await settle();
    assert.equal(f.select.value, 'dreamed'); assert.equal(f.range.value, '70'); assert.equal(f.media.plays, 0);
    await play(f); assert.equal(f.button.attrs['aria-pressed'], 'true'); f.win.emit('pagehide', { persisted: false });
  }
});
test('a BFCache freeze also records the state for the page that follows', async () => {
  const store = memoryStore(); const f = setup({ store, activated: true }); await play(f);
  f.win.emit('pagehide', { persisted: true }); assert.equal(JSON.parse(store.data[KEY]).playing, true);
});

test('phones get a collapsed pill whose settings toggle is an accessible disclosure above the chat launcher', () => {
  const c = readFileSync(new URL('../src/components/PortfolioMusic.astro', import.meta.url), 'utf8');
  assert.match(c, /data-music-more[^>]*aria-expanded="false"[^>]*aria-controls="music-settings"|aria-controls="music-settings"[^>]*aria-expanded="false"/);
  assert.match(c, /id="music-settings"/); assert.match(c, /@media \(max-width: 640px\)/);
  assert.match(c, /\.is-open/); assert.match(c, /aria-expanded/); assert.match(c, /Escape/);
  assert.match(c, /musicCopy\[locale\]|copy\.settings/); assert.ok(musicCopySettings());
});
function musicCopySettings() { const s = readFileSync(new URL('../src/scripts/portfolio-music.mjs', import.meta.url), 'utf8'); return /settings: 'Music settings'/.test(s) && /settings: 'Ajustes de música'/.test(s); }

test('autostart plays on page load when the browser already reports user activation', async () => {
  const f = setup({ autostart: true, activated: true }); await settle();
  assert.equal(f.media.plays, 1); assert.equal(f.button.attrs['aria-pressed'], 'true'); assert.equal(f.status.textContent ?? '', '');
});
test('autostart without activation attempts nothing on load and starts on the first page gesture', async () => {
  const f = setup({ autostart: true }); await settle();
  assert.equal(f.contexts(), 0); assert.equal(f.media.plays, 0); assert.equal(f.button.attrs['aria-pressed'], 'false');
  f.doc.emit('pointerdown', { target: {} }); await settle();
  assert.equal(f.media.plays, 1); assert.equal(f.button.attrs['aria-pressed'], 'true');
  f.doc.emit('pointerdown', { target: {} }); await settle();
  assert.equal(f.media.plays, 1); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
test('autostart never overrides a player the visitor paused on a previous page', async () => {
  const store = memoryStore();
  const first = setup({ store }); await play(first); await play(first); first.win.emit('pagehide', { persisted: false });
  const f = setup({ store, autostart: true, activated: true }); await settle();
  f.doc.emit('pointerdown', { target: {} }); await settle();
  assert.equal(f.contexts(), 0); assert.equal(f.media.plays, 0);
});
test('autostart still starts after a reload that never played music', async () => {
  const store = memoryStore();
  const first = setup({ store }); first.win.emit('pagehide', { persisted: false });
  const f = setup({ store, autostart: true }); await settle();
  f.doc.emit('pointerdown', { target: {} }); await settle();
  assert.equal(f.media.plays, 1); assert.equal(f.button.attrs['aria-pressed'], 'true');
});
test('without autostart nothing starts on load or on a page gesture', async () => {
  const f = setup(); await settle(); f.doc.emit('pointerdown', { target: {} }); await settle();
  assert.equal(f.contexts(), 0); assert.equal(f.media.plays, 0);
});
