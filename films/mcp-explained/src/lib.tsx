import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';

// The stage is always 1920 x 1080; all drawing happens in these units.
export const W = 1920, H = 1080;

export const C = {
  ink: '#03050C', deep: '#071024', blue: '#3F86FF', sky: '#79B4FF', ice: '#CFE6FF', white: '#FFFFFF',
  amber: '#FFB23E', red: '#FF4A5C',
  chaos: ['#FF5A5F', '#FF9F1C', '#F15BB5', '#FEE440', '#00F5D4', '#9B5DE5'],
};
export const SANS = "'Inter Tight', sans-serif", MONO = "'JetBrains Mono', monospace";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const inExpo = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
export const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const inCubic = (x: number) => x * x * x;
export const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const outBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
export const ramp = (f: number, a: number, b: number, e: (x: number) => number = (x) => x) => e(clamp((f - a) / (b - a)));
export const hit = (f: number, t: number, decay = 10) => (f < t ? 0 : Math.exp(-(f - t) / decay));
export const hits = (f: number, ts: number[], decay = 10) => ts.reduce((m, t) => Math.max(m, hit(f, t, decay)), 0);

export const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const shake = (f: number, amp: number) => ({
  x: amp * (Math.sin(f * 2.31) + Math.sin(f * 5.17 + 1.3)) * 0.5,
  y: amp * (Math.sin(f * 2.79 + 0.7) + Math.sin(f * 4.43 + 2.1)) * 0.5,
});

// ---------------------------------------------------------------- canvas with cheap wide bloom
let b1: HTMLCanvasElement | null = null, b2: HTMLCanvasElement | null = null;
const applyBloom = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, k: number) => {
  if (!b1) { b1 = document.createElement('canvas'); b1.width = W / 4; b1.height = H / 4; }
  if (!b2) { b2 = document.createElement('canvas'); b2.width = W / 12; b2.height = H / 12; }
  const a = b1.getContext('2d')!, d = b2.getContext('2d')!;
  a.globalCompositeOperation = 'copy'; a.filter = 'blur(5px)'; a.drawImage(c, 0, 0, b1.width, b1.height);
  d.globalCompositeOperation = 'copy'; d.filter = 'blur(6px)'; d.drawImage(b1, 0, 0, b2.width, b2.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = clamp(k * 0.55, 0, 1); ctx.drawImage(b1, 0, 0, W, H);
  ctx.globalAlpha = clamp(k * 0.75, 0, 1); ctx.drawImage(b2, 0, 0, W, H);
  ctx.restore();
};

export type Draw = (ctx: CanvasRenderingContext2D, f: number) => void;
export const Paint: React.FC<{draw: Draw; bloom?: number; after?: Draw; frame?: number; style?: React.CSSProperties}> = ({draw, bloom = 0.8, after, frame, style}) => {
  const cf = useCurrentFrame();
  const f = frame ?? cf;
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    draw(ctx, f);
    if (bloom > 0) applyBloom(ctx, c, bloom);
    if (after) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; after(ctx, f); }
  }, [f, draw, bloom, after]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H, ...style}} />;
};

// ---------------------------------------------------------------- type
export const T: React.FC<{
  f: number; from: number; to: number; size?: number; x?: number; y?: number; w?: number; weight?: number;
  color?: string; mono?: boolean; fx?: 'slam' | 'rise' | 'cut'; halo?: boolean; tracking?: string; lh?: number; children: React.ReactNode;
}> = ({f, from, to, size = 96, x = W / 2, y = H / 2, w = 1700, weight = 700, color = C.white, mono, fx = 'slam', halo = true, tracking = '-0.02em', lh = 1.08, children}) => {
  if (f < from || f > to + 6) return null;
  const out = ramp(f, to, to + 5);
  let scale = 1, blur = 0, dy = 0, op = 1, chroma = 0;
  if (fx === 'slam') {
    const p = ramp(f, from, from + 9, outExpo);
    scale = lerp(1.24, 1, p); blur = lerp(16, 0, ramp(f, from, from + 6)); op = ramp(f, from, from + 2);
    chroma = 14 * (1 - ramp(f, from, from + 11));
  } else if (fx === 'rise') {
    const p = ramp(f, from, from + 13, outExpo);
    dy = lerp(34, 0, p); op = ramp(f, from, from + 8);
  }
  const shadow = [
    chroma > 0.1 ? `${chroma}px 0 0 rgba(255,50,80,.75), ${-chroma}px 0 0 rgba(60,150,255,.75)` : '',
    halo ? `0 0 ${size * 0.5}px rgba(3,5,12,.95), 0 0 ${size * 0.16}px rgba(3,5,12,.9)` : '',
  ].filter(Boolean).join(',');
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, textAlign: 'center',
      transform: `translate(-50%, -50%) translateY(${dy}px) scale(${scale * (1 + out * 0.02)})`,
      filter: blur > 0.05 ? `blur(${blur}px)` : undefined, opacity: op * (1 - out),
      fontFamily: mono ? MONO : SANS, fontWeight: weight, fontSize: size, lineHeight: lh, letterSpacing: mono ? '-0.01em' : tracking,
      color, textShadow: shadow || undefined,
    }}>{children}</div>
  );
};

export const Pill: React.FC<{x: number; y: number; text: React.ReactNode; color?: string; size?: number; opacity?: number; scale?: number; glow?: number}> =
  ({x, y, text, color = C.sky, size = 42, opacity = 1, scale = 1, glow = 1}) => (
    <div style={{
      position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, whiteSpace: 'nowrap',
      padding: `${size * 0.36}px ${size * 0.7}px`, borderRadius: size, background: 'rgba(5,12,30,.92)', border: `3px solid ${color}`,
      fontFamily: MONO, fontWeight: 600, fontSize: size, color: C.white,
      boxShadow: `0 0 ${46 * glow}px ${color}, inset 0 0 ${20 * glow}px ${color}55`,
    }}>{text}</div>
  );

export const Flash: React.FC<{v: number; color?: string}> = ({v, color = '#fff'}) =>
  v > 0.004 ? <div style={{position: 'absolute', inset: 0, background: color, opacity: clamp(v), mixBlendMode: 'screen'}} /> : null;

export const Vignette: React.FC<{k?: number}> = ({k = 0.3}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 62%, rgba(0,0,6,${k}) 100%)`, pointerEvents: 'none'}} />
);

// fine moving grain, so large dark areas don't band after compression
let tile: HTMLCanvasElement | null = null;
const grainDraw: Draw = (ctx, f) => {
  if (!tile) {
    tile = document.createElement('canvas'); tile.width = tile.height = 256;
    const t = tile.getContext('2d')!, img = t.createImageData(256, 256), r = rng(9);
    for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    t.putImageData(img, 0, 0);
  }
  ctx.clearRect(0, 0, W, H);
  const r = rng(f * 7 + 3); ctx.translate(-Math.floor(r() * 256), -Math.floor(r() * 256));
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')!; ctx.fillRect(0, 0, W + 256, H + 256);
};
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const c = ref.current!; const x = c.getContext('2d')!; x.setTransform(1, 0, 0, 1, 0, 0); grainDraw(x, f); }, [f]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.03, mixBlendMode: 'overlay', pointerEvents: 'none'}} />;
};
