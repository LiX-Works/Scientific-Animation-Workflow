import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, Draw, Flash, H, Paint, W, hit, hits, lerp, outExpo, ramp, shake} from '../lib';
import {CABLES, NL, NR, SAMPLES, XBAR, XL, XR, bezierAt, busAt, yOf} from '../tangle';
import {drawRing} from '../draw';

// With a standard: the same cables that grew in Web.tsx snap into one line.
// `frame` runs from just before SNAP up to about 148, set by the film.
const SNAP = 60;
const a = {x: 0, y: 0}, b = {x: 0, y: 0};
const LEFT = Array.from({length: NL}, (_, i) => yOf(i, NL));
const RIGHT = Array.from({length: NR}, (_, j) => yOf(j, NR));

const draw: Draw = (ctx, f) => {
  const sh = shake(f, 34 * hits(f, [SNAP], 6));
  ctx.save();
  ctx.translate(W / 2 + sh.x, H / 2 + sh.y);
  ctx.translate(-W / 2, -H / 2);
  ctx.globalCompositeOperation = 'lighter';

  // the line
  const lineIn = ramp(f, 15, SNAP, (x) => x * x * (3 - 2 * x));
  const half = lineIn * (H / 2 + 20), w = lerp(2, 7, ramp(f, SNAP, SNAP + 10));
  ctx.fillStyle = '#fff'; ctx.fillRect(XBAR - w / 2, H / 2 - half, w, half * 2);

  // cables morph from tangle to bus
  if (f >= SNAP && f < SNAP + 40) {
    const mean = ramp(f, SNAP, SNAP + 26);
    const chaos = C.chaos.map(() => new Path2D());
    for (let k = 0; k < CABLES.length; k += 3) {
      const c = CABLES[k], p = ramp(f, SNAP + c.lag * 13, SNAP + c.lag * 13 + 13, outExpo), path = chaos[c.hue];
      for (let s = 0; s <= SAMPLES; s++) {
        const t = s / SAMPLES;
        bezierAt(c, NL, NR, SNAP, t, a); busAt(c, t, b);
        const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p);
        if (s === 0) path.moveTo(x, y); else path.lineTo(x, y);
      }
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2 * (1 - mean);
    C.chaos.forEach((col, i) => { ctx.strokeStyle = col; ctx.stroke(chaos[i]); });
    ctx.globalAlpha = 0.14 * mean * (1 - ramp(f, SNAP + 26, SNAP + 40)); ctx.strokeStyle = C.sky;
    chaos.forEach((p) => ctx.stroke(p));
    ctx.globalAlpha = 1;
  }

  // the ordered web, and packets running through it
  const clean = ramp(f, SNAP + 18, SNAP + 34);
  if (clean > 0) {
    ctx.strokeStyle = `rgba(121,180,255,${0.85 * clean})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); LEFT.forEach((y) => { ctx.moveTo(XL, y); ctx.lineTo(XBAR, y); }); ctx.stroke();
    // the outputs fan out of the bar: bright where they leave it, thin at the far end
    const comb = ctx.createLinearGradient(XBAR, 0, XR, 0);
    comb.addColorStop(0, `rgba(170,210,255,${0.85 * clean})`); comb.addColorStop(1, `rgba(90,150,255,${0.14 * clean})`);
    ctx.strokeStyle = comb; ctx.lineWidth = 1;
    ctx.beginPath(); RIGHT.forEach((y, j) => { if (j % 2) return; ctx.moveTo(XBAR, y); ctx.lineTo(XR, y); }); ctx.stroke();
    ctx.fillStyle = `rgba(235,245,255,${clean})`;
    LEFT.forEach((y, i) => { const p = ((f * 0.012 + i * 0.37) % 1); ctx.fillRect(lerp(XL, XBAR, p) - 22, y - 2, 44, 4); });
    RIGHT.forEach((y, j) => { if (j % 3) return; const p = ((f * 0.016 + j * 0.0713) % 1); ctx.fillRect(lerp(XBAR, XR, p) - 12, y - 1, 24, 2); });
    ctx.fillStyle = `rgba(255,255,255,${clean})`;
    LEFT.forEach((y) => ctx.fillRect(XL - 5, y - 5, 10, 10));
    RIGHT.forEach((y) => ctx.fillRect(XR - 3, y - 1, 6, 2));
  }

  for (const [t, col] of [[SNAP, '220,235,255'], [SNAP + 6, '120,175,255']] as const) {
    const age = f - t;
    if (age >= 0 && age < 34) drawRing(ctx, W / 2, H / 2, outExpo(age / 34) * 1400, 1 - age / 34, col, 10 * (1 - age / 34) + 1);
  }
  ctx.restore();
};

export const Bus: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{background: C.ink}}>
    <Paint draw={draw} bloom={0.6} frame={frame} />
    <Flash v={hit(frame, SNAP, 6)} />
  </AbsoluteFill>
);
