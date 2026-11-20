# THE RIFT V9.1 — Preview-only quality gate

Branch: `feat/v8-technical-showcases`

## Delivered
- `site/labs/rift-showcase.html`: selectable comparison gallery, one live iframe at a time
- `rift-kinetic.html`: differential clockwise frame motion
- `rift-fracture.html`: segmented architectural separation and reassembly
- `rift-infinite.html`: perspective WebGL2 z-plane tunnel plus CSS scene
- `rift-ascension.html`: portal rotation, ghost `SUBSTANCE` typography, slit light
- `rift-variants.css`, `rift-variants.js`: standalone styling and deterministic scrub engine
- `scripts/capture_rift_variants.cjs`: local screenshots, two recordings per variant, and browser checks

## Preview on Mac
```sh
cd ~/Downloads/Dharaksh_Portfolio
git switch feat/v8-technical-showcases
git pull --ff-only origin feat/v8-technical-showcases
python3 -m http.server 4173 --directory site
```
Open http://127.0.0.1:4173/labs/rift-showcase.html

## Actual evidence (not yet captured by this authoring environment)
```sh
cd ~/Downloads/Dharaksh_Portfolio
npm install
npx playwright install chromium
node scripts/capture_rift_variants.cjs
```
Output: `screenshots/rift-v91/<variant>/{desktop-1440x900.png,mobile-390x844.png,reduced-motion.png,scroll-transition.png,entrance.webm,scroll.webm}` and `measurements.json`.

The script uses an ephemeral local HTTP server and headless Chromium, not the production website. It checks reversible scroll progress, pause/resume, responsive overflow, and reduced-motion state. It collects browser requestAnimationFrame intervals only. Those intervals are **not GPU frame times**, and mobile is **viewport emulation**, not a physical-phone test.

## Current quality gate
| Criterion | Status |
|---|---|
| Files exist on requested feature branch | Verified by GitHub reads |
| JavaScript parses | Verified with JS parser |
| Actual WebGL2 render and screenshot | **Not verified** in this environment |
| Actual mobile layout screenshot | **Not verified** in this environment |
| Entrance and scroll recordings | **Not recorded** in this environment |
| GPU latency / FPS on Mac | **Not measured** |
| Live homepage modified | **No** |
| Merged or deployed | **No** |

## Preview decision criteria
1. Kinetic: Are the rotations readable and architectural, or noisy?
2. Fracture: Does separation look physical and coherent in reverse?
3. Infinite: Does it feel like camera travel rather than CSS scale?
4. Ascension: Is SUBSTANCE atmospheric without competing with the name?
5. Across all: mobile typography, reduced motion, navigation, smooth scroll reversal, real WebGL support and runtime performance.

**Do not integrate any variant until the human reviewer sees the recordings and approves it.**

Known constraints: The current artwork combines a native WebGL2 perspective shader with layered CSS geometry, **not a Three.js mesh or physically based 3D scene**. Do not describe its reflections as physically simulated or claim GPU benchmarks from screenshot capture.