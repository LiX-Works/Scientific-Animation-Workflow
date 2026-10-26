# Sharing the source and the films

Keep a direct route to the finished film alongside its editable source and concise scientific explanation.

## Source repository

Commit the film code, small representative images, dependency manifests, reproduction instructions and selected production notes. Keep each implementation under `films/<case-name>/` so another case can use different tools.

Generated frames, installed dependencies, audio mixes and full MP4 exports remain outside Git history. Review public credits, metadata, screenshots and quotations for private information before distribution. Preserve earlier releases rather than replacing their historical assets.

## Downloadable film

The selected **English v6 edition** is `edl-gating-v6.mp4`: **85.000 s, 1920×1080, 30 fps, 2,550 frames and 111,879,725 bytes**. It is a new full render, using H.264/AAC with English graphics and no narration. [release.json](../films/edl-gating/release.json) records its SHA-256 and metadata.

The [edl-v6 Release](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v6) pairs that video with the English WebVTT explanation track and `SHA256SUMS`. Keep the tag linked to the corresponding source snapshot. The previous [edl-v5 Release](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v5) preserves the longer Chinese edition; its 95.48 MB file is no longer the default viewing asset.

File identity, complete decoding, sampled frame review, continuous human review and public hosting are distinct checks. Record each completed check with its actual scope in [validation](validation.md).

## Browser gallery

`gallery/index.html` is a static HTML video player. Its deployment directory contains the page, supporting images and the selected MP4 under the expected media path. The viewer does not run Three.js rendering or Python audio synthesis.

From the repository root, build into a new directory outside the checkout:

```sh
python -m pip install -r tools/requirements.txt
python tools/prepare-gallery.py --video /path/to/edl-gating-v6.mp4 --out /path/to/new-site-directory
```

The helper copies the selected video, renders public Markdown into HTML and preserves relative links. It refuses a nonempty output directory. Serve the staged site with HTTP byte-range support for video seeking.

The film itself has English labels and captions. An optional English explanation track offers a separate accessible text layer; it is not a voiceover or a translation of every component label. After changing timing or captions, export the current timeline, run `python tools/build-subtitles.py`, and review the track.

The `Publish film playback page` GitHub Actions workflow downloads the selected **edl-v6** Release assets, verifies their checksums and builds the static gallery without adding the MP4 to Git history. Publish the Release assets before the deployment that consumes them. GitHub Pages must use the GitHub Actions publishing source; run deployment from an allowed branch.

After deployment, check the actual public URL: load and play, seek near the end, confirm audio and captions, and follow the source and download links. Staging files alone does not create a Release or establish public playback.

## Reuse permissions

Project code uses **MIT**. Original project films, procedural music, images and explanatory prose use **CC BY 4.0**, subject to the scope and exceptions in [LICENSE-MEDIA.md](../LICENSE-MEDIA.md). Attribute the project, link the license and indicate changes. Third-party dependencies and separately identified material retain their own terms.

See the [MIT license](../LICENSE) and [CC BY 4.0 text](../LICENSES/CC-BY-4.0.txt).
