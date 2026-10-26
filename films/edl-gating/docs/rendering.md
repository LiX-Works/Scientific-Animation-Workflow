# Rendering the EDL-gating film

The current source renders the **85-second English v6 edition**. It uses Three.js/DOM graphics, browser frame capture, procedural audio and FFmpeg. Run these commands from `films/edl-gating/`; tool input/output paths are resolved from that folder.

## Dependencies

Use Node.js 20 or later, Python 3.10 or later, a recent Chrome/Chromium (Edge is also detected on Windows), and FFmpeg with `libx264` and AAC. `puppeteer-core` does not download a browser.

```sh
npm ci --ignore-scripts
python -m venv .venv
```

Activate the environment (`.venv\Scripts\Activate.ps1` in PowerShell, or `source .venv/bin/activate` in a POSIX shell), then:

```sh
python -m pip install -r requirements.txt
ffmpeg -version
```

Install **DejaVu Sans**, **DejaVu Serif** and **DejaVu Sans Mono** for the English typography. Noto Sans/Serif CJK SC remain fallbacks inherited from the Chinese edition. Fonts are not bundled; missing families can change layout. Waiting for `document.fonts.ready` does not prove a named system font is installed, so inspect stills on the target machine first.

Browser detection covers common Chrome/Chromium/Edge locations. Set `CHROME_PATH` or append `--chrome "/path/to/browser"` when needed.

## Check before rendering

These examples place generated output outside the Git checkout. From this film folder, `../../../edl-v6-artifacts/` is a sibling of the repository; substitute another output path if preferred.

```sh
npm run plan -- --fps 30 --workers 1 --ss 1 --out ../../../edl-v6-artifacts/frames
npm run render -- --stills 8,14.5,40,61,70,83,84.9666666667 --workers 1 --ss 1 --q 95 --out ../../../edl-v6-artifacts/stills
```

The complete plan is **2,550 frames**, numbered `f00000.jpg`–`f02549.jpg`, at native **1920×1080**. `window.DUR` is 85 seconds. The 102-second story coordinate and retained 87-second internal staging clock are mapped to playback time by the scene; do not use either as the output duration.

Rendering is headless. The default `--renderer software` uses SwiftShader. On Windows, `--renderer d3d11` selects the local Direct3D11 path; `--renderer auto` leaves selection to the browser. These options affect only the launched browser process. The approved final render used D3D11 after selected-frame comparison with software rendering. Different browsers, fonts and backends can produce small image differences.

One worker is a reliable starting point. Increase concurrency only after a short check on the target machine. The browser sandbox remains enabled; `--no-sandbox` is an explicit option for an already isolated environment that requires it.

## Full export

The committed timeline is ready to use. Regenerate it after changing timing; `--force` explicitly replaces the existing JSON.

```sh
npm run timeline -- --force
python audio/score.py --out ../../../edl-v6-artifacts/audio/mix.wav
npm run render -- --fps 30 --workers 1 --ss 1 --q 95 --out ../../../edl-v6-artifacts/frames
python tools/encode.py --frames ../../../edl-v6-artifacts/frames --audio ../../../edl-v6-artifacts/audio/mix.wav --variant master --out ../../../edl-v6-artifacts/edl-gating-v6.mp4
```

On Windows, append `--renderer d3d11` to the render command to request the backend used for the approved export. The source does not require that backend to function.

The score writes an 85-second, 48 kHz stereo raw mix, a numerical report and short review stems. The encoder's current `master` profile uses **H.264 CRF 18 / medium preset / AAC 192 kb/s**, with fast-start MP4 metadata. Raw audio is loudness-normalized once, targeting **−14 LUFS / −1 dBTP**.

If an approved normalized master already exists, pass it directly and **skip another loudness pass**:

```sh
python tools/encode.py --frames ../../../edl-v6-artifacts/frames --audio /path/to/approved-normalized.wav --audio-normalized --variant master --out ../../../edl-v6-artifacts/edl-gating-v6.mp4
```

The published MP4 reused the accepted normalized master directly. Its final AAC measured approximately −14.0 LUFS and −1.2 dBTP. The reproduction commands preserve the source and encode recipe; they do not promise byte-identical output across environments or normalization methods. Use [release.json](../release.json) to identify the exact published asset.

## Resume and short excerpts

The renderer skips existing frames unless `--force` is supplied. Resume only with unchanged source, fonts, backend, frame rate and scale; otherwise use a fresh directory. The encoder checks consecutive frame coverage and refuses to overwrite an MP4 by default.

`--from` and `--to` use playback seconds and preserve global frame numbers. Seek the audio to the same time by matching `--start-number`:

```sh
npm run render -- --from 60 --to 61 --fps 30 --workers 1 --out ../../../edl-v6-artifacts/segment-frames
python tools/encode.py --frames ../../../edl-v6-artifacts/segment-frames --audio /path/to/approved-normalized.wav --audio-normalized --start-number 1800 --duration 1 --out ../../../edl-v6-artifacts/segment.mp4
```

For excerpt review, reuse a full-length normalized master instead of normalizing a short passage independently.

## Optional variants and diagnostics

| Encoder profile | Purpose |
|---|---|
| `master` | Current CRF 18 / medium / AAC 192 kb/s export recipe |
| `medium` | Approximately 95 decimal MB for the complete film |
| `viewing` | Approximately 55 decimal MB for the complete film |
| `preview` | Approximately 22.5 decimal MB for the complete film |
| `legacy-master` | Retained CRF 16 / slow / AAC 256 kb/s recipe |

Size-budget outputs are approximate and are not the selected 111.88 MB Release film. `--plan` checks inputs and prints commands without encoding; `--output-dir` controls variant destinations. PNG frames use `--ext png`. The legacy shell wrappers remain convenience entry points; Windows can use `encode.py` directly.

- `node tools/serve.mjs` opens a local scene server; it initially displays time zero, rather than playing a video.
- `python tools/s2f.py 40,83` interpolates story positions using the exported timeline.
- `node tools/rep.mjs --frames 2490,2490 --out ../../../edl-v6-artifacts/repeat` checks repeated captures at a closing frame.
- `--mb 4` with `tools/mbavg.py` provides optional shutter-subframe averaging. It was not used for the selected v6 export.

A successful render, decode or timing plan does not replace watching the encoded result. Check text, motion and sound around transitions, then review the complete film. [Validation](../../../docs/validation.md) records the completed checks and their limits.
