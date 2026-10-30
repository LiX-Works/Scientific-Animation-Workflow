# Sharing the source and the films

## Source repository

`films/<case-name>/` holds each film's code, representative images, dependency manifests and documentation. `site/` holds the viewing page, its build tools and shared images. Generated frames, installed dependencies, audio mixes and full MP4 exports stay out of Git history. Review public credits, metadata and screenshots for private information before distribution.

## Downloadable films

Each film has a GitHub Release, and each case's `release.json` records its size and SHA-256.

| Film | Release | File |
|---|---|---|
| Electric-double-layer gating | [edl-v6](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v6) | `edl-gating-v6.mp4`, 85.000 s, 1920×1080, 30 fps, 111,879,725 bytes |
| MCP, Explained in Motion | [mcp-v1](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/mcp-v1) | `mcp-explained-v1.mp4`, 137.27 s, 1920×1080, 60 fps, 143,133,462 bytes; `mcp-explained-v1-web.mp4` for the gallery |

The earlier [edl-v5 Release](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v5) keeps the longer Chinese edition. Publish a Release before the deployment that consumes it.

## Browser gallery

`site/gallery/index.html` is a static video page. To build it locally into a new directory outside the checkout:

```sh
python -m pip install -r site/tools/requirements.txt
python site/tools/prepare-gallery.py --video /path/to/edl-gating-v6.mp4 --extra-video /path/to/mcp-explained-v1-web.mp4 --out /path/to/new-site-directory
```

The helper verifies the main video against its release metadata, copies the videos, renders public Markdown into HTML and preserves relative links. It refuses a nonempty output directory. Serve the result with HTTP byte-range support so that seeking works.

The `Publish film playback page` workflow downloads the selected Release assets, verifies their checksums and builds the same site. After deployment, check the public URL: load, play, seek near the end, and follow the source and download links.

## Reuse permissions

Project code uses **MIT**. Original films, procedural music, images and explanatory prose use **CC BY 4.0**, subject to the scope and exceptions in [LICENSE-MEDIA.md](legal/LICENSE-MEDIA.md). Third-party dependencies and separately identified material keep their own terms.

See the [MIT license](../LICENSE) and [CC BY 4.0 text](legal/LICENSES/CC-BY-4.0.txt).
