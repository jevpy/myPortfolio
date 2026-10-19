# Onecode portfolio integration

## Intent
Implement supplied Downloads/onecode-portfolio.html faithfully as the isolated Astro homepage. User selected Web Developer & AI Engineer. Preserve project facts, blog/tools routes, bilingual resumes, assets and existing layouts.

## Constraints
Preserve pre-existing .gitignore modification. Single delegated writer; no dependency upgrades or commits/push/PR authorized. User approved npm ci and build including normal generated .vercel/output/, .astro/ and typings. No configured TDD mode/runner discovered: ordinary functional checks, no RED claims. Delivery ask-on-risk, forecast 4000–5500 authored lines from reference; PR chaining deferred until delivery requested. Native RDD enabled but unavailable for final candidate because managed assets are outdated; no sync authorized.

## Tasks
- [x] T1 Integrate faithful isolated homepage. Route: delegated worker (multi-file/preparation trigger). Completed with post-fix successful build.
- [x] T2 Independently verify build, route/link and static accessibility integration; fix confirmed decorative defect. Route: delegated verifier; one parent mechanical ID edit. Completed automated/static scope; browser checks not run.
- [ ] T3 Native review and human visual acceptance. State: blocked/in_progress. Native inspect returned managed_assets_outdated; approval not obtained. Browser unavailable, human acceptance pending.

## Files
src/pages/index.astro; src/layouts/PortfolioLayout.astro; src/styles/portfolio.css; src/scripts/portfolio-scene.js. Full reference styles and coupled graphics/interactions retained, with original attribution. Local blog/tool and bilingual PDF links added. Other routes retain existing layouts. Added id=blog-scene to match WebGL lookup.

## Verification evidence
Initial worker build failed because dependencies absent. User authorized npm ci: 586 packages installed, 587 audited; 30 vulnerabilities (3 low, 7 moderate, 18 high, 2 critical). No upgrades or audit fixes applied; exploitability not assessed. Lockfile and typings had no tracked diff; existing .gitignore addition ignoring .atl/ preserved.
Independent initial npm run build succeeded (89.74s). Verifier found missing blog-scene ID; parent corrected it. Independent post-fix npm run build succeeded (39.01s). Reference DOM lookup now matches markup.
Static: anchor IDs resolve; blog/tools/posts exist in production manifest; PDFs/favicon produced; four project URLs match existing data. Homepage-only CSS/script entries confirmed. Labels, dialog focus restoration, live statuses, menu inert/focus trap/Escape, filter states, reduced motion and fallbacks present. No document.currentScript dependency or confirmed Astro bundling-order regression.
Warnings: deprecated dependencies; experimental astro env; stale Browserslist; existing unused imports; CSS nth-of-type(Odd); sharp/detect-libc externalization; local Node24 unsupported by adapter which selects Node18.
Native assess initially unassessable due untracked scope, requiring independent verification (performed). Native inspect selected intended source/task files, excluded generated output, then blocked managed_assets_outdated. No START, sync, approval or receipt claimed.

## Human acceptance (all not run)
Serve with npm run dev, open localhost:4321. Check desktop/mobile visual fidelity; menu Tab/Shift-Tab/Escape and focus restoration; rapid All/Apps/Web filters (4/3/1); valid/invalid/blank contact fields and mail composer; clipboard failure; reduced motion; blocked CDN/WebGL fallbacks; local tools/blog navigation and bilingual resume downloads. Capture screenshots and console/network/focus failures. No browser tools available; no WCAG or visual-fidelity approval claimed.

## Next step
User visual acceptance and, if desired, authorize synchronizing native review managed assets before review. Dependency remediation is a separate authorized task. No commits made. Generated .vercel/ output preserved; it is not intended review source.
