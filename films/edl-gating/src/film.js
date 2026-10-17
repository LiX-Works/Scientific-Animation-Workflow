// 《离子电双层栅控降低晶体管击穿风险的物理原理》 — 画面 = render(t) 纯函数
import * as THREE from 'three';
const W = 1920, H = 1080;
const STORY = 102; let DUR = 102;

// ---------- 工具 ----------
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

// ---------- 渲染器 ----------
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
  sub: '#c4cfdb', nplus: '#9fbbdc', ox: '#ffffff', gel: '#a9d8d0', gate: '#8c9aab',
  e: '#2456c8', h: '#d1495b', cat: '#c98a2b', an: '#3f8a62', gq: '#7a6fae', edge: '#33465c', lat: '#9aa8ba'
};

// ---------- 器件（可动态改变尺寸的盒子） ----------
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitEdges = new THREE.EdgesGeometry(unitBox);
function part(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .55, metalness: o.metal ?? 0, transparent: !!o.transparent, opacity: o.opacity ?? 1, emissive: new THREE.Color(color), emissiveIntensity: 0, depthWrite: !o.transparent });
  const mesh = new THREE.Mesh(unitBox, m);
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

const GX = 4.6; // 栅宽一半
function makeDevice(kind) {
  const d = { kind, g: new THREE.Group() };
  d.sub = part(C.sub); d.S = part(C.nplus); d.D = part(C.nplus);
  d.diel = part(C.ox, { transparent: true, opacity: .42, rough: .2 });
  d.gel = part(C.gel, { transparent: true, opacity: .0, rough: .1 });
  d.gate = part(C.gate, { metal: .25, rough: .68 });
  d.cS = part('#a9b4c1', { metal: .25, rough: .62 }); d.cD = part('#a9b4c1', { metal: .25, rough: .62 });
  [d.sub, d.S, d.D, d.diel, d.gel, d.gate, d.cS, d.cD].forEach(p => d.g.add(p));
  // 载流子
  d.NE = 150; d.el = inst(sphereG, C.e, d.NE, { em: .15 }); d.g.add(d.el);
  d.eo = []; for (let i = 0; i < d.NE; i++) { const side = i % 2 ? 1 : -1; d.eo.push({ ox: side * (5 + R() * 2.8), oy: -.25 - R() * 1.05, tx: -4.4 + R() * 8.8, ty: -.07 - R() * .17, z: R() - .5, r: R(), sp: .92 + R() * .16, u: (i + R() * .8) / d.NE }); }
  d.NR = 70; d.res = inst(sphereG, C.e, d.NR, { em: .15 }); d.g.add(d.res);
  d.ro = []; for (let i = 0; i < d.NR; i++) { const side = i % 2 ? 1 : -1; d.ro.push({ x: side * (4.8 + R() * 3.1), y: -.15 - R() * 1.15, z: R() - .5 }); }
  d.NH = 170; d.ho = inst(torusG, C.h, d.NH, { em: .15 }); d.g.add(d.ho);
  d.hp = []; for (let i = 0; i < d.NH; i++) { let x = -7.7 + R() * 15.4; d.hp.push({ x, y: -1.75 - R() * 3.1, z: R() - .5 }); }
  for (let i = 0; i < 60; i++) d.hp[i].y = -.3 - R() * 1.6, d.hp[i].x = -4.3 + R() * 8.6; // 表面附近的空穴
  d.NG = 72; d.gq = inst(sphereLo, C.gq, d.NG, { em: .1, rough: .45 }); d.g.add(d.gq);
  // 场线（介质内竖直短线）
  d.NF = 26 * 5; const fp = new Float32Array(d.NF * 6); const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  d.fieldM = new THREE.LineBasicMaterial({ color: '#33475e', transparent: true, opacity: 0 }); d.field = new THREE.LineSegments(fg, d.fieldM); d.field.frustumCulled = false; d.g.add(d.field);
  // 电压柱
  d.col = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 1, 32), new THREE.MeshStandardMaterial({ color: '#e8590c', emissive: new THREE.Color('#e8590c'), emissiveIntensity: .25, roughness: .3, transparent: true, opacity: .9 }));
  d.colGlass = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: .35, roughness: .05, side: THREE.DoubleSide, depthWrite: false }));
  d.g.add(d.col, d.colGlass);
  scene.add(d.g);
  return d;
}
const B = makeDevice('edl');   // 主角：开场的晶体管，之后它的介质变为电解质
const A = makeDevice('ox');    // 对照：传统固体栅介质（后段滑入）

// 电解质离子（介观）
const NI = 230;
const cat = inst(sphereG, C.cat, NI, { em: .12 }), an = inst(sphereG, C.an, NI, { em: .12 });
B.g.add(cat, an);
const ions = [];
for (let i = 0; i < NI; i++) ions.push({ cx: -4.4 + R() * 8.8, cy: .12 + R() * 2.16, cz: R() - .5, ax: -4.4 + R() * 8.8, ay: .12 + R() * 2.16, az: R() - .5, r: R() });
// 被吸附进界面层的“过剩”离子：前 26% 的阳离子 → 底部，前 26% 的阴离子 → 顶部
const EXC = Math.floor(NI * .26);
function layerSlot(i, n) { const cols = 26; const rows = Math.ceil(n / cols); const c = i % cols, r = Math.floor(i / cols); return { x: -4.3 + (c + .5) / cols * 8.6 + (r % 2) * .15, z: (r + .5) / rows - .5 }; }

// 界面坐标底面网格（电解质/半导体界面）
const gridG = new THREE.BufferGeometry(); { const a = []; for (let x = -8; x <= 8.001; x += .8) a.push(x, 0, -1, x, 0, 1); for (let k = 0; k <= 10; k++) { const z = -1 + k * .2; a.push(-8, 0, z, 8, 0, z); } gridG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); }
const gridM = new THREE.LineBasicMaterial({ color: '#2c4560', transparent: true, opacity: 0, depthWrite: false }); const grid = new THREE.LineSegments(gridG, gridM); grid.frustumCulled = false; grid.renderOrder = 2; B.g.add(grid);
// φ(y) 曲线
const phiN = 120; const phiG = new THREE.BufferGeometry(); phiG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(phiN * 3), 3));
const phiM = new THREE.LineBasicMaterial({ color: '#14202e', transparent: true, opacity: 0 }); const phiL = new THREE.Line(phiG, phiM); phiL.frustumCulled = false; B.g.add(phiL);
const axG = new THREE.BufferGeometry(); axG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); const axM = new THREE.LineBasicMaterial({ color: '#6b7c90', transparent: true, opacity: 0 }); const axL = new THREE.LineSegments(axG, axM); axL.frustumCulled = false; B.g.add(axL);

// ---------- 微观界面（单位：nm，整体缩放） ----------
const NM = .02; // 1 nm 在世界中的长度
const micro = new THREE.Group(); micro.scale.setScalar(NM); B.g.add(micro);
const latPts = []; for (let x = -18; x <= 18; x += .72) for (let z = -14; z <= 10; z += .72) for (let y = -.45; y > -6.5; y -= .72) latPts.push([x + (Math.round(y / .72) % 2) * .36, y, z]);
const lat = inst(sphereLo, C.lat, latPts.length, { em: .05, rough: .6, metal: .1 }); micro.add(lat);
latPts.forEach((p, i) => put(lat, i, p[0], p[1], p[2], .15));
const NCL = 36 * 24; const mcat = inst(sphereG, C.cat, NCL, { em: .12 }); const mshell = inst(sphereLo, '#f7e3b5', NCL, { em: .1, opacity: .1, dw: false }); micro.add(mcat, mshell);
const clp = []; for (let r = 0; r < 24; r++) for (let c = 0; c < 36; c++) clp.push({ x: -17.5 + c * 1.0 + (r % 2) * .5 + (R() - .5) * .25, z: -13.5 + r * 1.0 + (R() - .5) * .25, y0: 2 + R() * 9, r: R() });
const NME = 820; const mel = inst(sphereLo, C.e, NME, { em: .3, opacity: .6, dw: false }); micro.add(mel);
const mep = []; for (let i = 0; i < NME; i++) mep.push({ x: -18 + R() * 36, z: -14 + R() * 24, y: -.35 - Math.pow(R(), 1.8) * 1.4 });
// 近景离子上的 +/− 标记
function signTex(ch, col) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = col || '#ffffff'; g.font = 'bold 110px DejaVu Sans'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70); return new THREE.CanvasTexture(c); }
const plusM = new THREE.SpriteMaterial({ map: signTex('+', '#4a3000'), transparent: true, depthTest: false }), minusM = new THREE.SpriteMaterial({ map: signTex('−'), transparent: true, depthTest: false });
const signC = [], signA = [];
for (let k = 0; k < 40; k++) { const sp = new THREE.Sprite(plusM); sp.scale.setScalar(.5); sp.renderOrder = 8; micro.add(sp); signC.push(sp); }
const NMB = 150; const mbc = inst(sphereG, C.cat, NMB, { em: .12 }), mba = inst(sphereG, C.an, NMB, { em: .12 }); micro.add(mbc, mba);
const mbp = []; for (let i = 0; i < NMB; i++) mbp.push({ x: -18 + R() * 36, y: 3 + R() * 14, z: -14 + R() * 24, x2: -18 + R() * 36, y2: 3 + R() * 14, z2: -14 + R() * 24 });
const NMF = 400; const mfG = new THREE.BufferGeometry(); mfG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NMF * 6), 3));
const mfM = new THREE.LineBasicMaterial({ color: '#33475e', transparent: true, opacity: 0 }); const mfL = new THREE.LineSegments(mfG, mfM); mfL.frustumCulled = false; micro.add(mfL);
const mfp = []; for (let i = 0; i < NMF; i++) mfp.push({ x: -10 + R() * 20, z: -7 + R() * 14, ph: R() });
// 微观里的半导体表面（细线框平面）
const surfM = new THREE.MeshStandardMaterial({ color: '#c8d3e0', roughness: .8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const surf = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), surfM); surf.rotation.x = -Math.PI / 2; surf.position.y = -.1; micro.add(surf);
// d 括号
const brG = new THREE.BufferGeometry(); brG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, .45, 0, 0, -.55, 0, -.25, .45, 0, .25, .45, 0, -.25, -.55, 0, .25, -.55, 0]), 3));
const brM = new THREE.LineBasicMaterial({ color: '#14202e', transparent: true, opacity: 0, depthTest: false }); const br = new THREE.LineSegments(brG, brM); br.position.set(-1.6, 0, 6); br.renderOrder = 9; micro.add(br);

// 击穿：缺陷 + 细丝（A 的介质内）
const ND = 90; const defs = inst(new THREE.OctahedronGeometry(1), '#e8590c', ND, { em: .4 }); A.g.add(defs);
const dp = []; const fx = .9;
for (let i = 0; i < ND; i++) { const chain = i < 14; dp.push(chain ? { x: fx + Math.sin(i * 2.1) * .12, y: .05 + (i / 13) * .6, z: .05, t: 80.5 + (i / 14) * 4.2 + R() * .4, chain } : { x: -4.2 + R() * 8.4, y: .05 + R() * .6, z: (R() - .5) * 5.4, t: 79.8 + R() * 5, chain }); }
const filG = new THREE.BufferGeometry(); { const a = []; for (let i = 0; i <= 14; i++) a.push(fx + Math.sin(i * 2.1) * .12, .7 - i / 14 * .7, .05); filG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); }
const filM = new THREE.LineBasicMaterial({ color: '#c92a2a', transparent: true, opacity: 0 }); const fil = new THREE.Line(filG, filM); A.g.add(fil);
const flash = new THREE.PointLight('#ffb35a', 0, 9); flash.position.set(fx, .35, .6); A.g.add(flash);
// 击穿通路：从栅极向下逐段生长的放电通道 + 侧向裂纹 + 残留烧蚀
const bPts = []; { const rr = mulberry(4242); for (let i = 0; i <= 7; i++) bPts.push(new THREE.Vector3(fx + (i && i < 7 ? (i % 2 ? 1 : -1) * (.05 + rr() * .07) : 0), .7 - (i + (i && i < 7 ? (rr() - .5) * .4 : 0)) / 7 * .7, .05 + (i && i < 7 ? (rr() - .5) * .04 : 0))); }
const bCurve = new THREE.CurvePath(); for (let i = 0; i < bPts.length - 1; i++) bCurve.add(new THREE.LineCurve3(bPts[i], bPts[i + 1]));
const coreG = new THREE.TubeGeometry(bCurve, 132, .024, 6, false), haloG = new THREE.TubeGeometry(bCurve, 132, .07, 8, false);
const coreM = new THREE.MeshBasicMaterial({ color: '#fff6e0', transparent: true, opacity: 0, depthTest: false }), haloM = new THREE.MeshBasicMaterial({ color: '#ff5a14', transparent: true, opacity: 0, depthWrite: false, depthTest: false });
const core = new THREE.Mesh(coreG, coreM), halo = new THREE.Mesh(haloG, haloM); core.renderOrder = 7; halo.renderOrder = 6; core.frustumCulled = halo.frustumCulled = false; A.g.add(halo, core);
const crG = new THREE.BufferGeometry(); { const a = []; const rr = mulberry(77); for (let k = 0; k < 16; k++) { const p = bCurve.getPoint(.1 + .8 * rr()); let x = p.x, y = p.y, z = p.z; const dir = rr() < .5 ? -1 : 1; for (let j = 0; j < 3; j++) { const nx = x + dir * (.12 + rr() * .25), ny = clamp(y + (rr() - .5) * .14, .02, .68), nz = z + (rr() - .5) * .3; a.push(x, y, z, nx, ny, nz); x = nx; y = ny; z = nz; } } crG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3)); }
const crM = new THREE.LineBasicMaterial({ color: '#7a2a12', transparent: true, opacity: 0, depthTest: false }); const cracks = new THREE.LineSegments(crG, crM); cracks.renderOrder = 6; cracks.frustumCulled = false; A.g.add(cracks);
const flashDiv = document.createElement('div'); flashDiv.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;background:radial-gradient(55% 55% at var(--fx,50%) var(--fy,40%),rgba(255,150,60,.75),rgba(255,120,40,.25) 40%,rgba(255,255,255,0) 75%);pointer-events:none;opacity:0;z-index:5'; document.body.appendChild(flashDiv);

// ---------- 文字系统 ----------
const ov = document.getElementById('ov');
const TX = [];
function tx(t0, t1, html, o = {}) {
  const el = document.createElement('div'); el.className = 'tx ' + (o.cls || 'l');
  if (o.split !== false && !/[<]/.test(html)) { el.innerHTML = [...html].map(ch => `<span class="c">${ch === ' ' ? '&nbsp;' : ch}</span>`).join(''); }
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
    const inn = seg(t, t0, t0 + (o.inDur || .55)), out = seg(t, t1 - (o.outDur || .35), t1);
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

// 片头
tx(.6, 3.9, '离子电双层栅控', { cls: 'h', y: 150, stag: .06 });
tx(1.3, 3.9, '为什么能用更低的栅压完成同样的沟道调控', { cls: 'sub', y: 236, stag: .015 });
// ---- 解释字幕（底部说明卡，按“因为 / 所以 / →”组织因果链） ----
const CAPS = [];
function cap(s0, s1, html) { CAPS.push([s0, s1, html]); return tx(s0, s1, html, { cls: 'cap', x: 110, y: 968, anchor: 0, stag: .012, split: !/</.test(html) }); }
cap(4.4, 7.0, '栅压 V<sub>G</sub> 在栅介质中建立纵向电场');
cap(7.0, 10.0, '电场排斥表面空穴、吸引电子；电子由源漏区汇入表面');
cap(10.0, 12.0, '电子足够多（V<sub>G</sub> &gt; V<sub>th</sub>）→ 形成反型层，即导电沟道');
cap(12.0, 14.6, '加 V<sub>DS</sub>：电子沿沟道 S → D 运动，电流 I<sub>DS</sub> 为 D → S');
cap(14.6, 17.2, '栅压建立沟道（纵向），源漏电压驱动输运（横向）');
cap(17.2, 19.4, '栅极 +Q 与沟道 −Q 隔介质相对：栅控结构即一个电容');
cap(19.4, 22.4, 'Q = CV，C = εA / d：电荷分离距离 d 越小，C 越大');
cap(22.4, 25.4, '诱导同样的 ΔQ，所需栅压变化 ΔV = ΔQ / C');
cap(25.4, 28.4, '所以：有效栅电容越大，所需栅压越低');
cap(28.4, 31.4, '将固体栅介质换成离子电解质（离子液体、离子凝胶）');
cap(31.4, 34.6, '电解质中正负离子可移动；无偏压时均匀混合、整体电中性');
cap(34.6, 37.6, '加栅压后离子受电场力迁移：阴离子移向栅极，阳离子移向半导体表面');
cap(37.6, 40.6, '阳离子停在电解质一侧，在半导体一侧感应出等量电子');
cap(40.6, 44.0, '体相近似电中性，电势降集中在两个界面：两个电双层');
cap(44.0, 50.4, '放大到半导体–电解质界面');
cap(50.4, 53.0, '阳离子层与感应电子仅相隔约 1 nm');
cap(53.0, 55.4, '此处 d 为等效电荷分离距离，而非电解质厚度');
cap(55.4, 57.6, 'C = εA / d：d 极小 → 单位面积电容极大');
cap(57.6, 60.4, '离子层如同紧贴沟道的等效栅极，栅控效率因此很高');
cap(60.4, 64.0, '回到器件尺度，比较两种栅控方式');
cap(64.0, 67.0, '设定相同目标：在沟道中诱导相同的 ΔQ');
cap(67.0, 70.6, '两条沟道电子同步增加，所需栅压却不同');
cap(70.6, 74.0, 'ΔV = ΔQ / C，而 C<sub>EDL</sub> ≫ C<sub>ox</sub> → 电双层只需很低的 V<sub>G</sub>');
cap(74.0, 78.0, '例：电容大 100 倍，所需 ΔV 约为 1/100（仅作示意）');
cap(78.0, 81.0, '固体介质中 E ≈ V / d：厚度一定时，栅压越高电场越强');
cap(81.0, 85.0, '长期高场应力 → 缺陷累积 → 漏电增加、绝缘退化');
cap(85.0, 87.4, '缺陷连成通路 → 栅介质击穿');
cap(87.4, 89.8, '电双层以更低 V<sub>G</sub> 完成同样调控 → 减少对高栅压的依赖 → 降低相关击穿风险');
// 部件标签（锚定在器件上，带底板）
tx(1.6, 8.5, '栅极 G', { at: vv(0, 1.15), obj: B.g, cls: 'l' });
tx(1.9, 8.5, '栅介质', { at: vv(-6.4, .35), obj: B.g, cls: 's' });
tx(2.2, 8.5, '源 S（n⁺）', { at: vv(-6.4, -.75), obj: B.g, cls: 's' });
tx(2.4, 8.5, '漏 D（n⁺）', { at: vv(6.4, -.75), obj: B.g, cls: 's' });
tx(2.7, 8.5, 'p 型衬底', { at: vv(0, -3.6), obj: B.g, cls: 's' });
const vgT = tx(4.4, 17, '', { at: vv(GX + .4, 1.15), obj: B.g, cls: 'k', anchor: 0, split: false, update: (t, el) => { const v = vgPhase1(t); el.innerHTML = `V<sub>G</sub> ↑ ${(v * 1.0).toFixed(2)}`; } });
tx(5.6, 9.6, '空穴被排斥', { at: vv(-2.6, -2.3), obj: B.g, cls: 's warm' });
tx(7.0, 10.0, '电子汇向表面', { at: vv(2.6, -1.25), obj: B.g, cls: 's cool' });
tx(8.4, 11.6, '电子不穿过栅介质', { at: vv(0, .35), obj: B.g, cls: 's' });
tx(10.2, 12.2, '反型层（导电沟道）', { at: vv(-1.5, -.55), obj: B.g, cls: 's cool', dy: 30 });
tx(12.0, 16.8, '电子 S → D', { at: vv(0, -.55), obj: B.g, cls: 's cool', dy: 34 });
tx(12.6, 16.8, '电流 I<sub>DS</sub>：D → S', { at: vv(0, -.55), obj: B.g, cls: 's', split: false, dy: 92 });
tx(14.6, 17.2, '纵向 · 栅控', { x: 120, y: 150, cls: 'l warm', anchor: 0 });
tx(15.0, 17.2, '横向 · 输运', { x: 120, y: 222, cls: 'l cool', anchor: 0 });
// 电容视角
tx(17.2, 22.4, '+Q', { at: vv(GX + .55, .62), obj: B.g, cls: 'l warm', anchor: 0 });
tx(17.4, 22.4, '−Q', { at: vv(GX + .55, -.14), obj: B.g, cls: 'l cool', anchor: 0 });
tx(18.2, 22.4, 'd', { at: vv(-GX - .5, .35), obj: B.g, cls: 'f', anchor: 1 });
tx(17.8, 22.4, 'Q = C V', { cls: 'f', x: 1800, y: 150, anchor: 1 });
tx(19.4, 22.4, 'C = εA / d', { cls: 'f', x: 1800, y: 234, anchor: 1 });
tx(22.6, 28.6, '<span id="dv">ΔV</span> = ΔQ / <span id="cc" style="display:inline-block">C</span>', { cls: 'f', x: 1800, y: 170, anchor: 1, split: false, update: (t, el) => { const k = ss(t, 24, 26.5); el.querySelector('#cc').style.transform = `scale(${1 + k * .9})`; el.querySelector('#dv').style.display = 'inline-block'; el.querySelector('#dv').style.transform = `scale(${1 - k * .5})`; } });
// 电解质
tx(37.0, 44.0, '阴离子 → 栅极界面', { at: vv(-2.6, 2.05), obj: B.g, cls: 'l an', lead: 1 });
tx(37.6, 44.0, '阳离子 → 半导体表面（电解质一侧）', { at: vv(-1.6, .2), obj: B.g, cls: 'l cat', lead: 1 });
tx(39.0, 44.0, '感应电子（半导体一侧）', { at: vv(1.6, -.2), obj: B.g, cls: 's cool', lead: 1 });
tx(40.4, 44.0, '体相近似电中性', { at: vv(1.8, 1.22), obj: B.g, cls: 's' });
tx(41.2, 44.6, 'φ(y)', { at: vv(6.5, 2.75), obj: B.g, cls: 's' });
tx(41.6, 44.6, '电势降集中在两个界面', { at: vv(6.2, -.35), obj: B.g, cls: 's' });
// 比例尺
const scaleT = tx(44.2, 60.4, '', { x: 1700, y: 860, cls: 'k', split: false, update: (t, el) => { const h = camH; const nm = h / NM; const bar = nm / 6; const lab = bar >= 1000 ? (bar / 1000).toPrecision(2) + ' μm' : bar.toPrecision(2) + ' nm'; el.innerHTML = `<div style="width:${H / 6}px;height:3px;background:#24364a;margin-bottom:8px"></div>${lab}`; } });
tx(50.4, 60.0, '电双层', { cls: 'm', x: 120, y: 150, anchor: 0 });
tx(51.6, 60.0, '阳离子层（电解质一侧）', { at: vv(4, .45, 6), obj: micro, cls: 'l cat', anchor: 0, dx: 60, lead: 1 });
tx(52.2, 60.0, '感应电子（半导体一侧）', { at: vv(4, -.8, 6), obj: micro, cls: 'l cool', anchor: 0, dx: 60, lead: 1 });
tx(53.0, 60.0, 'd ≈ 1 nm', { at: vv(-1.6, -.05, 6), obj: micro, cls: 'f', anchor: 1, dx: -28 });
tx(55.0, 60.0, 'C = εA / <span id="dd" style="display:inline-block">d</span>', { cls: 'f', x: 120, y: 240, anchor: 0, split: false, update: (t, el) => { const k = ss(t, 55.6, 57); el.querySelector('#dd').style.transform = `scale(${1 - .55 * k}) translateY(${k * 8}px)`; } });
tx(55.4, 60.0, '注意：界面处局部电场很强', { cls: 's', x: 1800, y: 150, anchor: 1 });
// 比较
tx(62.6, 77.6, '传统固体栅介质', { at: () => vv(0, -5.6), obj: A.g, cls: 'l' });
tx(62.8, 77.6, '电双层栅控', { at: () => vv(0, -5.6), obj: B.g, cls: 'l' });
tx(64.0, 78.0, '目标：相同的 ΔQ', { cls: 'm', y: 130 });
tx(66.2, 78.2, '', { at: () => vv(0, A.topY + A.colH + .7), obj: A.g, cls: 'l warm', split: false, update: (t, el) => el.innerHTML = `所需 V<sub>G</sub>：高` });
tx(66.2, 78.2, '', { at: () => vv(0, B.topY + B.colH + .7), obj: B.g, cls: 'l cool', split: false, update: (t, el) => el.innerHTML = `所需 V<sub>G</sub>：低` });
tx(70.8, 78.0, 'ΔV = ΔQ / C', { cls: 'f', x: 1800, y: 130, anchor: 1 });
tx(72.2, 78.0, 'C<sub>EDL</sub> ≫ C<sub>ox</sub>', { cls: 'f', x: 1800, y: 214, anchor: 1, split: false });
// 击穿
tx(78.6, 87.4, 'E ≈ V / d', { cls: 'f', x: 120, y: 150, anchor: 0 });
tx(81.0, 87.4, '缺陷累积', { at: vv(-2.5, .35, 3), obj: A.g, cls: 's warm', lead: 1 });
tx(85.0, 87.4, '击穿通路', { at: vv(.9, .35, 0), obj: A.g, cls: 'l warm', dx: -240, dy: 210, lead: 1 });
tx(87.4, 89.8, '更低的工作栅压', { cls: 'm', x: 1800, y: 150, anchor: 1 });
// 边界条件
const cav = ['低栅压 ≠ 界面电场弱：电双层内局部电场仍可很强', '材料本身的击穿场强并未提高', '电解质有电化学稳定窗口，过压同样会反应、退化', '离子不承担源漏电流；电双层不解决源漏方向的高场与发热失效'];
tx(89.6, 96.2, '需要分清的几点', { cls: 'm', x: 120, y: 200, anchor: 0 });
cav.forEach((s, i) => tx(90 + i * 1.1, 96.2, s, { cls: 'l', x: 120, y: 300 + i * 84, anchor: 0, stag: .006 }));
// 结尾
tx(97.0, 102, '离子重排 → 电双层 → 有效栅电容增大 → 同样 ΔQ 所需栅压降低 → 高栅压相关风险减弱', { cls: 'cap', x: 960, y: 300, stag: .006 });
tx(98.2, 102, '离子电双层栅控', { cls: 'h', y: 170, stag: .05 });
// 图例
tx(4.4, 28.4, '<i class="dot" style="background:#2456c8"></i>电子 −　<i class="ring"></i>空穴 +　<i class="dot" style="background:#7a6fae"></i>栅极正电荷', { cls: 'leg', x: 1880, y: 1046, anchor: 1, split: false });
tx(28.4, 96.2, '<i class="dot" style="background:#c98a2b"></i>阳离子 +　<i class="dot" style="background:#3f8a62"></i>阴离子 −　<i class="dot" style="background:#2456c8"></i>电子 −　<i class="ring"></i>空穴 +　<i class="dot" style="background:#7a6fae"></i>栅极正电荷', { cls: 'leg', x: 1880, y: 1046, anchor: 1, split: false });

// ---------- 阅读时间重映射：故事时间 s → 影片时间 T ----------
function need(html) { const n = html.replace(/<[^>]+>/g, '').replace(/\s/g, '').length; return Math.max(1.9, n / 5.8 + 0.5); }
const SEG = CAPS.map(c => [c[0], c[1], need(c[2])]); SEG.push([89.8, 96.2, 13.5], [96.4, 102, 6]); SEG.sort((a, b) => a[0] - b[0]);
const WS = [0], WT = [0];
for (const [s0, s1, nd] of SEG) { const cs = WS[WS.length - 1], ct = WT[WT.length - 1]; if (s0 > cs) { WS.push(s0); WT.push(ct + s0 - cs); } const c2 = WT[WT.length - 1]; WS.push(s1); WT.push(c2 + Math.max((s1 - s0) * (s0 >= 40 ? .62 : s0 >= 17 ? .8 : 1), nd)); }
if (WS[WS.length - 1] < STORY) { WT.push(WT[WT.length - 1] + STORY - WS[WS.length - 1]); WS.push(STORY); }
DUR = WT[WT.length - 1]; window.DUR = DUR; window.WARP = { S: WS, T: WT };
function storyAt(T) { let i = 0; while (i < WT.length - 2 && T > WT[i + 1]) i++; return lerp(WS[i], WS[i + 1], clamp((T - WT[i]) / (WT[i + 1] - WT[i]))); }
// ---------- 时间函数 ----------
function vgPhase1(t) { return ss(t, 4.4, 10.0) * 1.0; } // 归一化栅压（第一段）
// 相机关键帧：t, 目标 x,y,z, yaw°, pitch°, 画面高度 h, fov°
const K = [
  [0, 0, -1.4, 0, 0, 0, 11.5, 4],
  [4, 0, -1.0, 0, 0, 0, 10.4, 4],
  [8, 0, -.6, 0, 0, 0, 8.6, 4],
  [10.4, -.6, -.25, 0, 0, 0, 5.0, 4],
  [12.2, -.6, -.35, 0, 0, 0, 5.6, 4],
  [16.5, 1.2, -.5, 0, 0, 0, 9.6, 4],
  [20, 0, 0, 0, 0, 0, 8.2, 4],
  [22, 0, 0, 0, 0, 0, 7.9, 4],
  [27.5, 0, .2, 0, 34, 16, 10.5, 34],
  [31.5, 0, .9, 0, 40, 13, 9.4, 34],
  [35, 0, 1.1, 0, 26, 14, 9.6, 34],
  [44, 0, 1.0, 0, 18, 11, 7.2, 34],
  [46.5, 0, .4, 0, 14, 12, 2.4, 38],
  [50.5, 0, .002, .06, 10, 17, .3, 40],
  [60, 0, .002, .06, -8, 13, .24, 40],
  [62.6, 2.5, -.2, 0, 8, 14, 10, 34],
  [66, 0, 1.2, 0, 14, 12, 20, 32],
  [78, 0, 1.4, 0, 10, 9, 18.5, 32],
  [80.5, -9.5, .3, 3, 20, 3, 2.4, 34],
  [86, -9.5, .3, 3, 14, 3, 3.2, 34],
  [89, 9.5, .9, 0, -22, 10, 7.5, 34],
  [96, 0, 3.4, 0, 6, 7, 30, 28],
  [101, 0, -1.2, 0, 0, 0, 30, 4],
  [102, 0, -1.2, 0, 0, 0, 30, 4]];
let camH = 10;
function camAt(t) {
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1]; const u0 = seg(t, a[0], b[0]); const k = a[0] === 22 ? eio(Math.pow(u0, 1.7)) : eio(u0);
  const o = {}; ['t', 'x', 'y', 'z', 'yaw', 'pitch', 'h', 'fov'].forEach((n, j) => o[n] = j === 6 ? Math.exp(lerp(Math.log(a[j]), Math.log(b[j]), k)) : lerp(a[j], b[j], k));
  return o;
}
function placeCam(t) {
  const c = camAt(t); { const pk = ss(t, 84.55, 84.95) * (1 - ss(t, 85.3, 86.8)); c.h *= 1 - .58 * pk; c.x = lerp(c.x, -9.5 + fx, .7 * pk); const sk = t > 85 && t < 87 ? Math.exp(-(t - 85) * 4.5) : 0; c.x += sk * .05 * c.h * Math.sin(t * 93); c.y += sk * .04 * c.h * Math.cos(t * 71); } camH = c.h;
  // 手持感：很小的双正弦漂移，在 2D 段和微观段几乎为零
  const hand = (t > 22 && t < 96) ? .35 : .05;
  const yaw = (c.yaw + Math.sin(t * .37) * .6 * hand) * Math.PI / 180, pit = (c.pitch + Math.sin(t * .29 + 1) * .4 * hand) * Math.PI / 180;
  const dist = c.h / (2 * Math.tan(c.fov * Math.PI / 360));
  cam.fov = c.fov; cam.position.set(c.x + dist * Math.sin(yaw) * Math.cos(pit), c.y + dist * Math.sin(pit), c.z + dist * Math.cos(yaw) * Math.cos(pit));
  cam.lookAt(c.x, c.y, c.z); cam.near = dist * .02; cam.far = dist * 20 + 200; cam.updateProjectionMatrix();
  fill.position.copy(cam.position);
  { const sw = seg(t, 22.3, 25.2), bw = Math.sin(Math.PI * sw); key.intensity = 2.0 + 1.3 * bw; key.position.set(lerp(-14, 14, sw) * (sw > 0 && sw < 1 ? 1 : 0) + (sw > 0 && sw < 1 ? 0 : 6), 10, 8); }
}

// 器件状态
function layoutDevice(d, st) {
  const dz = st.dz, top = st.thick, gH = .8;
  setBox(d.sub, -8, 8, -5, 0, dz); setBox(d.S, -8.004, -GX, -1.45, 0.004, dz + .03); setBox(d.D, GX, 8.004, -1.45, 0.004, dz + .03);
  const cz = (st.cut || 0) * dz; setBox(d.diel, -GX, GX, 0, top, dz); setBox(d.gel, -GX, GX, 0, top, dz - cz); d.gel.position.z = -cz / 2;
  setBox(d.gate, -GX, GX, top, top + gH, dz - cz); d.gate.position.z = -cz / 2;
  setBox(d.cS, -7.4, -5.2, 0, .32, dz * .7); setBox(d.cD, 5.2, 7.4, 0, .32, dz * .7);
  d.topY = top + gH;
  const flat = st.flat;
  [d.sub, d.S, d.D, d.diel, d.gel, d.gate, d.cS, d.cD].forEach((p, k) => { const u = p.userData; const al = st.t !== undefined ? st.alpha * ss(st.t, .15 + [0, 1, 1, 2, 2, 3, 4, 4][k] * .38, .75 + [0, 1, 1, 2, 2, 3, 4, 4][k] * .38) : st.alpha; const fillA = st.t !== undefined ? ss(st.t, 1.4 + k * .1, 2.8 + k * .1) : 1; u.m.emissiveIntensity = flat * (u.m.metalness > .5 ? .1 : .3); u.lm.opacity = (.9 * flat + .14) * al; u.m.opacity = u.base * st.alpha * fillA * al; u.m.transparent = true; u.m.depthWrite = u.base >= 1 && st.alpha > .99; });
  d.diel.userData.m.opacity = .42 * (1 - st.gelK) * st.alpha; d.diel.userData.lm.opacity *= (1 - st.gelK);
  d.gel.userData.m.opacity = .16 * st.gelK * st.alpha; d.gel.userData.lm.opacity *= st.gelK;
  if (st.see) [d.sub, d.S, d.D].forEach(p => { const u = p.userData; u.m.opacity *= 1 - .55 * st.see; u.m.depthWrite = st.see < .01; });
  d.g.visible = st.alpha > .002;
}
function particles(d, t, st) {
  const dz = st.dz * .94, s = st.ps; // 粒子尺寸
  // 储备区电子（源漏 n+）
  for (let i = 0; i < d.NR; i++) { const p = d.ro[i]; put(d.res, i, p.x + jit(i, t) * .04, p.y + jit(i + 9, t) * .04, p.z * dz, .062 * s * st.alpha); }
  // 沟道电子
  for (let i = 0; i < d.NE; i++) {
    const p = d.eo[i]; const k = eio(clamp((st.fill - p.r * .55) / .45));
    let x = lerp(p.ox, p.tx, k), y = lerp(p.oy, p.ty, k);
    if (st.drift > 0 && k > .99) { const span = 15, dk = smr(clamp(st.drift / 1.2)); x = ((lerp(p.tx, -7.5 + p.u * span, dk) + 7.5 + st.drift * p.sp * 2.4) % span + span) % span - 7.5; }
    const edge = smr(clamp((7.6 - Math.abs(x)) / .6));
    put(d.el, i, x + jit(i, t, 1.3) * .03, y + jit(i + 3, t, 1.3) * .02, p.z * dz, .072 * s * (k > 0 ? 1 : .0001) * edge * st.alpha);
  }
  // 空穴
  const depl = 1.5 * st.vn;
  for (let i = 0; i < d.NH; i++) {
    const p = d.hp[i]; const sx = smr(clamp((GX + .6 - Math.abs(p.x)) / 1.2));
    const y = p.y - depl * Math.exp(p.y / 1.2) * sx;
    V3.set(p.x + jit(i, t) * .05, y + jit(i + 5, t) * .05, p.z * dz); S3.setScalar(.085 * s * st.alpha); M4.compose(V3, Q0, S3); d.ho.setMatrixAt(i, M4);
  }
  // 栅极下表面的正电荷
  const ng = Math.round(d.NG * clamp(st.gq));
  for (let i = 0; i < d.NG; i++) { const c = i % 18, r = Math.floor(i / 18); const sc = i < ng ? 1 : 0.0001; put(d.gq, i, -GX + (c + .5) / 18 * 2 * GX, st.thick - .06, ((r + .5) / 4) * dz * (1 - (st.cut || 0)) - dz / 2, (d.kind === 'ox' ? .1 : .07) * s * sc * st.alpha); }
  // 场线
  const fpA = d.field.geometry.attributes.position.array; let n = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 26; c++) {
    const x = -GX + (c + .5) / 26 * 2 * GX, z = ((r + .5) / 5 - .5) * dz;
    const show = (c / 26 < st.fdens || st.fdens >= 1) && (st.flat > .5 ? r === 2 : true);
    const ph = ((t * 1.4 + c * .37) % 1);
    const y0 = st.thick - .05 - ph * .3 * st.thick, y1 = y0 - .25 * st.thick;
    if (show) { fpA.set([x, Math.max(.02, y0), z, x, Math.max(.02, y1), z], n * 6); } else fpA.set([0, -99, 0, 0, -99, 0], n * 6);
    n++;
  }
  d.field.geometry.attributes.position.needsUpdate = true; d.fieldM.opacity = st.fop * st.alpha;
  d.fieldM.color.set(st.fhot > 0 ? new THREE.Color('#33475e').lerp(new THREE.Color('#d9480f'), st.fhot) : '#33475e');
  [d.el, d.res, d.ho, d.gq].forEach(m => { m.instanceMatrix.needsUpdate = true; m.material.opacity = st.alpha; });
  // 电压柱
  d.colH = Math.max(.001, st.col); d.col.scale.set(1, d.colH, 1); d.col.position.set(0, d.topY + d.colH / 2 + .05, 0);
  d.colGlass.scale.set(1, Math.max(.001, st.colMax), 1); d.colGlass.position.set(0, d.topY + st.colMax / 2 + .05, 0);
  d.col.visible = d.colGlass.visible = st.col > .002;
}

// 透明物体的绘制顺序固定（v3.2）：InstancedMesh 的包围球只在首次渲染时计算并冻结，
// 透明排序因此依赖“这个浏览器之前渲染过哪些帧”，多 worker 渲染时会出现每 N 帧一次的闪烁。
scene.traverse(o => { if (o.isInstancedMesh) { o.renderOrder = o.material.depthWrite ? 1 : 3; o.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); } });
mshell.renderOrder = 4; surf.renderOrder = 2; mfL.renderOrder = 5;
window.render = function (T) {
  let t = storyAt(clamp(T, 0, DUR));
  placeCam(t);
  // ---- 宏观状态 B ----
  const ext = eio(Math.pow(seg(t, 22.2, 27.4), 1.5)) * (1 - ss(t, 96.4, 101));         // 挤出
  const flat = 1 - ss(t, 21.5, 26.5) + ss(t, 97, 101);              // 平面感
  const draw = ss(t, .2, 2.6);
  const gelK = ss(t, 28.4, 31.8) * (1 - ss(t, 96.4, 99.5) * 0);
  const thick = lerp(.7, 2.4, eio(ss(t, 28.4, 31.2)));
  const bias = ss(t, 34.6, 41.4);                                   // EDL 偏压
  const microK = (t > 44 && t < 63) ? 1 - ss(camH, .4, .58) : 0;
  const slide = eio(ss(t, 60.5, 66));
  const Qc = ss(t, 66.6, 73.6);                                       // 比较段共同的 ΔQ
  // 第一段的栅压、沟道
  const vn1 = vgPhase1(t) * (1 - ss(t, 28.2, 30.5));
  const fill1 = ss(t, 6.6, 10.4) * (1 - ss(t, 28.2, 30.5));
  const fillB = Math.max(fill1, bias * (1 - ss(t, 61, 63.5)), Qc, ss(t, 88, 90) * (1 - ss(t, 99, 101)));
  const fillA = Math.max(Qc, ss(t, 78, 79));
  const driftT = t > 11.6 && t < 28.6 ? (t - 11.6) * ss(t, 11.6, 12.6) * (1 - ss(t, 27, 28.6)) : 0;
  const alphaB = ss(t, 2.4, 3.6);
  const cutB = ss(t, 30.5, 33.5) / 3 * (1 - ss(t, 96.4, 98.5));
  layoutDevice(B, { dz: lerp(.04, 6, ext), thick, flat, alpha: 1, gelK, t: t < 5 ? t : undefined, see: ss(t, 33, 35) * (1 - ss(t, 96, 97.5)), cut: cutB });
  { const dzB = lerp(.04, 6, ext); grid.scale.set(1, 1, dzB / 2); grid.position.y = .004; gridM.opacity = .22 * ss(t, 31, 34) * (1 - ss(t, 96.4, 98)) * (t > 44 && t < 63 ? ss(camH, .8, 2) : 1); }
  const vnB = Math.max(vn1, bias * .25, Qc * .12, t > 78 ? .12 : 0);
  particles(B, t, { cut: cutB, dz: lerp(.04, 6, ext), ps: lerp(1.25, 1, ext) * (1 - microK * .97), fill: fillB, drift: driftT, vn: Math.max(vn1, bias), gq: Math.max(vn1, bias) * (1 - ss(t, 61, 63.5)) + Qc * .2 * (t > 63.5 ? 1 : 0), thick, flat, alpha: alphaB * (1 - microK) * (t > 44 && t < 62 ? ss(camH, 1.2, 2.2) : 1), fdens: vn1 * 1.05, fop: (t < 28.5 ? .85 * vn1 : 0), fhot: 0, col: t > 64 ? Qc * .55 : 0, colMax: t > 64 ? 6.4 * ss(t, 64, 66) : 0 });
  B.g.position.x = 9.5 * slide;
  { const mk = microK; [B.sub, B.S, B.D].forEach(p => { p.userData.m.opacity *= (1 - .85 * mk); p.userData.m.depthWrite = mk < .01 && !(t > 33 && t < 97.5); p.userData.lm.opacity *= (1 - mk); }); B.gel.userData.m.opacity *= (1 - mk); B.gel.userData.lm.opacity *= (1 - mk); }
  // 主光：2D 时压暗
  hemi.intensity = .85 + .35 * flat; key.intensity = .6 + 1.5 * (1 - flat); rim.intensity = .8 * (1 - flat); fill.intensity = .4 + .5 * flat;
  // ---- 离子（介观） ----
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
  // ---- 微观 ----
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
  // ---- 对照器件 A ----
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
  // 背景随微观略变暖黑
  if (microK > 0) { const dist = camH / (2 * Math.tan(cam.fov * Math.PI / 360)); scene.fog = scene.fog || new THREE.Fog(FOGC, 1, 2); scene.fog.near = dist * .9; scene.fog.far = dist * 2.0; } else scene.fog = null;
  renderer.render(scene, cam);
  drawText(t);
};

// 声音事件（与画面同一时间线；audio/score.py 读取 events.json）
window.EV = [
  { t: .2, type: 'draw', dur: 2.4 }, { t: 4.4, type: 'field', dur: 5.6 }, { t: 6.6, type: 'gather', dur: 3.8 }, { t: 10.0, type: 'hit' },
  { t: 11.6, type: 'drift', dur: 5.6 }, { t: 17.8, type: 'glass' }, { t: 19.4, type: 'glass2' }, { t: 22.2, type: 'extrude', dur: 5.2 },
  { t: 24.0, type: 'glass' }, { t: 28.4, type: 'lift', dur: 3 }, { t: 30.0, type: 'gel', dur: 3 }, { t: 34.6, type: 'ions', dur: 6.8 },
  { t: 41.4, type: 'edl' }, { t: 44.5, type: 'riser', dur: 5.8 }, { t: 50.3, type: 'arrive' }, { t: 53.0, type: 'tick' }, { t: 55.6, type: 'glass' },
  { t: 60.3, type: 'pullout', dur: 5.5 }, { t: 66.6, type: 'columns', dur: 7.0 }, { t: 72.2, type: 'glass' }, { t: 79.0, type: 'stress', dur: 6 },
  { t: 80.0, type: 'defects', dur: 5 }, { t: 84.6, type: 'zap', dur: .4 }, { t: 85.0, type: 'break' }, { t: 89.6, type: 'calm' }, { t: 96.4, type: 'flatten', dur: 4.6 }, { t: 98.2, type: 'end' }];
document.fonts.ready.then(() => { window.render(0); window.READY = true; });
