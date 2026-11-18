# Portfolio V7 — Award-Winning Reference Study and Prioritized Roadmap

Prepared 18 November 2026. These are design references, not evidence that this portfolio has won an award, been deployed, or achieved the same performance. References are for analysis; do not copy their proprietary art, code, character design, or layouts.

## Selected external references

| Reference | What stands out | What could transfer to Dharaksh's portfolio |
|---|---|---|
| [Bruno Simon](https://bruno-simon.com/) / [2026 project analysis](https://rickcreates.com/r/2026-01-21-brunos-portfolio) | Coherent, navigable 3D world, visitor agency, visual identity | Make a separate **optional** interactive world; retain the immediately accessible ordinary portfolio |
| [Mathias Adolfsson 2026](https://tympanus.net/codrops/2026/11/05/mathias-adolfsson-portfolio/) | Project carousel flowing into a gallery; 3D is tied to work selection | Smooth project-card → case-study **shared-element transition** |
| [Stefan Vitasović 2025](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/) | Distinct typography, custom shader visual treatment, coordinated scroll | Reduce unrelated flourishes; choreograph page flow as one story |
| [Stas Bondar 2025](https://tympanus.net/codrops/2025/03/25/stas-bondar-25-the-code-techniques-behind-a-next-level-portfolio/) | 3D card response and separate scroll dynamics | One memorable project interaction at a time; avoid uniformly wobbling everything |
| [Podium 2026](https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/) | Story, rhythm and deliberate motion constraints | Let meaningful project content determine motion rather than effects determine content |
| [Tomasz Szmajda 2026](https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/) | 3D corridors made from simple, authored geometry | Achieve distinction from art direction, not expensive photoreal assets |

## My high-priority recommendations

### P0 — Evidence and usable design, before new spectacle
1. **Real project capture system.** For SRMedu, ProjectMatch and OODP Mastery use original high-resolution screenshots plus contextual captions; show a verified screen, what technical obstacle it solves, and link to the real product. Add Metro Runner gameplay footage **without** exposing its source or playable-site URL. Avoid unrelated generative concept art presented as real screens.
2. **Shareable full case-study pages.** V6 currently uses `?project=...` to open a modal. The next substantive upgrade should be canonical HTML routes (or framework routing) with direct OpenGraph previews per flagship project, proper browser back, readable architecture diagrams, screenshots, honest limitations and results.
3. **Accessible Kio.** Keep default balanced size as V7, compact/hide preferences, user-controlled tour, no automatic pop-up, no navigation interception, and no occlusion of project CTAs.
4. **Live performance and devices.** On actual deployment measure LCP/INP/CLS and test keyboard, screen readers, 320 px Android, physical iOS Safari, GPU context loss and battery/performance under sustained scrolling. Treat '60 FPS' as an objective to *measure*, not a promise.
5. **Proof and credential hygiene.** Distinguish self-reported GA4 metrics from externally verified benchmarks. Keep authentic certificate URLs; do not claim proposed prototype architecture as production.

### P1 — One memorable, integrated interaction language
6. **Signature 3D portal.** Make a scroll/drag navigable scene that morphs between four *project themes* (Learn → Match → Memory → Create), with a 'Skip 3D / View all projects' control. Start with lightweight geometry before adding high-poly assets. Preserve Metro privacy.
7. **Project-specific cinematic transitions.** Hero enters a moving knowledge network, network becomes team connections, connections fold into KV retention, then a stylized railway horizon. All scenes should share a camera/material/lighting language. Avoid abrupt canvas tearing.
8. **Actual object-based visualization.** The existing Proof Lab is illustrative. Upgrade selected visualizations using measured datasets or precisely documented formulas with source notes; keep its explanatory disclaimers.
9. **Shared element card transitions.** Clicking a card expands its artwork into the project case study. Reverse the same animation on back. Keep the regular link tappable and directly accessible.
10. **Kio as spatial guide.** Optional directional pointing, expressions reflecting current project/section, a 'Show me why this matters' prompt; never fake general AI conversation. A larger desktop character should automatically reduce or hide near content-heavy areas.
11. **Original type/identity system.** More purposeful letter-spacing, graphic patterns, illustration rules, iconography, print-like captions and restrained palette shifts that follow the project disciplines. Do not add random neon color gradients.
12. **Sound only with consent.** Optional tasteful interface earcons and ambient score tied to Web Audio visibility, muted by default, persistent audio preferences. Avoid auto-playing or looping music.

### P2 — Editorial polish and discovery
13. Sticky reading progress for case studies and a 'Back to projects' breadcrumb.
14. Keyboard command menu that searches project titles, technologies, research, credentials and destinations.
15. Small downloadable project briefs or printable case-study PDFs, if their content is complete.
16. Scroll-aware image sequences, used sparingly, for original UI prototypes and authentic gameplay clips; an image/video fallback for weaker devices.
17. A lightweight activity/update log linking real released versions and engineering decisions, not automated filler.
18. Friendly empty states and informative motion-off/low-bandwidth alternatives.
19. Accessibility details: contrast, focus loops in dialogs, non-drag controls for 3D, `prefers-reduced-motion`, and cursor-only effects gated to pointer:fine.
20. Correct social previews: dedicated per-project OpenGraph image with absolute HTTPS URL once the actual domain is chosen. No fabricated domain or metrics.

## Engineering recommendation

Do **not** add every effect. Prioritize: P0 evidence and navigation → one P1 signature spatial experience → disciplined transitions → P2 polish. The existing source already has extensive SVG, WebGL, Canvas and motion systems; new decorative effects have diminishing returns and can hurt comprehension, load time and accessibility.

For a larger interactive build, a reasonable architecture is Three.js/R3F for a single 3D canvas, GSAP/ScrollTrigger for deterministic scroll scenes, and a lean React/Next.js app (or retaining V7's vanilla stack if it continues to be maintainable). A rebuild is only justified if measured complexity or routing requirements demand it.

## Current V7 scope

V7 implements only **the user-requested competition entry removals and Kio readability/size preference changes**. The above features are future suggestions, not claims of existing implementation.
