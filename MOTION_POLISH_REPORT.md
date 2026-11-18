# Portfolio motion and Kio polish

The existing portfolio now shares motion timing, easing, entrance distances and motion preferences across its main page and all twelve case studies. Horizontal entrances, restrained zoom/blur reveals and SVG path drawing reverse as content leaves the viewport. Keyboard focus reveals its destination immediately. Hero layers and project artwork use separate parallax transforms, while the existing Universe retains its camera choreography and touch orbit controls.

The shared policy persists the visitor’s motion-off choice across navigation and reloads and respects the operating-system reduced-motion preference. Decorative animations cancel when motion is disabled. The main and case-study splash layers are suppressed. The old timed navigation fade, duplicate reveal observers, duplicate card tilt handlers and continuously scheduled cursor-follow loop were removed.

Project visuals and titles have matching native View Transition names on both routes. Navigation proceeds immediately through the normal document route. Browser events handle skipped transitions, and Back restores focus to the project’s case-study control. The regression suite confirms that the forward native transition reaches its ready state, then deliberately interrupts it with Back. Chromium can report its own skipped-animation cancellation during that interruption. The test records that specific native outcome separately and verifies successful navigation, restored focus and absence of other errors.

Kio opens as an inline guide in the section being discussed. This layout choice reserves document space for the character, guidance and controls. Compact sizing adapts to narrow screens, and the header GUIDE control provides access throughout the page. Existing stored hide and compact preferences remain compatible, and closing the guide records its minimized preference. Closing or hiding restores focus to the opener. Tour navigation relocates the panel into the chosen section, and manual scrolling interrupts the tour and clears target highlighting. Project focus and Universe district selection supply relevant guidance and brief pointing gestures. Coordinated head and hand motion replaces overlapping body gestures.

The inline guide uses the document scroll instead of a nested panel scroller. This keeps its close control, explanation and tour navigation in the document flow. All original project narratives, result caveats, media provenance and Metro privacy restrictions are retained.

## Validation

Run the following commands from the workspace root.

```sh
npm ci
npx playwright install chromium
npm run test:motion
npm run test:universe
npm test
```

An existing Chromium executable can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. The browser suites serve real HTML routes from localhost and block external requests.

On 19 November 2026, Chromium 156.0.8078.4 produced the following results.

- Motion and navigation passed 10/10 checks. Coverage includes reversible entrances, native transition readiness, immediate Back interruption, persisted motion settings, reduced motion, reversible SVG drawing, Kio layout and focus at 390px and 1440px, hide/compact/minimize preferences, touch navigation, section deep links, tour interruption, contextual guidance and all twelve project routes.
- Existing case studies passed 60/60 checks for responsive galleries, keyboard lightboxes, media loading and failure handling.
- Existing Universe passed 31/31 checks, including responsive rendering, touch orbit, camera movement, context loss and restoration, idle behavior and Kio preferences.
- Total result was 101 passed and zero failed checks. The browser’s specific immediate-Back transition cancellation is retained in the motion result JSON as an expected interruption outcome.
- Node syntax checks passed for all changed JavaScript files.

Raw results are in `test-results/motion/results.json`, `test-results/cases/results.json` and `test-results/universe/results.json`. Kio screenshots at both tested widths are in `test-results/motion/`. Desktop and mobile screenshots were visually inspected to verify guide sizing and separation from project controls.

Testing uses desktop Chromium with touch emulation. Physical mobile devices, Safari and assistive technologies require separate verification. The local preview is available at `http://127.0.0.1:4173/`. The workspace has no configured Git repository.
