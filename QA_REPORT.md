# V8 implementation and verification report

**Status:** Local implementation and isolated browser validation completed. Not a certified production deployment.

## Browser tests performed

- Isolated Chromium DOM/script injection at 320px, 390px, 768px, 1440px and 1920px widths.
- No captured JavaScript errors in the tested main-page and seven sampled case-study routes.
- No horizontal document overflow in those tests.
- Six featured and six archive entries present; twelve generated HTML project pages exist.
- Four `world` markers and four sectors, with AI Research and 3D Creation focus changes verified.
- Kio panel opens, world tour stop selected, and balanced desktop width measured at 216 CSS px.
- Sound toggle updates opt-in state; audio playback itself is unverified in headless CI.
- The four retained competition entries remain 01/03/04/05.
- Direct Metro Runner source/deployment links were absent from inspected HTML anchors, and the embedded résumé no longer contains the direct game-repository hyperlink.
- The software-rendered perspective 3D world and original per-project models rendered successfully in isolated Chromium.

## Source checks

- All local JavaScript files parsed with Node `--check`.
- All twelve project HTML files generated from original curated content records.
- All twelve project-specific 1200×630 PNG social cards generated and verified locally.
- Social metadata URLs require a real user-owned deployment domain via `scripts/prepare_deploy.py`.

## Important incomplete items

1. **Authentic screenshots and real gameplay video:** No approved original captures were accessible. File slots, loader and verification script exist. This remains an owner-media dependency; no fake screenshots/videos were created.
2. **Real-device testing:** Not completed; no physical phone or Apple Safari controlled in this session.
3. **Actual GPU WebGL2 performance and functionality:** Not confirmed in isolated browser because GPU contexts were unavailable there. Verified fallback is perspective 3D rendered by Canvas 2D.
4. **Cross-document animations:** CSS and links implemented; normal localhost navigation was blocked by the environment, so transitions are not certified in a standard browsing session.
5. **Spatial audio/haptics:** Toggle logic implemented but physical playback/device vibration not measured.
6. **Live external embeds:** Depend on third-party frame policy and real network access; not confirmed in local browser.
7. **Lighthouse/Core Web Vitals:** No production deployment or real traffic measurements yet.

## Design QA references

- `Portfolio_V8_Design_Preview.png` is a collage made of genuine screenshots of **this portfolio implementation**, not screenshots of the user's other projects.
- `screenshots/world-1440.png` and `screenshots/world-390.png` show the software 3D fallback.
- `screenshots/case-*.png` show actual generated technical case-study pages.
