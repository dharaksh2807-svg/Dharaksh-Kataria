# Case-study evidence upgrade

## Delivered

All 12 existing HTML case studies retain their narrative, metrics, caveats and conceptual artwork. The existing paper/copper/forest design extends into responsive galleries, native-dialog lightboxes and optional video controls. Problem, Solution, Implementation and Result headings are explicit. Project-specific component-flow diagrams summarize the existing technical descriptions. Added engineering challenges and trade-offs are identified as analysis of those descriptions.

The shared media component operates independently of the decorative canvas. It supports lazy images with reserved dimensions, accessible descriptions and provenance captions, request-only videos with native playback controls, playback pause on page hide, visible asset-error fallbacks and missing-media states. Keyboard controls cover opening, focus containment, previous/next, first/last, Escape and focus return. Public embeds have a direct-link fallback and an unload control. Narrow adjacent-project navigation was corrected on ReValue and Micchami.

Six authorized public applications supplied 11 genuine screenshots and five silent interface recordings. Public capture sessions used fresh contexts and empty sign-in fields. The screenshots and sampled recording frames were visually reviewed. Media registration validates hashes and metadata and requires recorded authorization and privacy review. Human review establishes authenticity. The runtime manifest is replaced atomically after all entries validate.

The existing ReValue source URL returned HTTP 404, so both source buttons now display an availability note. Its public application link remains available. Eight other existing GitHub source URLs returned HTTP 200. Six public application URLs returned HTTP 200 during capture. These checks establish public page availability at capture time.

## Missing evidence

Approved media is pending for KV-cache research, FairShift, Regula, Nexus / AlarmCluster, Smart Toll Plaza and Metro Runner. ReValue exposes only its public sign-in screen. Authenticated workflows need approved owner captures. The inventory and project-by-project gaps are in `site/assets/media/README.md`.

Metro Runner’s conceptual model remains labeled, with approved owner gameplay pending. Its case study exposes technical narrative only. Future captures require a complete review for private paths, credentials, usernames and source details.

Existing technical claims and analytics remain attributed to the original project records. This work adds genuine interface evidence and explicitly labeled engineering analysis. Independent re-runs of application benchmarks and verification of internal architecture remain pending.

## Exact local validation

On 19 November 2026, the final browser suite ran against actual HTTP routes using Playwright 1.65.1 and Chromium 156.0.8078.4.

- 48 responsive route checks passed across 12 pages at 320, 390, 768 and 1440 pixels. All checks reported zero document overflow and zero JavaScript errors.
- Six populated-gallery keyboard checks passed.
- Six additional checks passed for optional video loading/playback, failed-media fallbacks, canvas failure, disabled JavaScript, opt-in iframe fallback/unloading and normal-motion playback defaults.
- Total browser result was **60 passed, 0 failed**.
- Media validation registered **16 captures across six projects**.
- Five inventory checks passed, covering a valid inventory and rejection of changed hashes, missing approval, unsafe filenames and a Metro source URL.
- Node syntax checks passed for `site/case.js`, `site/case-media.js` and `scripts/test_case_media.cjs`.
- `npm install` reported **0 vulnerabilities**.

The suite runs with `npm ci`, `npx playwright install chromium`, then `npm test`. This run used an existing browser through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. See `site/projects/README.md` for usage. Raw results and screenshots are generated under `test-results/cases/`.

## Visual review

Desktop and mobile galleries, the mobile lightbox, missing-media views and retained case-study heroes were visually inspected. Existing V8 baseline files were preserved. At 1440×770, Pixelmatch with threshold 0.1 reported 18,322 differing pixels for SRMedu (1.652%) and 19,945 for Metro Runner (1.799%). The local regression suite blocks remote fonts and runs on macOS Chromium, while the supplied baseline came from an earlier isolated Chromium environment. Typography and text wrapping differ. These comparisons are diagnostic. The hero composition, palette and conceptual models remain visually consistent.

Browser coverage is desktop Chromium with viewport resizing. Real-device playback and assistive-technology behavior need separate device-level checks.

## Workspace

The workspace has no configured Git repository, so a commit is unavailable. All changes are local.
