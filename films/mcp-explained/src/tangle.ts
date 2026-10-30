import {C, H, W, lerp, rng} from './lib';

// The N x M web. Acts 2 and 3 share the same 6,000 cables, so what collapses in Act 3 is what grew in Act 2.
export const NL = 20, NR = 300, XL = 150, XR = 1770, XBAR = W / 2;

export const yOf = (idx: number, n: number) => {
  const gap = n <= 1 ? 0 : n <= 5 ? 190 : n <= 12 ? lerp(190, 78, (n - 5) / 7) : Math.min(78, 930 / (n - 1));
  return H / 2 + (idx - (n - 1) / 2) * gap;
};

export type Cable = {i: number; j: number; a: number; b: number; n1: number; n2: number; hue: number; birth: number; ph: number; lag: number};
export const CABLES: Cable[] = (() => {
  const r = rng(2024), out: Cable[] = [];
  for (let i = 0; i < NL; i++) for (let j = 0; j < NR; j++) {
    const stage = i < 3 && j < 4 ? 0 : i < 5 && j < 12 ? 1 : 2;
    out.push({i, j, a: 0.25 + r() * 0.6, b: 0.25 + r() * 0.6, n1: (r() - 0.5) * 2, n2: (r() - 0.5) * 2, hue: stage === 2 ? i % C.chaos.length : Math.floor(r() * C.chaos.length), birth: stage, ph: r() * 6.28, lag: r()});
  }
  // growth order: stage 0 in order, stage 1 in order, stage 2 by a random rank that grows ever faster
  const s0 = out.filter((c) => c.birth === 0), s1 = out.filter((c) => c.birth === 1), s2 = out.filter((c) => c.birth === 2);
  s0.forEach((c, k) => (c.birth = 15 + k * 5));
  s1.forEach((c, k) => (c.birth = 112 + k * 0.8));
  const ranks = s2.map(() => r()).map((v, k) => [v, k] as const).sort((x, y) => x[0] - y[0]);
  ranks.forEach(([, k], n) => (s2[k].birth = 165 + 120 * Math.pow(n / s2.length, 0.42)));
  return out.sort((x, y) => x.birth - y.birth);
})();

export const SAMPLES = 15;
export const bezierAt = (c: Cable, nl: number, nr: number, f: number, t: number, out: {x: number; y: number}) => {
  const y0 = yOf(c.i, nl), y3 = yOf(c.j, nr), dx = XR - XL;
  const wig = 16 * Math.sin(f * 0.07 + c.ph);
  const c1x = XL + c.a * dx, c1y = y0 + c.n1 * 560 + wig, c2x = XR - c.b * dx, c2y = y3 + c.n2 * 560 - wig;
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  out.x = a * XL + b * c1x + d * c2x + e * XR;
  out.y = a * y0 + b * c1y + d * c2y + e * y3;
};
// The ordered route: into the bar, along it, out the other side.
export const busAt = (c: Cable, t: number, out: {x: number; y: number}) => {
  const y0 = yOf(c.i, NL), y3 = yOf(c.j, NR);
  if (t <= 0.4) { out.x = lerp(XL, XBAR, t / 0.4); out.y = y0; }
  else if (t <= 0.6) { out.x = XBAR; out.y = lerp(y0, y3, (t - 0.4) / 0.2); }
  else { out.x = lerp(XBAR, XR, (t - 0.6) / 0.4); out.y = y3; }
};
