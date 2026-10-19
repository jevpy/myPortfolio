# Foreground figure glow

## Intent
User explicitly approved isolating Capabilities/Contact 3D figures from the black section veils and adding a real local glow. Preserve smoke and text readability. Previous brightness changes did not resolve user visual report.

## Evidence
Read-only scout found shared scene canvas in negative-z bg-art under later section ::before66%black veils; .86 applies only to fallback smoke. Current unlit lines/points use normal blending and no halo pass. SVGs live above veils but lack glow. Runtime appearance/active engine not observed.

## Scope and constraints
src/pages/index.astro, src/styles/portfolio.css, src/scripts/portfolio-scene.js only. Layer order smoke -> readability veils -> isolated figure core/halo -> text/controls. Preserve existing smoke shader/Canvas/setup/CSS, pause/reduced motion/scrollresize/tabcontextBFCache/engine disposal/imports, no input interception, aria-hidden, Contact desktop-only policy. No installs/upgrades/commits/native sync. TDD unconfigured/no runner: ordinary build/static checks. Delegated writer multi-file, independent verifier. Forecast250–450 lines advisory, ask-on-risk noPR.

## Tasks
- [x] F1 Implement isolated decorative render layer and figure-only halo with readable SVG fallbacks. Source implemented; subsequent Selected work writer build and independent current-source build36.58s passed without EPERM.
- [x] F2 Independently verify build, layer architecture/smoke invariance/lifecycle and document runtime/native limits. Static/incident diagnosis finished and subsequent current-source buildpassed. No destructive recovery performed. Browser/GLSL/visual acceptance remains pending.

## Progress evidence
Foreground root canvas outside section contexts, separate renderer/core+additive halos, content stacking and SVG glow implemented. First build before final alpha correction passed; final-source build and retry failed EPERM clearing .vercel/output/functions, retry also Windows libuv assertion. At the incident boundary final source was not build-verified; subsequently W2 real-selected-work verified current source build36.58s successfully, including foreground/glow source. EPERM did not recur; cause was never proven. Six protected smoke/veil hash regions matched writer pre/post. Parent fresh LSP: no reported primary errors/warnings,9auxiliary no-important CSS warnings; Astro unsupported and JS clean inconclusive. Historical diagnostics not refreshed evidence. Incident delegated read-only, no deletion/cleanup/ACL/taskkill/install allowed. Verifier muve5tty-8-5dtb finished: root figure canvas z0, veils z-1, contentz1 and navigationz30/40; premultiplied alpha consistent and actual additive halo pass present. One RAF and dual renderer lifecycle statically supported. Three protected setup/GLSL hashes independently matched; other writer boundaries unavailable, no inferred regression. Directory FullControl and15Nodeprocesses do not establish lock owner; Vercel adapter overrides --outDir, no alternate output recommended. No build retry after diagnosis. User confirmation of consuming preview/build server and bounded handle-owner inspection needed; no guessed process termination. Browser/GLSL/glow acceptance not run.

## Acceptance
No section veil over figure pixels; separate glow extends beyond geometry; copy/controls above art. Smoke unchanged; one scheduled render loop, frozen redraw and full disposal of both renderers. Build passes. Browser GLSL/visual contrast/performance and actual glow acceptance pending until observed. Native review previously managed_assets_outdated; inspect finalcandidate. No commits.
