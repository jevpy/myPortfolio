import test from 'node:test';
import assert from 'node:assert/strict';
import { createAchievementsMotion } from '../src/scripts/achievements-motion.mjs';

class Events {
  listeners = new Map();
  addEventListener(name, fn) { const set = this.listeners.get(name) ?? new Set(); set.add(fn); this.listeners.set(name, set); }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
  emit(name, event = {}) { for (const fn of this.listeners.get(name) ?? []) fn(event); }
  count() { return [...this.listeners.values()].reduce((n, set) => n + set.size, 0); }
}
function fixture({ reduced = false, fine = true, hidden = false, paused = false, observer = true, loader } = {}) {
  const win = new Events();
  const doc = new Events();
  doc.hidden = hidden;
  let off = paused;
  doc.documentElement = { classList: { contains: () => off } };
  const control = new Events();
  control.disabled = false;
  control.getAttribute = () => paused ? 'true' : 'false';
  doc.getElementById = () => control;
  const reduce = Object.assign(new Events(), { matches: reduced });
  const pointer = Object.assign(new Events(), { matches: fine });
  win.matchMedia = q => q.includes('reduced') ? reduce : pointer;
  let intersection;
  let intersectionObserver;
  let mutation;
  const observations = [];
  const observers = [];
  class IO {
    constructor(fn, options) {
      intersection = fn;
      intersectionObserver = this;
      this.thresholds = [options.threshold].flat().sort((a, b) => a - b);
      this.previousThresholdIndex = -1;
      this.previousIsIntersecting = false;
      observations.push(options);
      observers.push(this);
    }
    observe() {}
    sample(target, isIntersecting, intersectionRatio) {
      const firstGreater = this.thresholds.findIndex(threshold => threshold > intersectionRatio);
      const thresholdIndex = firstGreater === -1 ? this.thresholds.length : firstGreater;
      const notify = thresholdIndex !== this.previousThresholdIndex
        || isIntersecting !== this.previousIsIntersecting;
      this.previousThresholdIndex = thresholdIndex;
      this.previousIsIntersecting = isIntersecting;
      if (notify) intersection([{ target, isIntersecting, intersectionRatio }]);
      return notify;
    }
    disconnect() { this.disconnected = true; }
  }
  class MO {
    constructor(fn) { mutation = fn; observers.push(this); }
    observe(_target, options) { observations.push(options); }
    disconnect() { this.disconnected = true; }
  }
  win.IntersectionObserver = observer ? IO : undefined;
  win.MutationObserver = MO;
  const layer = {};
  const panel = new Events();
  panel.querySelector = () => layer;
  panel.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  const root = { querySelectorAll: selector => selector === '[data-achievement-panel]' ? [panel] : [layer] };
  const hero = { killed: false };
  const triggers = [hero];
  let owned;
  const calls = { loads: 0, contexts: 0, reverts: 0, entrances: [], scrolls: [], tilts: [], killed: 0,
    get heroKilled() { return hero.killed; }, triggers };
  const gsap = {
    registerPlugin() {},
    set() {},
    context(fn, scope) {
      assert.equal(scope, root);
      calls.contexts++;
      const local = [];
      const run = callback => { owned = local; try { callback(); } finally { owned = undefined; } };
      run(fn);
      return { revert() { calls.reverts++; local.forEach(trigger => { trigger.killed = true; }); }, add: run };
    },
    timeline() { return { fromTo(_target, from, to, position) { calls.entrances.push({ from, to, position }); return this; } }; },
    fromTo(_target, _from, to) {
      calls.scrolls.push(to);
      const trigger = { killed: false };
      triggers.push(trigger); owned?.push(trigger);
    },
    to(_target, vars) { calls.tilts.push(vars); return { kill() { calls.killed++; } }; },
  };
  const loadMotion = () => { calls.loads++; return loader ? loader() : Promise.resolve({ gsap, ScrollTrigger: {} }); };
  const controller = createAchievementsMotion({ root, document: doc, window: win, loadMotion });
  return {
    controller, calls, doc, win, panel, control, observations, observers, reduce, pointer,
    enter(value = true) { intersection?.([{ target: root, isIntersecting: value, intersectionRatio: value ? 1 : 0 }]); },
    sample(isIntersecting, intersectionRatio) { return intersectionObserver.sample(root, isIntersecting, intersectionRatio); },
    reduced(value) { reduce.matches = value; reduce.emit('change'); },
    fine(value) { pointer.matches = value; pointer.emit('change'); },
    pause(value) { paused = value; off = value; mutation?.(); },
    siteOff(value) { off = value; mutation?.(); },
    disable(value) { control.disabled = value; mutation?.(); },
    hide(value) { doc.hidden = value; doc.emit('visibilitychange'); },
    motion: { gsap, ScrollTrigger: {} },
  };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

test('Node import and absent host/observer leave SSR content untouched', async () => {
  assert.doesNotThrow(() => createAchievementsMotion({ root: null }).dispose());
  const f = fixture({ observer: false });
  await settle();
  assert.equal(f.calls.loads, 0);
  assert.equal(f.calls.contexts, 0);
  f.controller.dispose();
});

test('only actual intersection loads motion; entrance and scrub own distinct layers', async () => {
  const f = fixture();
  assert.equal(f.calls.loads, 0);
  assert.equal(f.observations[0].rootMargin, '0px');
  f.enter(); await settle();
  assert.equal(f.calls.loads, 1);
  assert.equal(f.calls.contexts, 1);
  assert.ok(f.calls.entrances.length >= 4);
  assert.ok(f.calls.entrances.every(c => c.to.duration <= 1.6));
  assert.ok(f.calls.scrolls.every(c => c.scrollTrigger.scrub && !c.scrollTrigger.pin));
  f.enter(false);
  assert.equal(f.calls.reverts, 1);
  assert.equal(f.calls.heroKilled, false);
  assert.ok(f.calls.triggers.slice(1).every(t => t.killed));
  f.enter(); await settle();
  assert.equal(f.calls.loads, 1, 'reuse loaded module, not another import');
  assert.equal(f.calls.contexts, 2);
  f.controller.dispose();
});

test('threshold crossing after a zero-area edge intersection loads motion', async () => {
  const f = fixture();
  assert.equal(f.sample(false, 0), true, 'initial outside observation notifies');
  await settle();
  assert.equal(f.calls.loads, 0);
  assert.equal(f.sample(true, 0), true, 'edge contact changes isIntersecting');
  await settle();
  assert.equal(f.calls.loads, 0, 'zero-area edge contact must not import');
  assert.equal(f.calls.contexts, 0);
  assert.equal(f.sample(true, .005), false, 'below-threshold movement does not notify');
  await settle();
  assert.equal(f.calls.loads, 0);
  assert.equal(f.calls.contexts, 0);
  f.sample(true, .02);
  await settle();
  assert.equal(f.calls.loads, 1, 'positive threshold crossing must trigger import');
  assert.equal(f.calls.contexts, 1);
  f.controller.dispose();
});

for (const [name, initial, restore] of [
  ['reduced', { reduced: true }, f => f.reduced(false)],
  ['hidden', { hidden: true }, f => f.hide(false)],
  ['site pause', { paused: true }, f => f.pause(false)],
]) test(`${name} prevents import and can resume while intersecting`, async () => {
  const f = fixture(initial);
  f.enter(); await settle();
  assert.equal(f.calls.loads, 0);
  restore(f); await settle();
  assert.equal(f.calls.contexts, 1);
  f.controller.dispose();
});

for (const flip of ['reduced', 'hidden', 'offscreen', 'pause', 'dispose']) test(`async ${flip} discards ineligible completion`, async () => {
  let resolve;
  const f = fixture({ loader: () => new Promise(r => { resolve = r; }) });
  f.enter(); await settle();
  if (flip === 'reduced') f.reduced(true);
  if (flip === 'hidden') f.hide(true);
  if (flip === 'offscreen') f.enter(false);
  if (flip === 'pause') f.pause(true);
  if (flip === 'dispose') f.controller.dispose();
  resolve(f.motion); await settle();
  assert.equal(f.calls.contexts, 0);
  f.controller.dispose();
});

test('eligibility is checked again immediately before the asynchronous loader starts', async () => {
  const f = fixture();
  f.enter(); f.hide(true);
  await settle();
  assert.equal(f.calls.loads, 0);
  f.controller.dispose();
});

test('eligibility restored during a skipped loader microtask resumes without another event', async () => {
  const f = fixture();
  f.enter(); f.hide(true);
  await Promise.resolve();
  f.hide(false); await settle(); await settle();
  assert.equal(f.calls.contexts, 1);
  f.controller.dispose();
});

test('external motion-off and disabled Pause each independently prevent import', async () => {
  const f = fixture();
  f.siteOff(true); f.enter(); await settle();
  assert.equal(f.calls.loads, 0);
  f.disable(true); f.siteOff(false); await settle();
  assert.equal(f.calls.loads, 0);
  f.disable(false); await settle();
  assert.equal(f.calls.contexts, 1);
  f.controller.dispose();
});

test('fine pointer is bounded, touch ignored, leave/cancel reset; coarse toggle resumes', async () => {
  const f = fixture({ fine: false });
  f.enter(); await settle();
  f.panel.emit('pointermove', { clientX: 900, clientY: -900 });
  assert.equal(f.calls.tilts.length, 0);
  f.fine(true);
  f.panel.emit('pointermove', { pointerType: 'touch', clientX: 200, clientY: 100 });
  assert.equal(f.calls.tilts.length, 0);
  f.panel.emit('pointermove', { pointerType: 'mouse', clientX: 900, clientY: -900 });
  const tilt = f.calls.tilts.at(-1);
  assert.ok(Math.abs(tilt.rotationX) <= 5 && Math.abs(tilt.rotationY) <= 5);
  f.panel.emit('pointerleave');
  assert.equal(f.calls.tilts.at(-1).rotationX, 0);
  f.panel.emit('pointercancel');
  assert.equal(f.calls.tilts.at(-1).rotationY, 0);
  f.fine(false);
  assert.equal(f.panel.count(), 0);
  f.fine(true);
  assert.equal(f.panel.count(), 3);
  f.enter(false);
  assert.equal(f.panel.count(), 0);
  f.enter(); await settle();
  assert.equal(f.panel.count(), 3);
  f.controller.dispose();
  assert.equal(f.panel.count(), 0);
});

test('visibility and BFCache suspend/restore, terminal pagehide removes events and observers', async () => {
  const f = fixture();
  f.enter(); await settle();
  f.hide(true); assert.equal(f.calls.reverts, 1);
  f.hide(false); await settle(); assert.equal(f.calls.contexts, 2);
  f.win.emit('pagehide', { persisted: true }); assert.equal(f.calls.reverts, 2);
  f.win.emit('pageshow', { persisted: true }); await settle(); assert.equal(f.calls.contexts, 3);
  f.win.emit('pagehide', { persisted: false });
  assert.equal(f.calls.reverts, 3);
  assert.equal(f.win.count() + f.doc.count() + f.panel.count() + f.control.count() + f.reduce.count() + f.pointer.count(), 0);
  assert.ok(f.observers.every(o => o.disconnected));
  f.enter(); f.win.emit('pageshow', { persisted: true }); await settle();
  assert.equal(f.calls.contexts, 3);
});

test('loader rejection is consumed, preserves readable base, and does not retry in a loop', async () => {
  const f = fixture({ loader: () => Promise.reject(new Error('offline')) });
  f.enter(); await settle();
  assert.equal(f.calls.contexts, 0);
  f.enter(false); f.enter(); await settle();
  assert.equal(f.calls.loads, 1);
  f.controller.dispose();
});

test('pause observer watches only external classes/control state, not animated styles', () => {
  const f = fixture();
  const mutations = f.observations.filter(o => o.attributeFilter);
  assert.deepEqual(mutations.map(o => o.attributeFilter), [['class'], ['aria-pressed', 'disabled']]);
  assert.ok(mutations.every(o => !o.subtree));
  f.controller.dispose();
});
