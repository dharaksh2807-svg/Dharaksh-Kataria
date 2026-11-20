# Local Rift homepage repair

## Root cause established before edits

On 20 November 2026, the working directory was `/Users/dharaksh/Downloads/Dharaksh_Portfolio`, checked out on `feat/v8-technical-showcases` at `e10115728c86d02523346dd48b0caf10a86b591d`. Remote `main` and remote HEAD were both `6a8c92fb88e4f99666e9dc1e63a28eab36913dcf`. Remote main already contained the integrated Rift homepage. The local feature branch still contained the sculpture homepage.

Python PID 21947 was running `python -m http.server 4173 --directory site` with this repository as its working directory. Port 4173 therefore served this checkout's `site` directory. The SHA-256 of both `site/index.html` and the HTTP response from `/index.html` was `afd7e1ce52e51e7a353b9220ec5202585934b1d0eca3aa62cbad79000d6365de`.

A fresh Chromium session on the actual homepage found `#heroArt`, `#sculptureCanvas` and the `hero.js` script, with no `#riftCanvas`. It reported no JavaScript errors, no service-worker registrations and no Cache Storage entries. The sole listener on port 4173 was the Python server above. A second Python server listened on 8080 and did not serve the target port. The old response itself explains the sculpture. The Rift dependencies were absent from that response.

## Checkout and work preservation

Created `codex/rift-home-integration` from remote main in the existing serving checkout. This brings in the completed homepage integration and local Three.js dependencies. The Python process continues serving the same directory.

Preserved all prior uncommitted work in the stash named `Preserve local signature hero work before Rift homepage integration`. Restored the modified `site/hero.js`, modified `site/immersive.js`, signature hero files and screenshots to the working directory. Existing vendored Three.js files use main's tracked versions, with the original local copies retained in the stash. These user changes are excluded from this repair commit.

## Repair changes

- `site/labs/rift-directors-cut.js` keeps the complete name fully visible through 88.9% of cinematic scroll. At 89%, it replaces the opening with real project previews and their existing case-study destinations, using one reversible scroll-derived state. Project images load eagerly. The final frame reuses the existing bridge cards. Portal transforms remain assigned from scroll progress in the existing single renderer. The mobile camera centers and scales the portal to fit between the controls and typography.
- `site/rift-home.css` reserves room beside Kio for the visible Skip Experience action. It sizes the final project previews for desktop and mobile, keeps the guide below the header and prevents its margin from exposing the page background behind navigation.
- `scripts/qa_rift_home.cjs` extends the existing browser acceptance checks with legacy-hero absence, mandatory WebGL initialization, screenshots of all five modes during transformation, frame-boundary content assertions, reverse screenshots, Skip Experience, Kio, search, desktop/mobile navigation, an actual case-study visit with Back navigation and a cache-bypassing reload of `/`.

The final project reveal is a deliberate immediate cut at the end of the camera travel. The name and incoming project copy have separate visible states, eliminating the previous overlapping crossfade and washed-out typography.

## Browser evidence

All homepage screenshots below come from `http://127.0.0.1:4173/index.html` or its equivalent root `/`. The standalone preview regression is separately named and is additional coverage.

- `screenshots/rift-home/desktop-opening.png` at 1440 × 900
- `screenshots/rift-home/mobile-opening.png` at 390 × 844, device scale factor 2
- `screenshots/rift-home/scroll-35.png` for early scroll
- `screenshots/rift-home/scroll-53.png` for fracture
- `screenshots/rift-home/scroll-70.png` for mid-transition
- `screenshots/rift-home/scroll-82.png` for portal travel with readable name
- `screenshots/rift-home/scroll-93.png` for the immediate project reveal
- `screenshots/rift-home/reverse-fracture.png` and `reverse-opening.png`
- `screenshots/rift-home/mobile-final-reveal.png` and `mobile-reverse.png`
- `screenshots/rift-home/reduced-motion.png`
- `screenshots/rift-home/root-hard-reload.png`
- `screenshots/rift-home/mode-*.png` for all five selectable modes

Browser tests use Chromium viewport emulation. Mobile screenshots are not physical-device testing. Videos are retained locally in the same evidence directory. Browser result details are in `screenshots/rift-home/report.json`.

## Verification

- `npm test` passed 60/60 case-study checks.
- `npm run test:motion` passed 10/10 checks.
- `npm run test:universe` passed 31/31 checks.
- `npm run test:upgrades` passed 20 checks.
- `npm run test:rift-home` passed expanded desktop, mobile, five-mode, reduced-motion, hard-reload, project-reveal and reverse-scroll checks with zero browser errors and zero warnings.

## Preview

Open `http://127.0.0.1:4173/` or `http://127.0.0.1:4173/index.html`.
