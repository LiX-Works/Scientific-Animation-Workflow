// The soundtrack: a score and sound effects synthesized here, cued to the story events, under the narration. Writes public/mix.wav.
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {buildEvents, hops} from '../src/film/events.mjs';

const tl = JSON.parse(readFileSync('src/film/timeline.json', 'utf8'));
const E = buildEvents(tl), HOP = hops(E);
const SR = 44100, FPS = 30, N = Math.ceil((E.frames / FPS) * SR);
const L = new Float32Array(N), R = new Float32Array(N), RL = new Float32Array(N), RR = new Float32Array(N);
const sf = (fr) => Math.round((fr / FPS) * SR);
let seed = 1234;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const put = (i, l, r, send = 0) => { if (i < 0 || i >= N) return; L[i] += l; R[i] += r; if (send) { RL[i] += l * send; RR[i] += r * send; } };
const panGain = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

const sub = (fr, {dur = 1.2, f0 = 150, f1 = 36, drop = 0.09, gain = 0.9, send = 0.12} = {}) => {
  const n = Math.floor(dur * SR), s = sf(fr); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t / drop); ph += (2 * Math.PI * f) / SR; const v = Math.tanh(Math.sin(ph) * 1.8) * Math.min(1, t / 0.002) * Math.exp(-t / (dur * 0.36)) * gain; put(s + i, v, v, send); }
};
const noiseHit = (fr, {dur = 0.8, gain = 0.45, lp = 0.5, hp = 0.02, send = 0.35, decay = 0.25, pan = 0} = {}) => {
  const n = Math.floor(dur * SR), s = sf(fr); let a = 0, b = 0; const [gl, gr] = panGain(pan);
  for (let i = 0; i < n; i++) { const t = i / SR, w = rnd() * 2 - 1; a += lp * (w - a); b += hp * (a - b); const v = (a - b) * Math.exp(-t / decay) * Math.min(1, t / 0.001) * gain; put(s + i, v * gl, v * gr, send); }
};
const riser = (fr0, fr1, {gain = 0.32, lp0 = 0.02, lp1 = 0.7, send = 0.3, curve = 2.6} = {}) => {
  const s = sf(fr0), n = sf(fr1) - s; let a = 0, c = 0;
  for (let i = 0; i < n; i++) { const p = i / n, lp = lp0 + (lp1 - lp0) * p * p, w = rnd() * 2 - 1, w2 = rnd() * 2 - 1; a += lp * (w - a); c += lp * (w2 - c); const e = Math.pow(p, curve) * gain; put(s + i, a * e, c * e, send); }
};
const tick = (fr, {gain = 0.25, f = 5200, dur = 0.035, pan = 0, send = 0.1} = {}) => {
  const n = Math.floor(dur * SR), s = sf(fr); const [gl, gr] = panGain(pan);
  for (let i = 0; i < n; i++) { const t = i / SR, v = (Math.sin(2 * Math.PI * f * t) * 0.55 + (rnd() * 2 - 1) * 0.45) * Math.exp(-t / (dur * 0.28)) * gain; put(s + i, v * gl, v * gr, send); }
};
const glass = (fr, {gain = 0.34, base = 1680, pan = 0} = {}) => {
  const n = Math.floor(0.9 * SR), s = sf(fr); const [gl, gr] = panGain(pan), parts = [[1, 1, 0.16], [2.31, 0.6, 0.11], [3.87, 0.4, 0.07], [5.41, 0.25, 0.05]];
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [m, a, d] of parts) v += Math.sin(2 * Math.PI * base * m * t) * a * Math.exp(-t / d); v *= gain * Math.min(1, t / 0.0006); put(s + i, v * gl, v * gr, 0.45); }
  sub(fr, {dur: 0.28, f0: 110, f1: 46, drop: 0.03, gain: 0.5, send: 0.05});
};
const pluck = (fr, m, {gain = 0.13, dur = 0.5, pan = 0, send = 0.32, bright = 0.5} = {}) => {
  const n = Math.floor(dur * SR), s = sf(fr), f = mtof(m); const [gl, gr] = panGain(pan); let lp = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, ph = 2 * Math.PI * f * t, raw = Math.sin(ph) + 0.5 * Math.sin(2 * ph + 0.3) + 0.28 * Math.sin(3 * ph) + 0.16 * Math.sin(4 * ph + 0.7) + 0.1 * Math.sin(5 * ph), k = clamp(bright * Math.exp(-t / 0.12) + 0.04); lp += k * (raw - lp); const v = lp * Math.exp(-t / (dur * 0.32)) * Math.min(1, t / 0.002) * gain; put(s + i, v * gl, v * gr, send); }
};
const pad = (fr0, fr1, notes, {gain = 0.08, atk = 0.5, rel = 0.8, bright = 0.35, send = 0.4, vib = 0.15} = {}) => {
  const s = sf(fr0), n = sf(fr1) - s, voices = notes.flatMap((m, vi) => [-1, 1].map((d) => ({f: mtof(m) * Math.pow(2, (d * 7) / 1200), pan: d * 0.7, ph: vi * 1.7 + d, lp: 0})));
  for (let i = 0; i < n; i++) {
    const t = i / SR, tl_ = (n - i) / SR, e = Math.min(1, t / atk) * Math.min(1, tl_ / rel) * gain; let l = 0, r = 0;
    for (const v of voices) { v.ph += (2 * Math.PI * v.f * (1 + 0.0012 * Math.sin(2 * Math.PI * vib * t + v.f))) / SR; const p = v.ph, raw = Math.sin(p) + 0.45 * Math.sin(2 * p) + 0.22 * Math.sin(3 * p) + 0.12 * Math.sin(4 * p) + 0.06 * Math.sin(5 * p); v.lp += bright * (raw - v.lp); const [gl, gr] = panGain(v.pan); l += v.lp * gl; r += v.lp * gr; }
    put(s + i, l * e, r * e, send);
  }
};
const drone = (fr0, fr1, m, {gain = 0.14, atk = 1.2, rel = 1, dist = 1.5} = {}) => {
  const s = sf(fr0), n = sf(fr1) - s, f = mtof(m); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, tl_ = (n - i) / SR; ph += (2 * Math.PI * f) / SR; const v = Math.tanh((Math.sin(ph) + 0.4 * Math.sin(2 * ph + t)) * dist) * Math.min(1, t / atk) * Math.min(1, tl_ / rel) * gain; put(s + i, v, v); }
};
const whoosh = (fr0, fr1, {gain = 0.3, pan0 = -0.8, pan1 = 0.8, send = 0.25} = {}) => {
  const s = sf(fr0), n = sf(fr1) - s; let a = 0, b = 0;
  for (let i = 0; i < n; i++) { const p = i / n, e = Math.sin(Math.PI * Math.pow(p, 1.7)), lp = 0.03 + 0.5 * e * e, w = rnd() * 2 - 1; a += lp * (w - a); b += 0.02 * (a - b); const [gl, gr] = panGain(pan0 + (pan1 - pan0) * p), v = (a - b) * e * gain; put(s + i, v * gl, v * gr, send); }
};
const impact = (fr, g = 1) => {
  sub(fr, {dur: 2.4, f0: 190, f1: 33, drop: 0.11, gain: 0.95 * g, send: 0.2});
  noiseHit(fr, {dur: 1.6, gain: 0.24 * g, lp: 0.26, hp: 0.015, decay: 0.28, send: 0.32});
  noiseHit(fr, {dur: 0.2, gain: 0.2 * g, lp: 0.95, hp: 0.3, decay: 0.035, send: 0.1});
};
const kick = (fr, g = 1) => sub(fr, {dur: 0.42, f0: 170, f1: 48, drop: 0.035, gain: 0.72 * g, send: 0.03});
const hat = (fr, g = 1, pan = 0) => noiseHit(fr, {dur: 0.06, gain: 0.065 * g, lp: 0.98, hp: 0.6, decay: 0.012, send: 0.03, pan});
const bass = (fr, m, {beats = 1, gain = 0.32, cut = 0.2} = {}) => {
  const n = sf(beats * 15), s = sf(fr), f = mtof(m); let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += f / SR; ph -= Math.floor(ph); const saw = 2 * ph - 1, k = clamp(cut * Math.exp(-t / 0.09) + 0.03); lp += k * (saw - lp); const v = Math.tanh(lp * 2.3) * Math.min(1, t / 0.002) * Math.min(1, (n - i) / (0.015 * SR)) * gain; put(s + i, v, v, 0.02); }
};

// ---------------------------------------------------------------- opening: D minor, glass
const D2 = 38;
drone(0, E.gui - 2, D2 - 12, {gain: 0.17, atk: 1, rel: 0.2});
riser(E.ignite - 26, E.ignite, {gain: 0.28, curve: 3.4});
impact(E.ignite, 1);
pad(E.ignite, E.pull[0] + 30, [50, 57, 65, 69], {gain: 0.05, atk: 0.3, rel: 1.2, bright: 0.3});
whoosh(E.pull[0], E.pull[1], {gain: 0.26, pan0: 0, pan1: 0, send: 0.45});
pad(E.pull[0], E.gui - 2, [38, 45, 53, 60], {gain: 0.07, atk: 2, rel: 0.1, bright: 0.18});
E.strikes.forEach((t, i) => glass(t, {gain: 0.14 + i * 0.012, base: 1500 + i * 130, pan: ((i * 37) % 10) / 10 - 0.5}));

// ---------------------------------------------------------------- a window built for people: clicks, then a wrong one
impact(E.gui, 0.6);
for (let b = 0; E.gui + b * 30 < E.tilt; b++) { kick(E.gui + b * 30, 0.62); bass(E.gui + b * 30, D2 + [0, 0, 3, 0][b % 4], {beats: 2, gain: 0.2, cut: 0.1}); }
pad(E.gui, E.tilt + 8, [50, 57, 62, 65], {gain: 0.04, atk: 0.2, rel: 0.5, bright: 0.25});
for (let i = 0; i < 7; i++) { const t = E.menus - 4 + ((E.brk + 2 - E.menus + 4) * i) / 6; tick(t, {f: 1500, gain: i === 6 ? 0.42 : 0.28, dur: 0.05, pan: -0.3 + i * 0.1, send: 0.2}); }
tick(E.slow + 8, {f: 880, gain: 0.3, dur: 0.12, send: 0.3});
pad(E.brk + 2, E.brk + 30, [51, 57, 63, 70], {gain: 0.05, atk: 0.004, rel: 0.5, bright: 0.72, send: 0.35}); sub(E.brk + 2, {dur: 0.7, f0: 120, f1: 42, drop: 0.05, gain: 0.7, send: 0.2});

// ---------------------------------------------------------------- the layers open, MCP arrives
whoosh(E.tilt, E.tilt + 46, {gain: 0.3, pan0: 0, pan1: 0.3, send: 0.45}); riser(E.tilt - 6, E.tilt + 44, {gain: 0.14, curve: 1.6});
pad(E.tilt + 4, E.title + 2, [38, 50, 57, 62, 66, 69], {gain: 0.058, atk: 0.8, rel: 0.05, bright: 0.25});
for (let i = 0; E.tilt + 18 + i * 7.5 < E.title; i++) pluck(E.tilt + 18 + i * 7.5, [74, 78, 81, 86][i % 4] + (i > 16 ? 12 : 0), {gain: 0.07 + Math.min(i, 20) * 0.003, pan: i % 2 ? 0.45 : -0.45});
for (let b = 0; E.tilt + 20 + b * 15 < E.title; b++) kick(E.tilt + 20 + b * 15, 0.5);
[E.lCmd, E.lScript, E.lCore].forEach((t) => { sub(t, {dur: 0.7, f0: 150, f1: 44, drop: 0.05, gain: 0.72, send: 0.25}); noiseHit(t, {dur: 0.4, gain: 0.12, lp: 0.5, decay: 0.1, send: 0.3}); });
riser(E.title - 34, E.title, {gain: 0.34, lp0: 0.1, lp1: 0.95, curve: 3});
impact(E.title, 1.2);
pad(E.title, E.stage + 4, [38, 50, 57, 62, 66, 69, 74, 81], {gain: 0.06, atk: 0.01, rel: 0.3, bright: 0.34, send: 0.6});
glass(E.pack, {gain: 0.2, base: 1200, pan: -0.3}); sub(E.pack, {dur: 0.8, f0: 170, f1: 46, drop: 0.05, gain: 0.7, send: 0.2});
for (let i = 0; i < 4; i++) { pluck(E.tools - 2 + i * 4, [81, 86, 90, 93][i], {gain: 0.14, dur: 1.2, send: 0.55, pan: -0.5}); }
riser(E.stage - 30, E.stage + 2, {gain: 0.36, lp0: 0.05, lp1: 0.8, curve: 2.4});
impact(E.stage, 0.7);

// ---------------------------------------------------------------- without a standard: wires pile up, cut, then the snap
riser(E.tan, E.snap2 - 5, {gain: 0.42, lp0: 0.03, lp1: 0.9, curve: 2, send: 0.1});
for (let k = 0; E.tan + k * 7.5 < E.snap2 - 5; k++) { kick(E.tan + k * 7.5, 0.45 + k * 0.012); bass(E.tan + k * 7.5, D2 + [0, 3, 0, 5][k % 4], {beats: 0.45, gain: 0.26, cut: 0.2}); }
for (let i = 0; i < 70; i++) { const u = i / 70; tick(E.tan + (E.snap2 - 5 - E.tan) * Math.pow(u, 0.7), {f: 2000 + rnd() * 5000, gain: 0.06 + u * 0.1, dur: 0.02, pan: rnd() * 1.6 - 0.8, send: 0.04}); }
impact(E.snap2, 1.15);
pad(E.snap2, E.end + 2, [38, 50, 57, 62, 66, 69, 74], {gain: 0.06, atk: 0.02, rel: 0.2, bright: 0.3, send: 0.6});
for (let i = 0; i < 12; i++) pluck(E.snap2 + 22 + i * 7.5, [74, 78, 81, 86][i % 4] + (i > 7 ? 12 : 0), {gain: 0.08 + i * 0.006, pan: i % 2 ? 0.45 : -0.45});

// ---------------------------------------------------------------- the groove under the explanation: D major
const CHORDS = [[38, [62, 66, 69, 74]], [35, [59, 62, 66, 71]], [43, [59, 62, 67, 74]], [45, [61, 64, 69, 76]]];
const arp = [0, 2, 1, 3, 2, 1, 3, 2];
const nBars = Math.ceil((E.tan - E.stage) / 60);
for (let bar = 0; bar < nBars; bar++) {
  const t0 = E.stage + bar * 60, [root, ch] = CHORDS[bar % 4];
  const breakdown = t0 + 60 > E.key && t0 < E.req1 - 15;          // the key point stands in the open
  const tense = t0 + 60 > E.nope && t0 < E.fix;
  const big = t0 + 60 > E.nothing;
  const oct = big ? 24 : 12;
  pad(t0, t0 + 60, tense ? [51, 57, 63, 70] : ch, {gain: tense ? 0.042 : breakdown ? 0.065 : 0.05, atk: 0.05, rel: 0.08, bright: tense ? 0.5 : 0.2, send: 0.5});
  for (let s = 0; s < 8; s++) pluck(t0 + s * 7.5, (tense ? [63, 70, 66, 75] : ch)[arp[s] % 4] + oct, {gain: (breakdown ? 0.08 : 0.13) + (s % 4 === 0 ? 0.03 : 0), dur: 0.46, pan: s % 2 ? 0.5 : -0.5, bright: 0.42});
  if (breakdown) continue;
  for (let b = 0; b < 4; b++) kick(t0 + b * 15, tense ? 0.55 : 0.8);
  for (let b = 0; b < 4; b++) hat(t0 + b * 15 + 7.5, 1, b % 2 ? 0.25 : -0.25);
  for (let s = 0; s < 16; s++) if (s % 4 !== 2) hat(t0 + s * 3.75, 0.45, s % 2 ? 0.5 : -0.5);
  for (let s = 0; s < 8; s++) bass(t0 + s * 7.5, root + (s === 5 ? 7 : 0), {beats: 0.42, gain: 0.25, cut: 0.2});
}

// ---------------------------------------------------------------- every message, every arrival
const zip = ([t, each], legs, pan0 = -0.7, pan1 = 0.7, gain = 0.2) => { whoosh(t, t + each * legs, {gain, pan0, pan1}); tick(t + each * legs, {f: 2400, gain: 0.2, dur: 0.05, send: 0.3, pan: pan1}); };
zip(HOP.list, 1); zip(HOP.back, 1, 0.7, -0.2, 0.14);
for (let i = 0; i < 10; i++) whoosh(E.rush + i * 3, E.rush + 22 + i * 3, {gain: 0.13, pan0: 0.5, pan1: i % 2 ? -0.9 : 0.9});
impact(E.hero, 0.3); [E.cardName, E.cardDoes, E.cardInputs].forEach((t, i) => pluck(t, [86, 90, 93][i], {gain: 0.13, dur: 0.9, send: 0.5}));
whoosh(E.ctx - 2, E.ctx + 26, {gain: 0.2, pan0: 0.2, pan1: -0.8}); impact(E.ctx + 18, 0.25); pluck(E.you, 81, {gain: 0.12, dur: 1, send: 0.5, pan: -0.5});
[0, 7, 14, 20].forEach((d, i) => glass(E.wall + d, {gain: 0.14, base: 1500 + i * 150, pan: 0.3}));
for (let i = 0; i < 18; i++) tick(E.req1 + i * 3, {f: 3400 + (i % 5) * 300, gain: 0.07, dur: 0.018, pan: -0.5, send: 0.03});
zip(HOP.reqA, 1, -0.7, 0); pluck(E.wrap - 10, 86, {gain: 0.12, dur: 0.8}); pluck(E.tcall, 93, {gain: 0.14, dur: 0.9, send: 0.5});
zip(HOP.reqB, 1, 0, 0.5);
// the dive: a thud at each layer, the bottom, and back up
impact(E.dive, 0.5);
const dEnd = E.back - 16;
riser(E.dive + 2, dEnd - 6, {gain: 0.24, curve: 1.8, send: 0.12});
for (let l = 1; l <= 6; l++) { const t = E.dive + (dEnd - 4 - E.dive) * Math.pow(l / 6.2, 1 / 1.5); noiseHit(t, {dur: 0.2, gain: 0.12, lp: 0.7, hp: 0.05, decay: 0.05, send: 0.2, pan: l % 2 ? 0.5 : -0.5}); sub(t, {dur: 0.2, f0: 120, f1: 60, drop: 0.02, gain: 0.45, send: 0}); }
impact(dEnd, 0.55);
for (let i = 0; i < 12; i++) pluck(dEnd + 2 + i * 2.2, 74 + [0, 4, 7, 12, 16, 19, 24][i % 7], {gain: 0.07 + i * 0.005, dur: 0.5, pan: i % 2 ? 0.3 : -0.3, bright: 0.7});
whoosh(HOP.res[0], HOP.res[0] + 21, {gain: 0.22, pan0: 0.7, pan1: -0.7}); tick(HOP.res[0] + 21, {f: 2400, gain: 0.2, dur: 0.05, send: 0.3, pan: -0.7});
pluck(E.pick, 88, {gain: 0.13, dur: 0.8, pan: -0.4}); pluck(E.doi, 93, {gain: 0.15, dur: 0.9, pan: -0.4, send: 0.5});
for (let i = 0; i < 14; i++) tick(E.req2 + i * 3, {f: 3400 + (i % 5) * 300, gain: 0.07, dur: 0.018, pan: -0.5, send: 0.03});
zip(HOP.add, 3, -0.7, 0.6, 0.2);
impact(E.nope, 0.38);
whoosh(E.err, E.err + 21, {gain: 0.24, pan0: 0.7, pan1: -0.7});
impact(E.arrive2, 0.4); for (let i = 0; i < 4; i++) tick(E.arrive2 + i * 7.5, {f: 900, gain: 0.2, dur: 0.07});
pluck(E.naming, 88, {gain: 0.13, dur: 0.8, pan: -0.4});
for (let i = 0; i < 8; i++) tick(E.fix + i * 3, {f: 3400 + (i % 5) * 300, gain: 0.07, dur: 0.018, pan: -0.5, send: 0.03});
zip(HOP.again, 3, -0.7, 0.6, 0.22);
impact(E.retryDone, 0.65); for (let i = 0; i < 4; i++) pluck(E.retryDone + i * 3.75, [86, 90, 93, 98][i], {gain: 0.16, dur: 1.2, send: 0.6});
riser(E.nothing - 6, E.more, {gain: 0.16, curve: 2.2});
impact(E.more + 2, 0.34); [8, 16].forEach((d, i) => pluck(E.more + d, [86, 90][i], {gain: 0.15, dur: 1.1, send: 0.5, pan: 0.5}));

// ---------------------------------------------------------------- the end
pad(E.end, E.outro + 2, [38, 50, 57, 62, 66, 69], {gain: 0.058, atk: 0.2, rel: 0.1, bright: 0.28, send: 0.6});
[E.wList, E.wCall, E.wRead].forEach((t, i) => { sub(t, {dur: 0.5, f0: 150, f1: 50, drop: 0.04, gain: 0.6, send: 0.1}); pluck(t, [81, 86, 90][i], {gain: 0.11, dur: 1.3, send: 0.6}); });
riser(E.wRepeat - 4, E.outro, {gain: 0.5, lp0: 0.04, lp1: 0.95, curve: 2.2, send: 0.3});
impact(E.outro, 1.3);
pad(E.outro, E.frames - 2, [38, 50, 57, 62, 66, 69, 74, 78, 81], {gain: 0.06, atk: 0.008, rel: 2, bright: 0.3, send: 0.75});
[0, 16, 30].forEach((d, i) => pluck(E.outro + d, [86, 90, 93][i], {gain: 0.15, dur: 2.2, send: 0.75}));

// ---------------------------------------------------------------- reverb, the dead cut, voice over the top
const reverb = (input, tunes, fb = 0.84, damp = 0.32) => {
  const out = new Float32Array(N);
  for (const d of tunes) { const buf = new Float32Array(d); let idx = 0, lp = 0; for (let i = 0; i < N; i++) { const o = buf[idx]; lp += damp * (o - lp); buf[idx] = input[i] + lp * fb; idx = (idx + 1) % d; out[i] += o * 0.25; } }
  for (const d of [556, 225]) { const buf = new Float32Array(d); let idx = 0; for (let i = 0; i < N; i++) { const o = buf[idx], v = out[i]; buf[idx] = v + o * 0.5; idx = (idx + 1) % d; out[i] = o - v * 0.5; } }
  return out;
};
const wetL = reverb(RL, [1557, 1617, 1491, 1422]), wetR = reverb(RR, [1580, 1640, 1514, 1445]);
for (let i = 0; i < N; i++) { L[i] += wetL[i] * 0.55; R[i] += wetR[i] * 0.55; }
for (let i = sf(E.snap2 - 5), e = sf(E.snap2); i < e; i++) { L[i] = 0; R[i] = 0; }

const voice = new Float32Array(N);
for (const s of tl.segments) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', `public/vo/${s.id}.mp3`, '-f', 'f32le', '-ac', '1', '-ar', String(SR), 'pipe:1'], {maxBuffer: 1 << 28});
  const pcm = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4)), at = Math.round(s.at * SR);
  for (let i = 0; i < pcm.length && at + i < N; i++) voice[at + i] += pcm[i];
}
// the music stem is set by loudness; it dips about 7 dB while someone is speaking
let mp = 0, vp = 0, vn = 0;
for (let i = 0; i < N; i++) { mp += L[i] * L[i] + R[i] * R[i]; if (Math.abs(voice[i]) > 0.01) { vp += voice[i] * voice[i]; vn++; } }
const musicGain = Math.pow(10, -17 / 20) / Math.sqrt(mp / (2 * N)), voiceGain = Math.pow(10, -15 / 20) / Math.sqrt(vp / vn);
let env = 0;
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
let pk = 0, rms = 0;
// clarity check: in the band where consonants live (above about 1 kHz), how far does the voice sit above the music?
const HP = Math.exp((-2 * Math.PI * 1000) / SR);
let hv = 0, hm = 0, pv = 0, pm = 0;
const clarity = tl.segments.map((s) => ({id: s.id, a: Math.round(s.at * SR), b: sf(s.to), v: 0, m: 0, worst: 99, wv: 0, wm: 0, wn: 0}));
let ci = 0;
for (let i = 0; i < N; i++) {
  const a = Math.abs(voice[i]) * voiceGain; env = a > env ? a + (env - a) * 0.995 : a + (env - a) * 0.99995;
  const duck = 1 - 0.55 * Math.min(1, env * 7);
  const vv = voice[i] * voiceGain, mm = (L[i] + R[i]) * 0.5 * musicGain * duck;
  hv = HP * (hv + vv - pv); pv = vv; hm = HP * (hm + mm - pm); pm = mm;
  while (ci < clarity.length - 1 && i > clarity[ci].b) ci++;
  const cl = clarity[ci];
  if (i >= cl.a && i <= cl.b) {
    cl.v += hv * hv; cl.m += hm * hm; cl.wv += hv * hv; cl.wm += hm * hm; cl.wn++;
    if (cl.wn === 6615) { if (cl.wv > 1e-5) cl.worst = Math.min(cl.worst, 10 * Math.log10(cl.wv / Math.max(cl.wm, 1e-9))); cl.wv = 0; cl.wm = 0; cl.wn = 0; }
  }
  const fade = Math.min(1, (N - i) / (1.2 * SR));
  const l = Math.tanh((L[i] * musicGain * duck + voice[i] * voiceGain) * 1.0) * 0.96 * fade, r = Math.tanh((R[i] * musicGain * duck + voice[i] * voiceGain) * 1.0) * 0.96 * fade;
  pk = Math.max(pk, Math.abs(l), Math.abs(r)); rms += l * l + r * r;
  out.writeInt16LE(Math.round(l * 32767), 44 + i * 4); out.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
writeFileSync('public/mix.wav', out);
console.log('seconds', (N / SR).toFixed(1), 'peak', pk.toFixed(2), 'rms dB', (10 * Math.log10(rms / (2 * N))).toFixed(1));
console.log('voice over music above 1 kHz, dB (whole line / worst 150 ms):');
console.log(clarity.map((c) => `${c.id} ${(10 * Math.log10(c.v / Math.max(c.m, 1e-9))).toFixed(0)}/${c.worst.toFixed(0)}`).join('  '));
