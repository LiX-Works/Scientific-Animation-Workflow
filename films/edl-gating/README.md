# Electric-double-layer gating

**A continuous journey from a transistor cross-section to its ionic interface—and why higher gate capacitance can mean lower operating voltage.**

The **85-second English film** moves from 2D into 3D, enters the charge layers, and compares conventional and electric-double-layer (EDL) gating at the **same target change in channel charge**. It explains established physics through code-driven images, music and sound effects, with no narration. The topic grew from a lecture in an undergraduate sensors course; the animation was a self-directed project.

[Watch the film](https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#film) · [Download 1080p MP4](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/download/edl-v6/edl-gating-v6.mp4) · [Production notes](docs/production-notes.md) · [Render or modify it](docs/rendering.md)

## The physical idea

Mobile ions rearrange near the electrolyte interfaces. Closely separated ionic and electronic charge layers can provide a large effective gate capacitance. In a local capacitive comparison, **ΔQ ≈ C_eff ΔV_eff**: the same change in channel charge can require a smaller effective voltage change.

Lower operating gate voltage can reduce reliance on high-voltage operation. It does **not** imply weak local interfacial fields, stronger dielectric material, or immunity to failure. Particle counts, dimensions and the breakdown path are explanatory constructions. [Scientific scope and limits](docs/scientific-scope.md).

## What this case demonstrates

- **Scientific framing:** distinguish vertical gate control from lateral source–drain transport and keep the comparison at a common target charge.
- **Visual explanation:** preserve device identity through a 2D-to-3D transition, a microscopic interface view and a return to the full device.
- **Iterative review:** turn comments about particle continuity, occlusion, glare, camera speed and sound into specific changes.
- **A reproducible source:** Three.js and DOM text generate frames, Python synthesizes sound, and FFmpeg encodes the result.

The human contributor chose the topic, organized the explanation, directed the visual treatment and selected revisions. Grok Bot assisted with the original implementation; a web-based GPT assistant helped develop the brief. Codex assisted with the English edition, motion and material revisions, sound, rendering and public source preparation. The records do not identify the underlying model for each original production step. [Credits](docs/credits.md).

## Explore the source

| Entry | Contents |
|---|---|
| [Production notes](docs/production-notes.md) | Decisions and revisions, including the original v5 history |
| [Storyboard](docs/storyboard.md) | Current playback times and explanatory sequence |
| [Visual treatment](docs/treatment.md) | Matte surfaces, depth cues, continuity and emphasis |
| [Sound design](docs/sound_cues.md) | Continuous 108 BPM score and synchronized effects |
| [Rendering](docs/rendering.md) | Dependencies, short checks and complete export |
| [Physics checklist](docs/physics_check.md) | Constraints to retain when editing |
| [Selected prompts](docs/prompts.md) | Edited excerpts from the original production brief |

The selected [v6 Release](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v6) contains a newly rendered **1920×1080, 30 fps, 85.000 s H.264/AAC film**: 2,550 frames and 111,879,725 bytes. [release.json](release.json) records its SHA-256 and media details. The previous [v5 Release](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/tag/edl-v5) preserves the longer Chinese edition.

**Reuse:** original code is MIT-licensed; original film, documentation and audio are offered under CC BY 4.0 where applicable rights exist. Attribute **Scientific Animation Workflow contributors**. Third-party components retain their own terms: [code license](../../LICENSE), [media/documentation license](../../LICENSE-MEDIA.md), [third-party notices](../../THIRD_PARTY_NOTICES.md).
