# Verification of this source preparation

Checked on 2026-10-17. The delivered v5 scene, HTML and timeline remain byte-identical to the received production source. Changes concern the rendering tools, documentation, presentation and packaging.

## Executed checks

- Installed the film's Node dependencies from its lock file in the working checkout, and Python dependencies in a separate fresh environment.
- Read the live scene duration and planned all 4,382 default frames. The historical 4,383-frame export has a slightly longer rounded ending; the [rendering guide](../films/edl-gating/docs/rendering.md) explains the difference.
- Generated the full 147.05-second procedural stereo audio mix, rendered and encoded a six-frame clip, decoded each of the four output profiles, and inspected late-film stills.
- Checked repeated-frame consistency, temporal subframe averaging, invalid arguments, missing-frame failure and overwrite/resume behavior.
- Loaded the gallery at desktop and mobile widths, switched English/Chinese, played the selected video, sought to 77 seconds, and checked its 31 English explanation cues and local document links.
- Reviewed the public source inventory for private identity, local machine paths and generated dependencies/media. Full conversations and production logs remain outside the public source tree.

The source-preparation environment used Node 24.18.0, Python 3.12.14, NumPy 2.5.4, SciPy 1.18.1, Pillow 13.0.0, Chrome 155.0.8059.80 and FFmpeg 8.1.2. These are the preparation environment's versions, not proof of the historical render environment.

## Limits of these checks

The complete film has not been re-rendered with the revised tools. Selected stills and a short encoded clip verify operation, not full-film visual equivalence. The 95.48 MB gallery video is the supplied production encode, identified by its checksum, rather than a new render from this checkout. Technical checks and the physics checklist do not establish experimental accuracy, learning effectiveness or independent scientific endorsement. Public hosting has not been verified by local browser tests.
