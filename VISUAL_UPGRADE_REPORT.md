# Portfolio V8 — Signature Visuals Upgrade

**Branch:** `feat/v8-technical-showcases`  
**Scope:** Existing homepage hero WebGL2 renderer and Journey Canvas 2D scenes; no framework change.  
**Status:** Source implementation complete; independent browser visual acceptance and performance measurement **pending**.

## Targeted source files

| File | Change |
|---|---|
| `site/hero.js` | Replaced generic cyclic knot mesh with a deliberately constructed D/K metallic sculptural monogram made of five cubic-Bezier bevelled ribbon strokes. The fragment shader now renders a restrained metal palette with specular highlights, edge light, fine brushed microvariation and a moving light sweep. Pointer tilt and limited oscillation keep the monogram legible instead of continuously rotating it out of view. |
| `site/hero.js` | Reworked the Canvas 2D fallback to show a matching stylized D/K silhouette. Adjusted projection for small viewports. No external model download or WebGL framework introduced. |
| `site/immersive.js` | SRMedu: replaced the globe with six arranged semester clusters and 67 illustrative nodes, deterministic orbital activations, animated conceptual pathways and limited parallax. Individual cluster counts and graph links do **not** assert genuine subject mapping. |
| `site/immersive.js` | KV research: replaced the plain token grid with a framed retained/evicted/incoming token process. Added explicit illustrated-selection labels, a compacted cache bank and restrained scanning. **Not experimental attention data.** |
| `site/immersive.js` | Metro Runner: upgraded perspective portal geometry, layered rails, moving sleepers, lane guides, soft light sources and a more elaborate approaching train with 3D side and front faces, windows and two headlights. Clearly labeled *conceptual*, not actual gameplay. |
| `site/immersive.js` | Removed unused old-globe point generation and helper projection. Reduced Journey pixel-density cap to 1.35 on narrow screens (1.65 otherwise). Retained existing 40fps scheduling cap and offscreen/document-hidden suspension. |
| `site/index.html` | Updated the homepage canvas accessible label and caption to describe the D/K sculpture. Preserved full-name hero, 12 case studies and all other sections. |
| `scripts/test_visuals.cjs` and `package.json` | Added focused Chromium screenshot generation with desktop, mobile, reduced-motion and forced 2D fallback captures. Logs page errors and signature shader compilation warnings. |

## Visual rationale

1. **Hero:** Distinctive recognizable monogram before surface ornament. Motion deliberately remains oscillatory so the D/K silhouette never disappears behind the camera.
2. **Study atlas:** Semantic clusters communicate the platform's six-semester scope rather than presenting an abstract decorative globe.
3. **KV instrument:** An explanatory, synthetic token-retention process without suggesting that rendered tokens or curves are actual measurements.
4. **Metro:** Geometry and a recognizable train create depth and motion. Screen shake and rapid flashing were omitted.

## Evidence and verification

**Completed here:**
- The updated JavaScript was syntax-parsed without error during source changes.
- GitHub confirmed commits to the existing feature branch.
- No change was made to the protected live `main` implementation; no deployment or merging was performed.

**Not completed here:**
- The latest branch was not executed in a real browser in this environment.
- No before/after screenshot of the **updated branch** has been captured or visually judged here.
- Real Chromium, Safari, physical-mobile, screen-reader and WebGL context-loss regression results are not yet available.
- Actual FPS, GPU timing, power use, memory allocation and Web Vitals have **not** been measured. The existing rendering caps are implementation choices, not measured performance results.

The browser validation is therefore a **release gate**, not a presumed pass.

## Capture and test on the owner's Mac

Run at the actual repository root:

```bash
cd ~/Downloads/Dharaksh_Portfolio
git switch feat/v8-technical-showcases
git pull --ff-only
npm run test:visuals
```

If the first run passes, the resulting captures are in `test-results/visuals/`:

- `hero-desktop.png`
- `hero-mobile.png`
- `journey-knowledge.png`
- `journey-memory.png`
- `journey-metro.png`
- `journey-metro-mobile.png`
- `hero-reduced-motion.png`
- `hero-2d-fallback.png`
- `journey-knowledge-mobile.png`
- `manifest.json` (capture/environment information; not FPS measurements)

**Accept only after personally reviewing all screenshots** for silhouette quality, composition, readability, animation restraint, responsive cropping, Kio overlap and fallbacks. Screenshots are only still frames; additionally preview motion in a real browser.

Then run the four existing suites once:

```bash
npm run test:upgrades
npm run test:motion
npm run test:universe
npm test
```

These tests cover functional regressions but cannot certify aesthetics.

## Known limitations and deferred work

- A static screenshot cannot prove smoothness; inspect animations directly and measure performance separately.
- The original hero WebGL renderer does not implement a comprehensive context restoration/rebuild path after `webglcontextlost`. The Canvas 2D fallback handles WebGL unavailability at initialization, not a complete recovery from lost GPU state.
- This phase is **conceptual 3D/2.5D art**, not authentic product footage. Owner-approved Metro gameplay and screenshots remain separate.
- Interactive browser measurements and usability tests remain required before merging.
- No new fonts, shaders, frameworks or third-party media were added.

**Merge policy:** Keep PR #1 as draft until all visual and functional checks pass, and obtain the user's approval for the art direction.