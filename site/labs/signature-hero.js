import * as THREE from './vendor/three.module.min.js';

const canvas = document.querySelector('#sculpture');
const motionButton = document.querySelector('#motion');
const motionAction = document.querySelector('#motion-action');
const motionLabel = document.querySelector('#motion-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const forcedStatic = new URLSearchParams(location.search).get('motion') === 'off';
let motionReduced = reducedMotion.matches;
let userPaused = false;
let paused = motionReduced || forcedStatic;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' });
} catch (error) {
  document.querySelector('#unavailable').hidden = false;
  motionButton.disabled = true;
  motionLabel.textContent = 'WebGL unavailable';
  throw error;
}

renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
const sculpture = new THREE.Group();
scene.add(sculpture);

// The reflection rig is baked once. Large softboxes shape the broad highlights,
// narrow strips define the folded edges, and dark gaps preserve the curvature.
const studio = new THREE.Scene();
studio.background = new THREE.Color(0x303338);
const panelGeometry = new THREE.PlaneGeometry(1, 1);
function softbox(color, intensity, position, size, target = [0, 0, 0]) {
  const panel = new THREE.Mesh(panelGeometry, new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide,
  }));
  panel.position.set(...position);
  panel.scale.set(...size, 1);
  panel.lookAt(...target);
  studio.add(panel);
}
softbox('#fff5df', 5, [-3, 5, 3], [4, 5]);
softbox('#e2edff', 3, [4, 2, -1], [2, 6]);
softbox('#ffffff', 5, [-4, 0, -3], [1.2, 5]);
softbox('#edcfae', 2.4, [1, -3, 2], [4, 1.4]);
softbox('#ffffff', 3, [0, 1, 5], [.6, 4]);
softbox('#d3d7c8', .65, [-1, -1, 4], [3, 2]);
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = pmrem.fromScene(studio, .025, .1, 30, { size: 512 });
scene.environment = environment.texture;
pmrem.dispose();
studio.traverse(object => { object.material?.dispose(); });
panelGeometry.dispose();

const key = new THREE.DirectionalLight('#fff2d9', 2.5);
key.position.set(-3, 5, 5);
scene.add(key);
const rim = new THREE.DirectionalLight('#b7c8df', 1.5);
rim.position.set(4, 1, -3);
scene.add(rim);

// A closed, lens-section membrane. The centerline, width, cup and roll are
// individually art-directed. It has neither a circular section nor a knot path.
const knots = [
  // x, y, z, half-width, roll, cup
  [-1.72, -1.15, .45, .018, -.7, .06],
  [-1.58, -.61, .24, .38, -.5, .16],
  [-1.59, .38, -.1, .61, -.15, .22],
  [-.98, 1.47, -.42, .74, .2, .34],
  [.17, 1.89, -.36, .65, .65, .32],
  [1.26, 1.48, -.05, .57, 1.1, .31],
  [1.48, .68, .43, .5, 1.5, .26],
  [.83, .1, 1.02, .72, 2.15, .28],
  [-.35, -.42, .9, .46, 2.65, .2],
  [-.25, -1.2, .36, .42, 3.1, .2],
  [.62, -1.6, -.1, .46, 3.4, .2],
  [1.41, -1.28, -.13, .32, 4.1, .16],
  [1.94, -.72, .03, .008, 4.4, .02],
];
const centerline = new THREE.CatmullRomCurve3(knots.map(knot => new THREE.Vector3(...knot.slice(0, 3))), false, 'centripetal');
const sections = 256;
const perimeter = 64;
const positions = [];
const colors = [];
const indices = [];
const silver = new THREE.Color('#dce1df');
const champagne = new THREE.Color('#ded0af');
const copper = new THREE.Color('#be7650');
function profile(t, column) {
  const scaled = t * (knots.length - 1);
  const index = Math.min(knots.length - 2, Math.floor(scaled));
  const fraction = scaled - index;
  const p0 = knots[Math.max(0, index - 1)][column];
  const p1 = knots[index][column];
  const p2 = knots[index + 1][column];
  const p3 = knots[Math.min(knots.length - 1, index + 2)][column];
  return .5 * ((2 * p1) + (-p0 + p2) * fraction +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * fraction ** 2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * fraction ** 3);
}
for (let i = 0; i <= sections; i++) {
  const t = i / sections;
  const point = centerline.getPoint(t);
  const tangent = centerline.getTangent(t);
  const lateral = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
  const normal = new THREE.Vector3().crossVectors(tangent, lateral).normalize();
  const roll = profile(t, 4);
  const side = lateral.clone().multiplyScalar(Math.cos(roll)).addScaledVector(normal, Math.sin(roll));
  const depth = normal.clone().multiplyScalar(Math.cos(roll)).addScaledVector(lateral, -Math.sin(roll));
  const width = Math.max(.007, profile(t, 3));
  const cup = profile(t, 5);
  const thickness = Math.min(.026 + width * .085, width * .3);
  for (let j = 0; j <= perimeter; j++) {
    const angle = j / perimeter * Math.PI * 2;
    const across = Math.cos(angle);
    const face = Math.sin(angle);
    const fold = cup * (across ** 2 - .35) + .045 * Math.sin(across * Math.PI + t * 9);
    const vertex = point.clone().addScaledVector(side, width * across)
      .addScaledVector(depth, fold + thickness * face);
    positions.push(vertex.x, vertex.y, vertex.z);
    const warmth = THREE.MathUtils.smoothstep(t, .39, .77);
    const inner = THREE.MathUtils.smoothstep(-face, -.15, .85);
    const color = silver.clone().lerp(champagne, .3 + .35 * warmth)
      .lerp(copper, warmth * inner * .86);
    colors.push(color.r, color.g, color.b);
    if (i < sections && j < perimeter) {
      const a = i * (perimeter + 1) + j;
      const b = a + perimeter + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
}
// Seal both tapered tips to make a complete solid with outward-facing normals.
for (const end of [0, sections]) {
  const first = end * (perimeter + 1);
  const center = new THREE.Vector3();
  for (let j = 0; j < perimeter; j++) {
    center.add(new THREE.Vector3().fromArray(positions, (first + j) * 3));
  }
  center.divideScalar(perimeter);
  const cap = positions.length / 3;
  positions.push(center.x, center.y, center.z);
  colors.push(...colors.slice(first * 3, first * 3 + 3));
  for (let j = 0; j < perimeter; j++) {
    if (end === 0) indices.push(cap, first + j + 1, first + j);
    else indices.push(cap, first + j, first + j + 1);
  }
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals();

// Weld only the duplicated circumference normals. Keeping the longitudinal
// samples separate preserves the hand-shaped silhouette and the thin lip.
const normals = geometry.attributes.normal;
for (let i = 0; i <= sections; i++) {
  const first = i * (perimeter + 1);
  const last = first + perimeter;
  const normal = new THREE.Vector3().fromBufferAttribute(normals, first)
    .add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
  normals.setXYZ(first, normal.x, normal.y, normal.z);
  normals.setXYZ(last, normal.x, normal.y, normal.z);
}

const material = new THREE.MeshPhysicalMaterial({
  metalness: 1, roughness: .22, vertexColors: true,
  clearcoat: .25, clearcoatRoughness: .22, envMapIntensity: 1.2,
});
// Broad elastic deformation happens in object space. Its Jacobian transports
// normals as well, so reflections remain attached to the changing curvature.
const uniforms = { time: { value: 0 } };
material.onBeforeCompile = shader => {
  shader.uniforms.uSculptureTime = uniforms.time;
  shader.vertexShader = 'uniform float uSculptureTime;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
    #include <beginnormal_vertex>
    float breathe = sin(uSculptureTime * .24) * .055;
    float bend = sin(uSculptureTime * .17) * .045;
    objectNormal = normalize(vec3(objectNormal.x, objectNormal.y -
      objectNormal.x * breathe * cos(position.y * 1.3) * 1.3 -
      objectNormal.z * bend * position.y * 2.0, objectNormal.z));
  `);
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    transformed.x += breathe * sin(position.y * 1.3);
    transformed.z += bend * position.y * position.y;
  `);
};
sculpture.add(new THREE.Mesh(geometry, material));
sculpture.rotation.set(-.12, -.24, .18);

let frame = 0;
let lastTime = 0;
let elapsed = 0;
let visible = true;
let pointerX = 0;
let pointerY = 0;
let smoothX = 0;
let smoothY = 0;
let renderCount = 0;
const cameraTarget = new THREE.Vector3(0, .12, 0);

function draw(delta = 0) {
  const easing = 1 - Math.exp(-delta * 3);
  smoothX += (pointerX - smoothX) * easing;
  smoothY += (pointerY - smoothY) * easing;
  uniforms.time.value = elapsed;
  sculpture.rotation.y = -.24 + Math.sin(elapsed * .13) * .085 + smoothX * .075;
  sculpture.rotation.x = -.12 + Math.sin(elapsed * .11) * .035 + smoothY * .045;
  sculpture.position.y = Math.sin(elapsed * .19) * .035;
  camera.position.x = Math.sin(elapsed * .09) * .1;
  camera.lookAt(cameraTarget);
  renderer.render(scene, camera);
  renderCount++;
}
function animate(now) {
  frame = 0;
  if (paused || !visible || document.hidden) return;
  const delta = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
  lastTime = now;
  elapsed += delta;
  draw(delta);
  frame = requestAnimationFrame(animate);
}
function schedule() {
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  if (!paused && visible && !document.hidden) frame = requestAnimationFrame(animate);
}
function resize() {
  const bounds = canvas.getBoundingClientRect();
  renderer.setSize(bounds.width, bounds.height, false);
  camera.aspect = bounds.width / bounds.height;
  // Fit the full sculpture by both axes, including the kinetic envelope.
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  camera.position.z = Math.max(5.45 / camera.aspect, 5.1) / (2 * Math.tan(verticalFov / 2));
  camera.updateProjectionMatrix();
  draw();
}
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  schedule();
}).observe(canvas);
canvas.addEventListener('pointermove', event => {
  if (paused || event.pointerType === 'touch') return;
  const bounds = canvas.getBoundingClientRect();
  pointerX = (event.clientX - bounds.left) / bounds.width - .5;
  pointerY = (event.clientY - bounds.top) / bounds.height - .5;
}, { passive: true });
canvas.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
document.addEventListener('visibilitychange', schedule);

function updateControls() {
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Resume sculpture animation' : 'Pause sculpture animation');
  motionAction.textContent = paused ? 'Resume' : 'Pause';
  motionLabel.textContent = paused ? 'A moment held' : 'Slowly becoming';
  motionButton.disabled = motionReduced || forcedStatic;
  if (motionButton.disabled) {
    motionAction.textContent = 'Still';
    motionButton.setAttribute('aria-label', 'Static sculpture, motion disabled');
  }
}
motionButton.addEventListener('click', () => {
  userPaused = !userPaused;
  paused = userPaused || motionReduced || forcedStatic;
  updateControls();
  schedule();
});
reducedMotion.addEventListener('change', event => {
  motionReduced = event.matches;
  paused = userPaused || motionReduced || forcedStatic;
  if (paused) {
    elapsed = 0;
    pointerX = pointerY = smoothX = smoothY = 0;
    draw();
  }
  updateControls();
  schedule();
});

// Read-only diagnostics for the local acceptance capture, with no timers,
// overlays or sample collection in the normal viewing path.
window.signatureHero = {
  get state() {
    return {
      ready: true, paused, reducedMotion: motionReduced,
      elapsed, renderCount, triangles: renderer.info.render.triangles,
      drawCalls: renderer.info.render.calls, pixelRatio: renderer.getPixelRatio(),
      buffer: [canvas.width, canvas.height], threeRevision: THREE.REVISION,
    };
  },
};
updateControls();
resize();
schedule();
