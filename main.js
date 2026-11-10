import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const CYAN = 0x00e5ff, BLUE = 0x3a7bff, WHITE = 0xfff6e9, BLACK = 0x1a1a1a, WARM = 0xffb347;

// ---------- Renderer / scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3f5);
scene.fog = new THREE.Fog(0x9fd3f5, 40, 140);

const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
const HOME = { pos: new THREE.Vector3(14, 10, 16), target: new THREE.Vector3(0, 1.4, 0) };
camera.position.set(26, 20, 30);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI / 2.15;
controls.target.copy(HOME.target);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.4, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight(0xdff1ff, 0x5a4a30, 1.4));
const moon = new THREE.DirectionalLight(0xfff1d6, 2.2);
moon.position.set(8, 14, 10);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
scene.add(moon);
const stallLight = new THREE.PointLight(WARM, 18, 9, 1.6);
stallLight.position.set(0, 3.1, -0.6);
scene.add(stallLight);

// ---------- Helpers ----------
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, ...o });
const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
const M = {
  black: mat(BLACK, { roughness: 0.8 }),
  dark: mat(0x111823),
  white: mat(WHITE, { roughness: 0.5 }),
  blue: mat(BLUE, { roughness: 0.4 }),
  cyan: mat(CYAN, { roughness: 0.3, metalness: 0.3 }),
  steel: mat(0xcfe8f5, { roughness: 0.2, metalness: 0.9 }),
  glowCyan: glow(CYAN, 2.5),
  glowWhite: glow(WHITE, 1.5),
  wood: mat(0x8b5a2b, { roughness: 0.85 }),
  darkWood: mat(0x5c3a1e, { roughness: 0.9 }),
  earth: mat(0x9c7b5b, { roughness: 1 }),
  granite: mat(0x4a4a4a, { roughness: 0.35 }),
  cream: mat(0xf3e9d2, { roughness: 0.9 }),
  terracotta: mat(0xb5562f, { roughness: 0.9 }),
  red: mat(0xc1272d, { roughness: 0.5 }),
  yellow: mat(0xf2c200, { roughness: 0.5 }),
  green: mat(0x1f7a3a, { roughness: 0.5 }),
  leaf: mat(0x2e7d32, { roughness: 0.7 }),
  marigold: mat(0xff8c1a, { roughness: 0.7, emissive: 0xff8c1a, emissiveIntensity: 0.25 }),
  gold: mat(0xd4af37, { metalness: 1, roughness: 0.25 }),
};

function box(w, h, d, material, x = 0, y = 0, z = 0, parent = scene, r = 0) {
  const g = r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, parent = scene, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ---------- Earth: India map under the island (stall sits on Bengaluru) ----------
const INDIA = [[68.2,23.7],[68.8,24.3],[71.1,24.4],[70.0,26.5],[70.4,28.0],[72.8,29.0],[74.4,30.9],[74.5,32.7],[74.1,34.7],
  [73.7,36.0],[75.5,36.8],[77.8,35.5],[79.5,34.0],[78.9,32.5],[79.2,31.0],[80.3,30.4],[81.1,30.2],[82.0,27.9],[84.0,27.4],
  [85.0,26.9],[86.7,26.5],[88.1,26.4],[88.2,27.9],[88.8,27.3],[89.8,26.7],[92.0,26.8],[94.0,27.6],[95.4,28.3],[97.3,28.0],
  [97.0,27.1],[95.2,26.0],[94.6,24.7],[94.1,23.8],[93.3,24.0],[93.0,22.0],[92.6,21.9],[92.1,23.6],[91.7,22.9],[91.2,23.7],
  [91.9,24.2],[92.4,25.0],[89.8,25.3],[88.5,24.3],[88.7,23.6],[89.0,22.0],[88.9,21.6],[87.0,21.5],[86.5,20.2],[85.0,19.3],
  [84.0,18.3],[82.3,17.0],[82.2,16.5],[80.8,15.9],[80.2,13.8],[80.3,13.0],[79.9,12.0],[79.8,10.3],[79.2,10.3],[78.3,8.9],
  [77.5,8.1],[76.6,8.9],[76.0,10.3],[75.4,11.8],[74.8,12.9],[74.4,14.6],[73.5,16.0],[72.8,19.0],[72.8,20.5],[72.6,21.4],
  [72.0,21.3],[70.9,20.7],[69.0,22.3],[70.0,22.9]];
const MAP = { lon0: 62, lon1: 102, lat0: 4, lat1: 40, size: 240 };      // world units across the map
const BLR = [77.6, 12.97];
const mapTex = canvasTexture(2048, 2048, (ctx, w, h) => {
  const px = ([lon, lat]) => [(lon - MAP.lon0) / (MAP.lon1 - MAP.lon0) * w, (1 - (lat - MAP.lat0) / (MAP.lat1 - MAP.lat0)) * h];
  const sea = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
  sea.addColorStop(0, '#3f8fc4'); sea.addColorStop(1, '#1f5f8f');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, w, h);
  const land = (pts) => { ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](...px(p))); ctx.closePath(); };
  // neighbouring land (rough) so India isn't floating in the sea
  ctx.fillStyle = '#c9b48a';
  land([[60,40],[102,40],[102,22],[97.3,28.0],[95.4,28.3],[88.2,27.9],[80.3,30.4],[74.1,34.7],[70.4,28.0],[68.2,23.7],[60,24]]); ctx.fill();
  land([[89.8,25.3],[92.4,25.0],[92.6,21.9],[89.0,22.0]]); ctx.fill();
  land([[93.0,22.0],[97.0,27.1],[102,22],[102,10],[98,10],[94.5,16.5]]); ctx.fill();
  // India
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#d8c79a'); g.addColorStop(0.35, '#9cba6a'); g.addColorStop(0.7, '#6fa451'); g.addColorStop(1, '#4f8f3d');
  land(INDIA); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#f7f1dd'; ctx.stroke();
  // Sri Lanka
  ctx.beginPath(); const [sx, sy] = px([80.7, 7.8]); ctx.ellipse(sx, sy, 28, 48, 0, 0, Math.PI * 2); ctx.fillStyle = '#5f9a48'; ctx.fill();
  // texture speckle
  for (let i = 0; i < 6000; i++) { ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; ctx.fillRect(Math.random() * w, Math.random() * h, 6, 6); }
  ctx.fillStyle = '#ffffff'; ctx.font = '700 70px Outfit, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('INDIA', ...px([79, 23]));
  ctx.font = 'italic 44px Outfit, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Arabian Sea', ...px([66, 15])); ctx.fillText('Bay of Bengal', ...px([88, 15])); ctx.fillText('Indian Ocean', ...px([80, 5]));
});
const mapPlane = new THREE.Mesh(new THREE.PlaneGeometry(MAP.size, MAP.size), new THREE.MeshStandardMaterial({ map: mapTex, roughness: 1 }));
mapPlane.rotation.x = -Math.PI / 2;
// shift so Bengaluru lands at the origin, under the stall
mapPlane.position.set(
  -((BLR[0] - MAP.lon0) / (MAP.lon1 - MAP.lon0) - 0.5) * MAP.size, -0.75,
  (0.5 - (MAP.lat1 - BLR[1]) / (MAP.lat1 - MAP.lat0)) * MAP.size);
mapPlane.receiveShadow = true;
scene.add(mapPlane);

// soft clouds drifting over the map
const clouds = [];
const cloudMat = mat(0xffffff, { roughness: 1, transparent: true, opacity: 0.9 });
for (let i = 0; i < 9; i++) {
  const c = new THREE.Group();
  for (let j = 0; j < 4; j++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random(), 12, 10), cloudMat);
    puff.position.set(j * 1.3, Math.random() * 0.5, Math.random() - 0.5);
    c.add(puff);
  }
  const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 20;
  c.position.set(Math.cos(a) * r, 8 + Math.random() * 6, Math.sin(a) * r);
  c.scale.y = 0.6;
  scene.add(c);
  clouds.push(c);
}

// ---------- Ground: island + rangoli ----------
box(13, 0.6, 11, M.earth, 0, -0.3, 0, scene, 0.15);
box(13.2, 0.08, 11.2, M.darkWood, 0, -0.62, 0);

const rangoliTex = canvasTexture(1024, 1024, (ctx, w) => {
  const c = w / 2;
  ctx.translate(c, c);
  const ring = (n, r, size, color, petal = true) => {
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.rotate((i / n) * Math.PI * 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      if (petal) {
        ctx.moveTo(0, r - size);
        ctx.quadraticCurveTo(size * 0.6, r, 0, r + size);
        ctx.quadraticCurveTo(-size * 0.6, r, 0, r - size);
      } else ctx.arc(0, r, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
  const circle = (r, color, lw = 0) => {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.stroke(); } else { ctx.fillStyle = color; ctx.fill(); }
  };
  circle(500, '#7a3b1e');
  ring(48, 470, 10, '#ffffff', false);
  ring(24, 400, 60, '#ff8c1a');
  circle(330, '#ffd400', 8);
  ring(16, 270, 60, '#e91e63');
  ring(32, 200, 8, '#ffffff', false);
  ring(8, 130, 70, '#2e9d4a');
  circle(80, '#ffd400');
  circle(40, '#e91e63');
});
const rangoli = new THREE.Mesh(new THREE.CircleGeometry(2, 64),
  new THREE.MeshStandardMaterial({ map: rangoliTex, emissive: 0xffffff, emissiveMap: rangoliTex, emissiveIntensity: 0.1 }));
rangoli.rotation.x = -Math.PI / 2;
rangoli.position.set(0, 0.01, 3);
rangoli.receiveShadow = true;
scene.add(rangoli);


// ---------- The coffee shop (stall) ----------
const stall = new THREE.Group();
scene.add(stall);
box(7, 0.15, 3.6, M.darkWood, 0, 0.075, -1.6, stall);                 // stall floor
box(7, 4, 0.2, M.wood, 0, 2, -3.4, stall);                          // back wall
for (let i = 0; i < 6; i++) box(0.04, 3.8, 0.02, M.darkWood, -3 + i * 1.2, 2, -3.29, stall); // wall slats
for (const x of [-3.4, 3.4]) for (const z of [-3.3, 0.1]) box(0.16, 4, 0.16, M.darkWood, x, 2, z, stall);

// counter with cyan-white tiled front
box(6.4, 1.1, 1, M.wood, 0, 0.6, -0.4, stall);
box(6.6, 0.1, 1.2, M.granite, 0, 1.2, -0.4, stall);
for (let i = 0; i < 16; i++) box(0.36, 0.36, 0.02, i % 2 ? M.terracotta : M.cream, -2.95 + i * 0.393, 0.65, 0.11, stall);

// striped scalloped awning
const awning = new THREE.Group();
awning.position.set(0, 4.1, -1.3);
awning.rotation.x = 0.28;
stall.add(awning);
for (let i = 0; i < 10; i++) {
  const stripe = box(0.75, 0.06, 3.4, i % 2 ? M.cream : M.red, -3.375 + i * 0.75, 0, 0, awning);
  const scallop = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.06, 20, 1, false, 0, Math.PI), stripe.material);
  scallop.rotation.y = -Math.PI / 2;
  scallop.position.set(stripe.position.x, 0, 1.7);
  awning.add(scallop);
}

// toran (hanging leaf garland)
const toran = new THREE.Group();
stall.add(toran);
for (let i = 0; i < 21; i++) {
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 4), i % 3 ? M.leaf : M.marigold);
  leaf.rotation.x = Math.PI;
  const x = -3.2 + i * 0.32;
  leaf.position.set(x, 3.45 - Math.sin((i / 20) * Math.PI) * 0.25, 0.1);
  toran.add(leaf);
}

// neon sign
const signTex = canvasTexture(1024, 256, (ctx, w, h) => {
  ctx.fillStyle = '#f2c200'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c1272d'; ctx.lineWidth = 8; ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#c1272d'; ctx.font = '800 72px Outfit, sans-serif';
  ctx.fillText("ANUSHA'S COFFEE CORNER", w / 2, h / 2 - 22);
  ctx.fillStyle = '#3b2412'; ctx.font = '400 40px Outfit, sans-serif';
  ctx.fillText('code · cook · creative', w / 2, h / 2 + 62);
});
const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1),
  new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.25 }));
sign.position.set(0, 4.95, -3.25);
stall.add(sign);

// hanging lanterns
const lanterns = [];
for (const x of [-2.2, 2.2]) {
  const l = new THREE.Group();
  l.position.set(x, 3.4, -1.4);
  box(0.01, 0.6, 0.01, M.black, 0, 0.3, 0, l);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), glow(WARM, 3));
  bulb.scale.y = 1.3;
  l.add(bulb);
  stall.add(l);
  lanterns.push(l);
}

// ---------- Interactive objects ----------
const interactives = [];
function interactive(group, section, label, view) {
  group.userData = { section, label, view, baseScale: group.scale.clone() };
  group.traverse(o => { if (o.isMesh) o.userData.root = group; });
  interactives.push(group);
  return group;
}

// Laptop (HP Victus with Tux) → projects
const victusBlack = mat(0x1c1d21, { roughness: 0.45, metalness: 0.4 });
const laptop = new THREE.Group();
laptop.position.set(-1.7, 1.25, -0.5);
laptop.rotation.y = 0.35;
box(1.2, 0.06, 0.8, victusBlack, 0, 0.03, 0, laptop, 0.02);

const keyboardTex = canvasTexture(1024, 680, (ctx, w, h) => {
  ctx.fillStyle = '#1c1d21'; ctx.fillRect(0, 0, w, h);
  const rows = [14, 14, 14, 13, 12];
  const kw = 62, gap = 8, top = 20;
  rows.forEach((n, r) => {
    let x = (w - n * (kw + gap)) / 2;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = '#0b0b0d'; ctx.fillRect(x, top + r * 70, kw, 60);
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 22, top + r * 70 + 24, 18, 4); // backlit legend
      x += kw + gap;
    }
  });
  ctx.fillStyle = '#0b0b0d'; ctx.fillRect(w / 2 - 220, top + 5 * 70, 440, 60);              // space bar
  ctx.strokeStyle = '#3a3b40'; ctx.lineWidth = 4; ctx.strokeRect(w / 2 - 170, 470, 340, 190); // touchpad
  ctx.fillStyle = '#9aa0a8'; ctx.font = 'italic 600 34px Outfit, sans-serif'; 
});
const keys = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.76), new THREE.MeshStandardMaterial({ map: keyboardTex, roughness: 0.6 }));
keys.rotation.x = -Math.PI / 2;
keys.position.y = 0.061;
laptop.add(keys);

const lid = new THREE.Group();
lid.position.set(0, 0.06, -0.4);
lid.rotation.x = -0.25;
laptop.add(lid);
box(1.2, 0.8, 0.04, victusBlack, 0, 0.4, 0, lid, 0.02);

// Tux sticker on the back of the lid, plus HP-style "V" badge
const tuxTex = canvasTexture(512, 512, (ctx, w) => {
  ctx.fillStyle = '#1c1d21'; ctx.fillRect(0, 0, w, w);
  const c = w / 2;
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(c, 270, 130, 170, 0, 0, Math.PI * 2); ctx.fill();      // body
  ctx.beginPath(); ctx.ellipse(c, 130, 85, 85, 0, 0, Math.PI * 2); ctx.fill();                              // head
  ctx.fillStyle = '#f5f5f0'; ctx.beginPath(); ctx.ellipse(c, 300, 90, 130, 0, 0, Math.PI * 2); ctx.fill();   // belly
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(c + s * 28, 115, 20, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(c + s * 22, 122, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a900'; ctx.beginPath(); ctx.ellipse(c + s * 65, 440, 70, 28, 0, 0, Math.PI * 2); ctx.fill(); // feet
  }
  ctx.fillStyle = '#f2a900'; ctx.beginPath(); ctx.ellipse(c, 160, 42, 20, 0, 0, Math.PI * 2); ctx.fill();   // beak
});
const tux = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ map: tuxTex, roughness: 0.5 }));
tux.position.set(-0.4, 0.15, -0.022);
tux.rotation.y = Math.PI;
lid.add(tux);
const vLogo = canvasTexture(256, 256, (ctx, w) => {
  ctx.fillStyle = '#1c1d21'; ctx.fillRect(0, 0, w, w);
  ctx.fillStyle = '#c9ccd2';
  // Victus "V": two slanted bars that meet at the bottom, with a cut on the right bar
  ctx.beginPath(); ctx.moveTo(40, 50); ctx.lineTo(88, 50); ctx.lineTo(136, 190); ctx.lineTo(112, 210); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(168, 50); ctx.lineTo(216, 50); ctx.lineTo(148, 210); ctx.lineTo(124, 190); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1c1d21'; ctx.fillRect(150, 108, 60, 10);
});
const vMat = new THREE.MeshStandardMaterial({ map: vLogo, metalness: 0.2, roughness: 0.35 });
const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), vMat);
badge.position.set(0, 0.42, -0.022); badge.rotation.y = Math.PI;
lid.add(badge);
const bezelLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), vMat);
bezelLabel.position.set(0, 0.03, 0.022);
lid.add(bezelLabel);
const codeCanvas = document.createElement('canvas');
codeCanvas.width = 512; codeCanvas.height = 320;
const codeCtx = codeCanvas.getContext('2d');
const codeTex = new THREE.CanvasTexture(codeCanvas);
codeTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7),
  new THREE.MeshBasicMaterial({ map: codeTex }));
screen.position.set(0, 0.43, 0.025);
lid.add(screen);
stall.add(interactive(laptop, 'projects', '💻 Projects', [-0.6, 2.3, 2.4]));

const codeLines = [
  'const anusha = new Developer();', 'anusha.brew("filter coffee");', 'await chatbot.reply(msg);',
  'ocr.extract(img).then(show);', 'faces = cv.detect(frame)', 'iot.sensor.on("intrusion")',
  'git push origin main', 'npm run build ✓', 'while(alive) learn();',
];
let codeRow = 0, codeTimer = 0;
function drawCode() {
  codeCtx.fillStyle = '#020a14'; codeCtx.fillRect(0, 0, 512, 320);
  codeCtx.font = '22px monospace';
  for (let i = 0; i < 10; i++) {
    const line = codeLines[(codeRow + i) % codeLines.length];
    codeCtx.fillStyle = i % 3 === 0 ? '#00e5ff' : i % 3 === 1 ? '#ffffff' : '#5c9dff';
    codeCtx.fillText(`${String(codeRow + i + 1).padStart(2, '0')}  ${line}`, 16, 34 + i * 29);
  }
  codeTex.needsUpdate = true;
}
drawCode();

// South Indian filter coffee: milk pot on the stove, steel filter, davara-tumbler sets → about
const coffee = new THREE.Group();
coffee.position.set(0.5, 1.25, -0.6);
cyl(0.35, 0.4, 0.15, M.black, 0, 0.075, 0, coffee);                // stove
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 8, 32), glow(BLUE, 3));
ring.rotation.x = Math.PI / 2; ring.position.y = 0.16; coffee.add(ring);
cyl(0.3, 0.26, 0.42, M.steel, 0, 0.38, 0, coffee, 32);              // milk pot
const lip = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), M.steel);
lip.rotation.x = Math.PI / 2; lip.position.y = 0.59; coffee.add(lip);
const milk = cyl(0.28, 0.28, 0.01, mat(0xf3ead8), 0, 0.56, 0, coffee, 32);
// coffee filter: lower vessel, upper perforated vessel, domed lid with knob
cyl(0.15, 0.15, 0.3, M.steel, -0.65, 0.15, 0.05, coffee, 24);
cyl(0.14, 0.14, 0.24, M.steel, -0.65, 0.42, 0.05, coffee, 24);
const lid2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.steel);
lid2.position.set(-0.65, 0.54, 0.05); coffee.add(lid2);
cyl(0.03, 0.03, 0.06, M.black, -0.65, 0.71, 0.05, coffee);
// davara + tumbler sets with frothy coffee
for (let i = 0; i < 3; i++) {
  const x = 0.55 + i * 0.25;
  cyl(0.11, 0.09, 0.08, M.steel, x, 0.04, 0.3, coffee);            // davara (bowl)
  cyl(0.065, 0.05, 0.2, M.steel, x, 0.18, 0.3, coffee);            // tumbler
  cyl(0.06, 0.06, 0.01, mat(0xc89f74), x, 0.28, 0.3, coffee);      // coffee with froth
}
stall.add(interactive(coffee, 'about', '☕ About Me', [1.6, 2.6, 2.2]));

// steam particles
const steamGeo = new THREE.BufferGeometry();
const STEAM = 40, steamPos = new Float32Array(STEAM * 3), steamLife = new Float32Array(STEAM);
for (let i = 0; i < STEAM; i++) steamLife[i] = Math.random();
steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
const steam = new THREE.Points(steamGeo, new THREE.PointsMaterial({ color: WHITE, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false }));
steam.position.set(0.5, 1.85, -0.6);
scene.add(steam);

// Books → skills
const books = new THREE.Group();
books.position.set(2.3, 1.25, -0.5);
const bookColors = [M.red, mat(0x1f3a6b), M.green, mat(0x6b1f2a), M.yellow];
bookColors.forEach((m, i) => {
  const b = box(0.8 - i * 0.05, 0.14, 0.55, m, (Math.random() - 0.5) * 0.08, 0.07 + i * 0.145, 0, books, 0.02);
  b.rotation.y = (Math.random() - 0.5) * 0.3;
});
const pages = box(0.03, 0.12, 0.5, M.cream, 0.39, 0.07, 0, books);
stall.add(interactive(books, 'skills', '📚 Skills', [3.4, 2.4, 2.0]));

// Wall shelf with trophy → achievements
box(1.6, 0.08, 0.5, M.darkWood, -2, 2.4, -3.05, stall);
const trophy = new THREE.Group();
trophy.position.set(-2, 2.44, -3.0);
const gold = M.gold;
box(0.35, 0.12, 0.35, M.black, 0, 0.06, 0, trophy);
cyl(0.04, 0.08, 0.25, gold, 0, 0.24, 0, trophy);
const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.08, 0.35, 24, 1, true), gold);
cup.material = cup.material.clone(); cup.material.side = THREE.DoubleSide; cup.position.y = 0.53; trophy.add(cup);
for (const s of [-1, 1]) {
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), gold);
  h.position.set(s * 0.25, 0.55, 0); trophy.add(h);
}
const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), gold);
star.position.y = 0.85; trophy.add(star);
stall.add(interactive(trophy, 'achievements', '🏆 Achievements', [-1.2, 3.2, 0.6]));

// Framed certificates → certs
const certs = new THREE.Group();
certs.position.set(1.6, 2.6, -3.28);
[[-0.7, 0.2], [0.1, -0.15], [0.85, 0.25]].forEach(([x, y], i) => {
  box(0.62, 0.8, 0.05, M.darkWood, x, y, 0, certs);
  const paper = box(0.5, 0.66, 0.02, M.cream, x, y, 0.03, certs);
  box(0.3, 0.03, 0.01, M.black, x, y + 0.2, 0.045, certs);
  box(0.36, 0.02, 0.01, M.dark, x, y + 0.05, 0.045, certs);
  box(0.28, 0.02, 0.01, M.dark, x, y - 0.03, 0.045, certs);
  const seal = cyl(0.06, 0.06, 0.01, M.red, x + 0.12, y - 0.2, 0.045, certs);
  seal.rotation.x = Math.PI / 2;
});
stall.add(interactive(certs, 'certs', '🖼️ Certifications', [1.9, 3.0, 1.0]));

// Post box → contact
const post = new THREE.Group();
post.position.set(4.6, 0, 1.8);
cyl(0.1, 0.1, 0.8, M.black, 0, 0.4, 0, post);
cyl(0.42, 0.42, 1.2, M.red, 0, 1.4, 0, post, 32);
const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.red);
dome.position.y = 2; dome.castShadow = true; post.add(dome);
box(0.4, 0.06, 0.1, M.black, 0, 1.75, 0.4, post);
box(0.5, 0.25, 0.02, M.white, 0, 1.35, 0.42, post);
cyl(0.44, 0.44, 0.06, M.black, 0, 1.0, 0, post, 32);
post.rotation.y = -0.6;
scene.add(interactive(post, 'contact', '📮 Contact', [6.6, 2.4, 5.2]));

// Auto-rickshaw → education (side profiles extruded across the width)
const auto = new THREE.Group();
auto.position.set(-4.4, 0, 2.6);
auto.rotation.y = 0.7;
function extrude(points, width, material, parent = auto, bevel = 0.04) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 16 });
  geo.translate(0, 0, -width / 2);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f0, transmission: 0.8, roughness: 0.05, transparent: true, opacity: 0.35 });

// rear passenger tub (wide)
extrude([[-1.1, 0.3], [0.35, 0.3], [0.35, 0.8], [-1.0, 0.8], [-1.1, 0.7]], 1.2, M.green);
// front fascia: narrows toward the nose, rises to the dashboard
extrude([[0.3, 0.3], [1.0, 0.3], [1.22, 0.55], [1.22, 1.2], [1.05, 1.32], [0.75, 1.32], [0.55, 0.85], [0.3, 0.85]], 0.75, M.green);
// black skirting
box(2.2, 0.08, 1.25, M.black, 0.05, 0.3, 0, auto);
// canopy: one curved shell from the windshield top sweeping down to the back
const roofShape = [[1.0, 1.88]];
for (let i = 1; i <= 12; i++) { const u = i / 12; roofShape.push([1.0 - u * 2.15, 1.88 + Math.sin(u * Math.PI * 0.8) * 0.22 - u * u * 0.1]); }
roofShape.push([-1.15, 0.85], [-1.08, 0.85], [-1.08, 1.7]);
for (let i = 12; i >= 0; i--) { const u = i / 12; roofShape.push([0.95 - u * 2.03, 1.82 + Math.sin(u * Math.PI * 0.8) * 0.2 - u * u * 0.1]); }
extrude(roofShape, 1.25, M.yellow, auto, 0.02);
box(0.03, 0.5, 1.15, M.black, -1.1, 1.3, 0, auto);                                // rear window band
box(0.04, 0.55, 0.8, glass, 1.0, 1.6, 0, auto).rotation.z = -0.12;               // windshield
for (const z of [-0.6, 0.6]) {
  const pole = box(0.04, 0.6, 0.04, M.black, 0.92, 1.58, z, auto);
  pole.rotation.z = -0.12;
  box(0.7, 0.04, 0.03, M.steel, -0.4, 1.05, z, auto);                             // grab rail
}
box(0.75, 0.12, 1.05, M.black, -0.55, 0.88, 0, auto, 0.04);                      // passenger bench
box(0.12, 0.5, 1.05, M.black, -0.95, 1.15, 0, auto, 0.04);                       // backrest
box(0.32, 0.1, 0.38, M.black, 0.35, 0.92, 0, auto, 0.04);                        // driver seat
box(0.06, 0.06, 0.7, M.steel, 0.75, 1.3, 0, auto);                               // handlebar

const wheels = [];
for (const [x, z] of [[1.0, 0], [-0.6, 0.66], [-0.6, -0.66]]) {
  const w = cyl(0.24, 0.24, 0.14, M.black, x, 0.24, z, auto);
  w.rotation.x = Math.PI / 2;
  const hub = cyl(0.1, 0.1, 0.15, M.steel, x, 0.24, z, auto);
  hub.rotation.x = Math.PI / 2;
  wheels.push(w);
}
const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), M.glowWhite);
headlight.position.set(1.24, 1.0, 0); auto.add(headlight);
for (const z of [-0.28, 0.28]) {
  const ind = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), glow(0xff9a1f, 1.5));
  ind.position.set(1.23, 1.18, z); auto.add(ind);
}
const plate = canvasTexture(256, 64, (ctx, w, h) => {
  ctx.fillStyle = '#f2c200'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#111'; ctx.font = '700 36px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('KA 01 2028', w / 2, 46);
});
const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshStandardMaterial({ map: plate }));
plateMesh.position.set(1.23, 0.62, 0); plateMesh.rotation.y = Math.PI / 2; auto.add(plateMesh);
scene.add(interactive(auto, 'education', '🛺 Education', [-1.4, 2.4, 6.6]));

// ---------- Avatar: Anusha the barista (bob haircut, round glasses, black shirt) ----------
const skin = mat(0xb47a56, { roughness: 0.7 });
const hairMat = mat(0x0d0b0a, { roughness: 0.55 });
const shirt = mat(0x151515, { roughness: 0.8 });
const apron = mat(0x6b4226, { roughness: 0.9 });

const avatar = new THREE.Group();
avatar.position.set(0, 0.15, -1.4);
avatar.scale.setScalar(1.35);
scene.add(avatar);
const hips = new THREE.Group();
avatar.add(hips);

function limb(len, radius, material, x, y, parent) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 4, 10), material);
  m.position.y = -len / 2;
  m.castShadow = true;
  pivot.add(m);
  parent.add(pivot);
  return pivot;
}
const legL = limb(0.62, 0.09, mat(0x23252b), -0.12, 0.8, hips);
const legR = limb(0.62, 0.09, mat(0x23252b), 0.12, 0.8, hips);
for (const leg of [legL, legR]) box(0.16, 0.08, 0.26, M.black, 0, -0.75, 0.05, leg, 0.03); // shoes

const torso = new THREE.Group();
torso.position.y = 0.8;
hips.add(torso);
const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 4, 12), shirt);
chest.position.y = 0.33; chest.scale.z = 0.75; chest.castShadow = true;
torso.add(chest);
box(0.38, 0.5, 0.02, apron, 0, 0.18, 0.17, torso, 0.01);                   // apron
for (const s of [-1, 1]) {                                                   // shirt collar
  const c = box(0.12, 0.03, 0.08, shirt, s * 0.07, 0.72, 0.1, torso);
  c.rotation.z = s * 0.4;
}
const armL = limb(0.42, 0.065, shirt, -0.29, 0.66, torso);
const armR = limb(0.42, 0.065, shirt, 0.29, 0.66, torso);
for (const arm of [armL, armR]) {
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), skin);
  hand.position.y = -0.55; arm.add(hand);
}
// steel tumbler held in the right hand while brewing
const heldCup = cyl(0.05, 0.04, 0.14, M.steel, 0, -0.62, 0.04, armR);

const head = new THREE.Group();
head.position.y = 0.98;
torso.add(head);
cyl(0.06, 0.07, 0.12, skin, 0, -0.14, 0, head);                              // neck
const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 20), skin);
face.scale.set(0.95, 1.08, 0.95); face.castShadow = true;
head.add(face);
// hair: cap + chin-length bob + side-swept fringe over the left eye
const cap = new THREE.Mesh(new THREE.SphereGeometry(0.215, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hairMat);
cap.position.y = 0.02; cap.rotation.x = -0.45;
head.add(cap);
const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.3, 24, 1, true, Math.PI * 0.3, Math.PI * 1.4), hairMat);
bob.material = hairMat.clone(); bob.material.side = THREE.DoubleSide;
bob.position.y = -0.07;
head.add(bob);
const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), hairMat);
fringe.scale.set(1.1, 0.4, 0.4); fringe.position.set(0.08, 0.15, 0.15); fringe.rotation.z = -0.4;
head.add(fringe);
// round wire glasses
const frame = mat(0x3a2a22, { metalness: 0.6, roughness: 0.3 });
for (const s of [-1, 1]) {
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 24), frame);
  rim.position.set(s * 0.075, 0.03, 0.205); head.add(rim);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), M.black);
  eye.position.set(s * 0.075, 0.03, 0.19); head.add(eye);
  const arm = box(0.006, 0.006, 0.18, frame, s * 0.135, 0.02, 0.1, head);
}
box(0.04, 0.008, 0.008, frame, 0, 0.04, 0.21, head);                        // bridge
// big smile
const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 16, Math.PI), M.white);
smile.rotation.z = Math.PI; smile.position.set(0, -0.06, 0.19); smile.scale.y = 0.7;
head.add(smile);

// Routine: walk to a spot behind the counter, do the task there, repeat
const routine = [
  { x: 0.5, act: 'stir', time: 4 },     // boil milk
  { x: -0.15, act: 'pour', time: 4 },   // decoction from the filter
  { x: 1.3, act: 'pull', time: 4 },     // pull coffee between davara & tumbler
  { x: -1.7, act: 'type', time: 4 },    // check the laptop
  { x: 2.3, act: 'wave', time: 3 },     // serve & greet
];
let step = 0, actT = 0, walking = true;
function updateAvatar(dt, t) {
  const goal = routine[step];
  const dx = goal.x - avatar.position.x;
  let swing = 0;
  [armL, armR].forEach(a => a.rotation.set(0, 0, 0));
  heldCup.visible = false;
  head.rotation.set(0, 0, 0);
  torso.rotation.set(0, 0, 0);

  if (walking) {
    const dir = Math.sign(dx);
    avatar.position.x += dir * Math.min(Math.abs(dx), dt * 1.1);
    avatar.rotation.y += ((dir > 0 ? Math.PI / 2 : -Math.PI / 2) - avatar.rotation.y) * 0.15;
    swing = Math.sin(t * 9) * 0.55;
    hips.position.y = Math.abs(Math.cos(t * 9)) * 0.04;
    armL.rotation.x = swing; armR.rotation.x = -swing;
    if (Math.abs(dx) < 0.01) { walking = false; actT = 0; }
  } else {
    actT += dt;
    avatar.rotation.y += (0 - avatar.rotation.y) * 0.15;     // face the customers
    hips.position.y = 0;
    switch (goal.act) {
      case 'stir':
        armR.rotation.x = -1.1 + Math.sin(t * 6) * 0.15;
        armR.rotation.z = -0.35 + Math.cos(t * 6) * 0.15;
        head.rotation.x = 0.35;
        break;
      case 'pour':
        heldCup.visible = true;
        armR.rotation.x = -1.4; armR.rotation.z = -0.3 + Math.sin(t * 2) * 0.15;
        armL.rotation.x = -0.9;
        head.rotation.x = 0.3;
        break;
      case 'pull': {                                         // the famous high pour
        heldCup.visible = true;
        const p = Math.sin(t * 3);
        armR.rotation.x = -1.6 - p * 0.9;
        armL.rotation.x = -0.9 + p * 0.2;
        head.rotation.x = 0.1 - p * 0.15;
        break;
      }
      case 'type': {                                         // laptop is turned to face her; lean in to the keys
        const settle = Math.min(actT / 0.6, 1);
        torso.rotation.x = 0.3 * settle;
        armL.rotation.x = (-0.35 + Math.sin(t * 18) * 0.05) * settle;
        armR.rotation.x = (-0.35 + Math.cos(t * 16) * 0.05) * settle;
        armL.rotation.z = 0.15; armR.rotation.z = -0.15;
        head.rotation.x = 0.1; head.rotation.y = Math.sin(t) * 0.1;
        break;
      }
      case 'wave':
        armR.rotation.z = 2.6 + Math.sin(t * 8) * 0.35;
        head.rotation.z = Math.sin(t * 2) * 0.1;
        break;
    }
    if (actT > goal.time) { step = (step + 1) % routine.length; walking = true; }
  }
  legL.rotation.x = swing; legR.rotation.x = -swing;

  // swivel the laptop toward Anusha while she types, back to the visitors afterwards
  const typing = !walking && goal.act === 'type';
  laptop.rotation.y += ((typing ? Math.PI : 0.35) - laptop.rotation.y) * 0.08;
  laptop.position.z += ((typing ? -0.65 : -0.5) - laptop.position.z) * 0.08;
  avatar.position.z += ((typing ? -1.1 : -1.4) - avatar.position.z) * 0.08;   // step up to the counter
  chest.scale.y = 1 + Math.sin(t * 2) * 0.01;               // breathing
}

// ---------- Fireflies ----------
const FF = 160, ffPos = new Float32Array(FF * 3), ffSeed = new Float32Array(FF);
for (let i = 0; i < FF; i++) {
  ffPos[i * 3] = (Math.random() - 0.5) * 30;
  ffPos[i * 3 + 1] = Math.random() * 12;
  ffPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  ffSeed[i] = Math.random() * 100;
}
const ffGeo = new THREE.BufferGeometry();
ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.06, transparent: true, opacity: 0.9 }));
fireflies.material.color.set(0xffffff);
fireflies.visible = false; // daytime: no fireflies
scene.add(fireflies);

// ---------- Interaction ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-9, -9);
const tooltip = document.getElementById('tooltip');
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panel-body');
const menuBtns = [...document.querySelectorAll('#menu button')];
let hovered = null, focused = null;
const camGoal = { pos: null, target: null };

canvas.addEventListener('pointermove', e => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  tooltip.style.left = e.clientX + 'px';
  tooltip.style.top = e.clientY + 'px';
});
let downAt = null;
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return; // ignore drags
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  const hit = pick();
  if (hit) focus(hit);
});

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactives, true);
  return hits.length ? hits[0].object.userData.root : null;
}

function focus(obj) {
  focused = obj;
  const { section, view } = obj.userData;
  const center = new THREE.Vector3();
  new THREE.Box3().setFromObject(obj).getCenter(center);
  camGoal.target = center;
  camGoal.pos = new THREE.Vector3(...view);
  panelBody.innerHTML = document.getElementById('t-' + section).innerHTML;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  menuBtns.forEach(b => b.classList.toggle('active', b.dataset.go === section));
}
function unfocus() {
  focused = null;
  camGoal.pos = HOME.pos.clone();
  camGoal.target = HOME.target.clone();
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  menuBtns.forEach(b => b.classList.remove('active'));
}
document.getElementById('close').onclick = unfocus;
addEventListener('keydown', e => { if (e.key === 'Escape') unfocus(); });
menuBtns.forEach(b => b.onclick = () => focus(interactives.find(o => o.userData.section === b.dataset.go)));
controls.addEventListener('start', () => { camGoal.pos = null; camGoal.target = null; }); // user takes over

// ---------- Loader / intro ----------
const loader = document.getElementById('loader');
const enterBtn = document.getElementById('enter');
const barFill = document.querySelector('.bar span');
let progress = 0;
const fakeLoad = setInterval(() => {
  progress = Math.min(100, progress + 12 + Math.random() * 18);
  barFill.style.width = progress + '%';
  if (progress >= 100) { clearInterval(fakeLoad); enterBtn.disabled = false; }
}, 120);
enterBtn.onclick = () => {
  loader.classList.add('hide');
  camGoal.pos = HOME.pos.clone();
  camGoal.target = HOME.target.clone();
};

// ---------- Loop ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

  if (camGoal.pos) {
    const k = 1 - Math.pow(0.02, dt);
    camera.position.lerp(camGoal.pos, k);
    controls.target.lerp(camGoal.target, k);
    if (camera.position.distanceTo(camGoal.pos) < 0.02) camGoal.pos = camGoal.target = null;
  }
  controls.update();

  // hover
  const hit = pick();
  if (hit !== hovered) {
    hovered = hit;
    canvas.classList.toggle('pointer', !!hit);
    tooltip.textContent = hit ? hit.userData.label : '';
    tooltip.classList.toggle('show', !!hit);
  }
  for (const o of interactives) {
    const s = o === hovered || o === focused ? 1.08 : 1;
    o.scale.lerp(o.userData.baseScale.clone().multiplyScalar(s), 0.15);
  }

  // ambience
  lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.3 + i) * 0.08; });
  toran.children.forEach((leaf, i) => { leaf.rotation.z = Math.sin(t * 2 + i * 0.5) * 0.15; });
  stallLight.intensity = 18 + Math.sin(t * 3) * 1.5;
  star.rotation.y = t * 2;
  ring.material.emissiveIntensity = 2.5 + Math.sin(t * 6) * 0.8;
  auto.position.y = Math.abs(Math.sin(t * 8)) * 0.012; // idling engine
  
  codeTimer += dt;
  if (codeTimer > 0.6) { codeTimer = 0; codeRow++; drawCode(); }

  for (let i = 0; i < STEAM; i++) {
    steamLife[i] += dt * 0.5;
    if (steamLife[i] > 1) steamLife[i] = 0;
    const l = steamLife[i];
    steamPos[i * 3] = Math.sin(l * 8 + i) * 0.12 * l;
    steamPos[i * 3 + 1] = l * 1.3;
    steamPos[i * 3 + 2] = Math.cos(l * 6 + i) * 0.12 * l;
  }
  steamGeo.attributes.position.needsUpdate = true;

  for (let i = 0; i < FF; i++) {
    ffPos[i * 3 + 1] += Math.sin(t + ffSeed[i]) * 0.004;
    ffPos[i * 3] += Math.cos(t * 0.5 + ffSeed[i]) * 0.004;
  }
  ffGeo.attributes.position.needsUpdate = true;
  fireflies.material.opacity = 0.6 + Math.sin(t * 2) * 0.3;

  updateAvatar(dt, t);
  clouds.forEach((c, i) => { c.position.x += Math.sin(t * 0.05 + i) * 0.01; });
  composer.render();
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// Debug view: ?cam=px,py,pz,tx,ty,tz skips the loader and fixes the camera (handy for screenshots)
const camParam = new URLSearchParams(location.search).get('cam');
if (camParam) {
  const [px, py, pz, tx, ty, tz] = camParam.split(',').map(Number);
  loader.classList.add('hide');
  camera.position.set(px, py, pz);
  controls.target.set(tx, ty, tz);
}
const stepParam = new URLSearchParams(location.search).get('step');
if (stepParam) { step = Number(stepParam); avatar.position.x = routine[step].x; }
