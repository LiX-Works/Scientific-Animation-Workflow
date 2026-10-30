# From a question to an animated explanation

**Question → mechanism and limits → visual decisions → explicit time → checks → finished export.**

Two worked examples use this sequence: [Electric-double-layer gating](../films/edl-gating/README.md) and [MCP, Explained in Motion](../films/mcp-explained/README.md).

## 1. Write the mechanism and its limits

Start with what the viewer should be able to explain afterward. Write down the causal chain and the conditions under which it holds.

The EDL film rests on `ΔQ ≈ C_eff · ΔV_eff`, with the target charge held fixed. Its limits travel with it: low applied voltage can coexist with a strong local field, electrochemical stability still matters, and gate-related and source–drain failure need separate explanations. The MCP film separates two questions: how software can be controlled at all, and what a shared standard adds. Each film's scope document records its sources and simplifications.

## 2. Choose pictures that carry the argument

State what must remain spatially understandable, which event deserves emphasis, and how much reading the audience can do during motion. Ask what each shot explains. An effect that marks nothing competes with the explanation.

Choose examples for what they force into view. The MCP example needs a DOI from its first result, so the model has to read before it can act. The EDL film keeps one recognizable device across every scale, so the microscopic view stays attached to the transistor.

## 3. Make time explicit

Keep camera motion, object state, captions and sound events tied to explicit time, and fix random seeds. Then any frame can be rendered alone, in any order, on parallel workers. Frame history can still affect an image when the timing interface looks deterministic: the EDL production met a transparency-order problem that only appeared in parallel rendering, so verify directly rendered frames.

Then decide what sets the clock:

- **A story timeline.** The EDL film stages actions on a story coordinate and maps it to playback time. The pace changes by changing the mapping. This suits a film carried by motion and on-screen text.
- **The narration.** The MCP film takes character timestamps from its AI voice and names events after spoken words. Rewriting a line moves every later cue. This suits a narrated film whose script is still changing. See [Narration as the clock](../films/mcp-explained/docs/method.md).

## 4. Check what can be measured, and watch the rest

Frame sheets reveal layout and contrast. Clips reveal reading time, camera speed and sound alignment. Measurements settle what can be measured: duration, frame count, full-stream decoding, loudness, and how far a voice sits above the music on each line. Readable labels and a coherent explanation still need a person watching the actual encoded file.

Working with a coding agent makes this step central. An agent is reliable when it can check its own output, so build those checks into the pipeline, and have it read primary sources instead of relying on memory. Keep what it cannot perceive with a person: the explanation itself, how the film sounds, and whether each shot teaches anything.

## 5. Publish the film with its source and limits

For each case, publish the film, source, reproduction steps and scientific or technical scope, along with the tools used. See [Adding a case](adding-a-case.md).
