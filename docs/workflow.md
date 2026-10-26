# From a scientific question to an animated explanation

The [EDL-gating film](../films/edl-gating/README.md) is the first worked example of this process. Its source code shows how the images and soundtrack were made; its production notes explain the decisions that made them easier to understand.

The reusable sequence is:

**Scientific question → mechanism and limits → visual brief → reviewed frames and clips → timed rendering and sound → finished export.**

## 1. Write the scientific brief

Start with what the viewer should be able to explain after watching. Specify the audience, the causal chain, and the assumptions behind the comparison.

For the EDL case, the central question is: **How can a larger effective gate capacitance reduce the voltage needed for a given change in channel charge?** The comparison holds the target charge change approximately constant:

`ΔQ ≈ C_eff · ΔV_eff`

The brief also carries the limits into the film: low applied gate voltage can coexist with a strong local interfacial field; electrochemical stability still matters; gate-related failure and source–drain failure require separate explanations. These constraints guide the pictures as well as the words. The scientific notes in the case distinguish the conceptual illustration from a quantitative device simulation.

For another subject, prepare the same three items: a question, a minimal explanatory chain, and the conditions under which that explanation applies.

## 2. Translate the brief into visual decisions

A visual brief gives the production system room to design while making success assessable. State what needs to remain spatially understandable, which event deserves emphasis, and how much reading the audience can do during motion.

The EDL brief called for a continuous journey from a flat transistor diagram into a three-dimensional interface. Keeping recognizable electrodes, charges, and boundaries across the transition helped connect the scales. Concise captions, formulas, music, and sound effects carried the explanation. The current edition uses English graphics. Removing the default dependence on narration gave the visual sequence more control over pacing.

These choices suit this film. Other topics may be clearer in two dimensions, with narration, or through deliberate cuts. Choose the form from the concept and the audience.

## 3. Turn review comments into visible changes

Review representative frames early, then watch short moving passages around transitions. A still reveals layout and contrast; a clip reveals flicker, reading time, camera speed, and sound alignment.

Examples from the EDL review:

| Observation | Documented response | Question to reuse |
|---|---|---|
| The channel appeared to contain a gap. | Restore visual continuity in the carrier distribution. | Does the drawing communicate the intended connected path? |
| The macroscopic ion layers overlapped visually. | Cut away part of the upper region and add an interface grid. | Can the viewer distinguish the regions before the close-up? |
| The upper plate was too reflective; the palette was hard to read. | Adjust the material and adopt amber, green, and muted purple-gray roles. | Do surface response and color help separate physical roles? |
| The breakdown event lacked emphasis. | Strengthen its visual and sound cues. | Is the event perceptible while remaining clearly schematic? |

Treat each change as a response to an observable problem. Keep a small before/after record and explain the tradeoff. Large effects still need a scientific reading: an animated breakdown path is an explanatory device, not a calculated failure prediction.

## 4. Make time explicit

The EDL implementation exposes `render(t)`: the renderer asks for a state at an explicit playback time and saves the corresponding frame. Its current timeline maps a 102-second story coordinate to an 85-second film. Rendering and sound generation must use the current exported mapping and the full playback duration, rather than an internal staging clock or an earlier edition's duration.

Keep camera motion, object state, captions, and sound events tied to explicit time. Fix any random seeds needed for repeatable generation. Verify that rendering a frame directly produces the expected state, including when frames are assigned to different workers. The EDL production history includes a transparency-order problem that became visible during parallel rendering; frame history can affect an image even when the timing interface looks deterministic.

Use a few full-resolution frames and short clips while adjusting the design. Once they are convincing, render the complete frame sequence, synthesize the soundtrack, and encode the film. The [case reproduction guide](../films/edl-gating/README.md) contains the implementation-specific commands and dependencies.

## 5. Watch the export as a viewer

Check the beginning, every major transition, and the ending in the actual encoded file. Read the captions at normal speed, listen for event alignment, and inspect fast motion, fine lines, particles, and gradients. Then watch the full film continuously to judge its explanation and rhythm.

Technical checks complement this review: expected duration and frame count, successful full-stream decoding, complete audio, and browser playback. A compression score measures differences from a reference file; readable labels and a coherent explanation still require visual judgment. Record which checks were completed and keep supplied footage distinct from newly rendered results.

## 6. Document the decisions and the collaboration

For each case, publish the final film, source, reproduction steps, scientific scope, and a concise account of the changes that mattered. A few selected prompts and review comments can make the production process concrete. Preserve their meaning and identify edited excerpts.

In the first case, the human contributor prepared the scientific material, set the creative direction, and reviewed the results. Grok Bot assisted with the original visual code, procedural audio and renders; a separate web GPT conversation assisted with planning and coordination. Codex assisted with the English edition, later motion/material/sound revisions, rendering and public preparation. The available records do not establish the underlying model for each original production step. The case documentation describes the observed division of work without assigning unsupported model credits.

New examples can follow this process while retaining their own tools and visual language. See [Adding a case](adding-a-case.md).
