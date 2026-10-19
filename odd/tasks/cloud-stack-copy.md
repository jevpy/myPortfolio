# Cloud and usual stack

## Objective
Keep the existing stack and add PHP, MySQL, PostgreSQL and Docker. Add a fourth Cloud & deployment capability mentioning AWS, Google Cloud and Docker in English and Spanish. Preserve existing visuals and responsive usability; do not invent certifications or service-specific expertise.

## Tasks
- [x] C1 Update localized copy, stack chips and capability layout.
- [x] C2 Verify build and both locale outputs.

## Progress
C1 implemented by worker. C2 verified independently: npm run build passed in 76.04 seconds; ten stack chips, four capability definitions and EN/ES cloud copy confirmed in source and generated HomePage_bxMvV80X.mjs. Responsive CSS has 4/2/1 columns at >1100/<=1100/<=640px. Git status identical before/after, but untracked paths prevent historical diff proof. Initial writer build passed after a 120-second timeout. Generated build writes explicitly approved. Existing worktree changes preserved. No commits authorized; commits pending authorization. Native assessment unavailable due undeclared untracked files; preflight requires scope selection and would include unrelated tracked edits, so native review pending isolated candidate.

## Checks
Copy/layout-only change: structural and build checks instead of artificial test-first RED. Check four cards, translated headings, Docker and cloud provider chips, responsive layout rules. Browser visual verification if available.

## Next step
Human browser acceptance remains pending: both locales at desktop/tablet/mobile widths, overflow, keyboard access and scene behavior. Native review pending isolated candidate; no commits created. Build warnings: experimental Astro env, outdated Browserslist, unused imports, nth-of-type(Odd) CSS warning, Node built-ins externalization, >500kB chunk and local Node 24 unsupported by Vercel adapter (Node 18 fallback). LSP validation was unsupported/inconclusive and later reported timeouts; generated bundle style advisories are not source defects and were not edited.
