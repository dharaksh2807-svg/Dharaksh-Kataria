# THE RIFT — DIRECTOR'S CUT (V9.2)

**Status:** Preview-only on `feat/v8-technical-showcases`. NOT merged or deployed.

## The experience

The approved Rift layout, typography, copper/champagne palette and links are preserved in `site/labs/rift-directors-cut.html`. This is a single unified direction, not another four-way experiment.

### Implemented motion and visual systems

1. **Real 3D portal:** eleven beveled octagonal architectural frames built using Three.js ExtrudeGeometry with depth and double-sided metal materials.
2. **Clockwise portal transformation:** every frame rotates clockwise with distinct offsets as scroll increases; opposing Y rotations and per-ring compression create a spatial twist. Idle drift is deliberately restrained.
3. **Metal material:** MeshPhysicalMaterial and procedural studio environment-map reflections, with moving directional/point lights and atmospheric fog. These are actual PBR calculations, not a claim of photorealistic raytracing or measured GPU quality.
4. **Fracture/reassembly:** four independent beveled segment meshes split in X/Y/Z with different turns and rejoin deterministically on the scroll timeline.
5. **SUBSTANCE typography:** a huge masked HTML typography layer plus a depth-tested 3D text plane inside the portal. The camera advances through that plane near the end of the sequence.
6. **Real camera fly-through:** the Three.js perspective camera moves along the tunnel, changes its aim, and rolls clockwise; not merely CSS zoom.
7. **Interaction:** pointer parallax, cursor-reactive key light, magnetic CTA microinteraction and scroll-linked light shafts.
8. **Handoff:** light opening expands into a cream-colored preview of selected work; preview cards reveal and respond to hover. All project cards link to the existing portfolio's `#work` section. Existing project pages are unchanged.
9. **Resilience:** on missing WebGL/Three.js, the approved original CSS Rift remains visible. Reduced-motion users get the static composition. Pause/resume, offscreen/hidden-tab pausing, capped DPR, and WebGL resource cleanup are included.

### Not implemented (intentionally)

- Cursor trails, particle explosions or automatic full rotations.
- Autoplay background music.
- Production project-card transitions (only preview handoff cards are built).
- Full physically based raytracing, real-time soft shadows, or costly postprocessing chains; none should be claimed.

### Dependencies

First tries the previously vendored files under `site/labs/vendor/three.module.min.js` (and its companion `three.core.min.js`). The vendor files exist in the local Mac Molt prototype but **are not committed to this feature branch**. If they are missing, the module attempts pinned Three.js r182 via jsDelivr, requiring internet access. If both fail, the static/CSS fallback renders.

**Before production integration:** self-host a licensed, verified Three.js build and include its notices so previews work without a CDN.

## Local preview on Mac

```sh
cd ~/Downloads/Dharaksh_Portfolio
git switch feat/v8-technical-showcases
git pull --ff-only origin feat/v8-technical-showcases
python3 -m http.server 4173 --directory site
```

Open `http://127.0.0.1:4173/labs/rift-directors-cut.html`.

Use the mouse and scroll forward, then backwards, then test Pause motion. Compare with `/labs/v9-the-rift.html`.

## Automated captures on Mac

With the server running:

```sh
cd ~/Downloads/Dharaksh_Portfolio
npm install
npx playwright install chromium
node scripts/capture_rift_directors_cut.cjs
```

Evidence outputs under `screenshots/rift-directors-cut/`: desktop/mobile screenshots, scroll-stage captures (43/53/81/94%), reduced-motion screenshot, entrance/scroll videos, report.json.

**This authoring environment has not run these browser tests.** JavaScript source syntax can be validated without a GPU, but material/reflection/animation quality and frame rate must be assessed from real render captures.

Mobile Playwright tests are viewport emulation, not physical-device validation. RAF frame intervals are not GPU timings.

## Human acceptance checklist

- Initial screenshot must retain readability and composition of the approved Rift.
- Rings should visibly rotate clockwise; the 3D depth must be obvious.
- Distinctive fracture should reassemble predictably when reversing scroll.
- SUBSTANCE should feel integrated but must not obscure the name.
- Camera should pass through portal geometry/3D text without clipping flashes or visually broken frames.
- Final scroll should visually connect with the warm projects section.
- Reduced-motion fallback and keyboard navigation must work.
- Check with Chrome on actual Mac and at least one physical phone before homepage integration.

**Do not merge or replace the production homepage until visuals and animation recordings are approved.**
