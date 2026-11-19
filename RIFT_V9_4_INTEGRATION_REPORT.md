# Portfolio V9.4 — The Rift homepage integration

**Repository:** dharaksh2807-svg/Dharaksh-Kataria
**Branch:** feat/v8-technical-showcases
**Status:** Integrated on feature branch only. Not merged or deployed.
**Review:** Automated source checks completed; real Mac browser screenshots and recordings remain necessary.

## User feedback addressed

| Observation | Change |
|---|---|
| “Dharaksh” clips or disappears too early | Real HTML full name, wider type safe area, dark readability scrim; full opacity through 70% scroll, fade only in final fly-through |
| Rift can obscure typography | Portal stays behind text in compositing, with stronger dark-side overlay |
| Empty cream screen after animation | Final-shot handoff title/CTA, immediately followed by three real linked project case studies |
| Four previous variants were confusing | Keep the Director's Cut as the default. Link to four existing optional motion studies, not an intrusive production mode selector |
| Kio appears tiny | Restore larger desktop guide in the CSS cascade; retain smaller mobile composition and user-selected compact mode |
| Hard to know what to explore | Contextual interaction compass appears in actual interactive sections; links to existing Kio guided tour; no automatic popups |
| Cursor and click feedback | Adaptive halo, hover focus ring, click compression; reuse existing V4 ripple instead of stacking duplicate effects |

## Actual source changes

- \`site/index.html\`: replaced old homepage D/K sculpture hero with integrated Rift; added project bridge, Kio shortcut and optional motion studies link. Rest of site preserved.
- \`site/rift-home.css\`: scoped responsive layout, portal CSS fallback, typography, project handoff, Kio size, interaction feedback.
- \`site/labs/rift-directors-cut.js\`: reused existing 3D animation on homepage, adjusted title visibility and handoff, respects the global motion switch.
- \`site/polish-interactions.js\`: contextual guide compass, existing cursor-halo motion and optional Kio shortcut.
- \`site/labs/vendor/\`: pinned official Three.js r182 module and core with MIT license, so no external CDN is needed in the normal path.
- \`scripts/qa_rift_home.cjs\`: screenshot/video and functional acceptance capture for desktop, mobile emulation, reverse scroll, reduced motion, global motion control, Kio size and project links.
- \`package.json\`: \`npm run test:rift-home\`.

The original \`site/hero.js\` is retained in the repository but no longer loaded by \`site/index.html\`; its WebGL D/K canvas is removed from the homepage. Other site sections, case studies, Engineering Universe, Journey, and Kio guide logic were not rewritten.

## Preview on Mac

\`\`\`sh
cd ~/Downloads/Dharaksh_Portfolio
git status --short
git switch feat/v8-technical-showcases
git pull --ff-only origin feat/v8-technical-showcases
python3 -m http.server 4173 --directory site
\`\`\`

Open \`http://127.0.0.1:4173/\`.

The old isolated lab remains at \`/labs/rift-directors-cut.html\`; four optional motion studies remain linked at \`/labs/rift-showcase.html\`.

To capture evidence (in another terminal with the server running):

\`\`\`sh
cd ~/Downloads/Dharaksh_Portfolio
npm install
npx playwright install chromium
npm run test:rift-home
\`\`\`

Outputs: \`screenshots/rift-home/\` screenshots, video recordings and \`report.json\`.

## Acceptance before merge or deployment

1. On 1440x900 and 390x844, the entire name is readable on the opening frame without horizontal clipping.
2. Name remains visible during the fracture and only fades during the final cream handoff.
3. Handoff text is readable at the end of the scroll, followed immediately by three linked case studies. No blank cream screen.
4. Scroll backward restores the initial composition with no accumulating rotations or geometry jumps.
5. The existing main navigation, mobile menu, Kio tour, global motion switch, and project case studies remain functional.
6. Motion off and \`prefers-reduced-motion\` never force an extended empty scrolling experience.
7. Verify local Three.js files load with HTTP 200 and WebGL actually initializes. If not, inspect the fallback separately.
8. Review desktop and real physical mobile captures for performance, text overlap, portal quality, shadow artifacts, and battery usage.
9. Run existing regression suites, link checking, accessibility audits and keyboard-only walkthrough.
10. Check that optional exploration compass and Kio never obscure important links or form controls.

## Not yet verified

- Actual browser screenshots and video recordings on the user's Mac.
- Measured FPS, GPU frame time, battery impact, and physical mobile performance.
- Cross-browser WebGL behavior (Safari, Firefox).
- Accessibility audit with screen reader and keyboard.
- Production deployment and DNS/CDN performance.

Do not call the implementation “finished”, “AAA” or “₹5 lakh quality” until the above is tested and the visual results are approved.

## Next high-value design/engineering backlog

**P0 — Release blockers:** real-device QA; WebGL fallback; scroll/anchor correctness; responsive type; Kio overlays; keyboard focus; contrast; Lighthouse/Core Web Vitals; broken-link audit; resource disposal and context-loss recovery.

**P1 — Portfolio quality:** project-card imagery and actual evidence; consistency across 12 case studies; proof screenshots and measurable outcomes; information architecture and section length; typography scale; transition continuity; search/navigation clarity; case-study CTA hierarchy; conversion/contact flow.

**P2 — Premium details:** cursor easing refinements; purposeful sound opt-in (if ever); project-card preview transitions; subtle page transitions; contextual section guide microcopy; precise lighting art direction; hero-to-project material continuity; responsive motion variants; optional guided story mode.

**P3 — Avoid unless evidence warrants:** 4 simultaneous live 3D engines; aggressive cursor replacement; autoplay audio; particles everywhere; excessive scroll-jacking; broad framework migration; performance-costly bloom without visual benefit.
