import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, Draw, Paint, W, H, clamp, lerp, outExpo, ramp, shake} from '../lib';
import {CABLES, SAMPLES, XL, XR, bezierAt, yOf} from '../tangle';

// Without a standard: every app wired to every program. Only the wires; the narration says what they mean.
// `frame` is a position along the web's own growth curve, set by the film so it can follow the spoken sentence.
const nodesAt = (f: number) => {
  const a = ramp(f, 104, 122, outExpo), b = ramp(f, 160, 200, outExpo);
  return {nl: lerp(lerp(3, 5, a), 20, b), nr: lerp(lerp(4, 12, a), 300, b)};
};
const countAt = (f: number) => {
  let lo = 0, hi = CABLES.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (CABLES[m].birth <= f) lo = m + 1; else hi = m; }
  return lo;
};

const pt = {x: 0, y: 0};
const draw: Draw = (ctx, f) => {
  const {nl, nr} = nodesAt(f);
  const n = countAt(f);
  const sh = shake(f, 3 + 26 * ramp(f, 230, 350));
  const push = 1 + ramp(f, 165, 358, (x) => x * x) * 0.12;
  ctx.save(); ctx.translate(W / 2 + sh.x, H / 2 + sh.y); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
  ctx.globalCompositeOperation = 'lighter';
  const dense = ramp(n, 60, 1800, (x) => Math.sqrt(x));
  ctx.lineWidth = lerp(3.4, 1, ramp(n, 12, 900));
  const alpha = lerp(0.95, 0.2, dense);
  const paths = C.chaos.map(() => new Path2D());
  for (let k = 0; k < n; k++) {
    if (k >= 60 && k % 3) continue; // a third of the cables reads as wires; all of them read as a blanket
    const c = CABLES[k], p = ramp(f, c.birth, c.birth + 9, outExpo), path = paths[c.hue];
    const end = Math.max(1, Math.ceil(SAMPLES * p));
    for (let s = 0; s <= end; s++) {
      bezierAt(c, nl, nr, f, Math.min(p, s / SAMPLES), pt);
      if (s === 0) path.moveTo(pt.x, pt.y); else path.lineTo(pt.x, pt.y);
    }
  }
  ctx.globalAlpha = clamp(alpha);
  C.chaos.forEach((col, i) => { ctx.strokeStyle = col; ctx.stroke(paths[i]); });

  // the plugs: every pair needs a different one
  ctx.globalAlpha = 1 - ramp(f, 180, 215);
  if (ctx.globalAlpha > 0) for (let k = 0; k < Math.min(n, 60); k++) {
    const c = CABLES[k], sz = 11;
    ctx.fillStyle = C.chaos[c.hue];
    const y0 = yOf(c.i, nl), y3 = yOf(c.j, nr), sh2 = (c.i * 3 + c.j * 5) % 3;
    ctx.save(); ctx.translate(XR - 26, y3 + (c.i - 1) * 9);
    if (sh2 === 0) ctx.fillRect(-sz, -sz / 2, sz * 2, sz);
    else if (sh2 === 1) { ctx.beginPath(); ctx.arc(0, 0, sz * 0.7, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-sz, -sz * 0.7); ctx.lineTo(sz, 0); ctx.lineTo(-sz, sz * 0.7); ctx.fill(); }
    ctx.restore();
    ctx.fillRect(XL + 18, y0 + (c.j - 1.5) * 8 - 2, 16, 4);
  }

  ctx.globalAlpha = 1; ctx.fillStyle = '#fff';
  const dotL = Math.floor(nl + 0.001), dotR = Math.floor(nr + 0.001);
  for (let i = 0; i < dotL; i++) ctx.fillRect(XL - 4, yOf(i, nl) - 4, 8, 8);
  for (let j = 0; j < dotR; j++) ctx.fillRect(XR - 3, yOf(j, nr) - 1, 6, 2);
  ctx.restore();
};

export const Web: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{background: C.ink}}><Paint draw={draw} bloom={0.4} frame={frame} /></AbsoluteFill>
);
