# Production Notes: Electric Double-Layer Gating

This case began with a topic from a lecture in an undergraduate sensors course: how electric double-layer gating can reduce the voltage needed to control a transistor channel, and how that relates to certain gate-related failure risks. The course did not require an animation. The contributor took up the topic as a self-directed exercise in AI-assisted scientific animation. The aim was to communicate known physics, rather than claim a new device principle.

The finished work is a collaboration between a human contributor and AI tools. The human role is visible in the scientific boundaries, the decision to restart, the visual brief and the review that shaped the film.

## The process in brief

**Organize the science → write a visual brief → inspect a first film → identify specific problems → revise code and timing → render and encode.**

Two decisions changed the result substantially. First, the contributor rejected a long, narration-led approach and requested a continuous visual journey from a flat diagram into a microscopic interface. Later, the contributor replaced general requests for polish with observations about occlusion, glare, missing particles and reading time.

## Why the first direction was abandoned

An early route produced a film of roughly 5 min 40 s at 16 fps, with speech narration. The contributor found the result too much like a sequence of presentation slides, with the spoken script determining when the images could move. A new brief asked for a separate work: about 1–3 minutes, sparse Chinese text, music and sound effects, and a continuous visual world.

The contributor deleted that first engineering project and associated early conversation to prevent the unwanted approach from shaping the restart. A rendered early film survived separately; the missing source and conversation were not reconstructed. This history explains the creative decision but cannot provide a reproducible source comparison for the deleted project.

## The new direction

The brief prioritized three things:

- **One spatial explanation.** A transistor cross-section gains depth; the camera enters its electrolyte interface, then returns to a full-device comparison.
- **A controlled comparison.** Both illustrations reach the same target channel-charge change while their required voltage indicators differ.
- **A restrained claim.** Lower required operating gate voltage may reduce dependence on high-voltage operation; it does not change a material's intrinsic breakdown strength.

Grok Bot generated a new Three.js scene, a DOM caption layer, a Python audio score and a browser-driven frame pipeline. A web-based GPT assistant helped the contributor organize the brief and coordinate feedback. The exported material names tools and services but does not establish the actual underlying conversational model.

## Version chronology

| Stage | What changed | Why it matters |
|---|---|---|
| Early narration-led film | Approximately 340 s, 16 fps; subsequently abandoned | Exposed the mismatch between a spoken lecture and the desired visual pace |
| New source project | A continuous device, 2D-to-3D transition, Chinese captions and synthesized audio | Changed the structure rather than shortening the old edit |
| Caption-reading revision | The 102 s story coordinate was stretched to roughly 176 s of viewing time | Made additional explanation readable, but increased duration |
| v4 rendering revision | Stable drawing order/bounds and supersampling addressed temporal flicker; separate quality encodes were produced | Distinguished scene rendering problems from compression softness |
| v5 review and revision | Cutaway and grid, new charge colors, calmer metal, channel continuity, stronger illustrative breakdown and faster middle/later passages | Produced a 146.1 s, 1080p, 30 fps film |
| Public source preparation | Portable rendering instructions, current documentation and playback checks | Makes the case easier to inspect and reproduce without publishing private records |

Version labels follow the surviving records. They do not imply that every intermediate source tree or exact render environment remains available.

## Feedback that changed the film

The feedback below comes from the contributor's supplied review text. The implementation descriptions are supported by the surviving v5 source and production notes; they are not measurements of learning effectiveness.

| Review observation or request | Recorded v5 response | Design lesson |
|---|---|---|
| A contact still flickered at the opening | A small depth offset separated overlapping surfaces, complementing the earlier draw-order fix | Check geometry and transparency before treating every flicker as an encoder issue |
| Blue channel particles had a visible gap | Electrons were distributed along the full illustrated channel with drift motion | A decorative gap can undermine the causal explanation |
| The upper plate looked excessively reflective | Lower metalness and greater roughness reduced glare | Materials should preserve structural readability |
| The macro electrolyte scene felt crowded | The front third was cut away, an interface grid was added, and the ion count was reduced | Occlusion and depth cues can be more useful than adding labels |
| Red/green ions needed a better palette; charge roles also needed separation | Cations became amber, anions green, and positive gate charges violet-gray; the legend was updated | Use role-specific colors and signs, rather than relying on color alone |
| Breakdown was too weak visually | A branching path, cracks, light pulse, camera emphasis and synthesized impact were added | Stronger emphasis needs a reminder that the sequence is schematic |
| The later film could be shorter and more energetic | Captions were tightened and later intervals accelerated; the pulse became 104 BPM | Preserve reading time selectively rather than speeding every particle equally |

These decisions explain the current film. They are not universal settings for every scientific animation.

## Two clocks keep sound and text aligned

The story coordinate ends at 102 s. The caption layer determines how much screen time each passage needs. The current reading estimate is `max(1.9, character_count / 5.8 + 0.5)` seconds, with additional timing rules for later scenes and the final limitations passage.

The exported story-to-film mapping also drives the audio score, so changing a caption can affect camera timing and sound-event placement. The current mapping ends at approximately 146.0508 s. The supplied film was rendered to 146.1 s, producing 4,383 frames at 30 fps; an automatic render of the exact authored duration can differ by a frame. Treating 102 as the final film duration would cut off the last 44 seconds.

See the [storyboard](storyboard.md), [sound notes](sound_cues.md) and [rendering instructions](rendering.md) for the relevant interfaces.

## What the open case preserves

The public case contains source, a concise production account, selected prompt excerpts and the scientific assumptions needed to interpret it. Complete conversations, private coordination material, temporary delivery links and machine logs are not part of the teaching narrative. Missing early material stays identified as missing.

The project does not claim that one prompt autonomously produced an ideal film, that the animations are measured device behavior, or that engineering notes amount to independent scientific validation. Its result is an inspectable example of explaining a physical mechanism through an iterative, code-driven process.
