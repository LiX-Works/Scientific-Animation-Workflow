<p align="center"><a href="https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#film"><img src="../../site/assets/edl-interface.jpg" alt="The electrolyte interface, with ions on one side and induced channel electrons on the other" width="860"></a></p>

# Electric-double-layer gating

**How can a larger gate capacitance reach the same channel charge at a lower gate voltage?**

This 85-second film follows one transistor from a flat cross-section into its three-dimensional electrolyte interface, then returns to compare two gating schemes at the same target change in channel charge. It explains established device physics, not a new result.

**1:25 · 1080p / 30 fps · English graphics · Music and sound effects, no narration · Built with Three.js, with Grok Bot and Codex**

[Watch the film](https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#film) · [Download 1080p MP4](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/download/edl-v6/edl-gating-v6.mp4) · [Scientific scope](docs/scientific-scope.md)

## The mechanism

**Ion redistribution → closely separated interface charges → larger effective capacitance → less gate voltage for the same ΔQ.**

In a local, approximately capacitive comparison, **ΔQ ≈ C_eff ΔV_eff**. The film holds the target ΔQ fixed, so the difference in gate voltage is the question being asked.

## What EDL gating is, and what it is not

| A common assumption | What actually happens |
|---|---|
| A thick electrolyte means a weak coupling. | In `C = εA/d`, d is the effective separation of the interfacial charge layers, not the electrolyte's thickness. |
| Ions carry the channel current. | Ions set the interfacial charge distribution. Electronic carriers in the semiconductor carry the source–drain current. |
| Low gate voltage means a weak field. | A nanometer-scale charge-separation region can sustain a strong local field at a low external voltage. |
| A large interfacial capacitance sets the device's capacitance. | Both interfaces, the semiconductor's response and the voltage partition all matter. A nonlinear device may need differential capacitance, traps and quantum capacitance. |
| EDL gating makes a device more reliable. | Lower operating voltage may reduce risks tied to high gate voltage. It does not raise intrinsic breakdown strength, and electrochemical stability and source–drain failure remain separate limits. |

The film states these limits on screen. Sources and the full reasoning are in the [scientific scope](docs/scientific-scope.md), and the [physics checklist](docs/physics_check.md) lists the constraints any edit must keep.

## Design decisions

| Decision | Reason |
|---|---|
| **Compare the same target ΔQ.** | Equal current or equal voltage would bring in transport and other device properties. A fixed charge target isolates gate coupling. |
| **Keep one device through every scale.** | Recognizable electrodes, charges and boundaries connect the cross-section to the microscopic interface, so the close-up stays attached to the device. |
| **Keep gate cues and channel flow visually distinct.** | The gate controls carrier distribution and the source–drain bias drives transport. Field cues move downward along fixed paths and read as direction, not as charge crossing the dielectric. |
| **Cut away the electrolyte and mark the interface.** | The electrolyte hides the region the argument depends on. A front cutaway and an interface grid reveal it, and neither is presented as a physical layer. |
| **Let motion set the pace, with no narration.** | Continuous camera movement and grouped captions carry the explanation, so the viewer reads the device as it changes. |

## The technique: one continuous camera

| Property | How it works | Consequence |
|---|---|---|
| **Story time and playback time are separate** | Scene actions live on a 0–102 story coordinate, and `src/timeline.json` maps them onto 85 seconds | Tightening the pace changes the mapping. The score places its events through the same mapping, so sound follows. |
| **Frames are requested by time** | Time-driven Three.js scenes and DOM text expose `render(t)`, and Puppeteer captures each frame | A single still and the full 2,550-frame export use one path. |
| **Sound is synthesized** | NumPy/SciPy generate a 108 BPM score and event-driven effects, with no samples | The approved master measures about −14.0 LUFS and −1.2 dBTP. |

## Source

| Entry | Contents |
|---|---|
| [Scientific scope](docs/scientific-scope.md) | The physical chain, sources, and what the film does not claim |
| [Physics checklist](docs/physics_check.md) | Constraints to keep when editing |
| [Visual treatment](docs/treatment.md) | Continuity, color roles and materials |
| [Storyboard](docs/storyboard.md) | Playback times and explanatory sequence |
| [Sound design](docs/sound_cues.md) | Score, event cues and export level |
| [Rendering](docs/rendering.md) | Dependencies, checks and full export |
| [release.json](release.json) | Duration, frame count, size and SHA-256 |

**Credits:** concept, physical explanation and direction by the creator; implementation with Grok Bot and Codex; brief developed with a web-based GPT assistant. [Credits and references](docs/credits.md). **Reuse:** original code is MIT-licensed; original film, documentation and audio are offered under CC BY 4.0 where applicable rights exist. Attribute **Scientific Animation Workflow contributors**. Third-party components retain their own terms: [code license](../../LICENSE), [media/documentation license](../../docs/legal/LICENSE-MEDIA.md), [third-party notices](../../docs/legal/THIRD_PARTY_NOTICES.md).
