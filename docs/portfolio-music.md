# Optional recorded lo-fi music

The portfolio and blog share compact bottom-left native play/pause, mute and volume controls in English and Spanish. **Every new page starts silent.** An explicit click or native button keyboard activation starts the local recording; adjusting volume or mute never starts music.

## Quick path

1. Activate Music to play **Everything You Ever Dreamed.** by **HoliznaCC0**.
2. Adjust the native 0–100 slider (default **70%**) or mute. Arrow keys, Home and End use native range behavior. Zero means muted; unmute restores the last nonzero setting (initially 70%).
3. Pick another recording in the **Track** selector (Everything You Ever Dreamed., Morning Coffee, Autumn, Clouds). Before the first play the choice is only stored; no audio or request happens. While playing, the new recording starts right away with the same volume; while paused, it waits for the next play.
4. Switching browser tabs or windows **does not pause** the music. Only the Pause button stops it.
5. Pause to stop playback. The chosen volume stays in memory for the next activation on this page, not across navigation.

## Recording and audio graph

The parent verified the individual FMA page's **CC0 1.0 Universal**, **Instrumental Yes** and **AI generated No** metadata. The album is **Lo-fi And Chill**. See [recording provenance and exact byte/hash evidence](../public/music/README.md). Three more CC0 recordings from the same album back the track selector; all four are same-origin files under `/music/` (the original is `/music/portfolio-lofi.mp3`); visitors never hotlink the source or make third-party audio requests. No audition has been performed: metadata establishes style and permission, not perceived quality or comfortable loudness.

The previous oscillator composition and scheduler have been replaced, not retuned. Unrelated old MP3 files are untouched. Only an explicit playback choice constructs an owned HTMLAudioElement and AudioContext. The media has `preload = 'none'`, no autoplay and looping enabled. One MediaElementSource connects through one Gain to the context destination and is reused across pause/resume. Media volume stays 1; app gain alone spans 0–1 without compounded attenuation or amplification above 1. Active adjustments use a short 15 ms gain-target time constant where supported, otherwise the scalar gain. Zero targets silence. Device/system volume still affects output.

## Lifecycle and privacy

| Situation | Behavior |
| --- | --- |
| First activation | Build the graph, then invoke both context resume and media play synchronously before awaiting either, preserving the click gesture |
| Pending activation | Loading, not a playing label; both settlements are tracked, including early rejection plus late success |
| Playing truth | Requires context `running` and media not paused; native playing, waiting, pause, error and context-state events update state |
| Pause | Pause owned media and suspend owned context; manual pause clears intent |
| Hidden tab / window switch | Keep playing; nothing is paused or suspended. If the browser throttles or pauses audio in the background, intent is retained and playback is retried on return (a rejected retry shows the localized retry state) |
| Track change | Stored silently before first play; while playing, swaps the source on the same media element and graph and restarts once (pending starts restart with the new recording); while paused, only the source changes |
| BFCache freeze / return | Pause on freeze; resume only retained explicit intent; preserve context, graph and chosen volume; rejected policies offer localized retry |
| Stale promise | Epoch guards pause late playback and re-suspend late resumes; newer intent waits for old settlements and pending suspend |
| Terminal pagehide / disposal | Remove only owned listeners, pause and detach media source, load to release the acquired resource, disconnect nodes, close context once |
| Unsupported / closed API | Localized unavailable status; retry can work if support becomes available, but a closed graph is not unlawfully rebuilt around the same media |

Navigation continuity: category, pagination and page links are full page loads, so the page that unloads writes one `sessionStorage` entry (`portfolio-music`: song id, volume, playing flag, position, timestamp; same tab only, no identifier, never transmitted). The next page restores song and volume always; it resumes playback only if the save is under 60 seconds old and the browser reports a prior user gesture (`navigator.userActivation.hasBeenActive`). If the browser refuses, the player stays idle and the visitor presses play. There is a short silence while the next page loads: playback is not gapless. Blocked storage degrades to no continuity. Tab switches and window changes never pause music.

No timers, oscillator voices, cookies, telemetry, permissions prompts, autoplay bypass, dependencies or live chat/API calls are used. Reduced motion removes visual transitions without changing the user's independent sound choice. Other audio controllers and global state are not cleaned up by this feature.

## Automated and static evidence

Deterministic fake-media/context tests cover default and live gain, clamp/zero/mute restoration, no activation from adjustments, synchronous play/resume, one bounded graph, truth checks, independently stalled play/resume, rejection and late settlement, pause/hide/disposal races, suspend serialization, visibility, BFCache, localized errors and terminal resource/listener cleanup. Asset tests verify the actual bytes/signature/hash and provenance. Obsolete oscillator envelope/headroom tests were intentionally replaced by recorded-graph and lifecycle tests. Static tests retain both unchanged layout mounts and inspect native range/labels/44px targets, focus/reduced-motion hooks and mobile width bounds.

Policy considered: scoped acceptance criteria; no additional project accessibility policy was supplied. Static evidence: full localized names remain accessible when visible play text is hidden below 400px, pressed/busy states and visible percent are synchronized, error status is polite, decorative SVGs are hidden from assistive technology. The control uses `max-width: calc(100vw - 104px)`, a shrinkable slider and bottom-left safe-area placement to reserve the bottom-right launcher region. No WCAG compliance, contrast or browser geometry claim is made. Local advisory review: no blocking static finding identified; native/browser checks below remain unperformed.

## Human acceptance — pending

Preconditions: EN/ES portfolio and blog, desktop and mobile browsers (including iOS Safari), initially low system volume, 320px viewport, chat launcher available. These are read-only acceptance scenarios, not claimed results.

| Status | Action | Expected visible/audible result | Failure evidence |
| --- | --- | --- | --- |
| Not run | Reload/navigate without activation; adjust slider and mute first | Silent; no recording request/context before play; readable localized controls | Network trace, screenshot, browser/version |
| Not run | Keyboard-focus, activate, adjust using arrows/Home/End, mute/unmute and pause | Focus visible; 0–100 changes sound; visible percent matches; zero silent; restore last volume; pause silent | Keyboard steps, displayed value, listening notes |
| Not run | Audition at several levels on desktop/mobile over loop boundary | Actual instrumental lo-fi recording; usable volume, no objectionable timbre/clicks/loop gap | Device/browser, system/app volume, listening notes |
| Not run | Hide/return and use BFCache while playing and while paused | Hidden silent; only previous opt-in returns; volume retained; paused stays silent | Lifecycle steps, status and sanitized console errors |
| Not run | Rapid play/pause and denied, delayed, failed or interrupted playback | No stale revival/false playing; localized unavailable status and retry | Gesture timing, labels and sanitized errors |
| Not run | Inspect at 320px with chat closed/open, reduced motion and screen reader | No overlap/overflow; chat usable; full names, values and status announced; no visual transition in reduced motion | Screenshots, browser/SR versions and announcements |

Human acceptance remains pending. Unknowns: actual listening quality, iOS gesture/volume behavior, range keyboard and screen-reader output, rendered contrast, loop continuity and mobile overlap. Parent owns independent V2 validation, any build, final acceptance and delivery; no build or browser audition is part of V1.
