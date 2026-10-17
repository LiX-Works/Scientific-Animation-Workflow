# Sharing the source and the films

The repository, video downloads, and browser gallery serve different reading needs. Keep each film's source easy to inspect while giving viewers a direct route to the finished work.

## Source repository

Commit the film code, small representative images, dependency manifests, reproduction instructions, and selected production notes. Keep each implementation under `films/<case-name>/` so a new case can use different tools without changing an earlier one.

Generated frames, installed dependencies, audio mixes, and full MP4 exports remain outside Git history. Public filenames and media credits should use the project or case name. Review embedded credits, file metadata, screenshots, and selected quotations for private information before distribution.

## Downloadable films

A GitHub Release can hold finished video files alongside a versioned source snapshot. For the first case, the selected default is the approximately **95.48 MB, 1080p/30 fps version**, named `edl-gating-v5.mp4`. A smaller 55.20 MB trial was assessed during preparation; the owner preferred the sharper 95.48 MB version. The 154.11 MB higher-bitrate source remains an archival option. These are compressed files; the larger file's original name does not establish that it is a lossless master.

Give each asset a clear case/version/quality filename. Record its duration, resolution, frame rate, byte size, and SHA-256 in the release notes or an accompanying manifest. Keep the release linked to the source version and state whether the video was supplied from production or newly rendered from that checkout.

Public hosting and continuous human review remain separate from file identity, decoding, and sampled comparison checks. State each completed check with its actual scope in the case's validation notes.

## Browser viewing

`gallery/index.html` is a static HTML video player. A deployment directory contains this page, its supporting images, and the selected MP4 under the page's expected media path. It can be staged locally without adding the MP4 to Git history.

From the repository root, install the small documentation renderer and build into a new directory outside the checkout:

```sh
python -m pip install -r tools/requirements.txt
python tools/prepare-gallery.py --video /path/to/edl-gating-v5.mp4 --out /path/to/new-site-directory
```

The helper copies the selected video, renders the repository's public Markdown into readable HTML, and preserves the gallery's relative paths. It refuses a nonempty output directory. Serve the resulting directory with a static server that supports HTTP byte ranges for video seeking, or open its HTML files locally for document review. The built site contains no dependency environment or raw conversation records.

The player includes optional English translations of the explanation cards, positioned above the original Chinese graphics. They do not translate every component label. After modifying the film's timing, export its timeline and run `python tools/build-subtitles.py`; review the translations if the scientific captions have changed.

For a GitHub Pages deployment, copy the selected release asset into that deployment directory, then deploy the static directory. The browser reads the colocated MP4 through its ordinary video controls. The gallery does not run Three.js rendering or Python audio synthesis on a viewer's device.

After deployment, check the real public URL: load, play, seek near the end, confirm audio and captions, and follow both download and source links. Add the working watch link to the root README only after that check. Preparing these files does not itself create a Release or enable Pages.

This repository's `Publish film playback page` workflow downloads the selected `edl-v5` Release film, verifies its supplied checksums, and stages the site without putting the video in Git history. It runs from `main` when presentation files change, or when dispatched manually. Publish the selected Release asset before the first deployment. GitHub Pages must use the GitHub Actions publishing source; keeping deployment runs on `main` respects the environment's branch protection. The repository README remains the main introduction; its large preview links directly to the film section of the hosted player.

## Reuse permissions

Project code uses **MIT**. Original project films, procedural music, images, and explanatory prose use **CC BY 4.0**, subject to the scope and exceptions in [LICENSE-MEDIA.md](../LICENSE-MEDIA.md). Reuse can include modification and commercial use under the applicable license terms. Attribute the project without adding private personal details. Third-party dependencies and any separately identified material retain their own licenses.

See the [MIT license](../LICENSE) and [CC BY 4.0 text](../LICENSES/CC-BY-4.0.txt) for the terms.
