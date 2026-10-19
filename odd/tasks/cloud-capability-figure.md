# Cloud capability 3D figure

## Objective
User screenshot confirms four capability cards but only three figures. Add a distinct wireframe 3D cloud with matching static fallback, preserving first three figures and existing renderer lifecycle. Pair each figure with its card across desktop/tablet/mobile.

## Scope
src/views/HomePage.astro, src/scripts/portfolio-scene.js, src/styles/portfolio.css. Reuse localized Cloud label and interaction hint. No new dependencies, renderer, loop or unrelated changes. Generated build outputs already authorized. No commits authorized.

## Tasks
- [x] F1 Implement fourth geometry, interaction/state registrations, fallback and responsive figure/card pairing.
- [x] F2 Verify build and static lifecycle/locale/layout requirements; document browser limitations.

## Progress
F1 implemented: lobed wireframe cloud, SVG fallback, shared capability registry and derived state arrays, paired wrappers and 4/2/1 layout. Worker passed node --check, npm run build (600s timeout), static assertions. Playwright/Puppeteer unavailable; browser checks pending. F2 independently passed: node syntax, inline static assertions and build (30.59s). Cloud has 97 finite vertices, 109 valid edges and 9 nodes. Four registrations and paired 4/2/1 wrappers confirmed; localized labels/fallback and shared pause/context/disposal wiring statically supported. No static defects identified. Browser behavior not observed. Build warnings include nth-of-type(Odd), externalized Node modules, large chunks and local Node24/Vercel mismatch. Untracked source files prevent historical Git comparison of first three figures. Native inspect blocked at intended-untracked scope selection; assessment unassessable so independent verifier required.

## Checks
No existing deterministic test runner found. Worker should use applicable test-first if a meaningful runnable check exists; otherwise report why and run build plus static checks. Browser acceptance: four distinct figures, first three unchanged, 4/2/1 paired layout, keyboard/pointer interaction, pause/reduced motion and WebGL fallback/context lifecycle. Do not claim visual verification without browser evidence.

## Next step
Human browser checks remain: four figures, unchanged first-three appearance, paired layout, EN/ES, pointer/keyboard, reduced motion/pause, fallback and context/BFCache recovery. Native review scope pending isolated candidate due unrelated worktree changes and pre-existing untracked source files. No commits created.
