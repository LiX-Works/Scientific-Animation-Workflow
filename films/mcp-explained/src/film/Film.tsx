import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, Draw, Flash, Grain, H, MONO, Paint, SANS, T, Vignette, W, clamp, hit, hits, inOut, lerp, outCubic, outExpo, ramp, rng, shake} from '../lib';
import {View, drawCore, drawRing, drawServer, drawTunnel, drawWire, project} from '../draw';
import {Web} from './Web';
import {Bus} from './Bus';
import tl from './timeline.json';
// @ts-ignore plain module shared with the sound script
import {buildEvents, hops} from './events.mjs';

// The whole film. Every effect marks something that is actually happening: a message moving, the model reading
// or writing, a server doing work, a call failing. All timing comes from events.mjs, which comes from the narration.
const E: any = buildEvents(tl);
const H_: any = hops(E);
export const FILM_FRAMES = tl.frames * 2;           // rendered at 60 fps; all timing below is in 30 fps units

const K = {panel: 'rgba(8,16,38,.74)', edge: 'rgba(140,190,255,.42)', ice: '#DCE8FF', sky: '#8DB4FF', blue: '#4C8DFF', amber: '#FFD36B', green: '#5FE3B0', red: '#FF5A6C', mute: '#90A2C2'};
const pw = (f: number, pts: number[][]) => {
  if (f <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (f - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  return pts[pts.length - 1][1];
};

// ================================================================ the opening: a mind in a glass box
const HS = 1.42;
type Plane = {axis: 0 | 1 | 2; sign: 1 | -1};
const FACES: Plane[] = [{axis: 0, sign: 1}, {axis: 2, sign: -1}, {axis: 1, sign: -1}, {axis: 0, sign: -1}, {axis: 2, sign: -1}, {axis: 0, sign: 1}];
const PTS = (() => { const r = rng(12); return FACES.map(() => [-0.75 + r() * 1.5, -0.75 + r() * 1.5]); })();
const onFace = (p: Plane, u: number, v: number): [number, number, number] => { const w = p.sign * HS; return p.axis === 0 ? [w, u, v] : p.axis === 1 ? [u, w, v] : [u, v, w]; };
const EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const CORNERS: [number, number, number][] = [];
for (const x of [-HS, HS]) for (const y of [-HS, HS]) for (const z of [-HS, HS]) CORNERS.push([x, y, z]);
const drawGlass: Draw = (ctx, fr) => {
  const f = fr / 2, pull = ramp(f, E.pull[0], E.pull[1], inOut), grow = ramp(f, E.ignite, E.ignite + 22, outExpo);
  const pulse = hit(f, E.ignite, 12) + hits(f, E.strikes, 6) * 0.5;
  const sh = shake(f, 20 * hit(f, E.ignite, 6) + 14 * hits(f, E.strikes, 4));
  const R = grow * lerp(720, 265, pull);
  const v: View = {cx: W / 2 + sh.x, cy: lerp(H / 2, 455, pull) + sh.y, R, yaw: f * 0.0048 + 0.5, pitch: 0.34, persp: 0.15};
  if (f >= E.ignite - 18 && f < E.ignite + 3) {
    const k = ramp(f, E.ignite - 18, E.ignite, (x) => x * x), g = ctx.createRadialGradient(v.cx, v.cy, 0, v.cx, v.cy, 20 + 80 * k);
    g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(90,150,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  drawCore(ctx, v, f * 0.055, {pulse});
  const box = ramp(f, E.pull[0] + 8, E.pull[1] - 4, inOut);
  if (box <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const P = CORNERS.map((c) => project(v, c[0], c[1], c[2]));
  for (const [a, b] of EDGES) {
    const near = clamp(0.55 - (P[a].z + P[b].z) * 0.14);
    ctx.strokeStyle = `rgba(205,230,255,${(0.28 + near * 0.72) * box})`; ctx.lineWidth = 1.2 + near * 3;
    ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(lerp(P[a].x, P[b].x, box), lerp(P[a].y, P[b].y, box)); ctx.stroke();
  }
  E.strikes.forEach((t: number, i: number) => {
    if (f < t - 8 || f > t + 34) return;
    const face = FACES[i], [u, w] = PTS[i], tgt = onFace(face, u, w);
    if (f < t) {
      const s = ramp(f, t - 8, t, (x) => x * x), s0 = Math.max(0, s - 0.35);
      const a = project(v, tgt[0] * s0, tgt[1] * s0, tgt[2] * s0), b = project(v, tgt[0] * s, tgt[1] * s, tgt[2] * s);
      ctx.strokeStyle = '#EAF4FF'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      return;
    }
    for (let ring = 0; ring < 3; ring++) {
      const age = f - t - ring * 3; if (age < 0) continue;
      const rad = 0.08 + age * 0.05, al = Math.exp(-age / 9);
      ctx.strokeStyle = `rgba(190,225,255,${al})`; ctx.lineWidth = 4 * al + 1; ctx.beginPath();
      let pen = false;
      for (let k = 0; k <= 48; k++) {
        const th = (k / 48) * Math.PI * 2, uu = u + Math.cos(th) * rad, vv = w + Math.sin(th) * rad;
        if (Math.abs(uu) > HS || Math.abs(vv) > HS) { pen = false; continue; }
        const q0 = onFace(face, uu, vv), q = project(v, q0[0], q0[1], q0[2]);
        if (pen) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
        pen = true;
      }
      ctx.stroke();
    }
  });
  ctx.restore();
};

// ================================================================ the window is only the top layer
// Plates lie in the x-z plane. Looking straight down they read as a flat app window; tilted, the layers below appear.
const stackT = (f: number) => ramp(f, E.tilt, E.tilt + 48, inOut);
const stackView = (f: number): View => {
  const t = stackT(f), w = ramp(f, E.gui, E.gui + 12, outExpo);
  return {cx: lerp(960, 1195, t), cy: lerp(470, 262, t), R: lerp(600, 372, t) * lerp(0.92, 1, w), yaw: lerp(0, -0.42, t) + t * (f - E.tilt) * 0.0013, pitch: lerp(Math.PI / 2, 0.62, t), persp: 0.13};
};
const layerY = (k: number, t: number) => k * 0.55 * t;
const UW = 1, VH = 0.62;
const quad = (ctx: CanvasRenderingContext2D, v: View, y: number, u0: number, v0: number, u1: number, v1: number) => {
  const a = project(v, u0, y, v0), b = project(v, u1, y, v0), c = project(v, u1, y, v1), d = project(v, u0, y, v1);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
};
const PLATE_BLOCKS = (() => {
  const r = rng(404);
  const counts = [0, 18, 26, 60];       // scripting: few wide entries; commands: many; core: dense
  return counts.map((n, k) => Array.from({length: n}, () => {
    const w = k === 3 ? 0.04 + r() * 0.06 : k === 1 ? 0.16 + r() * 0.2 : 0.07 + r() * 0.13, h = k === 3 ? 0.03 + r() * 0.05 : 0.06 + r() * 0.08;
    const u = -UW + 0.06 + r() * (2 * UW - 0.12 - w), w0 = -VH + 0.05 + r() * (2 * VH - 0.1 - h);
    return {u, v: w0, w, h, o: r()};
  }));
})();
const LINKS = (() => { const r = rng(9); return Array.from({length: 26}, () => ({u: -0.9 + r() * 1.8, v: -0.5 + r(), o: r(), k: Math.floor(r() * 3)})); })();
const drawLowerLayers: Draw = (ctx, fr) => {
  const f = fr / 2, t = stackT(f), v = stackView(f);
  drawTunnel(ctx, f, 0.45 * t, 1195, 480, 0.8);
  if (t <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
  const glowAt = [0, E.lScript, E.lCmd, E.lCore];
  for (let k = 3; k >= 1; k--) {
    const y = layerY(k, t), h = hit(f, glowAt[k], 18), on = ramp(f, E.tilt + 10 + k * 6, E.tilt + 34 + k * 6);
    quad(ctx, v, y, -UW, -VH, UW, VH);
    ctx.fillStyle = `rgba(70,130,255,${(0.1 + h * 0.24) * on})`; ctx.fill();
    ctx.strokeStyle = `rgba(150,195,255,${(0.65 + h * 0.35) * on})`; ctx.lineWidth = 2 + h * 2.5; ctx.stroke();
    for (const b of PLATE_BLOCKS[k]) {
      const lit = clamp(Math.pow(Math.max(0, Math.sin(f * 0.13 + b.o * 25)), 10) + h * 0.7);
      quad(ctx, v, y, b.u, b.v, b.u + b.w, b.v + b.h);
      ctx.fillStyle = `rgba(150,195,255,${(0.16 + lit * 0.72) * on})`; ctx.fill();
      ctx.strokeStyle = `rgba(190,220,255,${0.7 * on})`; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  // signals running between the layers
  for (const l of LINKS) {
    const y0 = layerY(l.k, t), y1 = layerY(l.k + 1, t), a = project(v, l.u, y0, l.v), b = project(v, l.u, y1, l.v);
    ctx.strokeStyle = `rgba(150,195,255,${0.28 * t})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const p = (f * 0.022 + l.o) % 1, x = lerp(a.x, b.x, p), yy = lerp(a.y, b.y, p);
    ctx.fillStyle = `rgba(230,242,255,${0.95 * t})`; ctx.fillRect(x - 2.5, yy - 5, 5, 10);
  }
  // the MCP server clamps onto the scripting layer
  const srv = ramp(f, E.pack - 8, E.pack + 8, outExpo);
  if (srv > 0) {
    const y = layerY(1, t), u0 = -UW - 0.44 * srv, u1 = -UW, hh = 0.13, dd = 0.2, gl = 0.5 + hit(f, E.pack, 18) * 0.5;
    const faces: [number, number, number][][] = [
      [[u0, y - hh, -dd], [u1, y - hh, -dd], [u1, y - hh, dd], [u0, y - hh, dd]],
      [[u0, y - hh, dd], [u1, y - hh, dd], [u1, y + hh, dd], [u0, y + hh, dd]],
      [[u0, y - hh, -dd], [u0, y - hh, dd], [u0, y + hh, dd], [u0, y + hh, -dd]],
    ];
    for (const fc of faces) {
      ctx.beginPath(); fc.forEach((p, i) => { const q = project(v, p[0], p[1], p[2]); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.closePath();
      ctx.fillStyle = `rgba(255,211,107,${0.3 * gl})`; ctx.fill(); ctx.strokeStyle = `rgba(255,225,150,${gl})`; ctx.lineWidth = 2.5; ctx.stroke();
    }
    const box = project(v, (u0 + u1) / 2, y, 0);
    TOOL_CHIPS.forEach((_, i) => {
      const c = ramp(f, E.tools - 4 + i * 4, E.tools + 8 + i * 4, outCubic);
      if (c <= 0) return;
      ctx.strokeStyle = `rgba(255,211,107,${0.75 * c})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(box.x, box.y); ctx.lineTo(lerp(box.x, 505, c), lerp(box.y, CHIP_Y0 + i * CHIP_DY, c)); ctx.stroke();
    });
  }
  ctx.restore();
};
const CHIP_Y0 = 560, CHIP_DY = 68;
const TOOL_CHIPS = ['import_data', 'plot_line', 'set_axis', 'export_figure'];
// The top plate is drawn after the bloom, so the app window stays crisp.
const drawTopPlate: Draw = (ctx, fr) => {
  const f = fr / 2, t = stackT(f), v = stackView(f);
  const a = ramp(f, E.gui, E.gui + 6);
  if (a <= 0) return;
  const al = a * lerp(1, 0.9, t);
  ctx.globalAlpha = al;
  const fill = (u0: number, v0: number, u1: number, v1: number, c: string) => { quad(ctx, v, 0, u0, v0, u1, v1); ctx.fillStyle = c; ctx.fill(); };
  fill(-UW, -VH, UW, VH, '#EEF2F9');
  fill(-UW, 0.53, UW, VH, '#C9D5E8');
  fill(-UW, 0.46, UW, 0.53, '#DFE6F1');
  for (let r = 0; r < 2; r++) for (let i = 0; i < 34; i++) {
    const u = -0.985 + i * 0.058, top = 0.44 - r * 0.075;
    fill(u, top - 0.058, u + 0.046, top, r === 0 ? (i % 5 === 0 ? '#7FA4DC' : '#B6C6DE') : i % 7 === 0 ? '#E0B15F' : '#BFCDE2');
  }
  fill(-UW, -0.56, -0.58, 0.28, '#E2E8F2');
  for (let i = 0; i < 11; i++) fill(-0.97, 0.22 - i * 0.07, -0.62 - (i % 3) * 0.06, 0.18 - i * 0.07, '#AFBFD6');
  fill(-0.54, -0.54, 0.97, 0.26, '#FFFFFF');
  fill(-UW, -VH, UW, -0.56, '#D3DCEA');
  // a small graph in the document area
  const line = (pts: [number, number][], c: string, w: number) => {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach(([u, vv], i) => { const q = project(v, u, 0, vv); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke();
  };
  line([[-0.44, 0.2], [-0.44, -0.46], [0.88, -0.46]], '#1B2B46', 3);
  const curve = (amp: number, tau: number): [number, number][] => Array.from({length: 40}, (_, i) => { const x = i / 39; return [-0.44 + x * 1.3, -0.46 + amp * (1 - Math.exp(-x / tau))]; });
  line(curve(0.56, 0.2), '#1450D2', 3.5); line(curve(0.38, 0.28), '#0E8A7D', 3.5); line(curve(0.22, 0.38), '#C8501E', 3.5);
  quad(ctx, v, 0, -UW, -VH, UW, VH); ctx.strokeStyle = t > 0 ? `rgba(205,230,255,${0.8})` : '#8DA3C4'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.globalAlpha = 1;
};
const CURSOR: {f: number; u: number; v: number}[] = [];
const makeCursor = () => {
  const pts = [[-0.86, 0.41], [-0.5, 0.41], [-0.2, 0.335], [0.3, 0.41], [-0.8, 0.1], [0.56, 0.335], [0.12, -0.02]];
  const t0 = E.menus - 4, t1 = E.brk + 2;
  pts.forEach((p, i) => CURSOR.push({f: lerp(t0, t1, i / (pts.length - 1)), u: p[0], v: p[1]}));
};
makeCursor();
const cursorAt = (f: number) => {
  if (f <= CURSOR[0].f) return {u: CURSOR[0].u, v: CURSOR[0].v};
  for (let i = 1; i < CURSOR.length; i++) if (f <= CURSOR[i].f) { const p = inOut((f - CURSOR[i - 1].f) / (CURSOR[i].f - CURSOR[i - 1].f)); return {u: lerp(CURSOR[i - 1].u, CURSOR[i].u, p), v: lerp(CURSOR[i - 1].v, CURSOR[i].v, p)}; }
  return {u: CURSOR[CURSOR.length - 1].u, v: CURSOR[CURSOR.length - 1].v};
};
const LAYER_NAMES = [{k: 0, t: 'Window', at: (): number => E.tilt + 4}, {k: 1, t: 'Scripting interfaces', at: (): number => E.lScript}, {k: 2, t: 'Commands', at: (): number => E.lCmd}, {k: 3, t: 'Core engine', at: (): number => E.lCore}];
const Layers: React.FC<{f: number}> = ({f}) => {
  const t = stackT(f), v = stackView(f), flat = 1 - ramp(f, E.tilt - 6, E.tilt + 6);
  const sc = (u: number, vv: number) => project(v, u, 0, vv);
  const cur = cursorAt(f), cp = sc(cur.u, cur.v);
  const clicks = CURSOR.map((c) => c.f);
  const down = hits(f, clicks, 3);
  const dlg = ramp(f, E.slow + 8, E.slow + 14, outExpo);
  const fail = hit(f, E.brk + 2, 9);
  const tl0 = sc(-0.98, 0.575), ml = sc(-0.98, 0.495);
  return (
    <AbsoluteFill>
      <Paint draw={drawLowerLayers} after={drawTopPlate} frame={f * 2} bloom={0.75} />
      {flat > 0 && (
        <div style={{position: 'absolute', inset: 0, opacity: flat}}>
          <div style={{position: 'absolute', left: tl0.x + 10, top: tl0.y - 15, fontFamily: SANS, fontWeight: 700, fontSize: 26, color: '#14233C'}}>Origin</div>
          <div style={{position: 'absolute', left: ml.x + 10, top: ml.y - 12, display: 'flex', gap: 26, fontFamily: SANS, fontWeight: 500, fontSize: 21, color: '#14233C'}}>
            {['File', 'Edit', 'View', 'Plot', 'Column', 'Worksheet', 'Analysis', 'Statistics', 'Image', 'Tools', 'Format', 'Window', 'Help'].map((m) => <span key={m}>{m}</span>)}
          </div>
          {dlg > 0 && (
            <div style={{position: 'absolute', left: 960, top: 500, width: 560, transform: `translate(-50%,-50%) scale(${lerp(0.9, 1, dlg)})`, opacity: dlg, boxSizing: 'border-box', padding: '24px 30px', borderRadius: 12, background: '#F5F7FB', border: `3px solid ${fail > 0.03 ? K.red : '#8DA3C4'}`, boxShadow: `0 16px 44px rgba(0,0,20,.45), 0 0 ${40 * fail}px ${K.red}`, fontFamily: SANS, color: '#14233C'}}>
              <div style={{fontWeight: 700, fontSize: 34}}>Unexpected dialog</div>
              <div style={{fontWeight: 500, fontSize: 25, marginTop: 8}}>The next click landed in the wrong place.</div>
            </div>
          )}
          {f >= E.gui + 4 && <svg width={56} height={66} viewBox="0 0 26 30" style={{position: 'absolute', left: cp.x - 6, top: cp.y - 4, transform: `scale(${1 - down * 0.14})`, transformOrigin: '6px 4px', filter: `drop-shadow(0 0 6px ${K.blue})`}}><path d="M3 2 L3 24 L9 18.5 L13 27 L17 25.2 L13 16.8 L21 16.8 Z" fill="#14233C" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" /></svg>}
          {clicks.map((c, i) => { const age = f - c; if (age < 0 || age > 14) return null; const p = sc(CURSOR[i].u, CURSOR[i].v); return <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: 16 + age * 5, height: 16 + age * 5, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: `3px solid ${i === CURSOR.length - 1 ? K.red : K.blue}`, opacity: 1 - age / 14}} />; })}
        </div>
      )}
      {t > 0 && LAYER_NAMES.map((l) => {
        const on = ramp(f, l.at() - 3, l.at() + 8, outExpo);
        if (on <= 0) return null;
        const a = project(v, UW, layerY(l.k, t), 0.05);
        return (
          <div key={l.k} style={{position: 'absolute', left: a.x + 18, top: a.y, transform: `translateY(-50%) translateX(${(1 - on) * 24}px)`, opacity: on, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: l.k === 1 && f >= E.pack ? K.amber : '#fff', textShadow: '0 0 16px #03050C'}}>
            <span style={{display: 'inline-block', width: 26, height: 3, background: l.k === 1 && f >= E.pack ? K.amber : K.sky}} />{l.t}
          </div>
        );
      })}
      {f >= E.pack - 4 && (() => { const y = layerY(1, t), b = project(v, -UW - 0.44, y, 0); return <div style={{position: 'absolute', left: b.x + 70, top: b.y - 92, transform: 'translate(-100%,-50%)', opacity: ramp(f, E.pack, E.pack + 10), fontFamily: SANS, fontWeight: 700, fontSize: 30, color: K.amber, whiteSpace: 'nowrap', textShadow: '0 0 14px #03050C'}}>MCP server</div>; })()}
      <T f={f} from={E.title} to={E.stage - 8} x={350} y={190} w={660} size={200} weight={800} tracking="-0.03em">MCP</T>
      <T f={f} from={E.title + 8} to={E.stage - 8} x={350} y={325} w={660} size={52} weight={600} fx="rise">Model Context Protocol</T>
      <T f={f} from={E.late - 2} to={E.stage - 8} x={350} y={400} w={660} size={32} weight={600} fx="rise" color={C.ice}>Released by Anthropic, late 2024</T>
      <T f={f} from={E.late + 18} to={E.stage - 8} x={350} y={462} w={560} size={28} weight={500} lh={1.2} fx="rise" color={C.ice}>Donated to the Agentic AI Foundation, under the Linux Foundation, Dec 2025</T>
      {TOOL_CHIPS.map((c, i) => {
        const p = ramp(f, E.tools - 4 + i * 4, E.tools + 8 + i * 4, outExpo);
        return p > 0 && f < E.stage - 2 ? <div key={c} style={{position: 'absolute', left: 195, top: CHIP_Y0 + i * CHIP_DY, width: 310, boxSizing: 'border-box', textAlign: 'center', transform: `translateY(-50%) translateX(${(1 - p) * 60}px)`, opacity: p, padding: '10px 14px', borderRadius: 12, background: 'rgba(5,12,30,.96)', border: `2.5px solid ${K.amber}`, boxShadow: `0 0 20px rgba(255,211,107,.6)`, fontFamily: MONO, fontWeight: 600, fontSize: 30, color: '#fff'}}>{c}</div> : null;
      })}
      <Flash v={hit(f, E.brk + 2, 6) * 0.35} color={K.red} />
      <Flash v={hit(f, E.title, 7) * 0.8} />
      <Flash v={ramp(f, E.stage - 10, E.stage, (x) => x * x) * 0.9} color="#BFD9FF" />
    </AbsoluteFill>
  );
};

// ================================================================ the world: stage geometry and camera
const M = {x: 50, y: 50, w: 720, h: 870}, A = {x: 830, y: 50, w: 280, h: 870};
const ROW = [{y: 50, h: 415}, {y: 505, h: 415}, {y: 960, h: 200}, {y: 1190, h: 200}];
const SVX = 1170, SVW = 190, SWX = 1400, SWW = 470, MID = 485;
const laneY = (r: number) => ROW[r].y + ROW[r].h / 2;
const CORE = {x: 410, y: 485};
type Key = {f: number; x: number; y: number; z: number; d?: number};
const CAM: Key[] = [
  {f: 0, x: 960, y: 485, z: 1.3},
  {f: E.stage, x: 960, y: 485, z: 1, d: 46},
  {f: E.list - 22, x: 1240, y: 485, z: 1.28, d: 30},
  {f: E.rush - 6, x: 960, y: 485, z: 1, d: 16},
  {f: E.ctx + 6, x: 640, y: 485, z: 1.18, d: 24},
  {f: E.wall - 14, x: 960, y: 485, z: 1, d: 20},
  {f: E.write - 6, x: 410, y: 640, z: 1.62, d: 26},
  {f: E.relay, x: 1000, y: 320, z: 1.36, d: 26},
  {f: E.run + 2, x: SVX + 95, y: 257, z: 1.7, d: 18},
  {f: E.dive - 12, x: SVX + 95, y: 225, z: 3.4, d: 12},
  {f: E.back - 16, x: 1500, y: 257, z: 1.45, d: 1},
  {f: E.back + 6, x: 960, y: 485, z: 1, d: 22},
  {f: E.read - 10, x: 410, y: 640, z: 1.62, d: 24},
  {f: E.send2 + 2, x: 1270, y: 712, z: 1.4, d: 30},
  {f: E.err + 8, x: 410, y: 640, z: 1.62, d: 26},
  {f: E.retry - 8, x: 960, y: 485, z: 1, d: 24},
  {f: E.more - 4, x: 960, y: 722, z: 0.655, d: 30},
];
const camera = (f: number) => {
  let c = {x: CAM[0].x, y: CAM[0].y, z: CAM[0].z};
  for (const k of CAM) {
    if (f < k.f) break;
    const p = inOut(clamp((f - k.f) / (k.d ?? 24)));
    c = {x: lerp(c.x, k.x, p), y: lerp(c.y, k.y, p), z: lerp(c.z, k.z, p)};
  }
  // a slow drift, so the frame is never quite still
  return {x: c.x + 5 * Math.sin(f * 0.021), y: c.y + 4 * Math.sin(f * 0.017 + 1), z: c.z * (1 + 0.006 * Math.sin(f * 0.013))};
};

// ---------------------------------------------------------------- messages
type Pt = [number, number];
const mx = M.x + M.w, ax = A.x + 140, ax1 = A.x + A.w;
const pos = (f: number, t0: number, pts: Pt[], each: number) => {
  const total = each * (pts.length - 1), p = clamp((f - t0) / total) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(p)), u = inOut(p - i);
  return {x: lerp(pts[i][0], pts[i + 1][0], u), y: lerp(pts[i][1], pts[i + 1][1], u), on: f >= t0 && f <= t0 + total + 2, end: t0 + total};
};
const Y0 = laneY(0), Y1 = laneY(1);
const ROUTES: {t: string; hop: number[]; pts: Pt[]; c: string; rgb: string}[] = [
  {t: 'tools/list', hop: H_.list, pts: [[ax1, Y0], [SVX, Y0]], c: K.sky, rgb: '150,195,255'},
  {t: 'tools/list', hop: H_.list, pts: [[ax1, Y1], [SVX, Y1]], c: K.sky, rgb: '150,195,255'},
  {t: 'tool list', hop: H_.back, pts: [[SVX, Y0], [ax1, Y0]], c: K.green, rgb: '110,230,180'},
  {t: 'tool list', hop: H_.back, pts: [[SVX, Y1], [ax1, Y1]], c: K.green, rgb: '110,230,180'},
  {t: 'search_papers(…)', hop: H_.reqA, pts: [[mx, MID], [ax, MID]], c: K.amber, rgb: '255,211,107'},
  {t: 'tools/call', hop: H_.reqB, pts: [[ax, Y0], [SVX, Y0]], c: K.sky, rgb: '150,195,255'},
  {t: 'result', hop: H_.res, pts: [[SVX, Y0], [ax, Y0], [ax, MID], [mx, MID]], c: K.green, rgb: '110,230,180'},
  {t: 'add_by_doi(…)', hop: H_.add, pts: [[mx, MID], [ax, MID], [ax, Y1], [SVX, Y1]], c: K.sky, rgb: '150,195,255'},
  {t: 'error', hop: H_.bad, pts: [[SVX, Y1], [ax, Y1], [ax, MID], [mx, MID]], c: K.red, rgb: '255,90,108'},
  {t: 'add_by_doi(…)', hop: H_.again, pts: [[mx, MID], [ax, MID], [ax, Y1], [SVX, Y1]], c: K.sky, rgb: '150,195,255'},
];
const FALL = (() => { const r = rng(3); return Array.from({length: 320}, () => ({a: r() * 6.283, d: 60 + r() * 330, o: r()})); })();
const WALL_T = [0, 7, 14, 20];
const WALL_Y = [300, 620, 430, 720];

const drawWorld: Draw = (ctx, fr) => {
  const f = fr / 2, c = camera(f), g = ramp(f, E.more, E.more + 26, inOut);
  const wall = ramp(f, E.wall, E.wall + 10) * (1 - ramp(f, E.relay, E.relay + 12));
  const loop = ramp(f, E.nothing - 4, E.nothing + 8) ;
  const rate = 1 + loop * 5;
  drawTunnel(ctx, f, 0.6, 960 - (c.x - 960) * 0.25, 490 - (c.y - 485) * 0.25, 1 + loop * 2);
  ctx.setTransform(c.z, 0, 0, c.z, 960 - c.x * c.z, 490 - c.y * c.z);

  const typing = (f >= E.req1 && f < E.req1 + 60) || (f >= E.req2 - 6 && f < E.req2 + 40) || (f >= E.fix - 2 && f < E.fix + 20) ? 0.22 + 0.16 * Math.sin(f * 1.4) : 0;
  const reads = [E.ctx + 18, E.you, E.back + 21, E.err + 21, E.retryDone + 6, E.longer];
  const pulse = hits(f, reads, 9) + typing + hits(f, WALL_T.map((d) => E.wall + d), 5) * 0.35;
  const cv: View = {cx: CORE.x, cy: CORE.y + 235 * g, R: 305 + 70 * g, yaw: f * 0.009, pitch: 0.3, persp: 0.12};
  drawCore(ctx, cv, f * 0.05, {pulse, alpha: 0.9, points: 4500});

  const k = 1 - 0.62 * wall;
  const isErr = f >= E.nope && f < E.fix;
  drawWire(ctx, mx, A.x, MID, f, k, rate);
  [0, 1].forEach((r) => {
    const col = r === 1 && isErr ? '255,90,108' : '121,180,255';
    drawWire(ctx, ax1, SVX, laneY(r), f, k, rate, col);
    drawWire(ctx, SVX + SVW, SWX, laneY(r), f, k * (f >= E.front && f < E.rush ? 1.4 : 0.8), rate * 1.5, col);
    const p = r === 0 ? Math.max(hit(f, E.list + 18, 16), hit(f, E.run + 6, 30), f >= E.srv && f < E.rush ? 0.6 : 0, loop * 0.35) : Math.max(hit(f, E.list + 18, 16), hit(f, E.solar, 24), hit(f, E.retryDone, 24), f >= E.srv && f < E.rush ? 0.6 : 0, loop * 0.35);
    drawServer(ctx, SVX + 95, laneY(r) - 62, 64, f, p, col, k);
  });
  if (g > 0) [2, 3].forEach((r) => {
    drawWire(ctx, ax1, SVX, laneY(r), f, g, rate);
    drawWire(ctx, SVX + SVW, SWX, laneY(r), f, g, rate * 1.5);
    drawServer(ctx, SVX + 95, laneY(r) - 30, 40, f, hit(f, E.more + 8 + (r - 2) * 8, 18) + (f >= E.longer ? 0.5 : 0), '121,180,255', g);
    drawRing(ctx, SVX + 95, laneY(r), (f - E.more - 8 - (r - 2) * 8) * 16, 1 - (f - E.more - 8 - (r - 2) * 8) / 30, '180,215,255', 5);
  });

  // the tool text pours into the model
  if (f >= E.ctx - 2 && f < E.ctx + 34) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const p of FALL) {
      const u = ramp(f, E.ctx - 2 + p.o * 12, E.ctx + 16 + p.o * 12, (x) => x * x), u0 = ramp(f - 2, E.ctx - 2 + p.o * 12, E.ctx + 16 + p.o * 12, (x) => x * x);
      if (u <= 0 || u >= 1) continue;
      const sx = 960 + Math.cos(p.a) * p.d, sy = 470 + Math.sin(p.a) * p.d * 0.6;
      ctx.strokeStyle = 'rgba(170,210,255,.85)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(lerp(sx, CORE.x, u0), lerp(sy, CORE.y, u0)); ctx.lineTo(lerp(sx, CORE.x, u), lerp(sy, CORE.y, u)); ctx.stroke();
    }
    ctx.restore();
  }

  // the glass wall of the model: strikes run out and stop there
  if (wall > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(215,235,255,${0.9 * wall})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mx, M.y); ctx.lineTo(mx, M.y + M.h); ctx.stroke();
    WALL_T.forEach((d, i) => {
      const t = E.wall + d, y = WALL_Y[i];
      if (f >= t - 7 && f < t) {
        const s = ramp(f, t - 7, t, (x) => x * x), s0 = Math.max(0, s - 0.3);
        ctx.strokeStyle = '#EAF4FF'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(lerp(CORE.x, mx, s0), lerp(CORE.y, y, s0)); ctx.lineTo(lerp(CORE.x, mx, s), lerp(CORE.y, y, s)); ctx.stroke();
      }
      for (let n = 0; n < 3; n++) {
        const age = f - t - n * 3; if (age < 0 || age > 30) continue;
        ctx.strokeStyle = `rgba(190,225,255,${Math.exp(-age / 9)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(mx, y, 6 + age * 1.2, 12 + age * 6, 0, 0, Math.PI * 2); ctx.stroke();
      }
    });
    ctx.restore();
  }

  // message trails and arrivals
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const r of ROUTES) {
    const a = pos(f, r.hop[0], r.pts, r.hop[1]);
    if (a.on) {
      const b = pos(f - 5, r.hop[0], r.pts, r.hop[1]), gr = ctx.createLinearGradient(b.x, b.y, a.x, a.y);
      gr.addColorStop(0, `rgba(${r.rgb},0)`); gr.addColorStop(1, `rgba(${r.rgb},.95)`);
      ctx.strokeStyle = gr; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(a.x, a.y); ctx.stroke();
    }
    const [ex, ey] = r.pts[r.pts.length - 1];
    drawRing(ctx, ex, ey, (f - a.end) * 7, 1 - (f - a.end) / 16, r.rgb, 4);
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ---------------------------------------------------------------- the model's transcript
const Tag: React.FC<{text: string; c: string}> = ({text, c}) => <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 19, letterSpacing: '.06em', color: c, marginBottom: 7}}>{text}</div>;
const type = (s: string, f: number, t0: number, cps = 1.1) => s.slice(0, Math.max(0, Math.floor((f - t0) * cps)));
const Hi: React.FC<{on: boolean; c?: string; children: React.ReactNode}> = ({on, c = 'rgba(255,211,107,.34)', children}) => <span style={{background: on ? c : 'transparent', borderRadius: 5, padding: '1px 3px', margin: '-1px -3px'}}>{children}</span>;
const mono: React.CSSProperties = {fontFamily: MONO, fontSize: 22, lineHeight: 1.42, color: K.ice, whiteSpace: 'pre-wrap'};
const sans23: React.CSSProperties = {fontFamily: SANS, fontSize: 23};
const DOI = '10.1234/psc.25.01';
const Transcript: React.FC<{f: number; g: number}> = ({f, g}) => {
  const on = (t: number) => f >= t;
  const blocks = [
    {at: E.ctx + 16, h: 196 + 196 * ramp(f, E.more + 6, E.more + 26, outCubic), el: (
      <>
        <Tag text="TOOLS" c={K.sky} />
        <div style={mono}><b style={{color: '#fff'}}>search_papers</b>(query, year_from){'\n'}<span style={sans23}>Search published papers by topic.</span>{'\n'}<b style={{color: '#fff'}}>add_by_doi</b>(doi, collection){'\n'}<span style={sans23}>Save a paper to the library by DOI.</span></div>
        {f >= E.more + 6 && <div style={{...mono, marginTop: 8, opacity: ramp(f, E.more + 6, E.more + 20), background: f >= E.longer ? 'rgba(141,180,255,.2)' : 'transparent', borderRadius: 8}}><b style={{color: '#fff'}}>import_data</b>(file){'\n'}<span style={sans23}>Load a data file into Origin.</span>{'\n'}<b style={{color: '#fff'}}>plot_line</b>(x, y){'\n'}<span style={sans23}>Draw a line graph in Origin.</span>{'\n'}<b style={{color: '#fff'}}>add_object</b>(type){'\n'}<span style={sans23}>Add an object to a Blender scene.</span></div>}
      </>
    )},
    {at: E.you - 2, h: 142, el: (
      <>
        <Tag text="YOU" c={K.sky} />
        <div style={{fontFamily: SANS, fontSize: 25, lineHeight: 1.32, color: '#fff'}}>Find a recent paper on perovskite solar cells and save it to my solar folder in Zotero.</div>
      </>
    )},
    {at: E.req1, h: 148, w: true, el: (
      <>
        <Tag text="THE MODEL WRITES" c={K.amber} />
        <div style={mono}>
          <Hi on={on(E.reqTool) && f < E.relay + 30}>{type('search_papers', f, E.req1)}</Hi>{f >= E.req1 + 12 ? '(' : ''}
          {f >= E.req1 + 14 && <>{'\n  '}<Hi on={on(E.reqInputs) && f < E.relay + 30}>{type('query: "perovskite solar cells",', f, E.req1 + 14)}{f >= E.req1 + 42 && <>{'\n  '}{type('year_from: 2025)', f, E.req1 + 42)}</>}</Hi></>}
        </div>
      </>
    )},
    {at: E.back + 18, h: 186, el: (
      <>
        <Tag text="RESULT" c={K.green} />
        <div style={mono}>
          <Hi on={on(E.pick)}>1. Stability of perovskite solar cells{'\n'}{'   '}2025 · <Hi on={on(E.doi)} c="rgba(255,211,107,.62)">{DOI}</Hi></Hi>{'\n'}2. Perovskite tandem cells at scale{'\n'}{'   '}2025 · 10.1234/psc.25.02
        </div>
      </>
    )},
    {at: E.req2 - 6, h: 148, w: true, el: (
      <>
        <Tag text="THE MODEL WRITES" c={K.amber} />
        <div style={mono}>
          {type('add_by_doi(', f, E.req2 - 6)}
          {f >= E.req2 + 4 && <>{'\n  doi: "'}<Hi on c="rgba(255,211,107,.62)">{type(DOI, f, E.req2 + 4, 1.4)}</Hi>{f >= E.req2 + 16 ? '",' : ''}</>}
          {f >= E.req2 + 16 && <>{'\n  '}{type('collection: "Solar")', f, E.req2 + 16)}</>}
        </div>
      </>
    )},
    {at: E.arrive2, h: 150, err: true, el: (
      <>
        <Tag text="ERROR" c="#FF8E9C" />
        <div style={{...mono, color: '#fff'}}>Collection "Solar" not found.{'\n'}Existing: <Hi on={on(E.naming)}>"Solar cells"</Hi>, "Reading list".</div>
      </>
    )},
    {at: E.fix - 2, h: 148, w: true, el: (
      <>
        <Tag text="THE MODEL WRITES" c={K.amber} />
        <div style={mono}>{'add_by_doi(\n  doi: "' + DOI + '",\n  '}{type('collection: "', f, E.fix - 2, 3)}<Hi on>{type('Solar cells', f, E.fix + 2, 1.2)}</Hi>{f >= E.fix + 12 ? '")' : ''}</div>
      </>
    )},
    {at: E.retryDone + 2, h: 84, el: (
      <>
        <Tag text="RESULT" c={K.green} />
        <div style={mono}>Saved to "Solar cells".</div>
      </>
    )},
  ];
  const view = M.h + 470 * g - 96;
  const hts = blocks.map((b) => b.h * ramp(f, b.at, b.at + 10, outCubic));
  const total = hts.reduce((a, b) => a + b, 0);
  let y = lerp(view - total, 0, g);
  const caret = f >= E.write && f < E.req1 && Math.floor(f / 9) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: 28, right: 28, top: 88, height: view, overflow: 'hidden'}}>
      {blocks.map((b, i) => {
        const yi = y; y += hts[i];
        const p = ramp(f, b.at, b.at + 10), glow = hit(f, b.at, 12);
        if (p <= 0) return null;
        const line = b.err ? '#FF8E9C' : b.w ? K.amber : 'transparent';
        return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: yi, opacity: p, transform: `translateX(${(1 - outExpo(p)) * -26}px)`, padding: '10px 14px', borderLeft: `4px solid ${line}`, background: b.err ? 'rgba(213,52,74,.3)' : b.w ? 'rgba(40,34,20,.6)' : 'rgba(6,12,30,.5)', borderRadius: 6, boxSizing: 'border-box', boxShadow: glow > 0.02 ? `0 0 ${34 * glow}px rgba(150,195,255,${glow})` : undefined}}>{b.el}</div>;
      })}
      {caret && <div style={{position: 'absolute', left: 16, bottom: 10, width: 13, height: 28, background: K.amber, boxShadow: `0 0 18px ${K.amber}`}} />}
    </div>
  );
};

// ---------------------------------------------------------------- panels and software
const Glass: React.FC<{x: number; y: number; w: number; h: number; hot?: number; color?: string; children?: React.ReactNode; style?: React.CSSProperties; intro?: number}> = ({x, y, w, h, hot = 0, color = '140,190,255', children, style, intro = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', background: K.panel, borderRadius: 20, border: `2px solid rgba(${color},${0.42 + hot * 0.58})`, boxShadow: `0 0 ${10 + hot * 46}px rgba(${color},${0.16 + hot * 0.6})`, opacity: intro, transform: `translateY(${(1 - intro) * 34}px) scale(${lerp(0.97, 1, intro)})`, ...style}}>{children}</div>
);
const Win: React.FC<{title: string; x: number; y: number; w: number; h: number; hot?: number; color?: string; intro?: number; children: React.ReactNode}> = ({title, x, y, w, h, hot, color, intro, children}) => (
  <Glass x={x} y={y} w={w} h={h} hot={hot} color={color} intro={intro} style={{overflow: 'hidden'}}>
    <div style={{height: 46, background: 'rgba(120,165,235,.16)', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#fff'}}>{title}</div>
    {children}
  </Glass>
);
const ServerLabel: React.FC<{r: number; name: string; intro: number; hot?: number; color?: string}> = ({r, name, intro, hot, color}) => (
  <Glass x={SVX} y={ROW[r].y} w={SVW} h={ROW[r].h} intro={intro} hot={hot} color={color} style={{background: 'rgba(8,16,38,.3)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: r > 1 ? 10 : 34, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: r > 1 ? 24 : 27, color: '#fff', lineHeight: 1.12}}>{name}</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 21, color: K.sky, marginTop: 4}}>MCP server</div>
    </div>
  </Glass>
);
const rowBg = 'rgba(120,165,235,.1)';
const PaperDb: React.FC<{f: number}> = ({f}) => {
  const hitOn = f >= E.back - 16;
  const rows = ['Charge transport in thin films', 'Stability of perovskite solar cells', 'Organic dyes for imaging', 'Perovskite tandem cells at scale', 'Catalysts for water splitting'];
  return (
    <div style={{padding: 16}}>
      <div style={{height: 42, borderRadius: 8, border: `2px solid ${K.edge}`, fontFamily: MONO, fontSize: 19, display: 'flex', alignItems: 'center', padding: '0 12px', color: '#fff'}}>{f >= E.run + 4 ? type('perovskite solar cells', f, E.run + 4, 2) : ''}</div>
      {rows.map((r, i) => {
        const m = hitOn && (i === 1 || i === 3);
        return <div key={r} style={{marginTop: 9, padding: '8px 12px', height: 42, boxSizing: 'border-box', borderRadius: 8, fontFamily: SANS, fontWeight: m ? 700 : 500, fontSize: 21, color: hitOn && !m ? K.mute : '#fff', background: m ? 'rgba(76,141,255,.42)' : rowBg, whiteSpace: 'nowrap', overflow: 'hidden'}}>{r}</div>;
      })}
    </div>
  );
};
const ZoteroWin: React.FC<{f: number}> = ({f}) => {
  const miss = f >= E.nope && f < E.fix, saved = f >= E.retryDone;
  return (
    <div style={{display: 'flex', height: 'calc(100% - 46px)'}}>
      <div style={{width: 176, background: rowBg, padding: 12, fontFamily: SANS, fontSize: 21, color: '#fff', boxSizing: 'border-box'}}>
        <div style={{fontWeight: 700, marginBottom: 8}}>My Library</div>
        {['Solar cells', 'Reading list'].map((c) => <div key={c} style={{padding: '7px 9px', borderRadius: 7, marginBottom: 4, fontWeight: 600, background: c === 'Solar cells' && f >= E.fix ? 'rgba(95,227,176,.3)' : miss ? 'rgba(255,90,108,.26)' : 'transparent'}}>{c}</div>)}
        {miss && <div style={{marginTop: 12, padding: '7px 9px', borderRadius: 7, border: `2.5px dashed ${K.red}`, color: '#FFB3BC', fontWeight: 700}}>Solar ?</div>}
      </div>
      <div style={{flex: 1, padding: 12, fontFamily: SANS, fontSize: 20, color: '#fff', lineHeight: 1.2}}>
        {['Solar cell efficiency tables', 'Thin-film absorbers: a review'].map((t) => <div key={t} style={{padding: '9px 10px', borderRadius: 7, background: rowBg, marginBottom: 8}}>{t}</div>)}
        {saved && <div style={{padding: '9px 10px', borderRadius: 7, background: 'rgba(95,227,176,.22)', border: `2.5px solid ${K.green}`, fontWeight: 700, opacity: ramp(f, E.retryDone, E.retryDone + 8), boxShadow: `0 0 ${30 * hit(f, E.retryDone, 14)}px ${K.green}`}}>Stability of perovskite solar cells</div>}
      </div>
    </div>
  );
};
const OriginWin: React.FC = () => <svg width="100%" height={150} viewBox="0 0 470 150"><path d="M50 16 V130 H440" fill="none" stroke="#fff" strokeWidth={3} /><path d="M50 128 C110 50 190 34 430 28" fill="none" stroke={K.sky} strokeWidth={4} /><path d="M50 128 C120 90 210 76 430 70" fill="none" stroke={K.green} strokeWidth={4} /></svg>;
const BlenderWin: React.FC = () => <svg width="100%" height={150} viewBox="0 0 470 150"><g fill="none" stroke={K.sky} strokeWidth={3} strokeLinejoin="round"><path d="M235 18 L305 52 L305 112 L235 138 L165 112 L165 52 Z" /><path d="M165 52 L235 84 L305 52 M235 84 V138" /></g></svg>;

const Chip: React.FC<{x: number; y: number; text: string; color: string}> = ({x, y, text, color}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', padding: '9px 16px', borderRadius: 12, background: 'rgba(5,12,30,.96)', border: `2.5px solid ${color}`, color: '#fff', fontFamily: MONO, fontWeight: 600, fontSize: 21, whiteSpace: 'nowrap', boxShadow: `0 0 26px ${color}`}}>{text}</div>
);

const Stage: React.FC<{f: number}> = ({f}) => {
  const c = camera(f), g = ramp(f, E.more, E.more + 26, inOut);
  const wall = ramp(f, E.wall, E.wall + 10) * (1 - ramp(f, E.relay, E.relay + 12)), dim = 1 - 0.62 * wall;
  const intro = (d: number) => ramp(f, E.stage + d, E.stage + d + 26, outCubic);
  const frontOn = f >= E.front && f < E.rush;
  const isErr = f >= E.nope && f < E.fix;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1500, transformOrigin: '0 0', transform: `translate(${960 - c.x * c.z}px, ${490 - c.y * c.z}px) scale(${c.z})`}}>
      <Glass x={M.x} y={M.y} w={M.w} h={M.h + 470 * g} intro={intro(0)} hot={wall} color="205,230,255" style={{overflow: 'hidden', background: 'rgba(6,12,30,.42)'}}>
        <div style={{position: 'absolute', left: 30, top: 22, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: '#fff'}}>Model</div>
        <div style={{position: 'absolute', right: 30, top: 32, fontFamily: SANS, fontWeight: 600, fontSize: 24, color: K.sky}}>what it reads and writes</div>
        <Transcript f={f} g={g} />
      </Glass>
      <div style={{opacity: dim}}>
        <Glass x={A.x} y={A.y} w={A.w} h={A.h + 470 * g} intro={intro(6)}>
          <div style={{position: 'absolute', left: 22, top: 22, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: '#fff'}}>AI app</div>
          {f >= E.prompt - 2 && <div style={{position: 'absolute', left: 16, right: 16, top: 84, padding: '12px 14px', borderRadius: 14, background: 'rgba(76,141,255,.26)', fontFamily: SANS, fontWeight: 500, fontSize: 24, lineHeight: 1.26, color: '#fff', minHeight: 190, boxSizing: 'border-box'}}>{type('Find a recent paper on perovskite solar cells and save it to my solar folder in Zotero.', f, E.prompt - 2, 1.6)}</div>}
        </Glass>
        <ServerLabel r={0} name="Paper search" intro={intro(12)} />
        <Win title="Paper database" x={SWX} y={ROW[0].y} w={SWW} h={ROW[0].h} hot={frontOn ? 0.8 : 0} intro={intro(18)}><PaperDb f={f} /></Win>
        <ServerLabel r={1} name="Zotero" intro={intro(14)} hot={isErr ? 0.8 : 0} color={isErr ? '255,90,108' : undefined} />
        <Win title="Zotero" x={SWX} y={ROW[1].y} w={SWW} h={ROW[1].h} hot={frontOn ? 0.8 : isErr ? 0.8 : 0} color={isErr ? '255,90,108' : undefined} intro={intro(20)}><ZoteroWin f={f} /></Win>
        {g > 0 && (
          <div style={{opacity: g}}>
            <ServerLabel r={2} name="Origin" intro={1} />
            <Win title="Origin" x={SWX} y={ROW[2].y} w={SWW} h={ROW[2].h}><OriginWin /></Win>
            <ServerLabel r={3} name="Blender" intro={1} />
            <Win title="Blender" x={SWX} y={ROW[3].y} w={SWW} h={ROW[3].h}><BlenderWin /></Win>
          </div>
        )}
      </div>
      {ROUTES.map((r, i) => { const a = pos(f, r.hop[0], r.pts, r.hop[1]); return a.on ? <Chip key={i} x={a.x} y={a.y} text={r.t} color={r.c} /> : null; })}
      {f >= E.wrap - 12 && f < E.run - 8 && (
        <div style={{position: 'absolute', left: 790, top: 300, width: 760, padding: '22px 26px', boxSizing: 'border-box', borderRadius: 16, background: 'rgba(6,14,34,.97)', border: `2.5px solid ${K.sky}`, boxShadow: `0 0 50px rgba(120,175,255,.6)`, fontFamily: MONO, fontSize: 24, lineHeight: 1.42, color: K.ice, whiteSpace: 'pre', opacity: ramp(f, E.wrap - 12, E.wrap - 3), transform: `scale(${lerp(0.94, 1, ramp(f, E.wrap - 12, E.wrap, outExpo))})`}}>
          {'{ "method": '}<span style={{background: f >= E.tcall ? 'rgba(76,141,255,.42)' : 'transparent', borderRadius: 5, fontWeight: 700, color: '#fff'}}>"tools/call"</span>{',\n  "params": {\n    "name": "search_papers",\n    "arguments": {\n      "query": "perovskite solar cells",\n      "year_from": 2025 } } }'}
        </div>
      )}
    </div>
  );
};

// ================================================================ tool cards rushing out, then the one to read
const CARDS = [['search_papers', 'Search published papers by topic.'], ['add_by_doi', 'Save a paper by DOI.'], ['list_collections', 'List the library collections.'], ['get_citation', 'Format a citation.'], ['get_abstract', 'Read a paper abstract.'], ['tag_item', 'Add a tag to an item.'], ['list_recent', 'List recently added items.'], ['find_duplicates', 'Find duplicate entries.'], ['export_bib', 'Export a bibliography.'], ['open_pdf', 'Open an attached PDF.']];
const SPREAD = (() => { const r = rng(41); return CARDS.map(() => ({x: (r() - 0.5) * 1800, y: (r() - 0.5) * 900, rz: (r() - 0.5) * 16, ry: (r() - 0.5) * 50})); })();
const Tools: React.FC<{f: number}> = ({f}) => {
  if (f < E.rush || f > E.ctx + 16) return null;
  const a = ramp(f, E.hero, E.hero + 14, outExpo), out = ramp(f, E.ctx - 4, E.ctx + 10, inOut);
  const Row: React.FC<{k: string; on: boolean; children: React.ReactNode}> = ({k, on, children}) => (
    <div style={{padding: '16px 20px', borderRadius: 14, marginTop: 10, background: on ? 'rgba(76,141,255,.3)' : 'transparent', boxShadow: on ? 'inset 0 0 0 2px rgba(141,180,255,.7)' : undefined}}>
      <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, color: K.sky}}>{k}</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 46, lineHeight: 1.18, color: '#fff', marginTop: 5}}>{children}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: `rgba(3,5,12,${0.72 * ramp(f, E.rush, E.rush + 8) * (1 - out)})`}}>
      <div style={{position: 'absolute', left: W / 2, top: 470, width: 0, height: 0, perspective: 1100, transformStyle: 'preserve-3d'}}>
        {CARDS.map(([n, d], i) => {
          const t0 = E.rush + i * 3, p = ramp(f, t0, t0 + 20, (x) => x * x);
          if (f < t0 || p >= 1) return null;
          const s = SPREAD[i], q = outExpo(clamp(p * 1.3));
          return (
            <div key={n} style={{position: 'absolute', left: -420, top: -125, width: 840, height: 250, boxSizing: 'border-box', padding: '36px 46px', borderRadius: 26, background: 'linear-gradient(145deg, rgba(20,44,96,.96), rgba(7,16,38,.96))', border: '3px solid #79B4FF', boxShadow: '0 0 60px rgba(70,135,255,.65)', transform: `translate3d(${lerp(500, s.x, q)}px, ${lerp(0, s.y, q)}px, ${lerp(-1800, 1090, p)}px) rotateZ(${s.rz}deg) rotateY(${s.ry}deg)`, opacity: ramp(f, t0, t0 + 3)}}>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 56, color: '#fff'}}>{n}</div>
              <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 42, color: K.ice, marginTop: 20}}>{d}</div>
            </div>
          );
        })}
      </div>
      {a > 0 && (
        <div style={{position: 'absolute', left: W / 2, top: 470, width: 1180, boxSizing: 'border-box', padding: '26px 34px', borderRadius: 26, background: 'linear-gradient(145deg, rgba(20,44,96,.98), rgba(7,16,38,.98))', border: '3px solid #79B4FF', boxShadow: '0 0 90px rgba(70,135,255,.75)', transform: `translate(-50%,-50%) scale(${lerp(0.6, 1, a) * lerp(1, 0.3, out)})`, opacity: a * (1 - out)}}>
          <Row k="name" on={f >= E.cardName && f < E.cardDoes}><span style={{fontFamily: MONO}}>add_by_doi</span></Row>
          <Row k="description" on={f >= E.cardDoes && f < E.cardInputs}>Save a paper to the library by DOI.</Row>
          <Row k="inputs" on={f >= E.cardInputs}><span style={{fontFamily: MONO}}>doi, collection</span></Row>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ the dive: through the server into the program
const LAYERS = [1, 2, 3, 4, 5, 6];
const LB = (() => { const r = rng(88); return LAYERS.map(() => Array.from({length: 26}, () => ({x: -760 + r() * 1520, y: -440 + r() * 880, w: 60 + r() * 220, h: 26 + r() * 90, o: r()}))); })();
const diveEnd = () => E.back - 16;
const drawDive: Draw = (ctx, fr) => {
  const f = fr / 2, end = diveEnd(), down = ramp(f, E.dive, end - 4, (x) => Math.pow(x, 1.5));
  const cam = 6.2 * down, roll = Math.sin(cam * 0.7) * 0.12;
  const sh = shake(f, 22 * hit(f, E.dive, 6) + 8 * hit(f, end - 8, 6));
  const cx = W / 2 + sh.x, cy = 480 + sh.y;
  drawTunnel(ctx, f, 1, cx, cy, 1 + down * 6);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
  for (let l = LAYERS.length; l >= 1; l--) {
    const d = l - cam; if (d <= 0.08) continue;
    const s = 1 / (d * 0.55 + 0.82), near = clamp(1 - d / 5), al = clamp(d / 0.4) * clamp(0.25 + near * 1.1);
    ctx.setTransform(s * Math.cos(roll * l), s * Math.sin(roll * l), -s * Math.sin(roll * l), s * Math.cos(roll * l), cx, cy);
    ctx.strokeStyle = `rgba(121,180,255,${0.9 * al})`; ctx.lineWidth = 3 / s; ctx.strokeRect(-860, -500, 1720, 1000);
    ctx.lineWidth = 1 / s; ctx.strokeStyle = `rgba(121,180,255,${0.16 * al})`;
    ctx.beginPath(); for (let g = -800; g <= 800; g += 100) { ctx.moveTo(g, -500); ctx.lineTo(g, 500); } for (let g = -500; g <= 500; g += 100) { ctx.moveTo(-860, g); ctx.lineTo(860, g); } ctx.stroke();
    for (const b of LB[l - 1]) {
      const lit = clamp(Math.pow(Math.max(0, Math.sin(f * 0.17 + b.o * 22 - Math.hypot(b.x, b.y) * 0.004)), 10) + (cam > l - 1.2 ? 0.45 : 0));
      ctx.fillStyle = `rgba(121,180,255,${(0.08 + lit * 0.62) * al})`; ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      ctx.strokeStyle = `rgba(200,225,255,${0.65 * al})`; ctx.lineWidth = 1.6 / s; ctx.strokeRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 170 + 240 * hit(f, end - 8, 5));
  g.addColorStop(0, 'rgba(255,255,255,.92)'); g.addColorStop(0.2, 'rgba(170,210,255,.6)'); g.addColorStop(1, 'rgba(40,90,220,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
};
const Dive: React.FC<{f: number}> = ({f}) => {
  const end = diveEnd();
  if (f < E.dive - 1 || f > end + 1) return null;
  const span = end - E.dive;
  const lines = ['db.query("perovskite solar cells")', 'filter(year >= 2025)', 'rank(results).top(2)'];
  const tags = ['Scripting interface', 'Commands', 'Core engine'];
  return (
    <AbsoluteFill>
      <Paint draw={drawDive} frame={f * 2} bloom={0.8} />
      {lines.map((t, i) => {
        const a = E.dive + (span * (i + 0.15)) / 3, b = a + span / 3 - 2, p = ramp(f, a, b);
        if (p <= 0 || p >= 1) return null;
        return <div key={t} style={{position: 'absolute', left: W / 2, top: 480, transform: `translate(-50%,-50%) scale(${lerp(0.72, 1.28, p)})`, opacity: Math.min(ramp(p, 0, 0.15), 1 - ramp(p, 0.8, 1)), padding: '16px 28px', borderRadius: 14, background: 'rgba(4,10,26,.86)', border: '2.5px solid #8DB4FF', boxShadow: '0 0 44px rgba(120,175,255,.8)', fontFamily: MONO, fontWeight: 600, fontSize: 50, color: '#fff', whiteSpace: 'nowrap'}}><div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: K.sky, marginBottom: 4}}>{tags[i]}</div>{t}</div>;
      })}
    </AbsoluteFill>
  );
};

// ================================================================ the summary, and the end
const SX = [410, 960, 1510], SY = 470;
const LOOP: Pt[] = (() => {
  const out: Pt[] = [[SX[1] + 220, SY]];
  out.push([SX[2] - 220, SY], [SX[2], SY + 75], [SX[2], SY + 215], [SX[1], SY + 215], [SX[1], SY + 75]);
  return out;
})();
const loopAt = (u: number): Pt => {
  const seg = LOOP.map((p, i) => (i ? Math.hypot(p[0] - LOOP[i - 1][0], p[1] - LOOP[i - 1][1]) : 0));
  const tot = seg.reduce((a, b) => a + b, 0); let d = ((u % 1) + 1) % 1 * tot;
  for (let i = 1; i < LOOP.length; i++) { if (d <= seg[i]) { const t = d / seg[i]; return [lerp(LOOP[i - 1][0], LOOP[i][0], t), lerp(LOOP[i - 1][1], LOOP[i][1], t)]; } d -= seg[i]; }
  return LOOP[0];
};
const FALL2 = (() => { const r = rng(7); return Array.from({length: 1200}, () => ({a: r() * 6.283, d: 700 + r() * 1100, o: r(), hue: r()})); })();
const drawEnd: Draw = (ctx, fr) => {
  const f = fr / 2, co = ramp(f, E.outro - 22, E.outro, (x) => x * x), sh = shake(f, 30 * hit(f, E.outro, 6));
  drawTunnel(ctx, f, 0.6 * (1 - co * 0.6), W / 2, 500, 1 + co * 5);
  ctx.save(); ctx.translate(sh.x, sh.y); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const s3 = ramp(f, E.wRepeat - 2, E.wRepeat + 18, inOut) * (1 - co);
  if (s3 > 0) {
    ctx.strokeStyle = `rgba(121,180,255,${0.8 * s3})`; ctx.lineWidth = 5;
    ctx.beginPath(); LOOP.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    const u = (f - E.wRepeat) * 0.018;
    for (let i = 0; i < 16; i++) { const q = loopAt(u - i * 0.006); ctx.fillStyle = `rgba(225,240,255,${(1 - i / 16) * s3})`; ctx.beginPath(); ctx.arc(q[0], q[1], 9 - i * 0.4, 0, 7); ctx.fill(); }
  }
  if (f <= E.outro + 1) for (const p of FALL2) {
    const t0 = E.outro - 40 + p.o * 18, u = ramp(f, t0, E.outro, (x) => x * x), u0 = ramp(f - 4, t0, E.outro, (x) => x * x);
    if (u <= 0) continue;
    const r1 = p.d * (1 - u), r0 = p.d * (1 - u0), a = p.a + (1 - u) * 1.1, a0 = p.a + (1 - u0) * 1.1;
    ctx.strokeStyle = `rgba(${lerp(120, 220, p.hue) | 0},${lerp(175, 235, p.hue) | 0},255,${0.5 + 0.5 * u})`; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(960 + Math.cos(a0) * r0, 470 + Math.sin(a0) * r0); ctx.lineTo(960 + Math.cos(a) * r1, 470 + Math.sin(a) * r1); ctx.stroke();
  }
  for (const [t, col] of [[E.outro, '255,255,255'], [E.outro + 5, '120,175,255'], [E.outro + 11, '70,120,240']] as const) {
    const age = f - t; if (age >= 0 && age < 44) drawRing(ctx, 960, 470, outExpo(age / 44) * 1500, 1 - age / 44, col, 10 * (1 - age / 44) + 1);
  }
  if (f >= E.outro) { const k = 0.5 + 0.5 * hit(f, E.outro, 14), g = ctx.createRadialGradient(960, 470, 80, 960, 470, 760); g.addColorStop(0, `rgba(70,130,255,${0.42 * k})`); g.addColorStop(1, 'rgba(30,60,180,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
};
const End: React.FC<{f: number}> = ({f}) => {
  if (f < E.end) return null;
  const a = ramp(f, E.end, E.end + 12), co = ramp(f, E.outro - 22, E.outro - 4, (x) => x * x);
  const Step: React.FC<{i: number; t: string; on: number}> = ({i, t, on}) => {
    const x = lerp(SX[i], 960, co);
    return <div style={{position: 'absolute', left: x, top: SY, width: 440, height: 150, transform: `translate(-50%,-50%) scale(${lerp(lerp(1.14, 1, outExpo(on)), 0.2, co)})`, borderRadius: 24, background: 'rgba(8,18,44,.9)', border: '3px solid #8DB4FF', boxShadow: `0 0 ${24 + 50 * (1 - on)}px rgba(120,175,255,.7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 50, color: '#fff', opacity: on * (1 - co)}}>{t}</div>;
  };
  const s1 = ramp(f, E.wList - 2, E.wList + 8), s2 = ramp(f, E.wCall - 2, E.wCall + 8), s3 = ramp(f, E.wRead - 2, E.wRead + 8), s4 = ramp(f, E.wRepeat - 2, E.wRepeat + 18, inOut);
  const fadeOut = ramp(f, E.frames - 26, E.frames - 4);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Paint draw={drawEnd} frame={f * 2} bloom={0.85} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - co}}>
        <path d={`M${SX[0] + 225} ${SY} H${SX[1] - 228}`} stroke={K.sky} strokeWidth={6} opacity={s2} />
        <path d={`M${SX[1] + 225} ${SY} H${SX[2] - 228}`} stroke={K.sky} strokeWidth={6} opacity={s3} />
      </svg>
      <T f={f} from={E.end + 2} to={E.outro - 24} y={235} size={120} weight={800}>MCP</T>
      <Step i={0} t="List the tools" on={s1} />
      <Step i={1} t="Call one" on={s2} />
      <Step i={2} t="Read the result" on={s3} />
      <div style={{position: 'absolute', left: SX[1], width: SX[2] - SX[1], top: SY + 232, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 44, color: K.sky, opacity: s4 * (1 - co)}}>repeat</div>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - fadeOut}}>
        <T f={f} from={E.outro} to={E.frames} y={440} size={300} weight={800} tracking="-0.03em">MCP</T>
        <T f={f} from={E.outro + 16} to={E.frames} y={640} size={74} weight={600} fx="rise" color={C.ice}>Model Context Protocol</T>
      </div>
      <Flash v={hit(f, E.outro, 7)} />
      {fadeOut > 0 && <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />}
    </AbsoluteFill>
  );
};

// ================================================================ subtitles and assembly
const CUES = tl.segments.flatMap((s) => s.cues.map((c, i, arr) => ({text: c.text, a: c.f, b: i + 1 < arr.length ? arr[i + 1].f - 2 : s.to + 6})));
const Subtitle: React.FC<{f: number}> = ({f}) => {
  const c = CUES.find((q) => f >= q.a - 2 && f <= q.b);
  if (!c) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 952, display: 'flex', justifyContent: 'center'}}>
      <div style={{maxWidth: 1600, padding: '11px 26px', borderRadius: 14, background: 'rgba(4,9,22,.86)', border: '1.5px solid rgba(140,190,255,.3)', color: '#fff', fontFamily: SANS, fontWeight: 500, fontSize: 36, lineHeight: 1.22, textAlign: 'center'}}>{c.text}</div>
    </div>
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame(), f = frame / 2;
  const glassOn = f < E.gui;
  const layersOn = f >= E.gui && f < E.stage + 12;
  const worldOn = f >= E.stage - 6 && f < E.tan + 10;
  // the wires stop dead, one line stands on black while the sound is cut, then everything snaps into it
  const tangleOn = f >= E.tan && f < E.snap2 - 5;
  const busOn = f >= E.snap2 - 5 && f < E.end + 14;
  const s2f = pw(f, [[E.tan, 192], [E.snap2 - 5, 290]]);
  const s3f = pw(f, [[E.snap2 - 5, 56], [E.snap2, 60], [E.end, 148]]);
  const layersOut = 1 - ramp(f, E.stage - 2, E.stage + 10);
  const bus = ramp(f, E.snap2 + 22, E.snap2 + 34);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {glassOn && <Paint draw={drawGlass} frame={frame} bloom={0.9} />}
      {glassOn && <Flash v={hit(f, E.ignite, 7) * 0.95} />}
      {f < E.ignite - 18 && Math.floor(f / 10) % 2 === 0 && f > 4 && <div style={{position: 'absolute', left: W / 2 - 8, top: H / 2 - 34, width: 16, height: 68, background: '#fff', boxShadow: '0 0 30px #9CC8FF'}} />}
      {worldOn && (
        <AbsoluteFill>
          <Paint draw={drawWorld} frame={frame} bloom={0.55} />
          <Stage f={f} />
          <Tools f={f} />
          <Dive f={f} />
          <Flash v={Math.max(hit(f, E.dive, 6) * 0.9, hit(f, diveEnd(), 7), hit(f, E.err, 5) * 0.4 * 0)} />
          <Flash v={Math.max(hit(f, E.nope, 7) * 0.32, hit(f, E.arrive2, 6) * 0.24)} color={K.red} />
          <Flash v={hit(f, E.retryDone, 7) * 0.28} color={K.green} />
          <Flash v={hit(f, E.more + 2, 7) * 0.2} />
        </AbsoluteFill>
      )}
      {layersOn && <AbsoluteFill style={{opacity: layersOut}}><Layers f={f} /></AbsoluteFill>}
      {tangleOn && <AbsoluteFill style={{opacity: ramp(f, E.tan, E.tan + 8)}}><Web frame={s2f} /></AbsoluteFill>}
      {busOn && (
        <AbsoluteFill>
          <Bus frame={s3f} />
          <div style={{position: 'absolute', inset: 0, opacity: bus}}>
            <T f={f} from={E.snap2 + 22} to={E.end + 8} x={960} y={58} w={300} size={46} weight={800} fx="rise" color={K.sky}>MCP</T>
            <T f={f} from={E.snap2 + 22} to={E.end + 8} x={420} y={58} w={700} size={46} weight={700} fx="rise">Every AI app</T>
            <T f={f} from={E.oneSrv} to={E.end + 8} x={1400} y={58} w={700} size={46} weight={700} fx="rise">One server per program</T>
          </div>
        </AbsoluteFill>
      )}
      <End f={f} />
      <Vignette /><Grain />
      <Subtitle f={f} />
    </AbsoluteFill>
  );
};
