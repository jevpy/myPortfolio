# Bilingual portfolio

## Intent

The user authorized English and Spanish across the entire portfolio, including complete translations of all five blog articles. English URLs remain unprefixed; Spanish counterparts use `/es/`. Native English/Español links preserve page, query and fragment. No automatic language redirects. Technical commands, URLs, brand names and factual project qualifications remain intact.

## Scope and constraints

Typed dictionaries, explicit Astro route wrappers and shared page views; no i18n package or configuration upgrade. Localized homepage, ten Selected work fichas, legacy about and four older project cards, all 36 tool overlays, navigation/React islands, document metadata, form/menu/clipboard/filter/motion messages and five full articles. Existing English Markdown and JSON data were preserved. Root-relative assets and PDFs support nested routes.

No installs, upgrades, commits, pushes, native asset sync or destructive recovery. Existing dirty files, smoke/foreground art, engine guards, motion controls, route behavior and factual statuses preserved within reported verification limits. TDD was not configured and no test runner existed; ordinary build, static and HTTP checks used. Delegated sequential writers and independent verifier satisfy multi-file/preparation routing. Forecast 2,000–4,000 authored lines, advisory only; delivery strategy ask-on-risk, no PR requested.

## Tasks

- [x] B1 Locale foundation, selector, bilingual SSR homepage, metadata and all script-generated copy. Writer build passed.
- [x] B2 Legacy pages/navigation/tool overlays and five complete Spanish articles. Writer build passed; reopened query, dead-stylesheet and heading-anchor findings fixed. Post-fix writer build passed in 45.19s.
- [x] B3 Independent production build, route/content/link parity and documented runtime/native limitations. Final build passed in 37.76s; all 20 dev SSR routes and production manifest entries verified.

## Implementation evidence

`src/i18n/{routes,home,legacy,content}.ts`, LanguageSwitcher, five shared views, explicit EN/ES route wrappers and locale-aware layouts/components. Homepage dictionary has 98 keys per locale; legacy dictionary has 34. Selected work retains 10/9/1 inventory with pending/unconfirmed qualifications. Tools retain 36 overlays and 34 rendered records (22 technical, 12 daily), source ordering/brands unchanged. React navigation receives explicit locale props. All animation-engine status branches and custom form validation use locale copy.

Spanish article paths use exact original dated filenames. Complete body review found no omitted meaning; external URL sequences and three recovery commands match. All 17 heading IDs and levels match between rendered EN/ES pairs. English article hashes remain unchanged. Selector preserves repeated, encoded and empty query parameters plus client-side hash. Two references to absent hugeicons CSS were removed; no consumers found, existing SVG/Tabler icons retained. Duplicate blog description and unmatched legacy closing div removed during view extraction.

## Verification evidence

Initial independent build timed out at 180s during client rendering; incomplete output was not accepted. After fixes, one independent build with a 600s budget completed successfully in 37.76s. Production Vercel config and bundled Astro manifest contain all 20 routes.

Own verifier dev server: 20/20 GET responses returned 200 with correct EN/ES document language, localized titles/descriptions and counterpart links. Inspected public assets/PDFs returned 200. Query tests on home/articles passed after correctly decoding HTML entities. Only verifier-owned PIDs were stopped in finally; no unrelated processes killed. Current git status unchanged during verification; typings and original Markdown/JSON diffs empty. No independent historical render-parameter baseline claimed.

Fresh parent LSP probes reported no primary errors/warnings; auxiliary findings included nested-ternary readability, extensionless dictionary imports and existing CSS important usage. Astro LSP was unsupported and some TS/JS checks inconclusive; not a clean-lint claim. Historical unused-variable/generated-chunk warnings were not treated as new source defects.

Build warnings remain: outdated Browserslist, unused legacy imports, CSS `nth-of-type(Odd)`, Node module externalization, large Three chunk, experimental Astro environment and local Node24 versus Vercel Node18. Final native inspect stopped at `managed_assets_outdated`; no START, sync, receipt or approval.

## Acceptance pending and next step

HTTP/static checks are not browser acceptance. NOT RUN: mobile layout, actual selector clicks/hash scrolling, React hydration, keyboard/screen reader, measured contrast, form/clipboard/mail launch, rapid filters, pause/reduced motion and runtime GLSL/glow/performance. Production deployment runtime not exercised. Serve `npm run dev`, compare `/` and `/es/`, switch pages/articles and test these interactions. Optional native asset synchronization/review requires separate authorization. No commits made.
