# Public profile assistant: offline first, optional Groq

The assistant includes bilingual public knowledge, guided answers, a server API and a widget on home, blog and authored detail pages, not the legacy MainLayout. AI defaults disabled. No accounts, credentials, live API calls or deployment are part of this change.

## Quick path: verify without a key

1. Run `node --test tests/chatbot.test.mjs tests/chatbot-client.test.mjs` with Node 24 (the tests import current TypeScript project exports using native type stripping).
2. Open the widget on the EN/ES home, blog or authored detail pages. Try a preset, then ask “How is Docker used?” / “¿Cómo usa Docker?” or “CRM Gmail attachments” / “CRM Gmail adjuntos”. Presets never call Groq; typed questions stay local when AI is disabled.
3. Leave `PORTFOLIO_CHAT_AI_ENABLED` unset or `false`. A valid API request then returns a guided public-knowledge answer without calling Groq.

All provider tests use injected fetch mocks. Do not use a real key for these tests.

## Browser daily question guard

The widget accepts **15 valid manual questions per Peru/Lima calendar day (UTC−5, midnight)**, shared by EN/ES on the same origin/browser. This is a browser UX guard, **not a hard visitor/API quota or anti-abuse control**. There is no durable backend visitor counter. Server warm-worker provider-start limits and failover behavior remain unchanged.

| Behavior | Contract |
| --- | --- |
| Counting | Count once after disposed/busy/blank/oversized validation, before appending the manual question or choosing any reply path. Cooldown, disabled AI, local answers, refusals and network/provider failures still count. Internal model attempts do not consume extra questions. |
| Local options | Presets never count; transcript and contact presets remain available after completion. No new denial/counting bubble, numeric allowance, banner or quota announcement appears. Only a generic localized email completion status/placeholder and accessible email action accompany the disabled manual form. |
| Persistence | Only `portfolio-chat-daily-v1` with `{ "day": "YYYY-MM-DD", "count": 0 }` in localStorage; no locale, identity, questions, replies, history or PII. The date is adjusted UTC, independent of display locale and browser timezone. |
| Validation | Read at most 128 characters before JSON parsing. Require exactly day/count, a real ISO date and nonnegative safe-integer count. Clamp over-limit counts to the limit. Corrupt JSON, negative/fractional/string counts, extra fields and future dates fail closed for the current day; valid past dates allow rollover without lowering same-day memory usage. |
| Storage unavailable | Getter/read/write exceptions keep the current in-memory allowance, including increments that could not be written. Same-day memory and storage merge using the larger count; clearing/stale records cannot replenish a running session. BFCache carries only memory state to the restored controller. A new page with unavailable storage cannot recover an earlier page's usage. |
| Refresh/lifecycle | Re-read before acceptance and best-effort storage events. Open, window focus and visible-tab restoration refresh the disabled composer, including after several days away. No polling or background AI retry. Terminal disposal removes owned listeners; BFCache rehydrates fresh listeners and preserves the transcript. |

**Limits:** read/merge/write is not atomic. Simultaneous tabs can race and undercount; storage events are best-effort. Clearing/changing storage, device-clock changes, a new browser/device, disabled storage across reloads, or direct API calls can bypass the guard. Do not describe it as global budget enforcement. Deployment ingress/spend controls remain necessary before AI activation.

Persisted-data safety assessment (advisory): target is browser-local data, not a database migration; a new isolated versioned key, no existing transcript transformation/deletion, no cookies or IP tracking. Backup is not applicable to this disposable nonidentity counter. Rolling back code stops counter use but leaves its small key; no deletion operation is part of this work. Automated mocks verify the strict shape, bounded parser, storage denial, monotonic same-day merging and rollover; real browser/storage-policy behavior remains pending owner acceptance. Production actions remain owner-controlled.

## Portfolio-only scope

Both `POST /api/chat` and offline replies use `resolveScope(knowledge, locale, message, history = [])` before routing. The existing three-argument stateless API remains supported. It returns `allow`, `clarify` or `reject` using anchored whole-request intent templates, named public entities and bounded feature terms—not an allowed-substring test. Public profile/name/background/skills/contact and the eight projects’ purpose, features, stack, status and published implementation are the only answer subjects. Blog articles and outside sources are not grounding.

| Request | Result |
| --- | --- |
| “How does AI Learning use React?” / “¿Cómo usa Laravel el CRM?” | Published project implementation, preserving caveats |
| “How does Course Notes Generator generate ODT?” / “¿Cómo genera ODT Course Notes Generator?”; “Course Notes Generator exports” | Editable ODT output through odfpy, dry-run verified; live AI pending |
| “¿Qué proyectos tienes?” / “Tell me about your projects” | Published project highlights and qualifications |
| “¿Con qué tecnologías trabajas?” | Published profile stack and capabilities |
| “What programming languages do you use?” | Only published profile languages: JavaScript, TypeScript and PHP—not React/Docker or project-only Python |
| Any published project ID, name or localized display name; “Course Notes”, “License Server” | Named project, all eight supported |
| “React”, “Python 3.12”, “ODT”, “Next.js”, “Drizzle”, “CRM OAuth” | Published portfolio usage, not general teaching |
| “What is React?” / “¿Qué es React?” | Clarify: ask for portfolio usage instead of a general definition |
| “Does CRM use Docker?”; rates, employers or availability | In-scope intent, honest unstated-information answer; no inferred association |
| Recipes, politics, math, finance, code generation or tutorials mentioning CRM/React | Reject; a project keyword cannot authorize an unrelated task |
| A portfolio question plus an unrelated task; override or role-change instructions | Reject the whole request |
| Unrecognized words/phrasing, unresolved pronouns | Clarify with public topic links; no provider request |
| “Hello” / “Hola” | Local greeting, no provider request |

Admission follows role/length/byte validation and precedes configuration, cooldown checks, in-flight state and provider-start accounting. Clarifications and rejections return the normal `200` local/public-knowledge envelope with `retryAfterSeconds: 0`, without fetching or changing provider capacity/cooldowns. Local presets, network failure and cooldown routing reuse the same early decision. The initial Spanish fallback copy remains “Por ahora puedo ayudarte con estas opciones”; refusals explicitly state the portfolio-only boundary.

Generation verbs remain rejected for task commands. A separate **full descriptive question** template requires a named published project and a bounded output format; only Course Notes’ verified ODT output feature is admitted by this route. Recognized project/output combinations outside that small route clarify without inventing a feature. Appending recipes, politics, arithmetic or instructions invalidates the complete template and still rejects the request. Named Course Notes exports/output shorthand uses the same published feature; standalone “exports” does not authorize a general topic. The four common own-portfolio questions above are also anchored complete forms, not substring exceptions.

The grammar is deliberately conservative: valid but unrecognized phrasings can clarify rather than answer. It is not universal semantic-security enforcement. Prompt instructions additionally reject mixed/outside tasks, keyword smuggling and code/tutorial contributions, but unrestricted generated output can still drift. Actual Groq outcomes, tone and EN/ES ambiguity handling need owner testing; mocks verify routing and prompt construction only.

### Routing and adaptable engineering facts

Huracorp now leads with **operational optimization and route planning**, not just persisted route labels. Its EN/ES project records describe geographic k-means grouping with Haversine distance, time-aware nearest-neighbor stop ordering, customer time windows, maximum-duration planning, driver/active-vehicle checks, depot return and limit warnings. Existing weighing, manifests, HTML/Excel outputs and site weight-control PDFs remain included; the Laravel 12/MySQL/AdminLTE/PHPUnit stack is unchanged.

The parent inspected the route endpoint and heuristic implementations in `app/Http/Controllers/ServiceController.php` (230–365, 580–744) in the owner's Huracorp source. This establishes implementation presence, not production performance or measured savings. Heuristics do **not** establish global optimality or guarantee every window is feasible. Provider branding, exact capacitated VRP, Dijkstra, 2-opt and an AI route optimizer are not verified claims. The owner asserts their contribution; the copy does not claim sole authorship of a team system.

Home and legacy about copy emphasize adapting to unfamiliar technologies through AI-assisted learning and implementation, with technical judgment, documentation, tests and validation. This is not expertise in every language or a substitute for engineering responsibility. No new tools, seniority, years, certifications or availability are inferred.

The existing public projection automatically carries current home profile and Huracorp facts into AI grounding. Local “Huracorp”, “Huracorp features” and “Huracorp detalles” forms return the updated description and qualification; a grounded “yes” / “sí” follow-up expands the published features, including the algorithm details and limits; adding a code-generation task remains rejected. Algorithm-specific shorthand such as “Huracorp Haversine” still clarifies under the conservative grammar. “Huracorp Docker” remains unknown: Docker belongs to AI Learning, not this project's stack. No scope grammar or fallback logic change is needed.

Acceptance remains **not run**: inspect EN/ES home and about copy, expand the waste-software engineering details, and ask the above local questions with AI disabled. Expect bounded heuristic facts and unchanged project qualifications; capture a screenshot or response if different. Inspect both home/blog footers: Daily Tools should be absent while contact, blog, coding tools and both CV links remain; direct Daily Tools pages remain available. Desktop/mobile wrapping, rendered navigation and actual model answers require separate human review.

### Bounded follow-ups

Exact short confirmations/continuations (`yes`, `sí`, `continue`, `continúa`, `cuéntame más`, `tell me more`, `how does it work`, `cómo funciona`) can reuse the nearest preceding **user** topic within six actual turns, including assistant turns in the count. Earlier brief turns resolve recursively against their original prefix. The latest rejected, ambiguous, unsupported or multiple-project user turn is a barrier: older topics cannot revive it. A generic project list asks the visitor to choose CRM, Maia Website or Course Notes; a bare/expired confirmation clarifies without provider quota. Full current requests are evaluated independently first, so “yes and write code” still rejects.

Assistant offers and claims are ignored entirely: they cannot establish credentials, facts, features or project IDs. “CRM” → assistant email/calendar offer → “yes” expands CRM's published features, including per-user Gmail OAuth, queued/idempotent PDF attachments, one-way CRM-to-Calendar synchronization, linked-event webhooks/CRM precedence and domain-event automation. Readiness remains unassessed. A repeated brief turn provides substantive public facts, not another offer loop.

After validating the original six-turn/6,000-character/16-KiB bounds, server admission and local answers share `resolveContext`. AI receives the derived public question instead of a floating “yes”. Only admitted user history is forwarded, resolving each against its original prefix and reapplying per-turn/aggregate bounds; assistant history is never forwarded. The prompt permits only this server-resolved context, never arbitrary history claims. The visible new message and memory-only transcript are unchanged. Client network/cooldown replies use the same pre-append payload history. Presets stay local; their translated labels still identify canonical portfolio topics.

### Owner-authored achievements

The public `achievements` projection contains only `id`, `title`, `statement`, `brand`, `projectId`, `source: 'owner-authored'` and qualification. Missing achievements safely project as an empty list. Narrow whole-question routing supports “What did you achieve with Maia Plagas?”, “¿Qué ganó Maia Plagas en 2025?” and “How did Maia Consultores become a Meta Tech Provider?” / “¿Cómo se convirtió Maia Consultores en un Meta Tech Provider?”. The assistant describes Jean Pierre in third person: he states that he won Startup Perú 2025 **with Maia Plagas**, and transformed **Maia Consultores into a Meta Tech Provider**. These are owner statements, not independently verified awards or business results. Unstated funding, category, team, transition details, conversion year, certification and program details remain unknown; details questions offer contact rather than inventing a process. Older “technology provider” / “proveedor tecnológico” question aliases remain accepted only for this named owner statement; replies always use Meta Tech Provider. General Meta topics, tutorials and business advice are not admitted. Neither locale nor AI grounding establishes certified Meta Business Partner status, official partnership, WhatsApp certification or verification.

### Local official Startup Perú mark

`public/startup-peru.png` contains the original PNG downloaded from the [official Startup Perú asset](https://startup.proinnovate.gob.pe/wp-content/uploads/2021/11/logo-SUP.png), served by the [official site](https://startup.proinnovate.gob.pe/). Integrity: **1911 bytes**, **175×42** pixels (native aspect 175:42), SHA-256 `77febbb6cb307de403c1eb93fe19c8b6c759ef19b42c885a48740a2fd78d784e`.

Acquisition used the exact HTTPS URL, a 15-second deadline, a 512-KiB cap and no redirects; content type, PNG signature and IHDR dimensions were checked before writing. Bytes/transparency are preserved without tracing or recoloring; render on a suitable dark surface without stretching. The local asset avoids runtime hotlinking. This official mark is not award validation or an endorsement. Reuse/licensing permission has not been established by this download; the owner must review it before publication.

### Achievement motion: isolated, optional enhancement

The achievements share one near-black editorial showcase: equal-width stories, a thin divider, warm-white headings and restrained lavender linework. Localized recognition/transformation labels, Maia Plagas with a compact winner/2025 line, and Maia Consultores frame the unchanged owner statements. The original 175×42 Startup Perú PNG is flat and unboxed; Meta Tech Provider appears as one prominent accessible heading, without a decorative duplicate or official Meta emblem. Nested abstract layers retain optional motion behind the content. All headings, statements and bottom-aligned work links are SSR-readable without JavaScript.

`src/scripts/achievements-motion.mjs` loads installed GSAP/ScrollTrigger only on actual viewport intersection. A brief layered entrance, unpinned scroll-bound orbit and fine-pointer-only tilt (±5°) share an achievement-owned context; pointer tweens are explicitly tracked. No extra renderer, endless loop, global trigger cleanup or scroll interception is introduced. Reduced motion, hidden tabs, offscreen state and the existing owner's Pause / `motion-off` state revert only owned motion to the static composition. BFCache restores when eligible; terminal pagehide disposes observers/events. Failed or stale loading never hides content.

**Rendered acceptance remains pending R2 / owner review; CSS/source and Node tests do not prove visual quality.** Check EN/ES at desktop, 320px and large zoom for balanced story rhythm, clear winner/year/brand hierarchy, one provider heading, native logo visibility/contrast and no horizontal overflow. Confirm the composition has no extruded text, tilted logo box, heavy violet blocks or staggered panels. Verify scroll/tilt/leave, touch scrolling, keyboard focus, screen-reader headings, reduced-motion toggles, Pause, hidden-tab and BFCache restoration in a browser. Static evidence retains labelled h2/h3, decorative aria-hidden layers and 44px work links; measured contrast and assistive-technology outcomes are unperformed. Official asset provenance above is unchanged. Private keys, failover, context barriers and deployment/WAF requirements are unchanged.

## Private owner setup (optional, not executed here)

Only the owner should configure the deployment platform's **server-only** environment settings. Never paste a key into chat, source code, public JSON, browser bundles or a `PUBLIC_` variable. Do not print environment values or commit private environment files.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORTFOLIO_CHAT_AI_ENABLED` | `false` | Only the exact string `true` enables AI. Set `false` as the kill switch, then apply the platform's environment/restart workflow. |
| `GROQ_API_KEY` | Empty | Private Groq credential; a missing key keeps guided answers working. |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Server-selected primary, never visitor-selected. An authorized candidate moves first; an unknown custom model stays single-model with GPT-style parameters and requires owner compatibility/billing review. |

These are documented configuration defaults, not credentials. No environment template was created; configure these variables privately through the deployment platform. Before activation, manually review the Groq account's current **FREE** plan, quotas, retention policy and billing settings. A paid-enabled key **may incur charges**. This code does not enforce a free-only account or switch providers automatically.

### Ordered model candidates

The default order is `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, then `qwen/qwen3.8-27b` (preview). Configuring one of these as primary moves it first and preserves the order of the rest. An unknown custom `GROQ_MODEL` does **not** opt into this candidate set. Preview availability and actual account/model quotas must be checked privately before activation. These quotas are not guaranteed additive; there is no free-quota entitlement or promised response count.

### Required production controls

- Keep AI disabled until the owner reviews platform/WAF ingress limits, concurrency, spend controls and a kill-switch procedure.
- The module limits actual provider fetch starts to four per rolling minute and one complete sequence in flight per warm worker. Every failover attempt consumes a start; each question tries at most three distinct candidates. Shared and per-model cooldowns are **best-effort local state**, not a durable globally shared quota or enforcement of global account budget. Cold starts, multiple instances and restarts reset or multiply that allowance.
- Same-origin checks are browser request safeguards, not authentication: non-browser callers can forge Origin. Body validation and local counters do not replace deployment abuse protection.
- No global nvm changes, installs, infrastructure creation or production deployment are needed for offline verification.

## Public data and API contract

Public knowledge is an explicit projection of **current** `src/i18n/home.ts` (`homeCopy` and all eight `projects`). Curated name, public email and stack come from the hero/skills statements in `src/views/HomePage.astro`; synchronize `src/lib/chatbot/knowledge.mjs` if those statements change. No legacy translations, external articles, PDFs, private repositories or secret files are read. Project descriptions, features, statuses and qualifications remain bilingual, including production readiness unassessed, planned functions, dry-run verification and live-AI execution pending.

`POST /api/chat`, same Origin as the request URL, `Content-Type: application/json`:

```json
{
  "locale": "en",
  "message": "What projects are listed?",
  "history": [{ "role": "user", "content": "Tell me about the profile" }]
}
```

`locale` is `en` or `es`. History is optional, at most six recent turns with only `user`/`assistant` roles. Each turn and new message is at most 1,000 JavaScript string characters; total at most 6,000. Actual streamed request bytes must not exceed 16 KiB. Do not send system/tool roles or treat prior assistant text as factual authority.

| Result | Contract |
| --- | --- |
| `200` AI | `{ text, links: [], mode: "ai", provenance: "groq", retryAfterSeconds: 0 }` |
| `200` guided | `{ text, links, mode: "local", provenance: "public-knowledge", retryAfterSeconds }` |
| `400` / `403` / `413` | Minimal `{ "error": "Invalid request" }` for invalid data / Origin / actual bytes. No provider call. |
| Non-POST `405` | Minimal `{ "error": "Method not allowed" }`. |

All responses are `Cache-Control: no-store`. No permissive cross-origin CORS headers are added; website-wide headers are not overridden.

AI uses the fixed Groq HTTPS chat-completions endpoint with redirects rejected and **one total 8-second monotonic deadline**, starting before request parsing and covering all headers, bodies and sequential attempts. It never restarts per model; the offline `deadlineMs` seam can only shorten it. Response bytes are limited to 64 KiB; private error JSON decoding is limited to 8 KiB within the remaining deadline. Unread/error/late bodies are canceled, and late fetch completion cannot start another attempt.

All models use at most 1,024 completion tokens. GPT-OSS (and unknown custom models for compatibility) uses `include_reasoning: false` without `reasoning_format`; Qwen uses `reasoning_format: 'hidden'` without `include_reasoning`, following [Groq reasoning documentation](https://console.groq.com/docs/reasoning). These parameters are mutually exclusive. Only the first choice's string `message.content` is accepted, at most 4,000 characters; embedded `<think>` reasoning is rejected. Reasoning and provider-generated link objects, errors and bodies are not returned or logged. Grounding instructions constrain answers to public facts; generated answers can still be mistaken and are not independent verification.

## H2 integration exports

| Module | Public exports / use |
| --- | --- |
| `knowledge.mjs` | `publicIdentity`, `createKnowledge({ homeCopy, projects })` returns `{ en, es }`. Safe to serialize; never pass server config to the client. |
| `fallback.mjs` | `resolveScope(knowledge, locale, message, history = [])` returns `allow` / `clarify` / `reject`; `resolveContext` also returns the effective question/context; `localReply(..., history = [])` applies it first and returns plain `text` and allowlisted `{ id, label, href }` links. No fetch, storage or timers. |
| `chatbot.mjs` | `chatbotCopy.en/es`: Assistant/Asistente labels, welcome/intro, unknown answer, cooldown/network text and four `{ topic, label, description }` presets. No privacy field. |
| `server.mjs` | Server-only `createChatService({ knowledge, config, fetch, clock, deadlineMs })`; returns async Request → Response handler. `config` is `{ enabled: boolean, apiKey?: string, model?: string }`. Also exports `parseRetryAfter`. Never import into widget code. |

Preset topics are `projects`, `tech`, `experience`, `contact`. Local replies use exact public project/technology names, lexical feature matching and bounded user-topic follow-ups, not ML or arbitrary conversation-history interpretation. Project highlights cover CRM operations, the headless website and course-document automation instead of listing eight statuses. Specific project answers retain all eight projects' individual qualifications.

| Local question (EN / ES) | Grounded answer / boundary |
| --- | --- |
| “How is Laravel used?” / “¿Cómo usa Laravel?” | CRM and Centro Carnes purposes, with readiness/refinement caveats; not the entire stack |
| “Docker” or “PostgreSQL” | AI Learning's published Drizzle/PostgreSQL/Docker Compose feature; course generation, correction and progress remain planned |
| “Python” | Course Notes' editable ODT workflow; dry-run verified, live AI pending |
| “CRM Gmail attachments” / “CRM Gmail adjuntos” | Published per-user OAuth, queued PDF attachments, send tracking and idempotency; production readiness unassessed |
| “Centro Carnes signatures” / “Centro Carnes firmas” | Published signing workflow, explicitly not cryptographic digital signatures |
| “Express” | Published server capability; no specific project association is stated |
| “CRM Docker” or rates/availability | Honest unknown answer and public contact links; unrecognized feature wording clarifies; the general stack is not evidence for CRM |
| “And that one?” / “¿Y ese?” | Requests a project/technology name; neither route infers unresolved references from history |

Recognized answers do not repeatedly prefix the four options. The Spanish initial fallback introduction remains exactly “Por ahora puedo ayudarte con estas opciones”; the widget uses separate welcome copy. UI should not show internal mode as a degrading badge.

AI grounding asks for the actual answer first, one or two useful concrete examples, friendly professional tone without owner impersonation, and usually 2–4 sentences or two short paragraphs. Follow-ups are optional, not a repeated menu. Unknown facts and project caveats remain mandatory. Mocked prompt-string tests verify instruction construction and untrusted-history boundaries, **not actual model quality or compliance**.

Render replies using **textContent**, never HTML/Markdown. Links must come from the public allowlist: localized home projects/skills/contact anchors and the published mailto address, never model-generated URLs or invented project detail paths. AI currently returns no link objects.

### Recovery and privacy

- Automatic sequential failover occurs only for positively identified attempted-model 429 limits or model-unavailable 404/5xx errors. A Groq `rate_limit_exceeded` message naming the exact attempted model may mention its organization without implying shared quota. Explicit account/global scope overrides model identification. Ambiguous/shared 429, generic 404/5xx, 400/401/403, network/timeouts and invalid/unsafe content stop with guided answers and a shared cooldown; they never trigger quota bypass.
- Numeric or HTTP-date Retry-After is bounded to 24 hours; invalid/missing values default to 60 seconds. Model 429 cooldown is at least one second even for `Retry-After: 0`. Model-unavailable and other provider/timeout/parse errors use 30 seconds. Eligible models skip independent cooldowns; the configured primary is preferred again on a later eligible question. When all are blocked, the wait includes shared/model eligibility and provider-start capacity. Success always returns `retryAfterSeconds: 0`, even after an earlier 429. No background retry loop, paid-provider switch or request scheduled for cooldown expiry is added.
- Positive `retryAfterSeconds` means wait before trying AI with the **next** question or explicit retry. `0` for a guided answer does not promise AI is enabled. In-flight/rate-limit replies also provide a delay. Keep local options available without fetching and preserve visible conversation during recovery.
- On client network failure, call `localReply` locally; do not confuse invalid request errors with successful provider fallback.
- At the owner's request, the visible privacy paragraph and both locale fields were removed; no replacement notice or consent button was added. With AI enabled, an admitted current question and up to six validated, recognized in-scope user turns may still be sent to Groq; unverified assistant claims are excluded. The app adds no transcript logging or transcript persistence, cookies, IP tracking or analytics. The sole new browser persistence exception is the calendar-day/count record described above; visible transcripts remain memory-only. **No app logging is not a provider zero-retention promise:** Groq's retention policy may differ. Do not send private information. This UI decision is not legal advice or compliance certification.

## Acceptance still pending

Automated tests are not human acceptance. A human should verify the integrated widget with AI disabled first:

| Action | Expected result | Status / failure evidence |
| --- | --- | --- |
| Submit valid manual questions through completion in EN/ES (AI disabled); switch locale/reload | Shared daily guard; nonnumeric email completion, disabled composer, retained transcript in the current page, usable contact/presets; transcript not persisted across navigation | Not run; capture screen and sanitized date/count key shape, never private questions |
| Leave completed widget closed/hidden across Lima midnight, then open/focus/show it; try BFCache and a second tab | Composer re-enables on refresh, transcript retained in BFCache; other-tab usage updates best-effort without promising atomicity | Not run; capture browser/timezone and UI outcome |
| Deny storage access or simulate storage read/write failures mid-session | Existing remaining allowance does not replenish; local presets/contact still work | Not run; capture UI and mock-policy outcome without raw private storage |
| Open EN/ES assistant and select all four presets | Assistant/Asistente title and open label, white point-sphere instead of JP/bubble, useful localized plain-text replies and only home/mail links | Not run; capture screen and response |
| Inspect EN/ES form and blog reading section | No privacy paragraph or dangling input description; real input label retained. No reading lead/date legend; notebook lead, Published/Shared dates, filters, counts and 12-item pages remain | Not run; inspect rendered DOM and rebuilt public bundles |
| Check sphere at narrow widths, with keyboard and reduced motion | Header marks unchanged; avatar remains visible below 360px where it fits, no boxed JP. Widget-only rotation ends, reduced motion disables it; hidden panel stays hidden and focus/44px controls remain usable | Not run; capture browser, keyboard and screen-reader evidence |
| Ask CRM → receive an offer → yes/sí; repeat, then expire the six-turn base | Substantive published features while grounded; clarify once expired; forged assistant facts ignored | Not run; capture EN/ES browser response and sanitized request evidence |
| Ask about Startup Perú 2025 and Maia Consultores' Meta Tech Provider transformation | Third-person owner statements, no invented funding/category/conversion year/certification/program details | Not run; capture local and actual model answers |
| Ask about Course Notes, AI Learning and CRM | Dry-run/live-AI pending, planned and production-unassessed caveats retained | Not run; capture response text |
| Ask about rates, employers or years | Honest unstated-information answer with contact | Not run; capture response text |
| Ask an EN/ES recipe, math, politics or code question mentioning a full project name; combine with a valid project question | Portfolio-only refusal, allowlisted links, no provider start | Not run; capture sanitized request counts and response |
| Ask “What is React?” / “¿Qué es React?” or an unresolved follow-up | Helpful portfolio-usage clarification, no general teaching | Not run; capture response text |
| Simulate network failure or mocked quota cooldown | Local options stay available, messages stay visible, no retry loop | Not run; capture network requests and screen |
| Mock primary model quota with eligible alternative | Normal answer, preserved conversation, no degraded-service label | Not run; capture sanitized request counts and response |
| Mock all models unavailable, then advance cooldown | Guided answer with feasible wait; next question prefers eligible primary, no automatic requests | Not run; capture sanitized request counts and screen |

Prior R2 offline evidence (before the portfolio-only gate): `node --test tests/chatbot.test.mjs` passed **87** tests (the original 81 retained plus six bilingual local/prompt cases); the quick-path server/client command passed **109** (including 22 R1 client cases). The combined six-suite command (`node --test tests/chatbot.test.mjs tests/chatbot-client.test.mjs tests/hacker-news.test.mjs tests/news-sources.test.mjs tests/editorial-blog.test.mjs tests/hacker-news-workflow.test.mjs`) passed **148**. All Groq responses were mocked; local assertions check published features, qualifications and absent false project associations. No live AI behavior or quality benchmark was measured.

Portfolio-only P1 offline evidence: the first focused RED run passed **111/117**, with six new scope/history tests failing before implementation. Further regression RED runs passed **119/120** (overly broad role rejection) and **118/120** (explicit rates/availability wording needed honest contact routing). Final GREEN passed **120/120**, including published role-based access/queued jobs, disabled/cooldown/in-flight and client offline consistency coverage. The authorized combined six-suite command passed **160/160**. No actual Groq calls or model-outcome claims were made.

Bounded P1 correction evidence: focused RED passed **120/126**, with six new bilingual generator/common-phrasing/mismatch cases failing. Focused GREEN passed **126/126**; the combined six-suite command passed **166/166**. Prior scope/history/transport assertions were retained. These are mocked routing and published-data checks, not live model-quality evidence; no correction build was run.

R2 did not run a build or deployment. Earlier artifact evidence belongs to `odd/tasks/hybrid-portfolio-chatbot.md`; final verification for the redesign remains separate in `odd/tasks/chatbot-experience-redesign.md`. Real Groq correctness/tone, browser keyboard/visual/screen-reader checks, language-tool coverage and deployment controls remain owner-reviewed acceptance work.
