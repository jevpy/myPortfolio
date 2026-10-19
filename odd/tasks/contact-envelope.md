# Contact envelope

## Objective
Replace Contact orbit with luminous 3D envelope, user approved. Preserve white/lavender style, existing scheduler, input, pause/reduced motion, disposal, heading/actions and desktop-only visibility. Match SVG fallback and EN/ES accessible labels. Do not modify hero/capability/smoke visuals.

## Tasks
- [x] E1 Replace contact geometry, fallback and labels with envelope, keeping hit region consistent.
- [x] E2 Independently verify build, syntax and geometry/lifecycle/accessibility wiring.

## Scope
src/scripts/portfolio-scene.js; src/views/HomePage.astro; src/i18n/home.ts; src/styles/portfolio.css. Generated build outputs previously authorized. No dependencies, source expansion or commits authorized.

## Progress
E1 implemented: 814 finite envelope samples, front/back outlines, ribs/flap, contact-only bounded rotation and matching rectangular projected hit bounds. Worker observed assertion RED/GREEN, syntax/build passed and 108 projection cases passed. Browser unavailable; E2 static/build scope verified. Independent verifier identified 12.041315px entry overflow before correction. Contact-only inward 12% shrink/.015 jitter replaced outward scatter; worker observed RED/GREEN and build passed in 35.92s. Independent recheck: 11,775 cases / 19,169,700 projections, zero point centers outside anchor, minimum margin 3.117px; CPU parity <=5.69e-14 and syntax passed. GPU precision, visible halo containment and browser behavior remain unverified. Historical Git delta unavailable for untracked source. Build warnings remain (CSS Odd, externalization, chunks, Node/Vercel mismatch). Native inspect blocked at untracked scope; assess unassessable requires independent verifier. Explorer mapped contact generation JS2477–2519, cloud lifecycle3038–3068/3253–3271, placement2955–2971; markup272–278; localized contactObject labels36/82; ellipse-only fallback CSS1233–1240. Contact round hit clipping removed to fit the rectangular silhouette. Point shader can turn thin envelopes edge-on; prioritize readable shallow volume without changing other figures.

## Checks
Use meaningful deterministic geometry assertions RED/GREEN where applicable; no existing test suite. Syntax/build and fallback/locale/hit/lifecycle static checks. Browser acceptance pending unless tooling available: silhouette/readability, hover/drag/keyboard/reset, reduced motion, context recovery, 1100/1101px breakpoint, both locales, no overlap. Native review scope unresolved because untracked implementation and unrelated changes coexist.

## Next step
Human browser acceptance: envelope silhouette, entry/halo containment, heading overlap, pointer/keyboard/reset, pause/reduced motion, fallback/context recovery and both locales at desktop breakpoint. Native review requires isolated candidate scope. No commits created.
