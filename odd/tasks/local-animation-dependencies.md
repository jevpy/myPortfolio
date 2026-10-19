# Local animation dependencies

## Intent
User authorized installing three 0.160.1 and gsap 3.12.5 and replacing CDN loaders with Astro-bundled local dynamic imports. Preserve homepage and Canvas2D/CSS fallback. Original Onecode acceptance remains in odd/tasks/onecode-portfolio.md.

## Constraints and routing
Edit only package.json, package-lock.json and src/scripts/portfolio-scene.js. Preserve unrelated changes. No commits/upgrades/audit fixes/native sync authorized. TDD unconfigured, no runner; ordinary build/static checks. L1 delegated writer (multi-file trigger), L2 independent delegated verifier. Delivery ask-on-risk, estimated under 200 authored lines excluding lock resolution; no PR requested.

## Tasks
- [x] L1 Install pinned dependencies and replace CDN/global bootstrap. npm install --save-exact three@0.160.1 gsap@3.12.5 and writer npm run build passed.
- [x] L2 Independently verify build/imports/fallback guards and document limitations. Independent npm run build passed; static verification passed. Native review unavailable and browser acceptance pending, not claimed as approved.

## Evidence
Exact pins verified in manifest, lock and installed packages. Build emits relative local Three/GSAP/ScrollTrigger chunks; application has no animation CDN loader or window library bindings. Attribution-only jsDelivr URL retained. ScrollTrigger registers before triggers. Separate library import failure paths, four-second Three deadline and irreversible engine decision preserved. No layout changes required. Generated Vercel output preserved; unrelated tracked changes preserved. No commits.
Warnings: Three chunk 667.46kB; 30 existing audit vulnerabilities remain (no remediation). Existing CSS nth-of-type(Odd), unused imports, Browserslist, externalized Node modules, experimental Astro and Node24/Vercel18 mismatch warnings. GSAP exceptions after gsap-ready do not explicitly roll back partial initialization, advisory follow-up rather than confirmed migration regression.
Native assessment unassessable initially because untracked declaration; independent verification performed. Final inspect with explicit intended untracked scope blocked managed_assets_outdated. No START, sync, receipt or approval claimed.

## Acceptance pending
Browser tools unavailable: normal visual rendering, blocked/late local chunks, WebGL fallback, reduced motion and rapid filters not run. Serve npm run dev and inspect same-origin library chunk requests and browser console. Human acceptance pending. Optional future authorized native sync/review and dependency audit remediation are separate scope.
