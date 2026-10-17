# Rendering the EDL gating film

These tools render the supplied v5 scene; they do not introduce a new animation framework. Paths passed to Node/Python tools are relative to this film folder unless absolute. You may run the scripts from another working directory. Node renderers start and close their own localhost server, so a separate server process is optional.

## Dependencies

Use Node.js 20 or later, Python 3.10 or later, a recent Chrome/Chromium (Edge is also detected on Windows), and FFmpeg with the `libx264` and AAC encoders. `puppeteer-core` does not download a browser. Install the Node dependencies with the committed lock file:

```sh
npm ci --ignore-scripts
python -m venv .venv
```

Activate the environment (`.venv\Scripts\Activate.ps1` in PowerShell, or `source .venv/bin/activate` in a POSIX shell), then:

```sh
python -m pip install -r requirements.txt
ffmpeg -version
```

The Python requirements specify compatible ranges rather than an exact environment lock. Future library/browser versions can change numeric audio or rasterization results.

## Fonts and browser selection

Install **Noto Sans CJK SC**, **Noto Serif CJK SC**, **DejaVu Serif**, **DejaVu Sans**, and **DejaVu Sans Mono** before rendering if you want the font families used by the original source. Fonts are not bundled. Missing fonts fall back to system fonts, which can change caption widths and layout. Waiting for `document.fonts.ready` does not prove that a named system font is installed. Review stills on the target machine before rendering the whole film.

The tools look for common Chrome/Chromium/Edge locations. If necessary set `CHROME_PATH` to the executable, or append `--chrome "/path/to/chrome"` to a Node render/timeline command. Windows PowerShell example:

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

Rendering is headless and uses SwiftShader for a predictable software WebGL path; it does not require an interactive browser window. The browser sandbox remains enabled. In an already isolated Linux container that requires it, `--no-sandbox` is an explicit opt-in.

## Full pipeline

Run the following in the film folder. The supplied `src/timeline.json` already exists; `--force` explicitly replaces this generated timeline after reading the live scene. The score and encoded outputs refuse overwrite by default.

```sh
npm run timeline -- --force
python audio/score.py
npm run plan
npm run render -- --fps 30 --workers 4 --out frames
python tools/encode.py --frames frames --variant medium
```

The output is `output/v5_medium.mp4`. Encoding includes a temporary loudness-normalized mix (-16 LUFS target, -1.5 dBTP, stereo 48 kHz) and produces H.264/AAC with fast-start MP4 metadata. It trims the procedural score's one-second tail to the rendered frame duration, without truncating the video to a shorter audio stream. Temporary normalization/pass-log files are cleaned after encoding; the source WAV and frames are preserved.

The frame renderer reads **live `window.DUR`**, after the caption reading-time warp, rather than the 102-second story length. In the supplied scene `DUR = 146.0507586206897` seconds. At 30 fps the default is **4,382 frames**, numbered 0–4,381, ending at 146.0667 seconds after frame quantization. The historical delivered MP4 has 4,383 frames (146.1 seconds); its rounded render end included an extra held-tail frame. The small tail difference is expected. This workflow covers the whole scene and does not claim byte-identical reproduction of the delivered MP4.

`render.mjs` skips existing frames to resume an interrupted render. Use a fresh frame directory after changing source, fonts, frame rate, scaling or other settings. Use `--force` only when you intend to replace generated frames. A plan prints timing and frame count without writing images; `--report path.json` additionally saves the plan.

## Short checks before a full render

```sh
npm run render -- --stills 10,60,120,145.9 --out output/check-stills
npm run render -- --to 0.2 --workers 1 --out output/check-frames
python tools/encode.py --frames output/check-frames --duration 0.2 --variant medium --out output/check.mp4
```

This produces six frames and a 0.2-second MP4. It checks rendering/encoding plumbing; it is not full-film visual or audio acceptance. The score must be generated first. To render a segment later in the film, `--from` and `--to` use **film seconds**, preserve global frame numbers, and are limited to the live film duration. Match the encoder's `--start-number` and `--duration` so that audio seeks to the same film time:

```sh
npm run render -- --from 60 --to 61 --out output/segment-frames
python tools/encode.py --frames output/segment-frames --start-number 1800 --duration 1 --out output/segment.mp4
```

## Quality variants

```sh
python tools/encode.py --variant all
```

| Variant | Video setting | Audio | Purpose |
| --- | --- | --- | --- |
| `master` | H.264 CRF 16 | AAC 256 kb/s | High-quality derivative |
| `medium` | Two-pass budget of about 95 decimal MB | AAC 192 kb/s | Main downloadable viewing version |
| `viewing` | Two-pass budget of about 55 decimal MB | AAC 192 kb/s | Smaller optional viewing version |
| `preview` | Two-pass budget of about 22.5 decimal MB | AAC 128 kb/s | Lightweight draft |

All variants are 1920×1080. Size budgets apply to a complete film of the timeline duration, include audio, and are approximate; short clips use the corresponding bitrate. Add `--output-dir output/alternate` to choose a variant folder, or `--out path.mp4` for one variant. Add `--plan` to validate frame coverage and print FFmpeg commands without encoding. A single missing frame fails before encoding. Use `--ffmpeg` or the `FFMPEG` environment variable if it is not on PATH. `--ext png` supports lossless source frames.

The POSIX `encode_v5.sh` and legacy positional `mux.sh` are convenience wrappers around the Python encoder. On Windows use `encode.py` directly. `PYTHON` may select the interpreter used by the shell wrappers.

## Optional diagnostics and temporal sampling

- `node tools/serve.mjs`: serves the scene locally for inspection; the scene initially renders time zero and is not a video player.
- `python tools/s2f.py 40,83`: maps story seconds to film seconds from `src/timeline.json`.
- `node tools/rep.mjs --frames 1800,1800 --out output/repeat`: takes sequential screenshots in one page to inspect repeated-frame behavior. `--raf` waits for two animation frames between render and capture.
- `node tools/render.mjs --to 1 --mb 4 --out output/blur-frames`, followed by `python tools/mbavg.py output/blur-frames --samples 4`: captures four shutter subframes and averages in approximate linear-light space. Subframes remain available; no input images are deleted. Encode the averaged JPEG frames with matching duration. This optional path is separate from the delivered video's historical render settings.

The full 4,382-frame rerender remains a separate acceptance step. Short smoke tests, a complete timing plan, score synthesis and selected late stills establish tool operation, not full-film visual equivalence or proof that a supplied historical soundtrack was generated by the current environment.
