# Article-only destinations

## Objective
User confirmed excluding repositories/demos: reading links should lead to posts/articles. Current snapshot includes github.com/vscarpenter/gsd-task-manager and atoll92.github.io/agent-standup/. Enforce destination screening before provider/global selection; preserve actual eligible original URLs, new-tab behavior, primary categories and authored content.

## Tasks/routing
- [x] A1 Add shared destination screening, DEV canonical-post fallback, strict historical compatibility and offline seed cleanup with tests/docs. Worker: multi-file behavior test-first.
- [x] A1b Diagnose Windows EPERM on generated Vercel output; no manual deletion/other process termination without authorization. Separate read-only tooling incident.
- [x] A2 Independently verify tests/build/routes/exclusions, retained valid entries and new-tab behavior. Verifier: command checks.

## Constraints/acceptance
Keep HTTP-safety separate from editorial eligibility. Exclude known code forges/repos/gists/rawcode/modelspaces and identifiable demos; avoid hostname substring false positives. GitHubPages individual blog/posts/articles/date paths may qualify; arbitrary project/demo pages don't. Recognizedpost URLs not blanketbanShowHN/toolarticles. No URL/title rules can prove arbitrary publisherarticle bodies or redirectdestinations: documentheuristiclimitations. DEV eligible externalcanonical retained; repositorycanonical falls back to actual dev.to/author/post URL, exclude ifneither valid.

Strict validateSnapshot rejects excludedarticle. normalizehistoricalschema3 must fully validate envelope AND EVERY originalentry includingwould-be-excluded entries before filtering; malformedexcludedrowinvalidates snapshot, no rawfilter-before-validation. Preserve retainedobjects/provenance/order/updatedAt and revalidate currentstrict result. Existing schema2migration remains honest; no classifier/versionbump solelydestinationrules. Offline seed removesonlycurrenttwo entries, retains other8 and actualoldtimestamp, no fakearticles/freshness. Futuredailyrefresh may refill up-to10.

No live API/networkoriginalbodyfetch/depsinstall/publishing/commit/push/deploy. Preserve dirty/untracked unrelatedfiles and Markdown. Existing generatedbuildoutputs approved. Native scope remains unresolved; noapprovalinvented.

## Checks
Observed RED/GREEN pureeligibility/fallback/compatibility tests. Knownrepo/demos/pagesblog/modelblog/unsafehostboundary/titleexceptions; malformedexcludedhistoricalentry invalidatesfullsnapshot, allcurrentfields strict; seed8noURLrewrites/timestampchange; providerfilter beforetop10; DEVcanonicalfallback; sparse/TTL/datekind maintained. FourNodesuites/build andSSRblogs/categorycounts/no repolinks/newtabs/Markdownpreservation. Browser pending; no failedlaunchretry.

## Progress
A1 complete:35testsRED/GREEN; sharedeligibility/DEVfallback/strictfullschema3historicalvalidation-before-filter/offline8seedunchangedtimestamp/docs. Initialbuildpassed; subsequentworkerbuild+retryfailedEPERMgeneratedfunctions. A1bseparateread-onlydiagnostics confirmedcorrectcwd/normalattrsFullControl/noidentifiedpreview, no provenrootcause/no killorcleanup. Laterindependentordinarybuildpassed12.37s withoutEPERM, no source/permissionchanges. A2independent35tests/build/gitdiffcheckpass+5exactsyntaxchecks and24builtSSRroutes (14ENESblog/filter10authoreddetail),58articleanchorsblank/rel/localizednotices,counts8/excluded2destinations/detailsH1;ownedserverclosed. No confirmeddefects. FullMarkdownDOMequalitynotrepeated(unchangedsourceinspectiononly); browserhumanacceptancepending. ExistingbuildNode24runtime18/Browserslist/externalization/unusedimports/chunkwarnings remain.

## Next step
Humanbrowseracceptance andexplicitreviewedpublication next. No livefetch or fakefreshness; nextautomaticvalidupdate mayrefill8upto10. Nativepreflight mayremainblockedbyexistinguntrackedmixedwork; noapprovalclaimed. No commits/push/deploy occurred, work-unitcommits pending explicit authorization.
