/* Smooth inertial scroll (Lenis) with section rise-in transitions, driven by the GSAP ticker, so every
   ScrollTrigger on the page follows the same eased motion. It never runs under
   reduced motion or while the shared Pause control has set `motion-off`;
   then the page falls back to native scrolling. */

const root = document.documentElement;
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function motionAllowed() {
  return !reducedQuery.matches && !root.classList.contains('motion-off');
}

async function init() {
  const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
    import('lenis'),
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  let ctx = null;
  const raf = (time) => lenis && lenis.raf(time * 1000);

  function start() {
    if (lenis || !motionAllowed()) return;
    lenis = new Lenis({
      lerp: 0.14,
      wheelMultiplier: 1.35,
      touchMultiplier: 1.5,
      anchors: { offset: -80 },
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /* section transitions: each section rises into place as it enters,
       tied to the scroll so the motion follows the reader's speed */
    ctx = gsap.context(() => {
      document.querySelectorAll('main .section').forEach((section, index) => {
        if (index === 0) return;
        gsap.fromTo(section.children,
          { y: 90, opacity: 0, scale: 0.97 },
          {
            y: 0, opacity: 1, scale: 1, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 92%', end: 'top 55%', scrub: 0.4 },
          });
      });
    });
  }

  function stop() {
    if (!lenis) return;
    ctx?.revert();
    ctx = null;
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  }

  const sync = () => (motionAllowed() ? start() : stop());
  reducedQuery.addEventListener('change', sync);
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  sync();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
