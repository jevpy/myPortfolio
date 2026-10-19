// Masthead figure: a constellation sphere (the brand's particle motif) drawn with three.js.
// Points sit on a Fibonacci sphere, near neighbours are linked, and the whole thing drifts
// and leans toward the pointer. The inline SVG remains the fallback for no WebGL or script.
const LAVENDER = 0xb9a8ff, WHITE = 0xf4f0ff;
const COUNT = 150, LINK = 0.62;

export function mountBlogFigure(host, { win = globalThis.window, doc = globalThis.document, load = () => import('three') } = {}) {
  let disposed = false, stopFrame = () => {}, teardown = () => {};
  const still = () => !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  load().then(THREE => {
    if (disposed) return;
    const size = () => Math.max(1, Math.round(host.clientWidth || 100));
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(win?.devicePixelRatio || 1, 2));
    renderer.setSize(size(), size());
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.className = 'editorial-sign-canvas';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 0, 5.2);

    // Soft round sprite so points read as glowing dots, not squares.
    let sprite = null;
    try {
      const canvas = doc.createElement('canvas'); canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d'), glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      glow.addColorStop(0, 'rgba(255,255,255,1)'); glow.addColorStop(0.35, 'rgba(255,255,255,.85)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
      sprite = new THREE.CanvasTexture(canvas);
    } catch { /* Square points are an acceptable fallback. */ }

    const positions = [];
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - 2 * (i + 0.5) / COUNT, ring = Math.sqrt(1 - y * y), angle = i * Math.PI * (3 - Math.sqrt(5));
      positions.push(new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring));
    }
    const pairs = [];
    for (let a = 0; a < COUNT; a++) for (let b = a + 1; b < COUNT; b++) {
      const dx = positions[a].x - positions[b].x, dy = positions[a].y - positions[b].y, dz = positions[a].z - positions[b].z;
      if (dx * dx + dy * dy + dz * dz < LINK * LINK * 0.25) pairs.push(positions[a], positions[b]);
    }
    const accents = positions.filter((_, i) => i % 19 === 0).map(p => p.clone());

    const geometries = [], materials = [];
    const geometry = points => { const g = new THREE.BufferGeometry().setFromPoints(points); geometries.push(g); return g; };
    const material = m => { materials.push(m); return m; };
    const sculpture = new THREE.Group();
    sculpture.add(new THREE.LineSegments(geometry(pairs), material(new THREE.LineBasicMaterial({ color: LAVENDER, transparent: true, opacity: 0.5 }))));
    sculpture.add(new THREE.Points(geometry(positions), material(new THREE.PointsMaterial({ color: LAVENDER, size: 0.13, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))));
    sculpture.add(new THREE.Points(geometry(accents), material(new THREE.PointsMaterial({ color: WHITE, size: 0.3, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))));
    scene.add(sculpture);

    const draw = () => renderer.render(scene, camera);
    let frame = 0, last = 0, visible = true, running = false, elapsed = 0, targetX = 0;
    const tick = time => {
      frame = 0;
      if (disposed || !running) return;
      const dt = Math.min(time - last, 64); last = time; elapsed += dt;
      // Pointer lean is eased; the constant drift keeps it alive when nobody touches it.
      sculpture.rotation.y += dt * 0.00028;
      sculpture.rotation.x += (targetX - sculpture.rotation.x) * 0.06;
      const breathe = 1 + Math.sin(elapsed * 0.0012) * 0.025;
      sculpture.scale.set?.(breathe, breathe, breathe);
      draw(); frame = win.requestAnimationFrame(tick);
    };
    const lean = event => {
      const box = host.getBoundingClientRect?.(); if (!box) return;
      targetX = Math.max(-0.5, Math.min(0.5, ((event.clientY - (box.top + box.height / 2)) / (win.innerHeight || 800)) * 1.6)) + 0.25;
    };
    const sync = () => {
      const should = !still() && visible && doc.visibilityState !== 'hidden' && !disposed;
      if (should && !running) { running = true; last = win.performance.now(); frame = win.requestAnimationFrame(tick); }
      if (!should && running) { running = false; if (frame) win.cancelAnimationFrame(frame); frame = 0; }
    };
    sculpture.rotation.set?.(0.25, 0.6, 0.08); draw();
    host.append(renderer.domElement);
    host.classList.add('is-3d');
    const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => { visible = entries.at(-1).isIntersecting; sync(); }) : null;
    observer?.observe(host);
    const resize = () => { renderer.setSize(size(), size()); draw(); };
    win.addEventListener('resize', resize);
    win.addEventListener('pointermove', lean, { passive: true });
    doc.addEventListener('visibilitychange', sync);
    targetX = 0.25;
    sync();
    stopFrame = () => { running = false; if (frame) win.cancelAnimationFrame(frame); frame = 0; };
    teardown = () => {
      observer?.disconnect(); win.removeEventListener('resize', resize); win.removeEventListener('pointermove', lean); doc.removeEventListener('visibilitychange', sync);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); sprite?.dispose(); renderer.dispose();
      renderer.domElement.remove(); host.classList.remove('is-3d');
    };
  }).catch(() => { /* No WebGL or chunk failure: the SVG wheel remains. */ });

  function dispose() { if (disposed) return; disposed = true; stopFrame(); teardown(); }
  win?.addEventListener?.('pagehide', dispose, { once: true });
  return { dispose };
}
