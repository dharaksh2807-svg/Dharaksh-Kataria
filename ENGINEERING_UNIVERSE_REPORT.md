# Engineering Universe implementation

## Running the scene

Serve the existing site directory and open the Universe anchor.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Local entry point is `http://127.0.0.1:4173/#universe`.

## Focused implementation

`site/world.js` extends the original V8 geometry, projection conventions, shaders and four connected islands. The existing forest, copper, moss and lavender palette, project routes and conceptual-art labeling remain in use.

- Learning highlights six SRMedu atlas volumes using the existing semester counts of 20, 10, 16, 14, 4 and 3 subjects.
- Collaboration connects seven illustrative role towers to the ProjectMatch hub through a highlighted bridge.
- Research cycles retention-budget illustrations of 260, 516 and 1028 tokens. The 30-column diagram is explicitly identified as illustrative, with experimental evidence available in the existing case study.
- Creation moves a train model between three lanes using the action button or A/D keys. The object is labeled a conceptual track interaction. Approved genuine Metro Runner gameplay remains pending.

Pointer/touch orbit, projected-object click selection, keyboard district focus, object activation and explicit zoom controls work in both WebGL2 and software modes. Pointer cancellation releases control ownership. Ordinary wheel input scrolls the document. Alt-wheel zooms the scene. Manual input pauses the scroll tour, which visitors can explicitly resume.

The desktop scene stays within a sticky stage as the page scrolls through a continuous four-district camera path. Camera target, radius, pitch and yaw interpolate in the existing shared coordinate space. Existing directional lighting and distance fog establish depth. A soft focus-light region follows the moving camera target. Narrow screens use the same path without reserving a tall sticky section. Reduced motion and the global motion switch select immediate camera updates and demand-only rendering.

Renderer resources are managed across context loss and restoration. The original canvas remains available for GPU restoration while a separate canvas provides software rendering. Three actual loss/restoration cycles are covered by browser tests. Shader failure, missing WebGL and unavailable Canvas2D preserve the standard project links. GPU buffers are reused for object updates, shader objects are released after linking, and audio nodes disconnect when their optional chimes finish.

The renderer stops while offscreen or hidden. Complete rendering unavailability also leaves the scene idle while ordinary district and project controls remain usable. Keyboard focus pauses the scroll tour, and a focused district marker stays available if camera movement takes its object outside the viewport. Software mode targets 30 fps. A rolling frame/CPU budget adjusts backing resolution with recovery hysteresis. Perspective projection avoids the previous general matrix-loop allocation, and software lighting colors are cached while the camera is stable. WebGL uses one draw call. Diagnostic frame, CPU, GPU-timer and quality measurements are available in `window.portfolioWorld.state.performance`.

`site/index.html` adds instructions, action/zoom/tour controls and four ordinary project-story links. The visible bypass works without JavaScript. `site/v8.css` extends the existing styles. `site/v8.js` drops the redundant district double-click navigation, leaving explicit project-story links as the navigation control. Kio preference handling continues through its existing implementation.

## Repeatable tests

```sh
npm ci
npx playwright install chromium
npm run test:universe
npm test
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects an existing browser executable. Both suites serve the actual HTML entry points from an ephemeral localhost server and block external requests. Results and screenshots are written under `test-results/universe/` and `test-results/cases/`.

The Universe suite covers native/software rendering at 320, 390, 768 and 1440 pixels, smooth focus transitions, four-stop scroll choreography, each interactive object, pointer/touch/keyboard input, document scrolling, motion preferences, offscreen/visibility lifecycle, real GPU context loss/restoration, shader failure, complete rendering unavailability, JavaScript-disabled navigation, direct object clicks, persisted Kio preferences, opt-in audio defaults and controlled-load quality adaptation.

The controlled-load test inserts a 26ms CPU delay into draw submission to exercise quality reduction. Its results are fault-injection evidence. Native rendering measurements run separately with the actual hardware path.

Visibility-handler testing simulates a visibility event. Touch tests use Chromium’s touch input protocol. These checks complement desktop pointer input. Physical mobile hardware and assistive-technology testing remain pending.

## Rendering measurements

The pre-change baseline and post-change measurements use Chromium 156.0.8078.4 on the same host. Native WebGL reports `ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)`. Hardware rendering was available. GPU timing uses `EXT_disjoint_timer_query_webgl2` with disjoint samples discarded. CPU timing measures the scene’s JavaScript draw work. Frame rate measures rendered frame timestamps. These quantities measure different parts of the pipeline.

The V8 baseline measured 60.004 fps with 0.300ms p95 CPU draw time on native WebGL2. The forced software baseline measured 60.002 fps with 1.600ms p95 CPU draw time. The upgraded software renderer deliberately caps rendering at 30 fps to reserve time for page interaction. Measurements are short local samples, with remote fonts blocked and the other portfolio scripts running.



## Final results

On 19 November 2026, the refreshed Universe suite passed **31/31 checks**, with **0 failures**. This includes new regressions for idle behavior when rendering is unavailable and keyboard focus retention during camera movement. The earlier case-study suite passed **60/60 checks**. This focused follow-up reran the Universe suite. Node syntax checks passed for the renderer and its test suite.

| Rendering path | Viewport width | Rendered fps | CPU p95 | GPU p95 |
| --- | --- | --- | --- | --- |
| native | 1440px | 60.003 | 0.300ms | 0.362ms |
| software | 1440px | 30.001 | 1.800ms | Unavailable |
| native | 390px | 60.003 | 0.300ms | 0.528ms |

The controlled 26ms draw-delay case reduced effective DPR to **1.40**, down from 1.65, after 91 rendered frames. Native measurements retained one draw call and 9,792 vertices.

Visual inspection covered desktop and mobile native rendering, software rendering, the overview and focused district views. The pre-change screenshots are under `test-results/universe/baseline-*.png`. The upgraded screenshots are under `test-results/universe/measured-*.png`. The scene adds controls, project-responsive geometry and camera views, so visual review checks design continuity and legibility.

The workspace has no configured Git repository. The implementation and preview remain local.
