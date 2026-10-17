# Adding another scientific animation

Start with a concrete explanatory question and an audience. Device physics, sensors, applications, and other scientific topics can share this collection; each film can carry the topic labels that fit its content.

Create a descriptive directory under `films/`. Keep the source and tools needed by that case together. The [EDL-gating case](../films/edl-gating/README.md) is an example of the expected documentation, while its Three.js and Python implementation is a choice made for that film.

A case is ready to present when a reader can find:

- **The film:** a representative image, viewing/download route, duration, and language.
- **The explanation:** the scientific question, the mechanism shown, and the assumptions or visual simplifications.
- **The work:** the human and AI roles, a few consequential iterations, and selected evidence of the design decisions.
- **The source:** installation and rendering commands, environment and font requirements, generated outputs, and the scope of completed verification.
- **The provenance:** scientific and creative references, third-party material, and the applicable licenses.

Write the case opening so someone can understand the contribution in a minute. Put long prompts, implementation details, and reproduction commands in linked sections or supporting files. Use public project identifiers and curated excerpts; keep private source conversations outside the repository.

Add one concise entry to the root README and one gallery entry when the viewing asset is ready. Reuse a tool across cases when its inputs and behavior are actually shared; until then, retain the working implementation in its case. Update the [shared workflow](workflow.md) when a new example teaches a useful method or exposes a limitation.
