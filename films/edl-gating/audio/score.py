"""Synthesize the procedural score and SFX (48 kHz stereo); no external samples."""
import argparse, json
from pathlib import Path
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
from scipy.io import wavfile
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--timeline', default='src/timeline.json', help='Path relative to the film folder, or an absolute path')
parser.add_argument('--out', default='audio/mix.wav', help='Generated WAV; relative to the film folder')
parser.add_argument('--force', action='store_true', help='Replace an existing generated WAV')
args = parser.parse_args()
timeline_path = ROOT / args.timeline
out_path = ROOT / args.out
if out_path.exists() and not args.force:
    parser.error('Output exists; use --force to replace this generated WAV')
SR = 48000
TL = json.loads(timeline_path.read_text(encoding='utf-8')); DUR = TL['dur'] + 1.0
WS, WT = TL['warp']['S'], TL['warp']['T']
def F(s): return float(np.interp(s, WS, WT))
def FD(s, d): return F(s + d) - F(s)
N = int(DUR * SR); rng = np.random.default_rng(1016)
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2)); send = np.zeros((N, 2))
def tt(d): return np.arange(int(d * SR)) / SR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, sig, t, g=1.0, pan=0.0, rev=0.25):
    i = int(t * SR); sig = sig[: max(0, N - i)]
    if i < 0 or len(sig) == 0: return
    if np.ndim(pan) == 0: l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    else: p = np.asarray(pan)[: len(sig)]; l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * g * l; buf[i:i + len(sig), 1] += sig * g * r
    send[i:i + len(sig), 0] += sig * g * l * rev; send[i:i + len(sig), 1] += sig * g * r * rev
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def adsr(n, a, r, s=1.0):
    e = np.ones(n) * s; ai = min(n, int(a * SR)); ri = min(n - ai, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai) ** 2 * s
    if ri > 0: e[n - ri:] *= np.linspace(1, 0, ri) ** 2
    return e
noise = lambda d: rng.standard_normal(int(d * SR))

# ---------- 音乐 ----------
def pad_note(m, d, bright=0.4, g=.05):
    x = tt(d); f = mtof(m); s = np.zeros_like(x)
    for n in range(1, 9):
        det = 1 + (rng.random() - .5) * .004
        s += (bright ** (n - 1)) / n * (np.sin(2 * np.pi * f * n * det * x + rng.random() * 6) + np.sin(2 * np.pi * f * n / det * x)) * .5
    return s * adsr(len(x), min(2.5, d * .4), min(3, d * .45)) * g
def pad(t0, d, notes, bright, g=.05):
    t0, d = F(t0), FD(t0, d)
    for k, m in enumerate(notes): add(mus, pad_note(m, d, bright, g), t0, 1, pan=(k / max(1, len(notes) - 1) - .5) * .7, rev=.6)
# 和声进行（MIDI 音高，均 ≥ 48）
pad(0, 12.5, [50, 57, 60, 64, 69], .25, .035)           # Dm9 宏观
pad(11, 12, [50, 57, 62, 65, 72], .3, .035)
pad(22, 13, [48, 55, 62, 64, 71], .45, .04)             # 挤出 → 开阔
pad(34, 12, [50, 57, 64, 65], .2, .03)                  # 微观：稀薄
pad(45, 16, [50, 57, 62, 64, 69, 76], .35, .022)         # 俯冲后的 swell
pad(60, 10, [53, 60, 64, 67, 72], .4, .035)             # 回到宏观
pad(69, 10, [55, 62, 65, 69, 74], .45, .035)
pad(78, 11, [58, 64, 69, 70], .5, .03)                  # 张力（半音冲突 69/70）
pad(89, 13.5, [53, 60, 64, 67, 69, 76], .3, .04)        # 解决 F 大九
# 拨弦脉冲 92 BPM 八分音符
BPM = 104; step = 60 / BPM / 2
def pluck(m, g):
    x = tt(.7); f = mtof(m)
    s = (np.sin(2 * np.pi * f * x) + .35 * np.sin(4 * np.pi * f * x) + .1 * np.sin(6 * np.pi * f * x)) * np.exp(-x * 7)
    return s * np.minimum(1, x / .002) * g
arp1 = [62, 69, 72, 74, 69, 72, 76, 72]; arp2 = [65, 72, 76, 77, 72, 76, 79, 76]
def pulse(t0, t1, arp, gain_fn):
    k = 0; t = t0
    while t < t1:
        g = gain_fn(t); 
        if g > 0: add(mus, pluck(arp[k % len(arp)], g), t, 1, pan=.35 * np.sin(k * .9), rev=.35)
        t += step; k += 1
pulse(F(4.0), F(22.0), arp1, lambda t: .05 * min(1, (t - F(4)) / 4) * (.6 if F(17) < t < F(22) else 1))
pulse(F(22.0), F(28.0), arp1, lambda t: .035 * (1 - (t - F(22)) / (F(28) - F(22))))
pulse(F(64.0), F(78.0), arp2, lambda t: .05 * min(1, (t - F(64)) / 2))
# 轻打击：开镲式高频噪声（反拍）+ 柔和底鼓（四分）——更有律动但保持通透
def hat(g):
    x = tt(.09); return hp(noise(.09), 7000) * np.exp(-x * 60) * g
def kick(g):
    x = tt(.35); f = 95 * np.exp(-x * 18) + 42; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9) * g
for a0, a1, g in [(F(7.0), F(22.0), 1.0), (F(64.0), F(78.0), 1.25)]:
    t = a0; k = 0
    while t < a1:
        if k % 2 == 1: add(mus, hat(.018 * g), t, pan=.3 * (1 if k % 4 == 1 else -1), rev=.15)
        if k % 4 == 0: add(mus, kick(.10 * g), t, rev=.05)
        t += step; k += 1
# 贝斯（含 2/3 次谐波，小音箱也能听到）
def bassn(m, d, g):
    x = tt(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * x) + .5 * np.sin(4 * np.pi * f * x) + .25 * np.sin(6 * np.pi * f * x)) * np.exp(-x * 2.2) * np.minimum(1, x / .01) * g
for i, t in enumerate(np.arange(F(64), F(78), step * 2)): add(mus, bassn([41, 41, 43, 43][int(i / 4) % 4], .6, .09), t, rev=.1)
for t in np.arange(F(78), F(88), .5): add(mus, bassn(34 + 12, .45, .07 * (1 + (t - F(78)) / (F(88) - F(78)))), t, rev=.1)
# 微观 drone + 铃音
x = tt(FD(34, 27)); drone = (np.sin(2 * np.pi * mtof(38) * x) + .4 * np.sin(2 * np.pi * mtof(50) * x * 1.002)) * adsr(len(x), 4, 5) * .06
add(mus, drone, F(34), rev=.4)
def bell(m, g):
    x = tt(3.5); f = mtof(m)
    return sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * dcy) for a, r, dcy in [(1, 1, 1.6), (.4, 2.76, 3), (.2, 5.4, 6)]) * g
for t, m in [(36.5, 81), (39.2, 76), (42, 84), (51.2, 81), (53.9, 79), (56.4, 76), (58.6, 74)]: add(mus, bell(m, .03), F(t), pan=rng.uniform(-.6, .6), rev=.8)
# 结尾和弦 bloom
for m in [53, 60, 64, 69, 72, 76]: add(mus, pad_note(m, 8, .35, .03), F(96.8), pan=(m - 64) / 20, rev=.8)

# ---------- 音效 ----------
def whoosh(d, f0, f1, g, rise=True):
    n = noise(d); x = tt(d); out = np.zeros_like(n); nb = 24; L = len(n) // nb + 1
    for b in range(nb):
        s = slice(b * L, min(len(n), (b + 1) * L)); k = b / (nb - 1); f = f0 * (f1 / f0) ** k
        out[s] = bp(n, max(30, f * .7), min(SR / 2 - 100, f * 1.4))[s]
    env = np.sin(np.pi * np.clip(x / d, 0, 1)) ** (1.5 if rise else 1)
    return out * env * g
def thump(g, f0=70):
    x = tt(1.2); f = f0 * np.exp(-x * 3) + 30; ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x * 4.5) * g
def chime(g, ms=(88, 95)):
    x = tt(2.4); return sum(np.sin(2 * np.pi * mtof(m) * x) * np.exp(-x * (2 + i)) for i, m in enumerate(ms)) * np.minimum(1, x / .003) * g
def ticks(t0, d, dens_fn, g, lo=2500, hi=7000, pan_fn=None):
    t = t0
    while t < t0 + d:
        dens = max(1e-3, dens_fn((t - t0) / d)); t += rng.exponential(1 / dens)
        c = bp(noise(.02), lo, hi) * np.exp(-tt(.02) * 300)
        add(sfx, c, t, g * rng.uniform(.4, 1), pan=pan_fn((t - t0) / d) if pan_fn else rng.uniform(-.8, .8), rev=.3)
for e in TL['events']:
    t, ty, d = F(e['t']), e['type'], FD(e['t'], e.get('dur', 1))
    if ty == 'draw':
        for k in range(7): add(sfx, bp(noise(.35), 1500, 5000) * adsr(int(.35 * SR), .05, .25) * .03, t + k * .33, pan=-.6 + k * .2)
    elif ty == 'field':
        x = tt(d + 1.5); hum = (np.sin(2 * np.pi * 55 * x) + .5 * np.sin(2 * np.pi * 110 * x) + .2 * np.sin(2 * np.pi * 165 * x)) * np.clip(x / d, 0, 1) ** 1.5 * adsr(len(x), .01, 1.4) * .05
        add(sfx, hum, t, rev=.2)
    elif ty == 'gather': ticks(t, d, lambda k: 6 + 40 * k, .045, pan_fn=lambda k: rng.uniform(-.3, .3))
    elif ty == 'hit': add(sfx, thump(.5), t, rev=.2); add(sfx, chime(.05, (86, 93, 98)), t + .02, rev=.7)
    elif ty == 'drift':
        x = tt(d); s = hp(noise(d), 3000) * adsr(len(x), .8, 1.2) * .012
        add(sfx, s, t, pan=np.linspace(-.7, .7, len(x)), rev=.2)
    elif ty in ('glass', 'glass2'): add(sfx, chime(.035, (91, 98) if ty == 'glass' else (93, 100)), t, pan=.2, rev=.8)
    elif ty == 'extrude': add(sfx, thump(.6, 42) * 1.3, t, rev=.4); add(sfx, whoosh(d * .55, 120, 1800, .16), t + .15, rev=.6); add(sfx, whoosh(d, 200, 2400, .12), t, rev=.5); add(sfx, thump(.25, 50), t + d * .85, rev=.3)
    elif ty == 'lift': add(sfx, whoosh(d, 400, 1200, .05), t, pan=.1, rev=.4)
    elif ty == 'gel': ticks(t, d, lambda k: 15 * np.sin(np.pi * k) + 2, .03, 600, 1800)
    elif ty == 'ions': ticks(t, d, lambda k: 8 + 90 * np.sin(np.pi * min(1, k * 1.1)) ** 2, .035, 1800, 6000)
    elif ty == 'edl':
        for m, dt in [(38, 0), (45, .35)]: add(sfx, bassn(m, 2.5, .25), t + dt, rev=.4)
    elif ty == 'riser':
        x = tt(d); f = 120 * (12 ** (x / d)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (x / d) ** 2 * .05
        add(sfx, s + whoosh(d, 300, 6000, .06) * (x / d), t, rev=.6)
    elif ty == 'arrive': add(sfx, thump(.45, 60), t, rev=.6); add(sfx, lp(noise(3), 900) * np.exp(-tt(3) * 1.4) * .08, t, rev=.9)
    elif ty == 'tick': add(sfx, bp(noise(.04), 2000, 6000) * np.exp(-tt(.04) * 120) * .1, t, pan=-.4)
    elif ty == 'pullout': add(sfx, whoosh(d, 3000, 180, .11), t, rev=.5)
    elif ty == 'columns':
        x = tt(d + .8); k = np.clip(x / (d - .2), 0, 1); k = k * k * (3 - 2 * k)
        for f1, pan, g in [(880, -.5, .03), (262, .5, .03)]:
            f = 220 * (f1 / 220) ** k; add(sfx, np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(len(x), .4, .8) * g, t, pan=pan, rev=.4)
    elif ty == 'stress':
        x = tt(d); s = (np.sin(2 * np.pi * 116 * x) * np.sin(2 * np.pi * 123 * x)) * (x / d) * (.5 + .5 * np.sin(2 * np.pi * (2 + 4 * x / d) * x)) * .05
        add(sfx, s, t, pan=-.4, rev=.3)
    elif ty == 'defects':
        ticks(t, d, lambda k: 2 + 25 * k ** 2, .09, 900, 4000, pan_fn=lambda k: -.4)
    elif ty == 'zap':
        x = tt(d); s = hp(noise(d), 2500) * (x / d) ** 3 * .12 + np.sin(2 * np.pi * np.cumsum(300 * 8 ** (x / d)) / SR) * (x / d) ** 2 * .04
        add(sfx, s, t, pan=-.4, rev=.3)
    elif ty == 'break':
        s = bp(noise(1.4), 500, 9000) * np.exp(-tt(1.4) * 3.5) * (rng.random(int(1.4 * SR)) > .55) * .42
        add(sfx, s, t, pan=-.4, rev=.5); add(sfx, thump(.95, 85), t, pan=-.2, rev=.5)
        add(sfx, lp(noise(3.5), 220) * np.exp(-tt(3.5) * 1.3) * .5, t + .02, rev=.8)
    elif ty == 'calm': add(sfx, chime(.03, (84, 91)), t, pan=.4, rev=.9)
    elif ty == 'flatten': add(sfx, whoosh(d, 2400, 150, .09), t, rev=.6)
    elif ty == 'end': add(sfx, thump(.2, 45), t, rev=.8)

# ---------- 混音 ----------
duck = np.ones(N)
for e in TL['events']:
    if e['type'] in ('hit', 'arrive', 'break'):
        i = int(F(e['t']) * SR); L = int(1.5 * SR); w = 1 - .35 * np.exp(-np.arange(L) / (.5 * SR)); duck[i:i + L] = np.minimum(duck[i:i + L], w[: N - i])
mus *= duck[:, None]
ir_d = 2.6; x = tt(ir_d)
ir = np.stack([lp(rng.standard_normal(len(x)), 6000) * np.exp(-x * 2.6) for _ in range(2)], 1); ir[: int(.01 * SR)] = 0
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1) * .09
mix = mus + sfx + wet
mix = hp(mix.T, 28).T
# 末尾淡出
fo = int(2.5 * SR); mix[N - fo:] *= np.linspace(1, 0, fo)[:, None]
mix /= max(1e-9, np.abs(mix).max()) / .7
out_path.parent.mkdir(parents=True, exist_ok=True)
# Exclusive creation also protects against another process creating the output.
with out_path.open('wb' if args.force else 'xb') as output_file:
    wavfile.write(output_file, SR, (mix * 32767).astype(np.int16))
print('Wrote', out_path, DUR, 'seconds')
