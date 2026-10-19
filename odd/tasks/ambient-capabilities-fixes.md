# Ambient smoke and capabilities fixes

## Intent

User goals: persistent visible moving smoke; capability figures perceptible in 3D; Software Developer instead of Web Developer, preserving AI Engineer. Motion still respects pause, reduced motion and hidden-tab suspension. Screenshot showed faint flat hubs.

## Scope and constraints

Changed only src/scripts/portfolio-scene.js, src/styles/portfolio.css, src/pages/index.astro, src/layouts/PortfolioLayout.astro. Preserve npm imports, exclusive engine guards, routes and unrelated changes. No installs/upgrades/commits/native sync. TDD unconfigured/no runner, ordinary checks. Multi-file delegated writer and independent verifier. Forecast150–350 lines, ask-on-risk delivery, no PR requested.

## Tasks

- [x] A1 Implement smoke, depth-visible capabilities and role/metadata copy. Writer build passed 43.59s.
- [x] A2 Independently verify build/static invariants and document browser/native limitations. Independent build passed 33.82s; no confirmed static/build blocker.

## Changes and verification

Both engines add persistent moving density folds; Canvas LUT brightened with pow(level,0.65). WebGL readability attenuation moved into smoke shader, global WebGL scrim disabled. Four noncoplanar nodes, six aligned edges share rotation/perspective transform and uniforms; baseline edges and SVG fallback brighter. Paused/reduced scroll updates uniforms and explicitly draws without advancing time; resize redraws. Guarded context/disposal retained. Software Developer in brand/hero/lead/footer and title/description; legitimate web technology copy unchanged.
Static shader inspection found no apparent mismatch, but runtime GLSL was not compiled by tools. Imports and irreversible engine selection remain intact. Build warnings persist: Three667.46kB, stale Browserslist, experimental Astro, externalized Node modules, Node24/Vercel18 mismatch, unused imports and out-of-scope BlogPost nth-of-type(Odd).
Parent fresh LSP probe: seven JS hints (deprecated compatibility APIs, unused section, absent @types/three) and one typo information; no reported errors. Astro LSP unsupported, JS clean result not confirmed; historical17 lint blockers are not current evidence. No new packages installed.
Final native inspect still blocked managed_assets_outdated; no START/sync/receipt/approval. Independent verification performed; no commits.

## Acceptance pending / next step

Browser unavailable. NOT RUN: watch smoke over time in WebGL/Canvas, desktop/mobile capability contrast/depth, pause-scroll/resize and reduced motion, hidden-tab/BFCache, keyboard/filters/contact/routes. Shader runtime and performance unverified. Serve npm run dev; inspect figures and capture screenshots/video/console failures. Human visual acceptance remains pending; native review requires separately authorized asset sync.
