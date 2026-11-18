# Dharaksh Kataria — V8 Engineering Universe

An editorial portfolio with an original explorable 3D technical world, responsive case-study routes, project-specific animated technical models, Kio companion, and optional sound/haptic effects.

## Start

```bash
cd site
python3 -m http.server 4173
```

Open **http://localhost:4173** (important: navigate via a server, not `file://`, when testing cross-document navigation and media).

- Main page: `/`
- Interactive 3D world: `/#universe`
- A case study: `/projects/srmedu.html`
- Private game story: `/projects/metro.html` (no game site/repository URL)

All core 3D and animation code is self-contained and does not require npm or a CDN at runtime. Google Fonts load if an internet connection is available; system-font fallbacks exist.

For Universe controls, rendering measurements and repeatable scene tests, see `ENGINEERING_UNIVERSE_REPORT.md`. Motion behavior, Kio layout and navigation checks are documented in `MOTION_POLISH_REPORT.md`.

## Delivered features

1. **Four-district, interactive 3D world**: Learning, Collaboration, AI Research, and 3D Creation. WebGL2 renderer with software-perspective 3D fallback; pointer/touch orbit, scroll zoom, keyboard focus, section inspector and direct case-study links.
2. **12 distinct HTML project pages**: six featured and six supporting projects, each with challenge, implementation, architectural model, technical evidence, appropriate caveats, direct known links, and previous/next navigation.
3. **Transitions**: cross-document View Transitions API where available; graceful fade otherwise, shorter intro, scroll entrance choreography, project-card interaction, micro-feedback and dedicated case-stage animation.
4. **Kio**: 216×280 CSS px desktop in balanced mode, with compact/dismiss controls and persisted preference. World-guide stop, project-focused gestures, accessibility support.
5. **Project-specific 3D models**: original explanatory geometry on case-study pages, draggable and pausable. These are *not* screenshots of the real applications.
6. **Opt-in audio/haptics**: short stereo-positioned Web Audio synthesizer chimes on district focus, and `navigator.vibrate` only where supported and explicitly enabled. Nothing autoplays.
7. **12 social cards**: original 1200×630 PNG illustrations; `scripts/prepare_deploy.py` sets correct absolute canonical/OG URLs once a real deployment domain is known.
8. **Privacy**: Metro Runner's game URL and repo are absent from the portfolio and the included résumé's game-specific hyperlink was removed.

## Authentic case-study media

The 12 case studies include responsive galleries, accessible keyboard lightboxes, optional videos, project-specific component diagrams and explicit engineering considerations. Six public applications have 11 genuine screenshots and five short silent interface walkthroughs captured from the existing authorized public links. Captions record sources and capture dates.

Approved owner evidence remains pending for six projects, including Metro Runner gameplay. Authenticated workflows also require approved owner captures. The full inventory, verification limits and registration process are documented in `site/assets/media/README.md`. Repeatable browser test commands are in `site/projects/README.md`.

## Social previews and deployment

After deploying to your own Vercel/Netlify domain, run:

```bash
python3 scripts/prepare_deploy.py --origin https://YOUR-ACTUAL-DOMAIN.com
```

Use your actual HTTPS origin; the script patches canonical URLs, `og:url`, `og:image`, and `twitter:image` in 13 HTML pages. Deploy the resulting `site/` folder. Test the previews in social sharing tools after deployment. **Do not publish unpatched relative social image metadata and assume it will work on all social networks.**

## Known limitations

- Public-interface captures cover six products. Approved media for the other six projects and authenticated workflows remains pending, including Metro Runner gameplay.
- Some public products block iframe embedding. The standalone external link is always available.
- Production Lighthouse results, macOS Safari behavior, mobile GPU WebGL and real-device haptics have not been independently measured.
- Isolated Chromium tested the software-rendered 3D fallback, not the actual WebGL2 GPU path, because browser security policy blocks local navigation/GL contexts in the test environment.
- Statistics remain attributed to documented reporting windows and are not represented as independent new measurements.
