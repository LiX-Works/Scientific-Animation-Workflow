# Production Notes: Electric Double-Layer Gating

This case began with a topic from a lecture in an undergraduate sensors course: how electric double-layer gating can reduce the voltage needed to control a transistor channel, and how that relates to certain gate-related failure risks. The course did not require an animation. The contributor took up the topic as a self-directed exercise in AI-assisted scientific animation. The aim was to communicate known physics, rather than claim a new device principle.

The current release is the **85-second English v6 edition**, newly rendered at 1080p and 30 fps. The work combines human scientific framing and visual direction with AI-assisted implementation. Earlier Chinese versions remain part of its production history.

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
| Initial public source preparation, 2026-10-17 | Portable rendering instructions, documentation and playback checks for the Chinese v5 edition | Made the supplied production source easier to inspect without publishing private records |
| English showcase revision, 2026-10-24–25 | English graphics; shorter grouped explanations; continuous electron drift; a coordinated 10-second dimensional reveal; matte surfaces and stronger face contrast; revised later camera movement and sound | Refocused the film for viewers who already know the basic device physics |
| Public v6, 2026-10-25 | The approved 85-second edition rendered in full at 1080p/30 fps, with a complete closing gate-charge row | Provides the current film and matching editable source |

Version labels follow the surviving records. They do not imply that every intermediate source tree or exact render environment remains available.

## Feedback that changed the film

The table below records **historical v5 revisions** from the contributor's supplied review text. These are not measurements of learning effectiveness.

| Review observation or request | Recorded v5 response | Design lesson |
|---|---|---|
| A contact still flickered at the opening | A small depth offset separated overlapping surfaces, complementing the earlier draw-order fix | Check geometry and transparency before treating every flicker as an encoder issue |
| Blue channel particles had a visible gap | Electrons were distributed along the full illustrated channel with drift motion | A decorative gap can undermine the causal explanation |
| The upper plate looked excessively reflective | Lower metalness and greater roughness reduced glare | Materials should preserve structural readability |
| The macro electrolyte scene felt crowded | The front third was cut away, an interface grid was added, and the ion count was reduced | Occlusion and depth cues can be more useful than adding labels |
| Red/green ions needed a better palette; charge roles also needed separation | Cations became amber, anions green, and positive gate charges violet-gray; the legend was updated | Use role-specific colors and signs, rather than relying on color alone |
| Breakdown was too weak visually | A branching path, cracks, light pulse, camera emphasis and synthesized impact were added | Stronger emphasis needs a reminder that the sequence is schematic |
| The later film could be shorter and more energetic | Captions were tightened and later intervals accelerated; the pulse became 104 BPM | Preserve reading time selectively rather than speeding every particle equally |

These decisions established the original film. They are not universal settings for every scientific animation.

## The English v6 review

The next review concentrated on the actual moving image. An initially over-fast opening was rejected. The selected version begins its dimensional reveal around 10 seconds, accelerates continuously, and uses a pale top with darker front and right faces. Matte surfaces and fine edges preserve depth without the glare or heavy blue outlines rejected during review.

Channel electrons now drift continuously from source to drain. Staggered downward cues make electric-field direction readable without implying charge flow through the dielectric. The electrolyte's unwanted rectangular outline is removed while the interface grid remains. Later camera passages, the comparison and the ending were tightened without turning the film into a sequence of separate cards.

The score was revised to a continuous 108 BPM arrangement. The accepted final mix raises the musical bus by 2 dB relative to the preceding review, restores a longer low-frequency breakdown tail, and places the main breakdown cue at 70 seconds. The comparison pause was shortened by two seconds. A final narrow fix completes the purple gate-charge row across the closing flat view.

Codex assisted with these source, language, audio and rendering revisions under the contributor's review. The final export contains 2,550 native 1080p frames and runs for 85.000 seconds. The [release manifest](../release.json) identifies the selected file; the [validation note](../../../docs/validation.md) separates render checks from scientific claims.

## Two clocks keep sound and text aligned

Scene actions retain a 102-second story coordinate, but this is not the playback duration. The current exported timeline maps those actions into **85 seconds**. The renderer uses the live playback interface, and the score uses the exported timeline. The internal 87-second staging clock and its final two-second editorial adjustment are handled by that interface.

In the historical v5 edition, a reading-time estimate expanded the same story coordinate to approximately 146.0508 seconds, and the delivered encode ran for 146.1 seconds. That reading-time rule does not describe the current English edit. When revising the source, regenerate its timeline and audio rather than using the length of an earlier edition.

See the [storyboard](storyboard.md), [sound notes](sound_cues.md) and [rendering instructions](rendering.md) for the relevant interfaces.

## What the open case preserves

The public case contains source, a concise production account, selected prompt excerpts and the scientific assumptions needed to interpret it. Complete conversations, private coordination material, temporary delivery links and machine logs are not part of the teaching narrative. Missing early material stays identified as missing.

The project does not claim that one prompt autonomously produced an ideal film, that the animations are measured device behavior, or that engineering notes amount to independent scientific validation. Its result is an inspectable example of explaining a physical mechanism through an iterative, code-driven process.
