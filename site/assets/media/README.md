# Authentic case-study media

## Registered captures

`captures.json` is the reviewed inventory. `manifest.js` is generated from it. The gallery currently registers 11 screenshots and five silent public-interface walkthroughs captured on 19 November 2026 from the public applications already linked by the owner’s portfolio.

Each entry records the original HTTPS source, capture date, accessible description, dimensions, SHA-256 hash and explicit authorization/privacy-review status. Captures used fresh browser contexts and public pages. The browser viewport excludes local paths, source code, developer tools and address bars. No accounts or credentials were entered. ReValue shows its public sign-in screen with empty fields. ProjectMatch’s public example listing remains identified as illustrative. LinkedInPostPro shows generic text entry with empty generated output.

Images are compressed WebP captures at 1280×800. Videos are H.264 MP4, 4.8–6 seconds, silent and metadata-stripped, with fast-start enabled. Videos show interface browsing, and text entry for LinkedInPostPro. They provide visual context for the public interface. Feature correctness still relies on separate technical evidence.

The existing `*-public-01.png` files are unregistered and are outside this inventory. The original artwork in `assets/og/` and the interactive 3D models remain explicitly labeled conceptual.

## Missing owner evidence

| Project | Available | Still needed |
| --- | --- | --- |
| SRMedu | Two public catalogue screenshots and walkthrough | Approved subject-tool and account workflows |
| ProjectMatch | Two public landing/workflow screenshots and walkthrough | Approved authenticated matching and messaging captures |
| OODP Mastery | Two public curriculum screenshots and walkthrough | Approved compiler and learning-workflow recording |
| ReValue | Public sign-in screenshot | Approved authenticated prototype screenshots and demonstration |
| LinkedInPostPro | Empty interface, generic text-entry screenshot and walkthrough | Approved output-generation demonstration |
| Micchami Dukkadam | Two public greeting screenshots and silent walkthrough | Optional approved customization/audio demonstration |
| KV-cache research | No registered capture | Owner-approved benchmark artifacts, charts and execution recording |
| FairShift | No registered capture | Approved local worker/employer dashboard capture and demonstration |
| Regula | No registered capture | Approved retrieval monitor and benchmark recording |
| Nexus / AlarmCluster | No registered capture | Approved actual-device screenshots and alarm demonstration |
| Smart Toll Plaza | No registered capture | Approved actual Tkinter application capture and workflow demonstration |
| Metro Runner | No registered capture | Owner-approved genuine gameplay screenshots and recording |

## Adding approved media

1. Capture the actual running project. For Metro Runner, use owner-provided gameplay only. Inspect the entire recording for private paths, credentials, usernames, repository URLs and source details. Approval must precede registration.
2. Add the file to this directory with a plain basename. Use PNG/WebP/JPEG for screenshots or a silent MP4/WebM recording no longer than 60 seconds.
3. Add an entry under the relevant project slug in `captures.json`. Supply `type`, `file`, `caption`, `alt` for images, `width`, `height`, `captured` as YYYY-MM-DD, `sha256`, `approved: true` and `privacyReviewed: true`. Public captures also include `source`. Metro entries must omit source URLs.
4. Run `python3 scripts/install_media.py --confirm-authentic`. Requires FFmpeg’s `ffprobe` on PATH. Validation checks bytes, dimensions, duration, audio absence, metadata fields and review hash before atomically replacing the runtime manifest. A hash verifies file identity. Human review establishes authenticity and privacy approval.
5. Run the browser regression suite described in `site/projects/README.md`.

Absent or failed media has a textual fallback. Images load lazily. Videos remain unloaded until requested and require the native play control to start. Live-site embeds are opt-in, include direct-link fallback and can be unloaded.
