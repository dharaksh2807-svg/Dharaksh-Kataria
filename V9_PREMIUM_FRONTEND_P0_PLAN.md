# Portfolio V9 — ₹5,00,000-Level Frontend Acceptance Plan

**Repository:** \`dharaksh2807-svg/Dharaksh-Kataria\`  
**Integration branch:** \`feat/v8-technical-showcases\`  
**Default:** Rift Director's Cut; **optional on-page selector:** Kinetic, Fracture, Infinite, Ascension  
**Shipping rule:** Do **not** merge or deploy before recorded visual acceptance on the user's Mac and at least one physical mobile device.

## Scope & truth standards

The feature branch already contains the integrated Rift in \`site/index.html\`, the five mode options, Kio, interactive explorations, and real links to case studies. The four experimental HTML labs remain separate historical previews; the homepage modes reuse the same 3D renderer and scene with distinct transition timelines. They are **not** five simultaneous WebGL canvases.

An expensive frontend is worth paying for only when the actual visual quality, content credibility, usability, stability, accessibility and measurable results justify the fee. Describing source code as "premium" is not proof.

## P0 work plan and acceptance gates

| Workstream | Code / design already present | Evidence still required | Pass condition |
|---|---|---|---|
| 1. Hero art direction | Scoped \`rift-home.css\`, opening perspective and copper/champagne PBR geometry in \`labs/rift-directors-cut.js\`; full live HTML title | 1440×900, 1280×800, 390×844, 360×800 opening captures; first-frame motion recording | Full "Dharaksh Kataria" fits without clipping, high contrast; portal stays visually subordinate to title where they overlap |
| 2. Cinematic continuity | Five selectable mode timelines driven by normalized scroll position; real 3D camera, fracture, SUBSTANCE and handoff | Record each mode opening → 30% → 50% → 70% → 95% → project handoff → reverse to 0%; test repeated scroll and rapid clicks | No jumps or geometry buildup, visible content at final frame, reverse returns to exactly the starting composition, no trapped navigation |
| 3. Mobile | Native mode selector, responsive layout, pixel-density cap and viewport-specific geometry positioning | Real iPhone Safari plus Android Chrome; touch scroll; 390×844 and 360×800 emulation | Full name fits; controls >=44px where practicable; touch scroll works; CTA and fixed Kio never block navigation |
| 4. Accessibility | H1, HTML links, skip link, native buttons, reduced motion, motion pause, focus rings, inert hidden handoff | Keyboard-only walkthrough, VoiceOver, contrast and axe-core audit, reduced-motion recording | All controls reachable and announced, focus visible, 3D not essential to navigation, reduced-motion users do not face forced cinematic scroll |
| 5. Performance | Self-hosted Three.js r182; responsive render resolution, optional shadows, RAF-based quality downgrade, visibility-based pause and disposal | Chrome Performance and WebGL inspector on Apple silicon, network waterfall, heap snapshots, Safari profiler, Lighthouse mobile and desktop | No unbounded render loops, context loss recovers gracefully, actual FPS and Core Web Vitals documented rather than inferred; target 60 FPS on capable desktop |
| 6. Project presentation | Verified case-study paths; public-interface capture assets for SRMedu and ProjectMatch, Metro artwork clearly labeled illustrative | Check captures against currently public sites, real gameplay media if available, case-study technical diagrams and claims with sources | Every caption distinguishes screenshot vs concept art, every demo link works, each flagship case study gives problem, architecture, tradeoffs, outcome and evidence |

## Immediate implementation state

- [x] Rift replaces the old homepage D/K WebGL hero **on the feature branch**.
- [x] Mode buttons available on desktop; native select on mobile; choice persisted to localStorage.
- [x] Director's Cut, Kinetic, Fracture, Infinite and Ascension use the homepage scene instead of five simultaneous renderers.
- [x] Full name and HTML call-to-action; scroll-controlled fracture/portal sequences.
- [x] Final light handoff leads to a project bridge with linked real case-study pages.
- [x] Kio visible and opt-in guide shortcut; contextual exploration cues; pointer and click feedback.
- [x] Self-hosted licensed Three.js r182.
- [x] Desktop/mobile, reduced-motion, and mode-select browser QA script.
- [ ] **Actual browser captures and motion videos reviewed after the latest changes.**
- [ ] Physical phone and Safari QA.
- [ ] Recorded real FPS, memory, frame timings, and Core Web Vitals.
- [ ] Keyboard / VoiceOver / automated accessibility audit.
- [ ] Existing complete regression suite rerun after integration.
- [ ] Independent art-direction and project-content audit with evidence.

## How to inspect the *integrated homepage*

\`\`\`sh
cd ~/Downloads/Dharaksh_Portfolio
git switch feat/v8-technical-showcases
git pull --ff-only origin feat/v8-technical-showcases
python3 -m http.server 4173 --directory site
\`\`\`

Open **http://127.0.0.1:4173/** — not \`/labs/rift-directors-cut.html\`.

Modes are selected using the controls in the homepage hero, or the exact query parameters:
- \`/?rift=director\`
- \`/?rift=kinetic\`
- \`/?rift=fracture\`
- \`/?rift=infinite\`
- \`/?rift=ascension\`

Each option is primarily an animated choreography variant, **not** a completely new WebGL architecture. The dedicated original lab previews are at \`/labs/rift-showcase.html\`.

## Run automated browser evidence

Use a separate Terminal while the Python HTTP server runs:

\`\`\`sh
cd ~/Downloads/Dharaksh_Portfolio
npm install
npx playwright install chromium
npm run test:rift-home
\`\`\`

Expected: \`screenshots/rift-home/\` contains opening/transition screenshots, recordings, 5 mode captures, mobile and reduced-motion captures, and a JSON report.

**Do not call these tests passed until they are actually executed.** An automated assertion cannot determine aesthetic quality, believable reflections, or artistic polish.

## Evaluation & sign-off

1. **Composition gate:** User selects the opening screenshot and approves complete title visibility.
2. **Motion gate:** User reviews a recording of the scroll sequence and its reverse in all five optional modes; selects default.
3. **Mobile gate:** At least one real iPhone Safari and one Android Chrome walkthrough.
4. **Accessibility gate:** Keyboard-only and screen-reader run, no critical automated violations.
5. **Technical gate:** FPS/long tasks, memory, WebGL fallback and Core Web Vitals recorded and compared to agreed targets.
6. **Content gate:** Case-study claims and media are accurate, labeled and linked.
7. **Release gate:** Merge only after the previous six gates pass, then deployment smoke tests and rollback plan.

## Avoid scope creep

Do not add more unrelated 3D effects, five overlapping animation engines, forced mode-selection onboarding, autoplay sound, aggressive cursor replacement, or unverified portfolio metrics. Improving the **quality of the entry point and actual work evidence** matters more than effect count.
