# Portfolio V8 — Interactive Engineering Showcase Enhancement

Branch: `feat/v8-technical-showcases`
Base: `main` (5a5a51c1dd06)
Status: **Implemented in source; runtime validation on an actual browser is still required.**

## Implemented without rebuilding Phases 1–4

- **Architecture explorer:** SRMedu and ProjectMatch case studies now include an interactive, keyboard-clickable component/dependency explorer with documented responsibilities and relationships. Existing static diagrams remain. The descriptions are intentionally framed as documented high-level architecture, not independently verified live topology.
- **KV experiment:** Corrected held-out 60-question comparison of full vs compressed retained KV (42.53 MiB / 7.11 MiB) and recall (83.3% / 80.0%). The user can switch between the two real reported measures. No fabricated budget sweep, exact latency or peak-RAM savings.
- **Twelve case-study chapter navigators:** Sticky 7-chapter links and real scroll-position progress, with keyboard anchors and CSS reduced-motion handling.
- **3D world continuity:** Saved district, selected conceptual object and camera yaw/pitch/zoom before following a project story. Restores on back or explicit return-to-world anchor, retaining ordinary native navigation and a safe state validator.
- **Custom accessible 404** at `site/404.html`.
- **Deployment readiness:** `scripts/prepare_deploy.py --origin https://REAL-DOMAIN` now produces a sitemap and robots reference, patches canonical/OG URLs idempotently, and preserves 13 routed pages.
- **Test source:** `npm run test:upgrades` checks all chapter navigators, explorers, two-metric research chart, world-state restoration and 404.

## Existing Phase 1–4 systems preserved

No replacement of original case studies, galleries, hero art, WebGL renderer, Kio, motion policy, keyboard links or responsive layouts. Existing 11 registered public UI screenshots and 5 short clips are retained.

## Deliberately unfinished because real assets or environment access are required

1. **Owner-approved Metro Runner gameplay** and screenshots (game source remains private, with no deployed public game link).
2. **Deeper authenticated SRMedu, ProjectMatch and OODP demonstrations**, plus artifacts for FairShift, Regula, ReValue and other projects. No synthetic screenshots.
3. **Before/after development history and process galleries:** the shared case-study module supports optional owner-approved process media through `window.V8_PROCESS_MEDIA`, but no development media or fabricated historic improvements were inserted.
4. **KV multi-budget/method/latency plot:** Only the reported corrected point is included; other series remain unavailable until corrected benchmark exports with provenance are supplied.
5. **Human visual refinements:** Requires screenshots of the upgraded pages viewed in the actual browser, preferably desktop and mobile.
6. **Real-device/performance/accessibility QA:** Physical Safari/Android, sustained rendering, screen-reader and field Web Vitals not verified.
7. **Production domain:** No domain assumed; run the deploy-preparation script with the actual HTTPS domain only when ready.

## Validation performed here

- JavaScript was syntax-parsed during creation of the shared case-study module and browser regression test script.
- GitHub connector returned success for creating/updating source files on the separate feature branch.
- **Not performed:** local browser run, Playwright suite execution, CSS screenshots, GitHub Actions or deployment.
- Historical 101/101 tests from prior phases **cannot be re-applied automatically** to this new branch.

## Required on the user's Mac

```sh
git fetch origin
git switch feat/v8-technical-showcases
npm ci
npx playwright install chromium
npm run test:upgrades
npm run test:motion
npm run test:universe
npm test
python3 -m http.server 4173 --directory site
```

Inspect `http://localhost:4173/projects/srmedu.html`, `/projects/projectmatch.html`, `/projects/kv.html`, then `/#universe`. Compare layouts at mobile and desktop widths before merging. Do not deploy automatically.

## Suggested owner captures

- SRMedu: a complete PYQ/MCQ study workflow, notes download, AI tutor or compiler, appropriately sanitized.
- ProjectMatch: sanitized authenticated matching, role application, messaging and team formation.
- OODP: code explanation, C++ compilation and solved PYQ.
- Metro Runner: approved 15–30 second gameplay highlighting three-lane movement, moving trains and rooftop traversal; remove debug overlays/private paths.
- KV: corrected machine-readable results with model, contexts, budgets, seed, recall, retained MiB, latency and source audit notes.
- Development history: real commit-linked screenshots, actual failed-to-fixed issues, date/measurement references.

## Constraints

Never expose a private Metro repository URL or fabricate game deployment, project performance results or historic artifacts. Do not merge based solely on the new test source.