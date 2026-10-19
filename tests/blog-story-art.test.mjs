import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountStoryArt } from '../src/scripts/blog-story-art.mjs';

const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function fakeThree(log) {
  class Obj { constructor() { this.rotation = { x: 0, y: 0, z: 0 }; this.position = { set() {} }; } add() {} }
  class Geo { constructor() { log.geometries++; } dispose() { log.disposedGeometries++; } }
  class Mat { dispose() { log.materials++; } }
  return {
    Scene: Obj, Group: Obj, PerspectiveCamera: class extends Obj { constructor() { super(); this.position = { set() {} }; } },
    IcosahedronGeometry: Geo, OctahedronGeometry: Geo, EdgesGeometry: Geo,
    LineSegments: class extends Obj {}, Points: class extends Obj {}, LineBasicMaterial: Mat, PointsMaterial: Mat,
    WebGLRenderer: class {
      constructor() { log.renderers++; this.domElement = { setAttribute() {}, remove() { log.removed = true; } }; }
      setPixelRatio() {} setSize() {} render() { log.renders++; } dispose() { log.rendererDisposed = true; }
    },
  };
}
function setup({ reduced = false, hidden = false, load } = {}) {
  const log = { geometries: 0, disposedGeometries: 0, materials: 0, renderers: 0, renders: 0 };
  const classes = new Set(), winL = new Map(), docL = new Map();
  const host = { clientWidth: 200, clientHeight: 140, classList: { add: c => classes.add(c), remove: c => classes.delete(c) }, append() {} };
  let frames = 0, cancelled = 0;
  const win = { matchMedia: () => ({ matches: reduced }), performance: { now: () => 0 }, requestAnimationFrame: () => ++frames,
    cancelAnimationFrame: () => { cancelled++; }, addEventListener: (k, fn) => winL.set(k, fn), removeEventListener: k => winL.delete(k) };
  const doc = { visibilityState: hidden ? 'hidden' : 'visible', addEventListener: (k, fn) => docL.set(k, fn), removeEventListener: k => docL.delete(k) };
  const handle = mountStoryArt(host, { win, doc, load: load ?? (async () => fakeThree(log)) });
  return { handle, log, classes, winL, docL, frames: () => frames, cancelled: () => cancelled };
}

test('the crystal mounts once and animates only for a visible, motion-allowed tab', async () => {
  const f = setup(); await settle();
  assert.equal(f.log.renderers, 1); assert.ok(f.classes.has('is-3d')); assert.equal(f.frames(), 1);
  for (const options of [{ reduced: true }, { hidden: true }]) { const s = setup(options); await settle(); assert.equal(s.frames(), 0); assert.ok(s.log.renders >= 1); }
});
test('failure keeps the SVG art and pagehide releases everything once', async () => {
  const failing = setup({ load: async () => { throw new Error('chunk'); } }); await settle(); assert.equal(failing.classes.has('is-3d'), false);
  const f = setup(); await settle(); f.winL.get('pagehide')();
  assert.equal(f.log.disposedGeometries, f.log.geometries); assert.equal(f.log.materials, 3); assert.ok(f.log.rendererDisposed && f.log.removed);
  assert.equal(f.classes.has('is-3d'), false); assert.equal(f.docL.size, 0); f.handle.dispose(); assert.equal(f.log.materials, 3);
  const early = setup(); early.handle.dispose(); await settle(); assert.equal(early.log.renderers, 0);
});
test('lead story keeps its SVG fallback inside the three.js host', () => {
  const page = readFileSync(new URL('../src/views/BlogPage.astro', import.meta.url), 'utf8');
  assert.match(page, /data-story-art><svg class="editorial-story-art-fallback"[^>]*aria-hidden="true"/);
  assert.match(page, /mountStoryArt/);
});
