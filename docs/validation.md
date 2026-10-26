# Verification and release scope

## Current English v6 edition · 2026-10-25

The selected film was newly rendered in full from the reviewed English source. The author approved the revised picture and sound, then requested one narrow closing-frame correction before final rendering: the purple gate-charge row now spans the full gate.

| Property | Selected asset |
|---|---|
| Filename | `edl-gating-v6.mp4` |
| Duration | 85.000 s; video and audio equal |
| Picture | Native 1920×1080, 30 fps, 2,550 frames |
| Encoding | H.264 CRF 18 / medium; AAC 192 kb/s |
| Size | 111,879,725 bytes |
| SHA-256 | `eb1fe12674c01c9be34d684792ce9a4f1cd6f38550f77d633a14f0fd2dc3b69b` |
| Graphics and sound | English graphics; music and synthesized effects, no narration |

The [release manifest](../films/edl-gating/release.json) carries the machine-readable identity.

Completed production checks:

- Rendered all 2,550 frames at native 1080p and checked source/audio identity against the frozen render inputs.
- Compared selected D3D11 and software-rendered frames before using D3D11 for the full export; inspected actual images rather than relying only on numeric differences.
- Inspected the encoded 83-second and final frames. The closing view contains a complete row of 18 purple gate-charge markers.
- Probed the output streams and completed full-stream decoding without errors.
- Reused the accepted 85-second normalized audio master without a second loudness pass. Final AAC measured approximately −14.0 LUFS and −1.2 dBTP.
- Checked the local playback response and supplied the complete film for the author's review.

These checks cover this selected render. They do not prove byte-identical reproduction on every machine. Font availability, browser version, graphics backend and audio-processing details can affect a new export.

Public deployment checks are separate from local playback and render checks. A local HTTP response does not establish that a public Release or hosted gallery is working.

## Historical source preparation · 2026-10-17

The initial public preparation preserved the received Chinese v5 scene, HTML and timeline byte for byte. Its selected gallery asset was a supplied 146.1-second production encode, rather than a newly rendered complete film. That preparation included dependency installation, a 4,382-frame default render plan, full procedural audio synthesis, a six-frame encode, selected late stills, tool error/resume checks and local gallery checks. The supplied v5 encode contained 4,383 frames because of its rounded ending.

Those results remain history; the old statement that the complete film had not been re-rendered does **not** describe the current v6 edition.

## Scientific limits

Render checks, the [physics checklist](../films/edl-gating/docs/physics_check.md) and the author's visual approval do not establish experimental accuracy, device reliability, learning effectiveness or independent scientific endorsement. The scene illustrates established concepts with hand-authored geometry, particle distributions and a schematic breakdown path. [Scientific scope](../films/edl-gating/docs/scientific-scope.md).
