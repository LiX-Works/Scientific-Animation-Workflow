# Rendering

## Requirements

- Node.js (tested with 24.18) and npm
- FFmpeg on `PATH`
- About 2 GB of free disk space for dependencies and intermediate video

Remotion downloads its own Chrome Headless Shell (about 113 MB) on first use. Fonts and voice takes are included, so no account or API key is needed unless you change the narration. Tested on Windows 11.

## Commands

```bash
npm ci
```

Rebuild the timeline from the included voice takes:

```bash
npm run timeline
```

Synthesize the score and mix it with the voice. This prints the voice-over-music clarity of every line:

```bash
npm run mix
```

Bundle the film:

```bash
npm run bundle
```

Review chosen frames as one contact sheet (output file, columns, scale, then frame numbers at 60 fps):

```bash
node scripts/stills.mjs out/sheet.jpg 4 0.25 300 1300 2260 4900
```

Export the whole film to `out/mcp-explained.mp4`:

```bash
npm run render
```

## Checks that were run

From a clean install of this folder:

| Check | Result |
|---|---|
| Type check (`tsc --noEmit`) | Passes |
| `src/film/timeline.json` compared with the production file | Byte-identical |
| `public/mix.wav` compared with the production mix | Byte-identical |
| 11 frames across the film, at half scale, compared with the production source | Byte-identical JPEGs on the same machine |

The released film itself was checked for duration (137.27 s), frame count (8,236), stream format and loudness (about -14 LUFS). A complete re-render from the clean install was not run. Fonts, browser versions and encoders can change a new render.
