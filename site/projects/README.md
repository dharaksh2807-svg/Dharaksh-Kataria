# Project case studies

Twelve static HTML routes retain their existing project narratives, metrics, evidence caveats, conceptual artwork, navigation and authorized links. Each has explicit Problem, Solution, Implementation and Result sections, a project-specific component-flow diagram and engineering challenge/trade-off/limitation sections. Added engineering considerations are derived from the existing case descriptions. The diagrams summarize documented components. Independent implementation verification remains subject to the evidence caveats on each page.

`../case-media.js` owns galleries, optional videos, keyboard lightboxes and live embeds independently of the decorative canvas. Lightboxes support Enter to open, Tab/Shift+Tab containment, Left/Right, Home/End, Escape to close and focus restoration. The responsive gallery collapses to one column at 640px. The existing design tokens remain in use.

Media provenance and missing evidence for all 12 projects are documented in `../assets/media/README.md`. Metro Runner remains private with approved gameplay pending.

## Repeatable browser checks

From the repository root, run the following commands.

```sh
npm ci
npx playwright install chromium
npm test
```

The suite serves actual HTML routes on an ephemeral localhost port and blocks external requests. It tests all 12 pages at 320, 390, 768 and 1440 pixels, six populated keyboard lightboxes, optional playback, failed assets, decorative-canvas failure, disabled JavaScript, motion preferences and iframe loading/unloading. Results and screenshots go into the ignored `test-results/cases/` directory. It leaves the V8 screenshots unchanged.

To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path before `npm test`. The result JSON records the actual browser version. Public-source availability and authenticated product functionality are outside this local regression suite.
