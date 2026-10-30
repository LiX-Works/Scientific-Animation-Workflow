import {H, W, clamp, lerp, rng} from './lib';

// ---------------------------------------------------------------- the model: a living sphere of points and threads
const N = 7000;
const SPHERE: [number, number, number][] = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996323;
  SPHERE.push([Math.cos(a) * r, y, Math.sin(a) * r]);
}
const THREADS = (() => {
  const r = rng(77), out: {a: number; b: number; lift: number; speed: number; off: number}[] = [];
  for (let i = 0; i < 150; i++) out.push({a: Math.floor(r() * N), b: Math.floor(r() * N), lift: 1.05 + r() * 0.35, speed: 0.012 + r() * 0.03, off: r()});
  return out;
})();

export type View = {cx: number; cy: number; R: number; yaw: number; pitch: number; persp?: number};
export const project = (v: View, x: number, y: number, z: number) => {
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
  const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
  const p = 1 / (1 + z2 * (v.persp ?? 0.16));
  return {x: v.cx + x1 * v.R * p, y: v.cy + y2 * v.R * p, z: z2, p};
};

const disp = (x: number, y: number, z: number, t: number, amp: number) =>
  1 + amp * (0.1 * Math.sin(6 * y + t * 1.1) + 0.07 * Math.sin(5 * x - t * 0.8) * Math.cos(4 * z + t * 0.6) + 0.035 * Math.sin(11 * z + 3 * x + t * 1.7));

export const drawCore = (ctx: CanvasRenderingContext2D, v: View, t: number, o: {pulse?: number; alpha?: number; points?: number; tint?: string; hot?: string} = {}) => {
  const {pulse = 0, alpha = 1, points = N, tint = '#8FC2FF', hot = '#FFFFFF'} = o;
  if (v.R < 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // inner light
  const glowR = v.R * (1.25 + pulse * 0.55);
  const g = ctx.createRadialGradient(v.cx, v.cy, 0, v.cx, v.cy, glowR);
  g.addColorStop(0, `rgba(190,225,255,${0.5 * alpha})`); g.addColorStop(0.3, `rgba(60,120,255,${(0.14 + pulse * 0.26) * alpha})`); g.addColorStop(1, 'rgba(20,50,140,0)');
  ctx.fillStyle = g; ctx.fillRect(v.cx - glowR, v.cy - glowR, glowR * 2, glowR * 2);
  // threads
  ctx.lineWidth = Math.max(0.8, v.R / 300);
  for (const th of THREADS) {
    const A = SPHERE[th.a], B = SPHERE[th.b];
    const ph = (th.off + t * th.speed) % 1;
    ctx.beginPath();
    for (let k = 0; k <= 14; k++) {
      const s = k / 14, lift = 1 + (th.lift - 1) * Math.sin(s * Math.PI);
      let x = lerp(A[0], B[0], s), y = lerp(A[1], B[1], s), z = lerp(A[2], B[2], s);
      const l = Math.hypot(x, y, z) || 1; x = (x / l) * lift; y = (y / l) * lift; z = (z / l) * lift;
      const q = project(v, x, y, z);
      if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.strokeStyle = `rgba(120,180,255,${(0.05 + 0.3 * Math.pow(Math.sin(ph * Math.PI), 6)) * alpha})`;
    ctx.stroke();
  }
  // points, in three brightness bands
  const bands = [new Path2D(), new Path2D(), new Path2D()];
  const amp = 1 + pulse * 1.6, stride = Math.max(1, Math.round(N / points));
  for (let i = 0; i < N; i += stride) {
    const [x, y, z] = SPHERE[i];
    const r = disp(x, y, z, t, amp) * (1 + pulse * 0.16);
    const q = project(v, x * r, y * r, z * r);
    if (q.x < -8 || q.x > W + 8 || q.y < -8 || q.y > H + 8) continue;
    const front = clamp(0.5 - q.z * 0.5);
    const s = Math.max(1, (v.R / 340) * (0.7 + front * 1.3) * q.p);
    bands[front > 0.72 ? 2 : front > 0.4 ? 1 : 0].rect(q.x - s / 2, q.y - s / 2, s, s);
  }
  ctx.fillStyle = tint; ctx.globalAlpha = 0.26 * alpha; ctx.fill(bands[0]);
  ctx.globalAlpha = 0.6 * alpha; ctx.fill(bands[1]);
  ctx.fillStyle = hot; ctx.globalAlpha = 0.95 * alpha; ctx.fill(bands[2]);
  ctx.restore();
};

// ---------------------------------------------------------------- depth streaks running to a vanishing point
const STREAKS = (() => { const r = rng(5); return Array.from({length: 260}, () => ({a: r() * Math.PI * 2, s: 0.004 + r() * 0.012, o: r(), w: 0.6 + r() * 1.6})); })();
export const drawTunnel = (ctx: CanvasRenderingContext2D, f: number, k = 1, cx = W / 2, cy = H / 2, speed = 1, color = '120,175,255') => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const st of STREAKS) {
    const z = (st.o + f * st.s * speed) % 1;
    const r0 = z * z * 1400 + 30, r1 = Math.pow(Math.min(1, z + 0.02 + 0.02 * speed), 2) * 1400 + 30;
    ctx.strokeStyle = `rgba(${color},${0.5 * z * k})`; ctx.lineWidth = st.w;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(st.a) * r0, cy + Math.sin(st.a) * r0); ctx.lineTo(cx + Math.cos(st.a) * r1, cy + Math.sin(st.a) * r1); ctx.stroke();
  }
  ctx.restore();
};

// ---------------------------------------------------------------- the server: a stack of isometric plates
const BLOCKS = (() => {
  const r = rng(31);
  return [0, 1, 2, 3].map(() => Array.from({length: 7}, () => ({u: -0.8 + r() * 1.6, v: -0.8 + r() * 1.6, h: 0.12 + r() * 0.38, o: r()})));
})();
export const drawServer = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, f: number, pulse = 0, color = '121,180,255', alpha = 1) => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
  const iso = (u: number, v: number, h: number) => ({x: cx + (u - v) * s * 0.92, y: cy + (u + v) * s * 0.46 - h * s});
  const plates = 4, gap = 0.62;
  for (let l = 0; l < plates; l++) {
    const base = (plates - 1 - l - (plates - 1) / 2) * gap * (1 + pulse * 0.28);
    const c = [iso(-1, -1, base), iso(1, -1, base), iso(1, 1, base), iso(-1, 1, base)];
    ctx.beginPath(); c.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
    ctx.fillStyle = `rgba(${color},${(0.05 + pulse * 0.12) * alpha})`; ctx.fill();
    ctx.strokeStyle = `rgba(${color},${(0.55 + pulse * 0.45) * alpha})`; ctx.lineWidth = 2; ctx.stroke();
    for (const b of BLOCKS[l]) {
      const hgt = b.h * (0.75 + 0.25 * Math.sin(f * 0.09 + b.o * 9)), lit = 0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(f * 0.12 + b.o * 20)), 8);
      const d = 0.12;
      const t = [iso(b.u - d, b.v - d, base + hgt), iso(b.u + d, b.v - d, base + hgt), iso(b.u + d, b.v + d, base + hgt), iso(b.u - d, b.v + d, base + hgt)];
      const g = [iso(b.u + d, b.v - d, base), iso(b.u + d, b.v + d, base), iso(b.u - d, b.v + d, base)];
      ctx.beginPath(); t.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
      ctx.fillStyle = `rgba(${color},${(0.14 + lit * 0.55 + pulse * 0.3) * alpha})`; ctx.fill();
      ctx.strokeStyle = `rgba(${color},${0.7 * alpha})`; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(t[1].x, t[1].y); ctx.lineTo(g[0].x, g[0].y); ctx.lineTo(g[1].x, g[1].y); ctx.lineTo(g[2].x, g[2].y); ctx.lineTo(t[3].x, t[3].y); ctx.moveTo(t[2].x, t[2].y); ctx.lineTo(g[1].x, g[1].y); ctx.stroke();
    }
  }
  ctx.restore();
};

// ---------------------------------------------------------------- the wire between them, with packets
export const drawWire = (ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, f: number, k = 1, rate = 1, color = '121,180,255') => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${color},${0.8 * k})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const p = (i / 9 + f * 0.006 * rate) % 1, x = lerp(x0, x1, p);
    ctx.fillStyle = `rgba(210,232,255,${0.7 * k})`; ctx.fillRect(x - 13, y - 1.5, 26, 3);
  }
  ctx.restore();
};

// A bright trail behind a capsule moving along the wire.
export const drawTrail = (ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color = '140,195,255', w = 10) => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},.95)`);
  ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), y - w / 2, Math.abs(x1 - x0), w);
  ctx.restore();
};

export const drawRing = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a: number, color = '170,210,255', w = 6, sy = 1) => {
  if (a <= 0.003 || r <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${color},${clamp(a)})`; ctx.lineWidth = w;
  ctx.beginPath(); ctx.ellipse(cx, cy, r, r * sy, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};
