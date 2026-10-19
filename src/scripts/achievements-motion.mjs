// Achievement-only enhancement. SSR is the fallback; no visibility classes are needed.
export async function loadAchievementsMotion() {
  const [core, plugin] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  return {
    gsap: core.gsap ?? core.default?.gsap ?? core.default,
    ScrollTrigger: plugin.ScrollTrigger ?? plugin.default?.ScrollTrigger ?? plugin.default,
  };
}

export function createAchievementsMotion({
  root,
  document: doc = globalThis.document,
  window: win = globalThis.window,
  loadMotion = loadAchievementsMotion,
} = {}) {
  let disposed = false;
  let intersecting = false;
  let cached = false;
  let loading = false;
  let failed = false;
  let motion;
  let context;
  let observer;
  let stateObserver;
  const events = [];
  const pointerEvents = [];
  const pointerTweens = new Map();
  const reduced = win?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const fine = win?.matchMedia?.('(hover: hover) and (pointer: fine)');
  const pause = doc?.getElementById?.('orb-pausa');
  const panels = root ? [...root.querySelectorAll('[data-achievement-panel]')] : [];
  const select = selector => [...root.querySelectorAll(selector)];

  function listen(target, name, fn, bucket = events) {
    if (!target?.addEventListener) return;
    target.addEventListener(name, fn, { passive: true });
    bucket.push(() => target.removeEventListener(name, fn));
  }
  function eligible() {
    return !disposed && !cached && intersecting && !doc.hidden && !reduced?.matches
      && !doc.documentElement.classList.contains('motion-off')
      && !pause?.disabled && pause?.getAttribute('aria-pressed') !== 'true';
  }
  function clearPointers() {
    pointerEvents.splice(0).forEach(remove => remove());
    pointerTweens.forEach(tween => tween.kill());
    pointerTweens.clear();
  }
  function suspend() {
    clearPointers();
    context?.revert();
    context = undefined;
  }
  // Pointer tweens are explicitly owned, bounded to one live tween per panel.
  // Context's initial set captures their original transform for full reversion.
  function tilt(panel, x, y) {
    pointerTweens.get(panel)?.kill();
    pointerTweens.set(panel, motion.gsap.to(panel.querySelector('[data-achievement-depth]'), {
      rotationX: y, rotationY: x, duration: .35, ease: 'power2.out', overwrite: 'auto',
    }));
  }
  function bindPointers() {
    const wasTilted = pointerTweens.size > 0;
    clearPointers();
    if (!context) return;
    if (wasTilted) panels.forEach(panel => tilt(panel, 0, 0));
    if (!fine?.matches) return;
    const clamp = value => Math.max(-1, Math.min(1, value));
    panels.forEach(panel => {
      listen(panel, 'pointermove', event => {
        if (!eligible() || event.pointerType === 'touch') return;
        const rect = panel.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        tilt(panel, clamp((event.clientX - rect.left) / rect.width * 2 - 1) * 5,
          -clamp((event.clientY - rect.top) / rect.height * 2 - 1) * 5);
      }, pointerEvents);
      const reset = () => { if (eligible()) tilt(panel, 0, 0); };
      listen(panel, 'pointerleave', reset, pointerEvents);
      listen(panel, 'pointercancel', reset, pointerEvents);
    });
  }
  function start() {
    if (!eligible() || context || !motion) return;
    const { gsap, ScrollTrigger } = motion;
    gsap.registerPlugin(ScrollTrigger);
    context = gsap.context(() => {}, root);
    context.add(() => {
      gsap.set(select('[data-achievement-depth]'), { rotationX: 0, rotationY: 0 });
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } });
      entrance.fromTo(select('[data-achievement-year]'), { y: 56, rotationX: -16 },
        { y: 0, rotationX: 0, duration: 1.3 }, 0);
      entrance.fromTo(select('[data-achievement-logo]'), { y: 20, scale: .9 },
        { y: 0, scale: 1, duration: 1 }, .15);
      entrance.fromTo(select('[data-achievement-type]'), { x: 28, rotationY: -12 },
        { x: 0, rotationY: 0, duration: 1.2, stagger: .12 }, .2);
      entrance.fromTo(select('[data-achievement-copy]'), { y: 18 },
        { y: 0, duration: .9, stagger: .1 }, .55);
      // Scroll and pointer operate on separate nested surfaces, never on text or links.
      panels.forEach(panel => {
        gsap.fromTo(panel.querySelector('[data-achievement-orbit]'), { y: 28, rotation: -12 }, {
          y: -28, rotation: 18, ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: .7 },
        });
      });
    });
    bindPointers();
  }
  function reconcile() {
    if (!eligible()) { suspend(); return; }
    if (failed) return;
    if (motion) {
      try { start(); } catch { failed = true; suspend(); }
      return;
    }
    if (loading || failed) return;
    loading = true;
    // Catch synchronous loaders as well as network/plugin rejection. No retry loop.
    let skipped = false;
    Promise.resolve().then(() => {
      if (!eligible()) { skipped = true; return; }
      return loadMotion();
    }).then(result => {
      if (disposed || skipped) return;
      motion = result;
      if (!motion?.gsap?.context || !motion.ScrollTrigger) throw new Error('Motion unavailable');
      if (eligible()) start();
    }).catch(() => { failed = true; suspend(); }).finally(() => {
      loading = false;
      if (skipped && eligible()) reconcile();
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    suspend();
    observer?.disconnect();
    stateObserver?.disconnect();
    events.splice(0).forEach(remove => remove());
    motion = undefined;
  }
  if (!root || !doc || !win?.IntersectionObserver) return { dispose };
  // A positive threshold guarantees a later notification after zero-area edge contact.
  observer = new win.IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === root) intersecting = entry.isIntersecting && entry.intersectionRatio > 0;
    }
    reconcile();
  }, { rootMargin: '0px', threshold: .01 });
  observer.observe(root);
  if (win.MutationObserver) {
    stateObserver = new win.MutationObserver(reconcile);
    stateObserver.observe(doc.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (pause) stateObserver.observe(pause, { attributes: true, attributeFilter: ['aria-pressed', 'disabled'] });
  }
  listen(pause, 'click', reconcile);
  listen(reduced, 'change', reconcile);
  listen(fine, 'change', bindPointers);
  listen(doc, 'visibilitychange', reconcile);
  listen(win, 'pagehide', event => {
    if (!event.persisted) { dispose(); return; }
    cached = true;
    suspend();
  });
  listen(win, 'pageshow', event => {
    if (event.persisted) { cached = false; reconcile(); }
  });
  return { dispose };
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-achievements-motion]').forEach(root => createAchievementsMotion({ root }));
}
