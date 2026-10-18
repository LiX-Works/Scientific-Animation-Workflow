# Electric Double-Layer Gating

**How a larger effective gate capacitance can reduce the voltage needed to control a transistor channel.**

This 2 min 26 s scientific animation follows a transistor from a flat cross-section into a three-dimensional interface, then compares conventional and electric double-layer (EDL) gating at the **same target change in channel charge**. The topic comes from a lecture in an undergraduate sensors course. The film was a self-directed project rather than an assignment, and explains established physics with Chinese on-screen text and a synthesized soundtrack. The gallery adds an optional English explanation track; it summarizes the scientific sequence rather than translating every graphic label.

[Watch the film](https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#film) · [Download MP4](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/download/edl-v5/edl-gating-v5.mp4) · [How it was made](docs/production-notes.md) · [Render or modify it](docs/rendering.md) · [Scientific scope](docs/scientific-scope.md)

## The idea in one minute

Ions rearrange near the electrolyte–semiconductor interface and form closely separated charge layers. A large effective capacitance can produce a given change in channel charge with a smaller effective voltage change: **ΔQ ≈ C_eff ΔV_eff**. This can reduce reliance on high gate-voltage operation. It does **not** demonstrate intrinsically stronger materials, weak local EDL fields, or immunity to breakdown.

Particle counts, distances and the breakdown sequence are explanatory constructions, not experimental data or a device-reliability simulation. [Read the assumptions and limits](docs/scientific-scope.md).

## What this case demonstrates

The human contributor chose the topic from a course lecture, organized the physical explanation, developed the creative brief with a web-based GPT assistant, and reviewed successive versions for clarity, pace, color and physical meaning. Grok Bot assisted with animation code, camera design, synthesized audio and rendering. The platform was announced to route tasks to back-end models including Claude Opus 5.5; the model used for each step is not visible in the production record.

The clearest example of human review is the crowded electrolyte scene: the contributor proposed removing the front third of the upper volume and adding an interface grid. The revised scene uses those cues to separate the ion layer from the channel. Other revisions addressed rendering flicker, a gap in the illustrated electron channel, excessive glare, color ambiguity and an overlong reading rhythm.

[See the feedback-to-change record](docs/production-notes.md#feedback-that-changed-the-film) · [Read selected production prompts](docs/prompts.md)

## From concept to film

1. **Define the physics.** Separate vertical gate control from lateral source–drain transport; keep the comparison at a common target charge.
2. **Build a continuous visual explanation.** Extrude the initial cross-section, enter the interface, then return to the complete device.
3. **Review meaning and presentation together.** Check charge signs and locations alongside depth cues, labels, timing and sound.
4. **Render from code.** Three.js and DOM text provide the images, Puppeteer captures frames, Python synthesizes audio, and FFmpeg encodes the result.

The source uses a **102-second story coordinate**, expanded by caption-reading intervals into **146.0508 seconds of film time**. The supplied 30 fps encodes contain 4,383 frames and run for **146.1 seconds**. Rendering only 102 seconds would omit the ending. [Reproduction instructions](docs/rendering.md) explain the current pipeline.

## Explore the project

| Entry | What to look for |
|---|---|
| [Production notes](docs/production-notes.md) | The rejected first approach, human decisions and v5 revisions |
| [Selected prompts](docs/prompts.md) | Short, edited translations of real briefs and review feedback |
| [Visual treatment](docs/treatment.md) | Spatial continuity, restrained language and the v5 palette |
| [Storyboard](docs/storyboard.md) | Story coordinates and approximate viewing times |
| [Sound design](docs/sound_cues.md) | Shared timeline, 104 BPM pulse and event-based synthesis |
| [Scientific scope](docs/scientific-scope.md) | What the comparison explains, and what it cannot establish |
| [Physics checklist](docs/physics_check.md) | Concrete checks for revising this animation |
| [Credits and references](docs/credits.md) | Roles, method references and source boundaries |

The **95.48 MB H.264/AAC copy** is the gallery and [Release](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v5) download: it preserves more fine detail than the smaller trial. It presents the supplied film at 1080p, 30 fps and 146.1 s. The original higher-bitrate encode is retained in the production archive; encoding options are not separate scientific versions.

**Reuse:** original code is MIT-licensed; original film, documentation and audio content are offered under CC BY 4.0 where applicable rights exist. Attribute **Scientific Animation Workflow contributors**. Third-party components retain their own terms; see the [code license](../../LICENSE), [media/documentation license](../../LICENSE-MEDIA.md) and [third-party notices](../../THIRD_PARTY_NOTICES.md).
