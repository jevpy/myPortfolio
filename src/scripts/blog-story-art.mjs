// Lead-story art: a faceted crystal (icosahedron shell around a counter-rotating octahedron)
// drawn with three.js in ink on the paper card. The inline SVG stays as the fallback.
const INK = 0x17151f, ACCENT = 0x6d4aff;

export function mountStoryArt(host, { win = globalThis.window, doc = globalThis.document, load = () => import('three') } = {}) {
  let disposed = false, stopFrame = () => {}, teardown = () => {};
  const still = () => !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  load().then(THREE => {
    if (disposed) return;
    const width = () => Math.max(1, Math.round(host.clientWidth || 200)), height = () => Math.max(1, Math.round(host.clientHeight || 140));
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(win?.devicePixelRatio || 1, 2));
    renderer.setSize(width(), height());
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.className = 'editorial-story-art-canvas';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width() / height(), 0.1, 20);
    camera.position.set(0, 0, 5.4);

    const geometries = [], materials = [];
    const keep = (list, item) => { list.push(item); return item; };
    const edges = (shape, color, opacity) => {
      const edge = keep(geometries, new THREE.EdgesGeometry(keep(geometries, shape)));
      return new THREE.LineSegments(edge, keep(materials, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
    };
    const shell = edges(new THREE.IcosahedronGeometry(1.25, 1), INK, 0.85);
    const core = edges(new THREE.OctahedronGeometry(0.62, 0), ACCENT, 1);
    const nodes = new THREE.Points(keep(geometries, new THREE.IcosahedronGeometry(1.25, 0)),
      keep(materials, new THREE.PointsMaterial({ color: ACCENT, size: 0.2, sizeAttenuation: true })));
    const crystal = new THREE.Group();
    crystal.add(shell, nodes, core);
    scene.add(crystal);

    const draw = () => renderer.render(scene, camera);
    let frame = 0, last = 0, visible = true, running = false, lean = 0, leanTarget = 0;
    const tick = time => {
      frame = 0;
      if (disposed || !running) return;
      const dt = Math.min(time - last, 64); last = time;
      shell.rotation.y += dt * 0.00035; shell.rotation.x += dt * 0.00012;
      core.rotation.y -= dt * 0.0009; core.rotation.z += dt * 0.0005;
      lean += (leanTarget - lean) * 0.06; crystal.rotation.x = 0.3 + lean;
      draw(); frame = win.requestAnimationFrame(tick);
    };
    const point = event => {
      const box = host.getBoundingClientRect?.(); if (!box) return;
      leanTarget = Math.max(-0.4, Math.min(0.4, (event.clientY - (box.top + box.height / 2)) / (win.innerHeight || 800)));
    };
    const sync = () => {
      const should = !still() && visible && doc.visibilityState !== 'hidden' && !disposed;
      if (should && !running) { running = true; last = win.performance.now(); frame = win.requestAnimationFrame(tick); }
      if (!should && running) { running = false; if (frame) win.cancelAnimationFrame(frame); frame = 0; }
    };
    crystal.rotation.x = 0.3; shell.rotation.y = 0.5; core.rotation.z = 0.4; draw();
    host.append(renderer.domElement);
    host.classList.add('is-3d');
    const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => { visible = entries.at(-1).isIntersecting; sync(); }) : null;
    observer?.observe(host);
    const resize = () => { renderer.setSize(width(), height()); camera.aspect = width() / height(); camera.updateProjectionMatrix?.(); draw(); };
    win.addEventListener('resize', resize);
    win.addEventListener('pointermove', point, { passive: true });
    doc.addEventListener('visibilitychange', sync);
    sync();
    stopFrame = () => { running = false; if (frame) win.cancelAnimationFrame(frame); frame = 0; };
    teardown = () => {
      observer?.disconnect(); win.removeEventListener('resize', resize); win.removeEventListener('pointermove', point); doc.removeEventListener('visibilitychange', sync);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
      renderer.domElement.remove(); host.classList.remove('is-3d');
    };
  }).catch(() => { /* No WebGL or chunk failure: the SVG art remains. */ });

  function dispose() { if (disposed) return; disposed = true; stopFrame(); teardown(); }
  win?.addEventListener?.('pagehide', dispose, { once: true });
  return { dispose };
}
