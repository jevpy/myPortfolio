import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountBlogFigure } from '../src/scripts/blog-figure.mjs';

const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function fakeThree(log) {
  class Obj { constructor() { this.rotation = { x: 0, y: 0, z: 0 }; this.position = { set() {}, copy() {}, z: 0 }; this.children = []; }
    add(...items) { this.children.push(...items); } }
  class Geometry { constructor() { log.geometries++; } setFromPoints() { return this; } dispose() { log.disposedGeometries++; } }
  return {
    Vector3: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } clone() { return new this.constructor(this.x, this.y, this.z); } },
    Points: class extends Obj {}, PointsMaterial: class { dispose() { log.materials++; } }, AdditiveBlending: 2,
    BufferGeometry: Geometry, Group: Obj, Scene: Obj, PerspectiveCamera: Obj,
    LineLoop: class extends Obj {}, LineSegments: class extends Obj {},
    LineBasicMaterial: class { dispose() { log.materials++; } },
    WebGLRenderer: class {
      constructor() { log.renderers++; this.domElement = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, remove() { log.removed = true; } }; }
      setPixelRatio() {} setSize() {} render() { log.renders++; } dispose() { log.rendererDisposed = true; }
    },
  };
}
function setup({ reduced = false, hidden = false, load } = {}) {
  const log = { materials: 0, geometries: 0, disposedGeometries: 0, renderers: 0, renders: 0 };
  const classes = new Set(), listeners = new Map(), docListeners = new Map();
  const host = { clientWidth: 100, classList: { add: c => classes.add(c), remove: c => classes.delete(c) }, append(node) { log.appended = node; } };
  let frames = 0, cancelled = 0;
  const win = { devicePixelRatio: 3, matchMedia: () => ({ matches: reduced }), performance: { now: () => 0 },
    requestAnimationFrame: () => ++frames, cancelAnimationFrame: () => { cancelled++; },
    addEventListener: (k, fn) => listeners.set(k, fn), removeEventListener: k => listeners.delete(k) };
  const doc = { visibilityState: hidden ? 'hidden' : 'visible', addEventListener: (k, fn) => docListeners.set(k, fn), removeEventListener: k => docListeners.delete(k) };
  const handle = mountBlogFigure(host, { win, doc, load: load ?? (async () => fakeThree(log)) });
  return { handle, log, classes, listeners, docListeners, frames: () => frames, cancelled: () => cancelled };
}

test('the figure draws the constellation once and animates a visible tab', async () => {
  const f = setup(); await settle();
  assert.equal(f.log.renderers, 1); assert.ok(f.log.renders >= 1); assert.equal(f.log.geometries, 3);
  assert.ok(f.classes.has('is-3d')); assert.equal(f.log.appended.attrs['aria-hidden'], 'true'); assert.equal(f.frames(), 1);
});
test('reduced motion and hidden tabs render one still frame without an animation loop', async () => {
  for (const options of [{ reduced: true }, { hidden: true }]) {
    const f = setup(options); await settle();
    assert.ok(f.log.renders >= 1); assert.equal(f.frames(), 0); assert.ok(f.classes.has('is-3d'));
  }
});
test('WebGL or chunk failure leaves the SVG wheel in place', async () => {
  const failing = setup({ load: async () => { throw new Error('chunk'); } }); await settle();
  assert.equal(failing.classes.has('is-3d'), false);
  const noGl = setup({ load: async () => ({ ...fakeThree({ geometries: 0 }), WebGLRenderer: class { constructor() { throw new Error('no webgl'); } } }) }); await settle();
  assert.equal(noGl.classes.has('is-3d'), false);
});
test('pagehide releases listeners, geometry, material, renderer and the canvas once', async () => {
  const f = setup(); await settle(); f.listeners.get('pagehide')();
  assert.equal(f.log.disposedGeometries, 3); assert.equal(f.log.materials, 3); assert.ok(f.log.rendererDisposed);
  assert.ok(f.log.removed); assert.equal(f.classes.has('is-3d'), false); assert.equal(f.cancelled(), 1);
  assert.equal(f.docListeners.size, 0); f.handle.dispose(); assert.equal(f.log.disposedGeometries, 3);
});
test('disposal before three loads never creates a renderer', async () => {
  const f = setup(); f.handle.dispose(); await settle(); assert.equal(f.log.renderers, 0);
});
test('blog page keeps an accessible SVG fallback inside the three.js host and only the blog imports it', () => {
  const page = readFileSync(new URL('../src/views/BlogPage.astro', import.meta.url), 'utf8');
  assert.match(page, /data-blog-figure><svg class="editorial-sign-fallback"[^>]*aria-hidden="true"/);
  assert.match(page, /import \{ mountBlogFigure \} from '\.\.\/scripts\/blog-figure\.mjs'/);
  assert.match(readFileSync(new URL('../src/scripts/blog-figure.mjs', import.meta.url), 'utf8'), /import\('three'\)/);
});
