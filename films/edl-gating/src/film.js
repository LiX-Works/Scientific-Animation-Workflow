// Electric-double-layer gating and reduced voltage stress: a deterministic render(t) scene.
import * as THREE from 'three';
const W = 1920, H = 1080;
const STORY = 102; let DUR = 102;
const REVIEW = new URLSearchParams(location.search).has('review');

// ---------- Utilities ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sm = x => x * x * (3 - 2 * x);
const smr = x => x * x * x * (x * (x * 6 - 15) + 10);
const ss = (t, a, b) => smr(seg(t, a, b));
const lerp = (a, b, k) => a + (b - a) * k;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eout = x => 1 - Math.pow(1 - x, 3);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = mulberry(20261016);
const jit = (i, t, f = 1) => Math.sin(t * 1.7 * f + i * 12.9898) * .5 + Math.sin(t * 2.9 * f + i * 78.233) * .5;

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(+(new URLSearchParams(location.search).get('ss') || 1)); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const FOGC = new THREE.Color('#e2ecf4');
const cam = new THREE.PerspectiveCamera(30, W / H, .01, 1000);
const hemi = new THREE.HemisphereLight('#ffffff', '#aebccb', .9); scene.add(hemi);
const key = new THREE.DirectionalLight('#fffaf2', 2.0); key.position.set(6, 10, 8); scene.add(key);
const rim = new THREE.DirectionalLight('#cfe3ff', .8); rim.position.set(-8, 3, -10); scene.add(rim);
const fill = new THREE.DirectionalLight('#ffffff', .5); scene.add(fill);

const C = {
  sub: '#c4cfdb', nplus: '#9fbbdc', ox: '#d5d7d3', gel: '#a9d8d0', gate: '#8c9aab',
  e: '#2456c8', h: '#d1495b', cat: '#c98a2b', an: '#3f8a62', gq: '#7a6fae', edge: '#33465c', lat: '#9aa8ba'
};

// ---------- Device parts (dynamically sized boxes) ----------
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitEdges = new THREE.EdgesGeometry(unitBox);
function part(color, o = {}) {
  const geo = o.faces ? unitBox.clone() : unitBox;
  if (o.faces) {
    const front = new THREE.Color(o.faces.front ?? color), top = new THREE.Color(o.faces.top), side = new THREE.Color(o.faces.side);
    const faceColors = [side, side, top, side, front, side], rgb = new Float32Array(geo.attributes.position.count * 3);
    faceColors.forEach((c, f) => { for (let v = 0; v < 4; v++) rgb.set([c.r, c.g, c.b], (f * 4 + v) * 3); });
    geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  }
  const Material = o.specular === undefined ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
  const m = new Material({ color: o.faces ? '#ffffff' : color, vertexColors: !!o.faces, roughness: o.rough ?? .55, metalness: o.metal ?? 0, ...(o.specular === undefined ? {} : { specularIntensity: o.specular, clearcoat: 0 }), transparent: !!o.transparent, opacity: o.opacity ?? 1, emissive: new THREE.Color(color), emissiveIntensity: 0, depthWrite: !o.transparent });
  const mesh = new THREE.Mesh(geo, m);
  const lm = new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 1 });
  const lines = new THREE.LineSegments(unitEdges, lm);
  const g = new THREE.Group(); g.add(mesh); g.add(lines);
  g.userData = { mesh, lines, m, lm, base: o.opacity ?? 1 };
  return g;
}
function setBox(p, x0, x1, y0, y1, dz) {
  p.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); p.scale.set(x1 - x0, Math.max(1e-3, y1 - y0), dz);
}
const sphereG = new THREE.SphereGeometry(1, 16, 12);
const sphereLo = new THREE.SphereGeometry(1, 10, 8);
const torusG = new THREE.TorusGeometry(1, .26, 8, 20);
function inst(geo, color, n, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: o.rough ?? .3, metalness: 0, clearcoat: .7, clearcoatRoughness: .14, sheen: .35, sheenRoughness: .5, sheenColor: new THREE.Color('#ffffff'), specularIntensity: .6, emissive: new THREE.Color(color), emissiveIntensity: (o.em ?? .35) * .6, transparent: true, opacity: o.opacity ?? 1, depthWrite: o.dw ?? true });
  const im = new THREE.InstancedMesh(geo, m, n); im.frustumCulled = false; im.count = n; return im;
}
const M4 = new THREE.Matrix4(), Q0 = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
function put(im, i, x, y, z, s) { V3.set(x, y, z); S3.set(s, s, s); M4.compose(V3, Q0, S3); im.setMatrixAt(i, M4); }

const GX = 4.6; // Half the gate width.
function makeDevice(kind) {
  const d = { kind, g: new THREE.Group() };
  d.sub = part(C.sub, { faces: { top: '#d5dfe8', front: '#98a3ae', side: '#65717f' } });
  d.S = part(C.nplus, { faces: { top: '#b7cde3', front: '#8196a8', side: '#576e82' } }); d.D = part(C.nplus, { faces: { top: '#b7cde3', front: '#8196a8', side: '#576e82' } });
  d.diel = part(C.ox, { transparent: true, opacity: .48, rough: .6 });
  d.gel = part(C.gel, { transparent: true, opacity: .0, rough: .1 });
  d.gate = part(C.gate, { metal: .08, rough: .76, specular: .25, faces: { top: '#b8c6d3', front: '#5e6d7c', side: '#3b4a59' } });
  d.cS = part('#a9b4c1', { metal: .08, rough: .72, specular: .25, faces: { top: '#ccd6df', front: '#7e8d9b', side: '#566878' } }); d.cD = part('#a9b4c1', { metal: .08, rough: .72, specular: .25, faces: { top: '#ccd6df', front: '#7e8d9b', side: '#566878' } });
  [d.sub, d.S, d.D, d.diel, d.gel, d.gate, d.cS, d.cD].forEach(p => d.g.add(p));
  // Charge carriers.
  d.NE = 150; d.el = inst(sphereG, C.e, d.NE, { em: .15 }); d.g.add(d.el);
  d.eo = []; for (let i = 0; i < d.NE; i++) { const side = i % 2 ? 1 : -1; d.eo.push({ ox: side * (5 + R() * 2.8), oy: -.25 - R() * 1.05, tx: -4.4 + R() * 8.8, ty: -.07 - R() * .17, z: R() - .5, r: R(), sp: .92 + R() * .16, u: (i + R() * .8) / d.NE }); }
  // One stratified phase lattice spans both contacts before drift starts.
  // Preserve the original RNG draws above so the rest of the scene remains deterministic.
  d.eo.forEach((p, i) => {
    p.u = (i + .5) / d.NE; p.tx = -7.5 + 15 * p.u;
    p.ox = (p.tx < 0 ? -1 : 1) * Math.abs(p.ox);
    p.z = ((i % 3) + .5) / 3 - .5; p.sp = 1;
  });
  d.NR = 70; d.res = inst(sphereG, C.e, d.NR, { em: .15 }); d.g.add(d.res);
  d.ro = []; for (let i = 0; i < d.NR; i++) { const side = i % 2 ? 1 : -1; d.ro.push({ x: side * (4.8 + R() * 3.1), y: -.15 - R() * 1.15, z: R() - .5 }); }
  d.NH = 170; d.ho = inst(torusG, C.h, d.NH, { em: .15 }); d.g.add(d.ho);
  d.hp = []; for (let i = 0; i < d.NH; i++) { let x = -7.7 + R() * 15.4; d.hp.push({ x, y: -1.75 - R() * 3.1, z: R() - .5 }); }
  for (let i = 0; i < 60; i++) d.hp[i].y = -.3 - R() * 1.6, d.hp[i].x = -4.3 + R() * 8.6; // Holes near the surface.
  d.NG = 72; d.gq = inst(sphereLo, C.gq, d.NG, { em: .1, rough: .45 }); d.g.add(d.gq);
  // Stationary field paths plus staggered downward direction cues; these are not moving charges.
  d.NF = 26 * 5;
  const fp = new Float32Array(d.NF * 24), fc = new Float32Array(d.NF * 32);
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  fg.setAttribute('color', new THREE.BufferAttribute(fc, 4));
  d.fieldM = new THREE.LineBasicMaterial({ color: '#46515c', transparent: true, opacity: 0, vertexColors: true }); d.field = new THREE.LineSegments(fg, d.fieldM); d.field.frustumCulled = false; d.g.add(d.field);
  // Voltage column.
  d.col = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 1, 32), new THREE.MeshStandardMaterial({ color: '#e8590c', emissive: new THREE.Color('#e8590c'), emissiveIntensity: .25, roughness: .3, transparent: true, opacity: .9 }));
  d.colGlass = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: .35, roughness: .05, side: THREE.DoubleSide, depthWrite: false }));
  d.g.add(d.col, d.colGlass);
  scene.add(d.g);
  return d;
}
const B = makeDevice('edl');   // Main device; its dielectric becomes an electrolyte after the opening.
const A = makeDevice('ox');    // Conventional solid-dielectric reference, introduced later.

// Electrolyte ions at the mesoscopic scale.
const NI = 230;
const cat = inst(sphereG, C.cat, NI, { em: .12 }), an = inst(sphereG, C.an, NI, { em: .12 });
B.g.add(cat, an);
const ions = [];
for (let i = 0; i < NI; i++) ions.push({ cx: -4.4 + R() * 8.8, cy: .12 + R() * 2.16, cz: R() - .5, ax: -4.4 + R() * 8.8, ay: .12 + R() * 2.16, az: R() - .5, r: R() });
// Interfacial excess ions: the first 26% of cations move down; the first 26% of anions move up.
const EXC = Math.floor(NI * .26);
function layerSlot(i, n) { const cols = 26; const rows = Math.ceil(n / cols); const c = i % cols, r = Math.floor(i / cols); return { x: -4.3 + (c + .5) / cols * 8.6 + (r % 2) * .15, z: (r + .5) / rows - .5 }; }

// Coordinate grid at the electrolyte/semiconductor interface.
const gridG = new THREE.BufferGeometry(); { const a = []; for (let x = -8; x <= 8.001; x += .8) a.push(x, 0, -1, x, 0, 1); for (let k = 0; k <= 10; k++) { const z = -1 + k * .2; a.push(-8, 0, z, 8, 0, z); } gridG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); }
const gridM = new THREE.LineBasicMaterial({ color: '#2c4560', transparent: true, opacity: 0, depthWrite: false }); const grid = new THREE.LineSegments(gridG, gridM); grid.frustumCulled = false; grid.renderOrder = 2; B.g.add(grid);
// Potential profile phi(y).
const phiN = 120; const phiG = new THREE.BufferGeometry(); phiG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(phiN * 3), 3));
const phiM = new THREE.LineBasicMaterial({ color: '#14202e', transparent: true, opacity: 0 }); const phiL = new THREE.Line(phiG, phiM); phiL.frustumCulled = false; B.g.add(phiL);
const axG = new THREE.BufferGeometry(); axG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); const axM = new THREE.LineBasicMaterial({ color: '#6b7c90', transparent: true, opacity: 0 }); const axL = new THREE.LineSegments(axG, axM); axL.frustumCulled = false; B.g.add(axL);

// ---------- Microscopic interface (nanometers, scaled as a group) ----------
const NM = .02; // World-space length representing 1 nm.
const micro = new THREE.Group(); micro.scale.setScalar(NM); B.g.add(micro);
const latPts = []; for (let x = -18; x <= 18; x += .72) for (let z = -14; z <= 10; z += .72) for (let y = -.45; y > -6.5; y -= .72) latPts.push([x + (Math.round(y / .72) % 2) * .36, y, z]);
const lat = inst(sphereLo, C.lat, latPts.length, { em: .05, rough: .6, metal: .1 }); micro.add(lat);
latPts.forEach((p, i) => put(lat, i, p[0], p[1], p[2], .15));
const NCL = 36 * 24; const mcat = inst(sphereG, C.cat, NCL, { em: .12 }); const mshell = inst(sphereLo, '#f7e3b5', NCL, { em: .1, opacity: .1, dw: false }); micro.add(mcat, mshell);
const clp = []; for (let r = 0; r < 24; r++) for (let c = 0; c < 36; c++) clp.push({ x: -17.5 + c * 1.0 + (r % 2) * .5 + (R() - .5) * .25, z: -13.5 + r * 1.0 + (R() - .5) * .25, y0: 2 + R() * 9, r: R() });
const NME = 820; const mel = inst(sphereLo, C.e, NME, { em: .3, opacity: .6, dw: false }); micro.add(mel);
const mep = []; for (let i = 0; i < NME; i++) mep.push({ x: -18 + R() * 36, z: -14 + R() * 24, y: -.35 - Math.pow(R(), 1.8) * 1.4 });
// Charge signs on close-up ions.
function signTex(ch, col) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = col || '#ffffff'; g.font = 'bold 110px DejaVu Sans'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70); return new THREE.CanvasTexture(c); }
const plusM = new THREE.SpriteMaterial({ map: signTex('+', '#4a3000'), transparent: true, depthTest: false }), minusM = new THREE.SpriteMaterial({ map: signTex('−'), transparent: true, depthTest: false });
const signC = [], signA = [];
for (let k = 0; k < 40; k++) { const sp = new THREE.Sprite(plusM); sp.scale.setScalar(.5); sp.renderOrder = 8; micro.add(sp); signC.push(sp); }
const NMB = 150; const mbc = inst(sphereG, C.cat, NMB, { em: .12 }), mba = inst(sphereG, C.an, NMB, { em: .12 }); micro.add(mbc, mba);
const mbp = []; for (let i = 0; i < NMB; i++) mbp.push({ x: -18 + R() * 36, y: 3 + R() * 14, z: -14 + R() * 24, x2: -18 + R() * 36, y2: 3 + R() * 14, z2: -14 + R() * 24 });
const NMF = 400; const mfG = new THREE.BufferGeometry(); mfG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NMF * 6), 3));
const mfM = new THREE.LineBasicMaterial({ color: '#33475e', transparent: true, opacity: 0 }); const mfL = new THREE.LineSegments(mfG, mfM); mfL.frustumCulled = false; micro.add(mfL);
const mfp = []; for (let i = 0; i < NMF; i++) mfp.push({ x: -10 + R() * 20, z: -7 + R() * 14, ph: R() });
// Semiconductor surface in the microscopic view.
const surfM = new THREE.MeshStandardMaterial({ color: '#c8d3e0', roughness: .8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const surf = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), surfM); surf.rotation.x = -Math.PI / 2; surf.position.y = -.1; micro.add(surf);
// Separation bracket for d.
const brG = new THREE.BufferGeometry(); brG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, .45, 0, 0, -.55, 0, -.25, .45, 0, .25, .45, 0, -.25, -.55, 0, .25, -.55, 0]), 3));
const brM = new THREE.LineBasicMaterial({ color: '#14202e', transparent: true, opacity: 0, depthTest: false }); const br = new THREE.LineSegments(brG, brM); br.position.set(-1.6, 0, 6); br.renderOrder = 9; micro.add(br);

// Breakdown: defects and a filament inside the reference dielectric.
const ND = 90; const defs = inst(new THREE.OctahedronGeometry(1), '#e8590c', ND, { em: .4 }); A.g.add(defs);
const dp = []; const fx = .9;
for (let i = 0; i < ND; i++) { const chain = i < 14; dp.push(chain ? { x: fx + Math.sin(i * 2.1) * .12, y: .05 + (i / 13) * .6, z: .05, t: 80.5 + (i / 14) * 4.2 + R() * .4, chain } : { x: -4.2 + R() * 8.4, y: .05 + R() * .6, z: (R() - .5) * 5.4, t: 79.8 + R() * 5, chain }); }
const filG = new THREE.BufferGeometry(); { const a = []; for (let i = 0; i <= 14; i++) a.push(fx + Math.sin(i * 2.1) * .12, .7 - i / 14 * .7, .05); filG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); }
const filM = new THREE.LineBasicMaterial({ color: '#c92a2a', transparent: true, opacity: 0 }); const fil = new THREE.Line(filG, filM); A.g.add(fil);
const flash = new THREE.PointLight('#ffb35a', 0, 9); flash.position.set(fx, .35, .6); A.g.add(flash);
// Breakdown path: a discharge growing downward from the gate, side cracks, and residual damage.
const bPts = []; { const rr = mulberry(4242); for (let i = 0; i <= 7; i++) bPts.push(new THREE.Vector3(fx + (i && i < 7 ? (i % 2 ? 1 : -1) * (.05 + rr() * .07) : 0), .7 - (i + (i && i < 7 ? (rr() - .5) * .4 : 0)) / 7 * .7, .05 + (i && i < 7 ? (rr() - .5) * .04 : 0))); }
const bCurve = new THREE.CurvePath(); for (let i = 0; i < bPts.length - 1; i++) bCurve.add(new THREE.LineCurve3(bPts[i], bPts[i + 1]));
const coreG = new THREE.TubeGeometry(bCurve, 132, .024, 6, false), haloG = new THREE.TubeGeometry(bCurve, 132, .07, 8, false);
const coreM = new THREE.MeshBasicMaterial({ color: '#fff6e0', transparent: true, opacity: 0, depthTest: false }), haloM = new THREE.MeshBasicMaterial({ color: '#ff5a14', transparent: true, opacity: 0, depthWrite: false, depthTest: false });
const core = new THREE.Mesh(coreG, coreM), halo = new THREE.Mesh(haloG, haloM); core.renderOrder = 7; halo.renderOrder = 6; core.frustumCulled = halo.frustumCulled = false; A.g.add(halo, core);
const crG = new THREE.BufferGeometry(); { const a = []; const rr = mulberry(77); for (let k = 0; k < 16; k++) { const p = bCurve.getPoint(.1 + .8 * rr()); let x = p.x, y = p.y, z = p.z; const dir = rr() < .5 ? -1 : 1; for (let j = 0; j < 3; j++) { const nx = x + dir * (.12 + rr() * .25), ny = clamp(y + (rr() - .5) * .14, .02, .68), nz = z + (rr() - .5) * .3; a.push(x, y, z, nx, ny, nz); x = nx; y = ny; z = nz; } } crG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); }
const crM = new THREE.LineBasicMaterial({ color: '#7a2a12', transparent: true, opacity: 0, depthTest: false }); const cracks = new THREE.LineSegments(crG, crM); cracks.renderOrder = 6; cracks.frustumCulled = false; A.g.add(cracks);
const flashDiv = document.createElement('div'); flashDiv.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;background:radial-gradient(55% 55% at var(--fx,50%) var(--fy,40%),rgba(255,150,60,.75),rgba(255,120,40,.25) 40%,rgba(255,255,255,0) 75%);pointer-events:none;opacity:0;z-index:5'; document.body.appendChild(flashDiv);

// ---------- Text overlays ----------
const ov = document.getElementById('ov');
const TX = [];
function tx(t0, t1, html, o = {}) {
  const el = document.createElement('div'); el.className = 'tx ' + (o.cls || 'l');
  if (o.split === true && !/[<]/.test(html)) { el.innerHTML = [...html].map(ch => `<span class="c">${ch === ' ' ? '&nbsp;' : ch}</span>`).join(''); }
  else el.innerHTML = html;
  ov.appendChild(el); const s = { t0, t1, el, o, chars: [...el.querySelectorAll('span.c')] }; TX.push(s); return s;
}
const P = new THREE.Vector3();
function toScreen(v, obj) { P.copy(v); if (obj) obj.localToWorld(P); P.project(cam); return [(P.x * .5 + .5) * W, (-P.y * .5 + .5) * H, P.z]; }
function drawText(t) {
  for (const s of TX) {
    const { t0, t1, el, o } = s;
    if (t < t0 - .01 || t > t1) { el.style.display = 'none'; if (s.ld) s.ld.style.display = 'none'; continue; }
    el.style.display = 'block';
    let x = o.x ?? 960, y = o.y ?? 540;
    if (o.at) { const a = typeof o.at === 'function' ? o.at(t) : o.at; const sc = toScreen(a, o.obj); x = sc[0] + (o.dx || 0); y = sc[1] + (o.dy ?? (o.lead ? -80 : 0)); }
    const ft = filmAt(t), f0 = filmAt(t0), f1 = filmAt(t1);
    const inn = seg(ft, f0, f0 + (o.inDur ?? .32)), out = seg(ft, f1 - (o.outDur ?? .24), f1);
    const ax = o.anchor ?? .5;
    { const w = el.offsetWidth || 0; x = clamp(x, 40 + ax * w, W - 40 - (1 - ax) * w); }
    el.style.transform = `translate(${x}px,${y}px) translate(${-ax * 100}%,-50%) translateY(${-out * 14}px) scale(${o.scale ? o.scale(t) : 1})`;
    el.style.opacity = (1 - out) * (o.alpha ? o.alpha(t) : 1);
    if (s.chars.length) s.chars.forEach((c, i) => { const k = eout(clamp((t - t0 - i * (o.stag ?? .03)) / .42)); c.style.transform = `translateY(${(1 - k) * .55}em)`; c.style.opacity = k; c.style.filter = k < 1 ? `blur(${(1 - k) * 6}px)` : 'none'; });
    else el.style.filter = inn < 1 ? `blur(${(1 - inn) * 8}px)` : 'none', el.style.opacity = eout(inn) * (1 - out) * (o.alpha ? o.alpha(t) : 1);
    if (o.lead) { if (!s.ld) { s.ld = document.createElement('div'); s.ld.className = 'ld'; ov.appendChild(s.ld); } const ax0 = x - (o.dx || 0), ay0 = y - (o.dy ?? -80); const lx = x, ly = y; const dx = lx - ax0, dy = ly - ay0; const L = Math.hypot(dx, dy); s.ld.style.display = L > 4 ? 'block' : 'none'; s.ld.style.width = L + 'px'; s.ld.style.transform = `translate(${ax0}px,${ay0}px) rotate(${Math.atan2(dy, dx)}rad)`; s.ld.style.opacity = el.style.opacity; }
    if (o.update) o.update(t, el);
  }
}
const vv = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// A compact opening and grouped explanation cards; full phrases enter together.
tx(.2, 17.2, 'Electric-double-layer gating', { cls: 'h', y: 105, split: false });
tx(.4, 17.2, 'The same channel control. A lower gate voltage.', { cls: 'sub', y: 190, split: false });
const CAPS = [];
function cap(s0, s1, html) { CAPS.push([s0, s1, html]); return tx(s0, s1, html, { cls: 'cap', x: 110, y: 968, anchor: 0, split: false }); }
cap(4.4, 17.2, 'One gate controls a conducting channel.');
cap(26.729032258064516, 31.90943396226415, 'Replace the dielectric with mobile ions.');
cap(31.90943396226415, 44.0, 'Ions separate at the interfaces; the bulk stays nearly neutral.');
cap(44.0, 53.0, 'A nanometre-scale charge separation.');
cap(53.0, 60.4, 'Nanometre separation. High gate capacitance.');
cap(64.0, 78.0, 'The same channel charge. A much lower gate voltage.');
cap(78.0, 87.4, 'High-field stress can build a breakdown path.');
cap(87.4, 89.8, 'Lower operating voltage. Less high-voltage-related stress.');
// Component labels anchored to the device, with background plates.
tx(1.6, 22.2, 'Gate G', { at: vv(0, 1.15), obj: B.g, cls: 'l' });
tx(1.6, 22.2, 'Gate dielectric', { at: vv(-6.4, .35), obj: B.g, cls: 's' });
tx(1.6, 22.2, 'Source S (n⁺)', { at: vv(-6.4, -.75), obj: B.g, cls: 's' });
tx(1.6, 22.2, 'Drain D (n⁺)', { at: vv(6.4, -.75), obj: B.g, cls: 's' });
tx(1.6, 22.2, 'p-type substrate', { at: vv(0, -3.6), obj: B.g, cls: 's' });
// Let the formed channel flow steadily before the dimensional reveal.
tx(10.4, 22.2, 'Electrons S → D', { at: vv(0, -.55), obj: B.g, cls: 's cool', dy: 84 });
tx(10.4, 22.2, 'Current I<sub>DS</sub>: D → S', { at: vv(0, -.55), obj: B.g, cls: 's', split: false, dy: 138 });
// Early capacitor formula animations are omitted; the later interface/comparison retains them.
// Electrolyte.
tx(37.0, 44.0, 'Anions → gate interface', { at: vv(-2.6, 2.05), obj: B.g, cls: 'l an', lead: 1 });
tx(37.6, 44.0, 'Cations → surface<br><span class="detail">electrolyte side</span>', { at: vv(-1.6, .2), obj: B.g, cls: 'l cat', dx: -150, dy: -150, lead: 1 });
tx(39.0, 44.0, 'Induced electrons<br><span class="detail">semiconductor side</span>', { at: vv(1.6, -.2), obj: B.g, cls: 's cool', dx: 130, dy: 20, lead: 1 });
tx(41.2, 44.6, 'φ(y)', { at: vv(6.5, 2.75), obj: B.g, cls: 's' });
tx(41.6, 44.6, 'Voltage drops<br>at two interfaces', { at: vv(6.2, -.35), obj: B.g, cls: 's' });
// Scale indicator.
const scaleT = tx(44.2, 60.4, '', { x: 1700, y: 860, cls: 'k', split: false, update: (t, el) => { const h = camH; const nm = h / NM; const bar = nm / 6; const lab = bar >= 1000 ? (bar / 1000).toPrecision(2) + ' μm' : bar.toPrecision(2) + ' nm'; el.innerHTML = `<div style="width:${H / 6}px;height:3px;background:#24364a;margin-bottom:8px"></div>${lab}`; } });
tx(50.4, 60.0, 'Electric double layer', { cls: 'm', x: 120, y: 150, anchor: 0 });
tx(51.6, 60.0, 'Cation layer<br><span class="detail">electrolyte side</span>', { at: vv(4, .45, 6), obj: micro, cls: 'l cat', anchor: 0, dx: 60, dy: -130, lead: 1 });
tx(52.2, 60.0, 'Induced electrons<br><span class="detail">semiconductor side</span>', { at: vv(4, -.8, 6), obj: micro, cls: 'l cool', anchor: 0, dx: 60, dy: 30, lead: 1 });
tx(53.0, 60.0, 'd ≈ 1 nm', { at: vv(-1.6, -.05, 6), obj: micro, cls: 'f', anchor: 1, dx: -28 });
tx(55.0, 60.0, 'C = εA / <span id="dd" style="display:inline-block">d</span>', { cls: 'f', x: 120, y: 240, anchor: 0, split: false, update: (t, el) => { const k = ss(t, 55.6, 57); el.querySelector('#dd').style.transform = `scale(${1 - .55 * k}) translateY(${k * 8}px)`; } });
tx(55.4, 60.0, 'Strong local field at the interface', { cls: 's', x: 1800, y: 150, anchor: 1 });
// Device comparison.
tx(64.0, 77.6, 'Solid gate dielectric', { cls: 'l', x: 500, y: 860 });
tx(64.0, 77.6, 'EDL gating', { cls: 'l', x: 1420, y: 860 });
tx(64.0, 78.0, 'Same target ΔQ', { cls: 'm', y: 130 });
tx(66.2, 78.2, '', { at: () => vv(0, A.topY + A.colH + .7), obj: A.g, cls: 'l warm', split: false, update: (t, el) => el.innerHTML = `Required V<sub>G</sub>: high` });
tx(66.2, 78.2, '', { at: () => vv(0, B.topY + B.colH + .7), obj: B.g, cls: 'l cool', split: false, update: (t, el) => el.innerHTML = `Required V<sub>G</sub>: low` });
tx(70.8, 78.0, 'ΔV = ΔQ / C', { cls: 'f', x: 1800, y: 130, anchor: 1 });
tx(72.2, 78.0, 'C<sub>EDL</sub> ≫ C<sub>ox</sub>', { cls: 'f', x: 1800, y: 214, anchor: 1, split: false });
// Breakdown.
tx(78.6, 87.4, 'E ≈ V / d', { cls: 'f', x: 120, y: 150, anchor: 0 });
tx(81.0, 87.4, 'Defects accumulate', { at: vv(-2.5, .35, 3), obj: A.g, cls: 's warm', lead: 1 });
tx(85.0, 87.4, 'Breakdown path', { at: vv(.9, .35, 0), obj: A.g, cls: 'l warm', dx: -240, dy: 210, lead: 1 });
tx(87.4, 89.8, 'Lower operating gate voltage', { cls: 'm', x: 1800, y: 150, anchor: 1 });
// Boundary conditions.
const cav = ['Strong interfacial fields remain.', 'Intrinsic breakdown field: unchanged.', 'Electrochemical stability still limits bias.'];
tx(89.8, 96.2, 'Lower voltage has limits', { cls: 'm', x: 120, y: 108, anchor: 0 });
cav.forEach((s, i) => tx(89.8, 96.2, s, { cls: 'l', x: 120, y: 220 + i * 92, anchor: 0, split: false }));
// Closing thesis, with room to read it.
tx(96.4, 102, 'Higher capacitance → lower gate voltage<br>Less high-voltage stress for the same ΔQ.', { cls: 'cap', x: 960, y: 325, split: false });
tx(96.4, 102, 'Electric-double-layer gating', { cls: 'h', y: 170, split: false });
// Legend.
tx(4.4, 26.729032258064516, '<i class="dot" style="background:#2456c8"></i>Electrons −　<i class="ring"></i>Holes +　<i class="dot" style="background:#7a6fae"></i>Positive gate charge', { cls: 'leg', x: 1880, y: 1046, anchor: 1, split: false });
tx(26.729032258064516, 96.2, '<i class="dot" style="background:#c98a2b"></i>Cations +　<i class="dot" style="background:#3f8a62"></i>Anions −　<i class="dot" style="background:#2456c8"></i>Electrons −　<i class="ring"></i>Holes +　<i class="dot" style="background:#7a6fae"></i>Positive gate charge', { cls: 'leg', x: 1880, y: 1046, anchor: 1, split: false });

// ---------- Reading-time remapping: story time s to film time T ----------
// Showcase v5: one coordinated reveal; no separate onset gesture or restart.
const WS = [0,4.4,10,17.2,22.2,27.4,28.4,34.6,44,50.4,60.4,64,74,78,85,89.8,96.2,102];
const WT = [0,2.2,4.7,8.2,10,16.2,17.2,22.5,30,37,47,50.5,60,64,72,77,82.5,87];
DUR = WT[WT.length - 1];
// A local editorial time adjustment shortens the settled comparison by two
// seconds. Existing scene clocks stay intact, preserving the accepted shots.
// The speed returns continuously to normal at both ends of the adjustment.
function sourceAt(T) {
  if (T <= 60) return T;
  if (T >= 62) return T + 2;
  const u = (T - 60) / 2;
  return 60 + 2 * u + 2 * (3 * u * u - 2 * u * u * u);
}
function editedAt(T) {
  if (T <= 60) return T;
  if (T >= 64) return T - 2;
  let lo = 60, hi = 62;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (sourceAt(mid) < T) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
window.DUR = editedAt(DUR); window.WARP = { S: WS, T: WT.map(editedAt) };
function storyAt(T) { let i = 0; while (i < WT.length - 2 && T > WT[i + 1]) i++; return lerp(WS[i], WS[i + 1], clamp((T - WT[i]) / (WT[i + 1] - WT[i]))); }
function filmAt(s) {
  let i = 0; while (i < WS.length - 2 && s > WS[i + 1]) i++;
  return lerp(WT[i], WT[i + 1], clamp((s - WS[i]) / (WS[i + 1] - WS[i])));
}
// Integrate a positive velocity profile: begin gently, accelerate to 13.65 s, release by 16.2 s.
function integratedSmoothRamp(x, width) {
  if (x <= 0) return 0;
  if (x >= width) return x - width / 2;
  const u = x / width; return width * (u ** 6 - 3 * u ** 5 + 2.5 * u ** 4);
}
function revealAt(f) {
  const s = .55 * integratedSmoothRamp(f - 10, .4) + .45 * integratedSmoothRamp(f - 10.4, 3.25) - integratedSmoothRamp(f - 13.65, 2.55);
  return clamp(s / 3.90375);
}
function volumeAt(f) { return revealAt(f); }
// ---------- Timing functions ----------
function vgPhase1(t) { return ss(t, 4.4, 10.0) * 1.0; } // Normalized gate voltage during the opening.
// Camera keys: t, target x/y/z, yaw, pitch, visible height h, and field of view (angles in degrees).
const K = [
  [0, 0, -.6, 0, 0, 0, 10.5, 4],
  [22.2, 0, -.6, 0, 0, 0, 10.5, 4],
  [27.4, 0, .35, 0, 34, 17, 11.1, 34],
  [31.5, 0, .9, 0, 36, 15, 10.4, 34],
  [35, 0, 1.1, 0, 30, 14, 9.6, 34],
  [44, 0, 1.0, 0, 18, 11, 7.2, 34],
  [46.5, 0, .4, 0, 14, 12, 2.4, 38],
  [50.5, 0, .002, .06, 10, 17, .3, 40],
  [60, 0, .002, .06, -8, 13, .24, 40],
  [62.6, 2.5, -.2, 0, 8, 14, 10, 34],
  [66, 0, 2.5, 0, 14, 12, 25, 32],
  [78, 0, 2.5, 0, 10, 9, 24.8, 32],
  [80.5, -9.5, .3, 3, 20, 3, 2.4, 34],
  [86, -9.5, .3, 3, 14, 3, 3.2, 34],
  [89, 9.5, 1.4, 0, -22, 10, 9.5, 34],
  [96, 0, 4.0, 0, 6, 7, 28.5, 28],
  [101, 9.5, 1.0, 0, 0, 0, 21, 4],
  [102, 9.5, 1.0, 0, 0, 0, 21, 4]];
// Shape-preserving camera curves in film seconds: interior waypoints no longer
// force a fresh ease-in/out on every shot. Log-height keeps zoom perceptual.
const CK = K.filter(k => k[0] >= 44).map(k => [filmAt(k[0]), ...k.slice(1)]);
const CV = Array.from({ length: 7 }, (_, j) => CK.map(k => j === 5 ? Math.log(k[j + 1]) : k[j + 1]));
const CM = CV.map(v => {
  const h = CK.slice(1).map((k, i) => k[0] - CK[i][0]);
  const d = h.map((dt, i) => (v[i + 1] - v[i]) / dt);
  return v.map((_, i) => {
    // The accepted opening reaches 30 s at rest; the ending also settles.
    if (i === 0 || i === v.length - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
});
let camH = 10;
function camAt(t) {
  const f = filmAt(t);
  if (f <= 30) {
    const r = revealAt(f), track = ss(f, 15.0, 30);
    return { t, x: 0, y: -.6 + .95 * r + .65 * track, z: 0,
      yaw: 34 * r - 16 * track, pitch: 17 * r - 6 * track,
      h: Math.exp(Math.log(10.5) + Math.log(11.1 / 10.5) * r + Math.log(7.2 / 11.1) * track),
      fov: 4 + 30 * r };
  }
  let i = 0; while (i < CK.length - 2 && f > CK[i + 1][0]) i++;
  const dt = CK[i + 1][0] - CK[i][0], u = seg(f, CK[i][0], CK[i + 1][0]);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const o = { t };
  ['x', 'y', 'z', 'yaw', 'pitch', 'h', 'fov'].forEach((n, j) => {
    const value = h00 * CV[j][i] + h10 * dt * CM[j][i] + h01 * CV[j][i + 1] + h11 * dt * CM[j][i + 1];
    o[n] = n === 'h' ? Math.exp(value) : value;
  });
  return o;
}
function placeCam(t) {
  const c = camAt(t); { const pk = ss(t, 84.55, 84.95) * (1 - ss(t, 85.3, 86.8)); c.h *= 1 - .58 * pk; c.x = lerp(c.x, -9.5 + fx, .7 * pk); const sk = t > 85 && t < 87 ? Math.exp(-(t - 85) * 4.5) : 0; c.x += sk * .05 * c.h * Math.sin(t * 93); c.y += sk * .04 * c.h * Math.cos(t * 71); } camH = c.h;
  // Subtle two-sine camera drift, nearly zero in the 2D and microscopic sections.
  const hand = (t > 34.6 && t < 96) ? .15 : 0;
  const yaw = (c.yaw + Math.sin(t * .37) * .6 * hand) * Math.PI / 180, pit = (c.pitch + Math.sin(t * .29 + 1) * .4 * hand) * Math.PI / 180;
  const dist = c.h / (2 * Math.tan(c.fov * Math.PI / 360));
  cam.fov = c.fov; cam.position.set(c.x + dist * Math.sin(yaw) * Math.cos(pit), c.y + dist * Math.sin(pit), c.z + dist * Math.cos(yaw) * Math.cos(pit));
  cam.lookAt(c.x, c.y, c.z); cam.near = dist * .02; cam.far = dist * 20 + 200; cam.updateProjectionMatrix();
  fill.position.copy(cam.position);
  key.position.set(6, 10, 8);
}

// Device state.
function layoutDevice(d, st) {
  const dz = st.dz, top = st.thick, gH = .8;
  setBox(d.sub, -8, 8, -5, 0, dz); setBox(d.S, -8.004, -GX, -1.45, 0.004, dz + .03); setBox(d.D, GX, 8.004, -1.45, 0.004, dz + .03);
  const cz = (st.cut || 0) * dz; setBox(d.diel, -GX, GX, 0, top, dz); setBox(d.gel, -GX, GX, 0, top, dz - cz); d.gel.position.z = -cz / 2;
  setBox(d.gate, -GX, GX, top, top + gH, dz - cz); d.gate.position.z = -cz / 2;
  setBox(d.cS, -7.4, -5.2, 0, .32, dz * .7); setBox(d.cD, 5.2, 7.4, 0, .32, dz * .7);
  d.topY = top + gH;
  const flat = st.flat;
  [d.sub, d.S, d.D, d.diel, d.gel, d.gate, d.cS, d.cD].forEach((p, k) => { const u = p.userData; const al = st.t !== undefined ? st.alpha * ss(st.t, .15 + [0, 1, 1, 2, 2, 3, 4, 4][k] * .38, .75 + [0, 1, 1, 2, 2, 3, 4, 4][k] * .38) : st.alpha; const fillA = st.t !== undefined ? ss(st.t, 1.4 + k * .1, 2.8 + k * .1) : 1; u.m.emissiveIntensity = flat * (u.m.metalness > .5 ? .1 : .3); u.lm.opacity = (.9 * flat + .22) * al; u.m.opacity = u.base * st.alpha * fillA * al; u.m.transparent = true; u.m.depthWrite = u.base >= 1 && st.alpha > .99; });
  d.diel.userData.m.opacity = .48 * (1 - st.gelK) * st.alpha; d.diel.userData.lm.opacity *= (1 - st.gelK);
  d.gel.userData.m.opacity = .16 * st.gelK * st.alpha;
  // The transparent electrolyte already describes its volume; a second box
  // outline reads as a leftover boundary when the cutaway moves forward.
  d.gel.userData.lm.opacity = 0;
  if (st.see) [d.sub, d.S, d.D].forEach(p => { const u = p.userData; u.m.opacity *= 1 - .55 * st.see; u.m.depthWrite = st.see < .01; });
  d.g.visible = st.alpha > .002;
}
// Integrate a smooth velocity ramp. Stopping holds phase instead of rewinding it.
function integratedRamp(x, width) {
  if (x <= 0) return 0;
  if (x >= width) return x - width / 2;
  const u = x / width; return width * (u * u * u - .5 * u * u * u * u);
}
function channelFlowClock(t) {
  const f = filmAt(t);
  return integratedRamp(f - 6.15, .65) - integratedRamp(f - 16.15, 1.2);
}
function channelElectronPosition(p, fill, drift) {
  const k = eio(clamp((fill - p.r * .55) / .45));
  const span = 15;
  const phaseX = ((p.tx + 7.5 + drift * 1.8) % span + span) % span - 7.5;
  return { x: lerp(p.ox, phaseX, k), y: lerp(p.oy, p.ty, k), k };
}
function particles(d, t, st) {
  const dz = st.dz * .94, s = st.ps; // Particle scale.
  // Reservoir electrons in the n+ source and drain.
  for (let i = 0; i < d.NR; i++) { const p = d.ro[i]; put(d.res, i, p.x + jit(i, t) * .04, p.y + jit(i + 9, t) * .04, p.z * dz, .062 * s * st.alpha); }
  // Channel electrons.
  for (let i = 0; i < d.NE; i++) {
    const p = d.eo[i]; const { x, y, k } = channelElectronPosition(p, st.fill, st.drift);
    const edge = smr(clamp((7.6 - Math.abs(x)) / .6));
    put(d.el, i, x, y + jit(i + 3, filmAt(t), 1.3) * .012, p.z * dz, .072 * s * (k > 0 ? 1 : .0001) * edge * st.alpha);
  }
  // Holes.
  const depl = 1.5 * st.vn;
  for (let i = 0; i < d.NH; i++) {
    const p = d.hp[i]; const sx = smr(clamp((GX + .6 - Math.abs(p.x)) / 1.2));
    const y = p.y - depl * Math.exp(p.y / 1.2) * sx;
    V3.set(p.x + jit(i, t) * .05, y + jit(i + 5, t) * .05, p.z * dz); S3.setScalar(.085 * s * st.alpha); M4.compose(V3, Q0, S3); d.ho.setMatrixAt(i, M4);
  }
  // Positive charge at the gate's lower surface.
  const ng = Math.round(d.NG * clamp(st.gq));
  for (let i = 0; i < d.NG; i++) { const c = i % 18, r = Math.floor(i / 18); const sc = i < ng ? 1 : 0.0001; put(d.gq, i, -GX + (c + .5) / 18 * 2 * GX, st.thick - .06, ((r + .5) / 4) * dz * (1 - (st.cut || 0)) - dz / 2, (d.kind === 'ox' ? .1 : .07) * s * sc * st.alpha); }
  // Field direction cues travel downward at film-time speed, fading before they restart.
  const fpA = d.field.geometry.attributes.position.array, fcA = d.field.geometry.attributes.color.array;
  const fieldT = filmAt(t); let n = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 26; c++) {
    const phase = ((fieldT / (2.05 + .23 * Math.sin(c * 2.73 + r)) + c * .618033989 + r * .381966011) % 1 + 1) % 1;
    const x = -GX + (c + .5) / 26 * 2 * GX + .075 * Math.sin(c * 2.39 + r * 1.17);
    const z = (((r + .5) / 5 - .5) + .023 * Math.sin(c * 1.91 + r * 2.71)) * dz;
    const show = (c / 26 < st.fdens || st.fdens >= 1) && c % 2 === 0 && (st.flat > .5 ? r === 2 : r % 2 === 0);
    const y0 = .90 * st.thick, end = .12 * st.thick, length = .33 * st.thick;
    const tip = lerp(y0 - length, end, phase), tail = tip + length;
    const wingY = tip + Math.min(.12, .12 * st.thick), wingX = Math.min(.075, .085 * st.thick);
    const pulse = .95 * ss(phase, 0, .14) * (1 - ss(phase, .80, 1));
    if (show) {
      fpA.set([x, y0, z, x, end, z, x, tail, z, x, tip, z, x - wingX, wingY, z, x, tip, z, x + wingX, wingY, z, x, tip, z], n * 24);
    } else {
      fpA.fill(0, n * 24, (n + 1) * 24);
      for (let v = 0; v < 8; v++) fpA[n * 24 + v * 3 + 1] = -99;
    }
    for (let v = 0; v < 8; v++) fcA.set([1, 1, 1, show ? (v < 2 ? .28 : pulse) : 0], n * 32 + v * 4);
    n++;
  }
  d.field.geometry.attributes.position.needsUpdate = true; d.field.geometry.attributes.color.needsUpdate = true;
  d.fieldM.opacity = st.fop * st.alpha;
  d.fieldM.color.set(st.fhot > 0 ? new THREE.Color('#46515c').lerp(new THREE.Color('#d9480f'), st.fhot) : '#46515c');
  [d.el, d.res, d.ho, d.gq].forEach(m => { m.instanceMatrix.needsUpdate = true; m.material.opacity = st.alpha; });
  // Voltage column.
  d.colH = Math.max(.001, st.col); d.col.scale.set(1, d.colH, 1); d.col.position.set(0, d.topY + d.colH / 2 + .05, 0);
  d.colGlass.scale.set(1, Math.max(.001, st.colMax), 1); d.colGlass.position.set(0, d.topY + st.colMax / 2 + .05, 0);
  d.col.visible = d.colGlass.visible = st.col > .002;
}

// Fixed transparency ordering (v3.2): the InstancedMesh bounding sphere is computed on first render.
// Otherwise, sorting depends on the browser's frame history and can flicker across render workers.
scene.traverse(o => { if (o.isInstancedMesh) { o.renderOrder = o.material.depthWrite ? 1 : 3; o.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); } });
mshell.renderOrder = 4; surf.renderOrder = 2; mfL.renderOrder = 5;
window.render = function (T) {
  const presentationTime = T;
  T = sourceAt(clamp(T, 0, window.DUR));
  let t = storyAt(clamp(T, 0, DUR));
  placeCam(t);
  // ---- Macroscopic state of the main device ----
  const ext = volumeAt(T) * (1 - ss(t, 96.4, 101));               // Reveal volume while electrons retain an independent clock.
  const flat = 1 - volumeAt(T) + ss(t, 97, 101);                  // Flat-view blend.
  const draw = ss(t, .2, 2.6);
  const gelK = ss(T, 15.4, 18.55);
  const thick = lerp(.7, 2.4, ss(T, 15.4, 18.8));
  const bias = ss(T, 19.4, filmAt(41.4));                         // Apply bias after showing the neutral electrolyte.
  // Bring the surface detail in during the approach, before the close-up fills the frame.
  const microK = (t > 44 && t < 63) ? 1 - ss(camH, .45, 1.1) : 0;
  const slide = eio(ss(t, 60.5, 66));
  const Qc = ss(t, 66.6, 73.6);                                       // Common delta Q for the comparison.
  // Opening gate bias and channel.
  const vn1 = vgPhase1(t) * (1 - ss(T, 15.8, 17.4));
  const fill1 = ss(T, 4.7, 6.5) * (1 - ss(T, 15.8, 17.8));
  const fillB = Math.max(fill1, bias * (1 - ss(t, 61, 63.5)), Qc, ss(t, 88, 90) * (1 - ss(t, 99, 101)));
  const fillA = Math.max(Qc, ss(t, 78, 79));
  const driftT = channelFlowClock(t);
  const alphaB = ss(t, 2.4, 3.6);
  const cutB = ss(T, 17.4, 20.0) / 3 * (1 - ss(t, 96.4, 98.5));
  layoutDevice(B, { dz: lerp(.04, 6, ext), thick, flat, alpha: 1, gelK, t: t < 5 ? t : undefined, see: ss(t, 33, 35), cut: cutB });
  { const dzB = lerp(.04, 6, ext); grid.scale.set(1, 1, dzB / 2); grid.position.y = .004; gridM.opacity = .22 * ss(T, 17.8, 20.6) * (1 - ss(t, 96.4, 98)) * (t > 44 && t < 63 ? ss(camH, .8, 2) : 1); }
  const vnB = Math.max(vn1, bias * .25, Qc * .12, t > 78 ? .12 : 0);
  // Complete one 18-marker row for the flat closing illustration. The earlier
  // low-density 3D comparison and all voltage/channel states remain unchanged.
  const closingGateMarkers = 18 / B.NG * ss(t, 96.4, 99.2);
  const gateMarkersB = Math.max(Math.max(vn1, bias) * (1 - ss(t, 61, 63.5)) + Qc * .2 * (t > 63.5 ? 1 : 0), closingGateMarkers);
  particles(B, t, { cut: cutB, dz: lerp(.04, 6, ext), ps: lerp(1.25, 1, ext) * (1 - microK * .97), fill: fillB, drift: driftT, vn: Math.max(vn1, bias), gq: gateMarkersB, thick, flat, alpha: alphaB * (1 - microK) * (t > 44 && t < 62 ? ss(camH, 1.2, 2.2) : 1), fdens: vn1 * 1.05, fop: (t < 28.5 ? .85 * vn1 : 0), fhot: 0, col: t > 64 ? Qc * .55 : 0, colMax: t > 64 ? 6.4 * ss(t, 64, 66) : 0 });
  B.g.position.x = 9.5 * slide;
  { const mk = microK; [B.sub, B.S, B.D].forEach(p => { p.userData.m.opacity *= (1 - .85 * mk); p.userData.m.depthWrite = mk < .01 && t <= 33; p.userData.lm.opacity *= (1 - mk); }); B.gel.userData.m.opacity *= (1 - mk); B.gel.userData.lm.opacity *= (1 - mk); }
  // Main lighting is reduced in the 2D view.
  hemi.intensity = .85 + .35 * flat;
  key.intensity = .6 + 1.5 * (1 - flat);
  rim.intensity = .8 * (1 - flat);
  fill.intensity = .4 + .5 * flat;
  // ---- Mesoscopic ions ----
  const mesoK = ss(camH, .38, .8) ; const ionsVis = gelK * (t > 44 && t < 62 ? mesoK : 1) * (1 - ss(t, 96.5, 98.5));
  const biasI = Math.max(bias * (1 - ss(t, 61, 64)), t > 64 ? Math.max(Qc, ss(t, 78, 79)) * (1 - ss(t, 98, 101)) : 0);
  const dzI = lerp(.04, 6, ext) * .92; const zMap = z => (z + .5) * (dzI * (1 - cutB)) - dzI / 2;
  for (let i = 0; i < NI; i++) {
    const p = ions[i]; const dl = clamp((biasI - p.r * .35) / .65); const k = eio(dl);
    let cx = p.cx, cy = p.cy, cz = p.cz, ax = p.ax, ay = p.ay, az = p.az;
    if (i < EXC) { const sl = layerSlot(i, EXC); cx = lerp(p.cx, sl.x, k); cy = lerp(p.cy * thick / 2.4, .12, k); cz = lerp(p.cz, sl.z, k); ax = lerp(p.ax, sl.x + .17, k); ay = lerp(p.ay * thick / 2.4, thick - .16, k); az = lerp(p.az, sl.z, k); }
    else { cy = p.cy * thick / 2.4; ay = p.ay * thick / 2.4; }
    const j = i < EXC ? .25 + .75 * (1 - k) : 1; const lay = i < EXC ? 1 + .35 * k : 1 - .3 * biasI;
    V3.set(cx, cy, zMap(cz)); B.g.localToWorld(V3); const cd = V3.distanceTo(cam.position); const near = smr(clamp((cd - camH * .9) / (camH * .6)));
    put(cat, i, cx + jit(i, t, .8) * .05 * j, cy + jit(i + 1, t, .8) * .04 * j, zMap(cz), .065 * ionsVis * lay * near);
    put(an, i, ax + jit(i + 7, t, .8) * .05 * j, ay + jit(i + 8, t, .8) * .04 * j, zMap(az), .078 * ionsVis * lay * near);
  }
  cat.instanceMatrix.needsUpdate = an.instanceMatrix.needsUpdate = true;
  // φ(y)
  const phiK = ss(t, 40.8, 42.8) * (1 - ss(t, 46, 47.5));
  { const a = phiG.attributes.position.array; for (let i = 0; i < phiN; i++) { const y = i / (phiN - 1) * thick; const phi = .5 + .48 * Math.exp(-(thick - y) / .1) - .42 * Math.exp(-y / .1); const drawn = i / phiN <= ss(t, 40.8, 42.6) ? 1 : 0; a.set([5.1 + phi * 2.0 * bias, drawn ? y : thick, zMap(.5) + .01], i * 3); } phiG.attributes.position.needsUpdate = true; phiM.opacity = phiK;
    { const zf = zMap(.5); axG.attributes.position.array.set([5.1, 0, zf, 5.1, thick, zf, 5.1, 0, zf, 7.4, 0, zf]); } axG.attributes.position.needsUpdate = true; axM.opacity = phiK * .8; }
  // ---- Microscopic interface ----
  micro.visible = microK > .002;
  if (micro.visible) {
    lat.material.opacity = microK; surfM.opacity = .35 * microK;
    for (let i = 0; i < NCL; i++) { const p = clp[i]; const arr = eout(clamp((t - 45.5 - p.r * 2.2) / 1.6)); const y = lerp(p.y0, .45, arr); put(mcat, i, p.x + jit(i, t, 2) * .06, y + jit(i + 2, t, 2) * .05, p.z + jit(i + 4, t, 2) * .06, .33); put(mshell, i, p.x + jit(i, t, 2) * .06, y + jit(i + 2, t, 2) * .05, p.z + jit(i + 4, t, 2) * .06, .58); }
    for (let i = 0; i < NME; i++) { const p = mep[i]; put(mel, i, p.x + jit(i, t, 3) * .15, p.y + jit(i + 1, t, 3) * .08, p.z + jit(i + 2, t, 3) * .15, .26); }
    for (let i = 0; i < NMB; i++) { const p = mbp[i]; put(mbc, i, p.x + jit(i, t, 1.4) * .4, p.y + jit(i + 1, t, 1.4) * .4, p.z + jit(i + 2, t, 1.4) * .4, .33); put(mba, i, p.x2 + jit(i + 5, t, 1.4) * .4, p.y2 + jit(i + 6, t, 1.4) * .4, p.z2 + jit(i + 7, t, 1.4) * .4, .4); }
    [mcat, mshell, mel, mbc, mba].forEach(m => { m.instanceMatrix.needsUpdate = true; });
    mcat.material.opacity = mbc.material.opacity = mba.material.opacity = microK; mshell.material.opacity = .1 * microK; mel.material.opacity = .5 * microK;
    const fa = mfG.attributes.position.array; for (let i = 0; i < NMF; i++) { const p = mfp[i]; const ph = (t * .9 + p.ph) % 1; const y0 = .15 - ph * .9; fa.set([p.x, y0, p.z, p.x, y0 - .18, p.z], i * 6); } mfG.attributes.position.needsUpdate = true;
    mfM.opacity = .55 * ss(t, 54.6, 56) * microK; brM.opacity = ss(t, 52.8, 53.6) * microK;
  }
  if (micro.visible) { let n = 0; for (let i = 0; i < NCL && n < signC.length; i++) { const p = clp[i]; if (p.z < 2 || p.z > 9 || Math.abs(p.x) > 9 || i % 3) continue; mcat.getMatrixAt(i, M4); V3.setFromMatrixPosition(M4); signC[n].position.copy(V3); signC[n].position.z += .34; signC[n].material.opacity = microK; n++; } for (; n < signC.length; n++) signC[n].visible = false; }
  // ---- Reference device ----
  const aIn = ss(t, 60.8, 66) * (1 - ss(t, 96.4, 99.6));
  A.g.position.x = lerp(-24, -9.5, eio(ss(t, 60.8, 66)));
  const VA = Qc * 6.0, hotA = ss(t, 79, 85);
  layoutDevice(A, { dz: 6 * (t < 97 ? 1 : 1 - ss(t, 97, 101) * .99), thick: .7, flat: ss(t, 97, 101), alpha: aIn, gelK: 0, see: 1 - ss(t, 96, 97.5) });
  particles(A, t, { dz: 6, ps: 1, fill: fillA, drift: 0, vn: Math.max(Qc, t > 78 ? 1 : 0), gq: Math.max(Qc, t > 78 ? 1 : 0), thick: .7, flat: 0, alpha: aIn, fdens: Math.max(Qc, t > 78 ? 1 : 0), fop: (.5 + .5 * hotA) * Math.max(Qc, t > 78 ? 1 : 0), fhot: hotA, col: t > 64 ? VA * (1 - ss(t, 96, 98)) : 0, colMax: t > 64 ? 6.4 * ss(t, 64, 66) * (1 - ss(t, 96, 98)) : 0 });
  if (B.col.visible) B.col.scale.y = Math.max(.001, B.colH * (1 - ss(t, 96, 98))), B.colGlass.scale.y *= (1 - ss(t, 96, 98));
  for (let i = 0; i < ND; i++) { const p = dp[i]; const k = eout(seg(t, p.t, p.t + .3)) * (1 - ss(t, 88, 90)); put(defs, i, p.x, p.y, p.z, .05 * k * (p.chain ? 1.2 : 1)); }
  defs.instanceMatrix.needsUpdate = true;
  const grow = eout(seg(t, 84.6, 85.0)) * (1 - ss(t, 88, 89.6)); const fk = seg(t, 85, 85.06) * (1 - ss(t, 85.1, 86.6));
  const nIdx = coreG.index.count; coreG.setDrawRange(0, Math.floor(nIdx * grow / 6) * 6); haloG.setDrawRange(0, Math.floor(haloG.index.count * grow / 6) * 6);
  const after = ss(t, 85.4, 86.5);
  coreM.opacity = grow > 0 ? clamp(.7 + fk) * (1 - after * .55) : 0; coreM.color.set(new THREE.Color('#fff6e0').lerp(new THREE.Color('#5a1d0c'), after));
  haloM.opacity = grow > 0 ? (.35 + .65 * fk) * (1 - after * .8) : 0;
  crM.opacity = ss(t, 85.0, 85.5) * (1 - ss(t, 88, 89.6)); crG.setDrawRange(0, Math.floor(96 * ss(t, 85.0, 85.6) / 2) * 2);
  filM.opacity = 0; flash.intensity = 120 * fk + 18 * grow * (1 - after) * (1 + Math.sin(t * 97) * .5);
  flashDiv.style.opacity = (.9 * fk).toFixed(3);
  if (fk > 0) { const sp = toScreen(vv(fx, .35, .05), A.g); flashDiv.style.background = `radial-gradient(50% 55% at 61% 40%,rgba(255,150,60,.8),rgba(255,120,40,.25) 40%,rgba(255,255,255,0) 75%)`; }
  renderer.domElement.style.filter = fk > 0 ? `brightness(${(1 + .55 * fk).toFixed(3)}) contrast(${(1 + .25 * fk).toFixed(3)}) saturate(${(1 + .4 * fk).toFixed(3)})` : 'none';
  // Depth fog for the microscopic view.
  if (microK > 0) { const dist = camH / (2 * Math.tan(cam.fov * Math.PI / 360)); scene.fog = scene.fog || new THREE.Fog(FOGC, 1, 2); scene.fog.near = dist * .9; scene.fog.far = dist * 2.0; } else scene.fog = null;
  renderer.render(scene, cam);
  drawText(t);
  if (REVIEW) {
    const a = B.el.instanceMatrix.array;
    window.REVIEW_STATE = {
      film: presentationTime, sourceFilm: T, story: t, ext, dz: lerp(.04, 6, ext), drift: driftT, gelK, thick, bias, cutB,
      camera: { ...camAt(t), position: cam.position.toArray() },
      channelElectrons: Array.from({ length: B.NE }, (_, i) => ({ x: a[i * 16 + 12], y: a[i * 16 + 13], z: a[i * 16 + 14], radius: a[i * 16] })),
    };
  }
};

// Sound events share the scene timeline; audio/score.py reads the exported timeline JSON.
window.EV = [
  {
    "t": 0.2,
    "type": "draw",
    "dur": 2.4
  },
  {
    "t": 4.4,
    "type": "field",
    "dur": 5.6
  },
  {
    "t": 6.6,
    "type": "gather",
    "dur": 3.8
  },
  {
    "t": 10,
    "type": "hit"
  },
  {
    "t": 11.6,
    "type": "drift",
    "dur": 5.6
  },
  {
    "t": 17.8,
    "type": "glass"
  },
  {
    "t": 19.4,
    "type": "glass2"
  },
  {
    "t": 22.2,
    "type": "extrude",
    "dur": 5.2
  },
  {
    "t": 24,
    "type": "glass"
  },
  {
    "t": 26.729032258064514,
    "type": "lift",
    "dur": 3.542665855143035
  },
  {
    "t": 27.232258064516127,
    "type": "gel",
    "dur": 2.746987218502742
  },
  {
    "t": 30.973584905660378,
    "type": "ions",
    "dur": 10.426415094339621
  },
  {
    "t": 41.4,
    "type": "edl"
  },
  {
    "t": 44.5,
    "type": "riser",
    "dur": 5.8
  },
  {
    "t": 50.3,
    "type": "arrive"
  },
  {
    "t": 53,
    "type": "tick"
  },
  {
    "t": 55.6,
    "type": "glass"
  },
  {
    "t": 60.3,
    "type": "pullout",
    "dur": 5.5
  },
  {
    "t": 66.6,
    "type": "columns",
    "dur": 7
  },
  {
    "t": 72.2,
    "type": "glass"
  },
  {
    "t": 79,
    "type": "stress",
    "dur": 6
  },
  {
    "t": 80,
    "type": "defects",
    "dur": 5
  },
  {
    "t": 84.6,
    "type": "zap",
    "dur": 0.4
  },
  {
    "t": 85,
    "type": "break"
  },
  {
    "t": 89.6,
    "type": "calm"
  },
  {
    "t": 96.4,
    "type": "flatten",
    "dur": 4.6
  },
  {
    "t": 98.2,
    "type": "end"
  }
];
document.fonts.ready.then(() => { window.render(0); window.READY = true; });
