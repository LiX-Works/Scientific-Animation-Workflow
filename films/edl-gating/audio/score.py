"""Synthesize a continuous showcase score with a weighted depth-reveal cue.

All sounds are generated here. Cues illustrate editorial transitions; they are
not recordings or predictions of sound emitted by the depicted device.
"""
import argparse
import json
import hashlib
import sys
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--timeline", default="src/timeline.json")
parser.add_argument("--out", default="audio/mix.wav")
parser.add_argument("--force", action="store_true")
parser.add_argument("--music-gain-db", type=float, default=2.0,
                    help="Musical-bus gain relative to the v4-v8 arrangement")
parser.add_argument("--stems-start", type=float, default=10.0, help="Start of the local component review in film seconds")
parser.add_argument("--stems-seconds", type=float, default=6, help="Duration of the local component review")
args = parser.parse_args()
if not -12 <= args.music_gain_db <= 12:
    parser.error("Music gain must be between -12 and +12 dB")
music_gain = 10 ** (args.music_gain_db / 20)
timeline_path = ROOT / args.timeline
out_path = ROOT / args.out
if out_path.exists() and not args.force:
    parser.error("Output exists; use --force to replace this generated WAV")
TL = json.loads(timeline_path.read_text(encoding="utf-8"))
SR = 48000
DUR = float(TL["dur"])
WS, WT = TL["warp"]["S"], TL["warp"]["T"]
if not (len(WS) == len(WT) and np.all(np.diff(WS) > 0) and np.all(np.diff(WT) > 0)):
    raise ValueError("The timeline must have a strictly increasing time mapping")
def F(s): return float(np.interp(s, WS, WT))
def FD(s, d): return F(s + d) - F(s)
N = int(round(DUR * SR))
rng = np.random.default_rng(20261024)
music = np.zeros((N, 2), np.float32)
effects = np.zeros_like(music)
plucks = np.zeros_like(music)
drums = np.zeros_like(music)
bass_bus = np.zeros_like(music)
send = np.zeros_like(music)
cue_log = []

def tt(d): return np.arange(max(1, int(round(d * SR)))) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def filt(x, cutoff, kind="low"):
    return sosfilt(butter(2, cutoff, kind, fs=SR, output="sos"), x)
def lp(x, f): return filt(x, f)
def hp(x, f): return filt(x, f, "high")
def bp(x, lo, hi): return filt(x, [lo, hi], "band")
def noise(d): return rng.standard_normal(len(tt(d)))
def envelope(n, attack=.01, release=.2):
    env = np.ones(n)
    a = min(n, max(1, int(attack * SR)))
    r = min(n - a, max(0, int(release * SR)))
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        env[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env

def add(buf, signal, time, gain=1.0, pan=0.0, reverb=.15):
    i = int(round(time * SR))
    sig = np.asarray(signal)
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[:max(0, N - i)]
    if len(sig) == 0:
        return
    if np.ndim(pan):
        p = np.asarray(pan)[:len(sig)]
    else:
        p = float(np.clip(pan, -1, 1))
    l = np.cos((p + 1) * np.pi / 4)
    r = np.sin((p + 1) * np.pi / 4)
    a = np.column_stack((sig * l, sig * r)).astype(np.float32) * gain
    # Raise the arrangement and its own reverb together, without increasing
    # every transition effect or changing the continuous 108 BPM rhythm.
    if any(buf is bus for bus in (music, plucks, drums, bass_bus)):
        a *= music_gain
    buf[i:i + len(a)] += a
    send[i:i + len(a)] += a * reverb

def pad_note(m, duration, gain=.026, bright=.24):
    x = tt(duration)
    f = mtof(m)
    tone = np.zeros_like(x)
    for n in range(1, 5):
        tone += bright ** (n - 1) / n * (
            np.sin(2 * np.pi * f * n * 1.0012 * x + n * .35) +
            np.sin(2 * np.pi * f * n * .9988 * x)
        ) / 2
    return tone * envelope(len(x), min(.7, duration * .2), min(1.4, duration * .35)) * gain

def harmony(start, end, notes, gain, bright=.24):
    a, b = F(start), F(end)
    duration = max(.1, b - a + 1.0)
    for k, m in enumerate(notes):
        add(music, pad_note(m, duration, gain, bright), a,
            pan=(k / max(1, len(notes) - 1) - .5) * 1.2, reverb=.24)

def pluck(m, gain):
    x = tt(.55)
    f = mtof(m)
    sig = np.sin(2 * np.pi * f * x) + .22 * np.sin(4 * np.pi * f * x)
    return sig * np.exp(-x * 9) * np.minimum(1, x / .003) * gain

def bass(m, duration=.55, gain=.045):
    x = tt(duration)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * x) + .32 * np.sin(4 * np.pi * f * x)
    return s * np.exp(-x * 5.5) * envelope(len(x), .015, .1) * gain

def kick(gain=.075):
    x = tt(.32)
    f = 43 + 65 * np.exp(-x * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 14) * envelope(len(x), .002, .06) * gain

def hat(gain=.009):
    x = tt(.065)
    return hp(noise(.065), 6500) * np.exp(-x * 85) * envelope(len(x), .001, .02) * gain

def thump(gain=.16, f0=46):
    x = tt(.85)
    f = 35 + f0 * np.exp(-x * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7) * envelope(len(x), .005, .25) * gain

def chime(notes=(81, 88), gain=.018, duration=1.35):
    x = tt(duration)
    s = sum(np.sin(2 * np.pi * mtof(m) * x) * np.exp(-x * (3.2 + i))
            for i, m in enumerate(notes))
    return s * envelope(len(x), .005, .4) * gain

def sweep(duration, gain=.05, upward=True):
    x = tt(duration)
    z = np.clip(x / max(.001, duration), 0, 1)
    u = z if upward else 1 - z
    n = noise(duration)
    s = lp(n, 550) * (1 - u) + bp(n, 500, 2600) * np.sin(np.pi * u) + hp(n, 3200) * u * .30
    return s * np.sin(np.pi * z) ** 1.35 * gain

def depth_motion(duration):
    """Slow pressure build and accelerating, dark air; no repeated drum hits."""
    x = tt(duration)
    z = np.clip(x / duration, 0, 1)
    local_rng = np.random.default_rng(20261025)
    air = local_rng.standard_normal(len(x))
    movement = z * z * (3 - 2 * z)
    # Most motion stays in the low mids so it reads on ordinary speakers.
    dark = bp(air, 75, 480)
    open_air = bp(air, 320, 1500)
    texture = dark * (1 - .40 * movement) + open_air * .48 * movement ** 2
    phase = 2 * np.pi * np.cumsum(49 + 16 * z ** 2) / SR
    body = np.sin(phase) + .26 * np.sin(2 * phase)
    build = smoothstep(z, .02, .96) ** 1.25
    return (texture * .036 + body * .020) * build * envelope(len(x), .22, .14)

def depth_landing():
    """One rounded, low hit, with audible harmonics and an unbroken tail."""
    x = tt(1.9)
    f = 43 + 25 * np.exp(-x * 6)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) + .28 * np.sin(2 * phase) + .09 * np.sin(3 * phase)
    return body * np.exp(-x * 3.8) * envelope(len(x), .016, .48) * .135


def breakdown_layers():
    """Original-style fracture, downward impact and a long low-frequency tail.

    Retain the original film's time constants and three-layer construction,
    with controlled dry levels for the current quieter arrangement. This is
    an editorial sound cue, not acoustic evidence about dielectric breakdown.
    """
    local_rng = np.random.default_rng(20261025 + 85)
    x = tt(1.4)
    crackle = (bp(local_rng.standard_normal(len(x)), 500, 9000)
               * np.exp(-x * 3.5) * (local_rng.random(len(x)) > .55)
               * envelope(len(x), .002, .15) * .14)
    x = tt(1.2)
    frequency = 85 * np.exp(-x * 3) + 30
    phase = 2 * np.pi * np.cumsum(frequency) / SR
    impact = (np.sin(phase) * np.exp(-x * 4.5)
              * envelope(len(x), .005, .15) * .31)
    x = tt(3.5)
    tail = (lp(local_rng.standard_normal(len(x)), 220) * np.exp(-x * 1.3)
            * envelope(len(x), .025, .45) * .22)
    # Consume the two noise buffers used by the replaced short cue so later
    # events and the shared reverb retain their previous deterministic stream.
    noise(.72)
    noise(1.25)
    return crackle, impact, tail

def ticks(time, duration, start_rate=4, end_rate=18, gain=.02, pan=0):
    stop = time + duration
    now = time
    while now < stop:
        progress = (now - time) / max(duration, .001)
        now += rng.exponential(1 / (start_rate + (end_rate - start_rate) * progress))
        if now >= stop:
            break
        x = tt(.024)
        sig = bp(noise(.024), 1500, 5000) * np.exp(-x * 190) * envelope(len(x), .001, .01)
        add(effects, sig, now, gain * rng.uniform(.5, 1), pan, .08)

# Harmony changes at the visual sections rather than at the original long cut.
harmony(0, 22.2, [50, 57, 60, 64, 69], .021)
harmony(22.2, 34.6, [48, 55, 62, 64, 71], .027, .32)
harmony(34.6, 44, [50, 57, 64, 69], .022, .18)
harmony(44, 50.4, [50, 57, 62, 64, 76], .022, .20)
harmony(50.4, 60.4, [53, 60, 64, 67, 72], .022)
harmony(60.4, 74, [55, 62, 65, 69, 74], .024, .30)
harmony(74, 85, [58, 62, 65, 69], .022, .22)
harmony(85, 89.8, [50, 57, 64, 65], .015, .16)
harmony(89.8, 102, [53, 60, 64, 67, 69, 76], .025, .28)

BPM = 108
step = 60 / BPM / 2
arp_a = [62, 69, 72, 74, 69, 72, 76, 72]
arp_b = [65, 72, 76, 77, 72, 76, 79, 76]
def smoothstep(value, start, stop):
    x = np.clip((value - start) / (stop - start), 0, 1)
    return x * x * (3 - 2 * x)
def pulse_weight(t):
    return ((.72 + .28 * smoothstep(t, .1, 2.6))
            * (1 - .38 * smoothstep(t, F(27.4) - 1, F(44)))
            * (1 + .20 * smoothstep(t, F(60.4), F(74))))
def drum_weight(t):
    return ((.62 + .38 * smoothstep(t, 1, 4))
            * (1 - .52 * smoothstep(t, F(27.4) - 1, F(44)))
            * (1 + .25 * smoothstep(t, F(60.4), F(74))))
def bass_note(t):
    for story, note in reversed([(0, 38), (22.2, 36), (34.6, 38),
                               (50.4, 41), (60.4, 43), (78, 46),
                               (85, 38), (89.8, 41)]):
        if t >= F(story):
            return note
    return 38

# One grid and one pattern index for the full film. There is no section stop,
# restart, tempo switch or gain step when the camera starts to turn.
grid_origin = .10
beat_events = []
for k, t in enumerate(np.arange(grid_origin, DUR - .2, step)):
    pattern = arp_a if t < F(60.4) else arp_b
    articulation = [1, .63, .82, .60, .95, .68, .78, .60][k % 8]
    pg = .021 * pulse_weight(t) * articulation
    dg = .022 * drum_weight(t)
    add(plucks, pluck(pattern[k % 8], pg), t,
        pan=np.sin(k * .82) * .30, reverb=.19)
    if k % 2 == 1:
        add(drums, hat(.0037 * drum_weight(t)), t,
            pan=(-1 if k % 4 == 1 else 1) * .3, reverb=.04)
    if k % 4 == 0:
        add(drums, kick(dg), t, reverb=.025)
    if k % 8 == 0:
        add(bass_bus, bass(bass_note(t), .70, .019 * pulse_weight(t)),
            t, reverb=.045)
    beat_events.append({"index": k, "film_seconds": float(t),
                        "pluck_gain": float(pg),
                        "drum_weight": float(drum_weight(t)),
                        "kick": k % 4 == 0})

# The microscopic passages have restrained high notes and a quiet low pad.
for s, note in [(36.2, 81), (40.6, 76), (45, 84), (51.6, 81), (55.8, 79), (58.6, 76)]:
    add(music, chime((note,), .018, 1.8), F(s), pan=rng.uniform(-.5, .5), reverb=.4)

extrude = next(e for e in TL["events"] if e["type"] == "extrude")
extrude_start = F(extrude["t"])
extrude_end = F(extrude["t"] + extrude["dur"])
# Actual film time shared with the v4 camera's depth emphasis. The viewer has
# ten calm opening seconds before the rotation starts; the peak is later.
reveal = 13.65
cue_log.append({"type": "reveal-accent", "film_seconds": reveal,
                "transition_start": extrude_start, "transition_end": extrude_end,
                "motion_build_start": extrude_start,
                "editorial_alignment": "v4 matte camera/depth emphasis"})

for e in TL["events"]:
    s, ty = e["t"], e["type"]
    t = F(s)
    d = max(.08, FD(s, e.get("dur", 1)))
    cue_log.append({"type": ty, "story_seconds": s, "film_seconds": t, "mapped_duration": d})
    if ty == "draw":
        # The compact showcase opens as a complete image, not typed labels.
        continue
    elif ty in ("field", "gather"):
        # Continuous quiet motion; no gathering or scattering particle implication.
        x = tt(d)
        sfx = bp(noise(d), 350, 2100) * envelope(len(x), min(.15, d * .2), min(.3, d * .3)) * .009
        add(effects, sfx, t, pan=np.linspace(-.25, .25, len(x)), reverb=.1)
    elif ty == "hit":
        continue  # No extra opening thump before the single depth reveal.
    elif ty == "drift":
        add(effects, sweep(d, .012), t, pan=.1, reverb=.1)
    elif ty in ("glass", "glass2"):
        if e["t"] < 34.6:
            continue  # Removed opening labels do not need notification tones.
        add(effects, chime((86 if ty == "glass" else 88,), .010, .9), t, pan=.2, reverb=.18)
    elif ty == "extrude":
        # Weight comes from one continuous dark build, then one rounded hit.
        # The 108 BPM music continues under the tail; no dramatic full stop.
        build_duration = reveal - t + .08
        add(effects, pad_note(36, .85, .008, .25), t, reverb=.10)
        add(effects, depth_motion(build_duration), t,
            pan=np.linspace(-.24, .24, len(tt(build_duration))), reverb=.20)
        add(effects, depth_landing(), reveal, reverb=.21)
        add(effects, sweep(2.05, .013, upward=False), reveal + .03,
            pan=np.linspace(.24, -.12, len(tt(2.05))), reverb=.24)
        add(effects, chime((74,), .006, 1.65), reveal + .035,
            pan=.1, reverb=.28)
    elif ty == "lift":
        add(effects, sweep(d, .023), t, pan=.15, reverb=.22)
    elif ty == "gel":
        ticks(t, d, 3, 7, .009)
    elif ty == "ions":
        ticks(t, d, 3, 12, .007)
    elif ty == "edl":
        add(effects, bass(38, 1.0, .035), t, reverb=.14)
        add(effects, chime((81,), .010, 1.6), t + .12, reverb=.30)
    elif ty == "riser":
        add(effects, sweep(d, .035), t, reverb=.26)
    elif ty == "arrive":
        add(effects, thump(.125, 32), t, reverb=.18)
        add(effects, sweep(.95, .018, upward=False), t, reverb=.24)
    elif ty == "tick":
        add(effects, chime((84,), .014, .55), t, pan=-.25, reverb=.14)
    elif ty == "pullout":
        add(effects, sweep(d, .031, upward=False), t, reverb=.2)
    elif ty == "columns":
        add(effects, chime((72, 79), .018, 1.0), t, pan=-.35, reverb=.18)
        add(effects, chime((76, 83), .015, 1.0), min(t + 1.1, t + d * .45), pan=.35, reverb=.18)
    elif ty == "stress":
        x = tt(d)
        p = np.clip(x / d, 0, 1)
        sig = (np.sin(2 * np.pi * 116 * x) * np.sin(2 * np.pi * 123 * x)) * p
        add(effects, sig * envelope(len(x), .25, .1) * .024, t, pan=-.35, reverb=.08)
    elif ty == "defects":
        ticks(t, d, 2, 17, .032, -.35)
    elif ty == "zap":
        x = tt(d)
        add(effects, hp(noise(d), 2300) * (x / d) ** 2 * envelope(len(x), .005, .02) * .055,
            t, pan=-.32, reverb=.08)
    elif ty == "break":
        crackle, impact, tail = breakdown_layers()
        add(effects, crackle, t, pan=-.30, reverb=.28)
        add(effects, impact, t, pan=-.12, reverb=.30)
        add(effects, tail, t + .02, reverb=.48)
        cue_log[-1]["layers"] = {
            "crackle_seconds": 1.4, "impact_seconds": 1.2,
            "low_tail_seconds": 3.5, "low_tail_cutoff_hz": 220,
            "low_tail_offset_seconds": .02,
            "crackle_decay_per_second": 3.5,
            "impact_decay_per_second": 4.5,
            "low_tail_decay_per_second": 1.3,
            "source": "Original film three-layer algorithm; controlled current-mix levels",
        }
    elif ty == "calm":
        add(effects, chime((81, 88), .016, 1.7), t, pan=.3, reverb=.35)
    elif ty == "flatten":
        add(effects, sweep(min(d, 1.8), .025, upward=False), t, reverb=.22)
    elif ty == "end":
        add(effects, chime((65, 72, 76), .018, 1.9), t, reverb=.32)

# Duck musical detail around the reveal and breakdown to make accents legible.
duck = np.ones(N)
for event_time, strength, recovery in [(reveal, .10, .65), (F(50.3), .10, .6), (F(85), .18, .85)]:
    i = int(event_time * SR)
    length = min(N - i, int(2.3 * SR))
    if length > 0:
        w = 1 - strength * np.exp(-np.arange(length) / (recovery * SR))
        duck[i:i + length] = np.minimum(duck[i:i + length], w)
music *= duck[:, None]
# Leave the very quiet pulse continuous during editing accents.
plucks *= (1 - (1 - duck[:, None]) * .35)
# Energy-normalized impulse response avoids the arbitrary loudness of the old
# random convolution kernel; dry transitions remain clear on laptop speakers.
x = tt(1.7)
impulse = []
for channel in range(2):
    ir = lp(rng.standard_normal(len(x)), 5200) * np.exp(-x * 4.4)
    ir[:int(.018 * SR)] = 0
    ir /= max(1e-9, np.linalg.norm(ir))
    impulse.append(ir)
wet = np.column_stack([fftconvolve(send[:, c], impulse[c])[:N] for c in range(2)]).astype(np.float32) * .18
# Apply the same linear cleanup/fades to all buses so stems remain meaningful.
buses = {"harmony": music, "plucks": plucks, "drums": drums,
         "bass": bass_bus, "effects": effects, "reverb": wet}
fade = np.ones(N)
fade_out = min(N, int(1.3 * SR))
fade[-fade_out:] *= np.cos(np.linspace(0, np.pi / 2, fade_out)) ** 2
fade_in = min(N, int(.045 * SR))
fade[:fade_in] *= np.linspace(0, 1, fade_in)
for name in buses:
    buses[name] = np.column_stack([hp(buses[name][:, c], 30) for c in range(2)]).astype(np.float32) * fade[:, None]
mix = sum(buses.values())
raw_peak = float(np.abs(mix).max())
target_peak = 10 ** (-3 / 20)
gain = min(target_peak / max(raw_peak, 1e-9), 2.5)
mix *= gain
for name in buses:
    buses[name] *= gain
peak = float(np.abs(mix).max())
rms = float(np.sqrt(np.mean(mix ** 2)))
if not np.isfinite(mix).all() or peak >= 1:
    raise ValueError("Non-finite samples or clipping in synthesis")
out_path.parent.mkdir(parents=True, exist_ok=True)
def write_wav(path, signal):
    pcm = np.round(signal * 32767).astype(np.int16)
    with path.open("wb" if args.force else "xb") as f:
        wavfile.write(f, SR, pcm)
write_wav(out_path, mix)
stem_start = max(0, min(N, int(args.stems_start * SR)))
stem_length = min(N - stem_start, max(0, int(args.stems_seconds * SR)))
stem_paths = {}
if stem_length:
    stem_dir = out_path.parent / "stems"
    stem_dir.mkdir(parents=True, exist_ok=True)
    for name, bus in buses.items():
        path = stem_dir / ("reveal-" + name + ".wav")
        write_wav(path, bus[stem_start:stem_start + stem_length])
        stem_paths[name] = str(path)
    path = stem_dir / "reveal-mix.wav"
    write_wav(path, mix[stem_start:stem_start + stem_length])
    stem_paths["mix"] = str(path)

def db(value):
    return float(20 * np.log10(max(float(value), 1e-12)))
# Short-time values demonstrate the absence of a section-level stop. Individual
# note envelopes still have natural attack/release and do not need flat RMS.
envelopes = []
review_seconds = min(30, DUR)
for time in np.arange(0, review_seconds, .10):
    i = int(time * SR)
    j = min(N, i + int(.5 * SR))
    row = {"film_seconds": round(float(time), 2),
           "pluck_weight": float(pulse_weight(time)),
           "drum_weight": float(drum_weight(time)),
           "components": {}}
    for name in ("plucks", "drums", "bass", "harmony", "effects"):
        audio = buses[name][i:j]
        row["components"][name] = {
            "rms_dbfs": db(np.sqrt(np.mean(audio ** 2))),
            "peak_dbfs": db(np.abs(audio).max())}
    row["mix_rms_dbfs"] = db(np.sqrt(np.mean(mix[i:j] ** 2)))
    envelopes.append(row)

boundaries = []
for time in (10.0, 13.0, 13.65, 16.2, 17.2, 19.4, 22.5, 30.0):
    before = [e for e in beat_events if e["film_seconds"] < time][-1]
    after = [e for e in beat_events if e["film_seconds"] >= time][0]
    boundaries.append({
        "film_seconds": time,
        "preceding_grid_event": before["film_seconds"],
        "following_grid_event": after["film_seconds"],
        "grid_interval_seconds": after["film_seconds"] - before["film_seconds"],
        "expected_grid_interval_seconds": step,
        "weight_left": {"pluck": float(pulse_weight(time - .001)),
                        "drum": float(drum_weight(time - .001))},
        "weight_right": {"pluck": float(pulse_weight(time + .001)),
                         "drum": float(drum_weight(time + .001))},
        "scheduled_section_stop": False,
    })

report = {
    "sample_rate": SR, "channels": 2, "duration_seconds": len(mix) / SR,
    "revision": "showcase-v9-fuller-breakdown-and-music",
    "music_gain_db": args.music_gain_db,
    "music_gain_linear": music_gain,
    "samples_per_channel": N, "bpm": BPM, "seed": 20261024,
    "peak_dbfs": db(peak), "rms_dbfs": db(rms),
    "clipped_samples": int(np.sum(np.abs(mix) >= 1)),
    "synthesis_gain": gain, "timeline": str(timeline_path),
    "source_root": str(ROOT), "source_script": str(Path(__file__).resolve()),
    "python_executable": sys.executable,
    "timeline_sha256": hashlib.sha256(timeline_path.read_bytes()).hexdigest(),
    "cue_log": cue_log,
    "beat_grid_origin_seconds": grid_origin,
    "beat_grid_step_seconds": step,
    "beat_events": beat_events,
    "boundary_checks": boundaries,
    "opening_envelope_window_seconds": .5,
    "opening_envelopes": envelopes,
    "stem_start_seconds": stem_start / SR,
    "stem_duration_seconds": stem_length / SR,
    "stems": stem_paths,
    "editorial_note": "Programmatic music and editing cues, not device sound.",
    "review_note": "Continuity measurements do not establish subjective pacing acceptance.",
    "encoding_recommendation": "loudnorm=I=-14:TP=-1:LRA=11; normalize the full master once",
}
out_path.with_suffix(".report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

# A single compact local plot, generated as SVG rather than another render.
plot_path = out_path.parent / "opening-rhythm-envelope.svg"
x0, y0, width, height = 78, 50, 960, 285
def xplot(t): return x0 + t / review_seconds * width
def yplot(value): return y0 + (1 - value) * height
lines = []
for key, color in (("pluck_weight", "#2679a9"), ("drum_weight", "#ad7a31")):
    points = " ".join(f"{xplot(e['film_seconds']):.2f},{yplot(e[key]):.2f}" for e in envelopes)
    lines.append(f'<polyline fill="none" stroke="{color}" stroke-width="3" points="{points}"/>')
markers = []
for t in (0, 5, 10, 13.65, 16.2, 19.4, 22.5, 25, 30):
    x = xplot(t)
    markers.append(f'<line x1="{x}" x2="{x}" y1="{y0}" y2="{y0+height}" stroke="#d8dde0" stroke-dasharray="3 5"/>')
    markers.append(f'<text x="{x}" y="{y0+height+25}" text-anchor="middle">{t}</text>')
svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1090" height="430" viewBox="0 0 1090 430">
<rect width="1090" height="430" fill="white"/>
<g font-family="Arial,sans-serif" font-size="16" fill="#2b3136">
<text x="78" y="27" font-size="19" font-weight="bold">Opening rhythm weights — continuous 108 BPM grid</text>
{''.join(markers)}
{''.join(lines)}
<text x="70" y="55" text-anchor="end">1.0</text><text x="70" y="195" text-anchor="end">0.5</text><text x="70" y="340" text-anchor="end">0</text>
<text x="78" y="390" fill="#2679a9">Plucks</text><text x="220" y="390" fill="#ad7a31">Quiet drums</text>
<text x="1038" y="390" text-anchor="end">Film seconds</text>
<text x="78" y="418" font-size="14">Weights show the smooth arrangement; component WAVs and 0.5 s RMS values support actual review.</text>
</g></svg>"""
plot_path.write_text(svg, encoding="utf-8")
print(json.dumps({"wrote": str(out_path), "duration": DUR, "bpm": BPM,
                  "peak_dbfs": report["peak_dbfs"], "rms_dbfs": report["rms_dbfs"],
                  "clipped_samples": report["clipped_samples"],
                  "reveal_accent": reveal, "stems": stem_paths}, indent=2))
