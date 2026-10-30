# Adding a case

Start with a concrete question and an audience. Create a descriptive directory under `films/`, and keep the source and tools for that case together. Each film can choose its own implementation: the [EDL case](../films/edl-gating/README.md) uses Three.js and Python, and the [MCP case](../films/mcp-explained/README.md) uses Remotion and Node.js.

A case is ready to present when a reader can find:

- **The film:** a representative image, viewing and download routes, duration and language.
- **The mechanism:** the question, the causal chain, and common assumptions the film corrects.
- **The decisions:** the choices that shaped the explanation, each with its reason.
- **The technique:** how the film is built, what that makes possible, and the tools used, including coding agents.
- **The limits:** assumptions, simplifications, and what is illustrative rather than measured.
- **The source:** installation and rendering commands, requirements, and the checks that were actually run.
- **The provenance:** references, third-party material and licenses.

Add a column to the table at the top of the [README](README.md), one short section, and a section in `site/gallery/index.html` once the video is ready. Publish the video as a GitHub Release, keep it out of Git, and add it to the Pages build in `.github/workflows/pages.yml`. Move a tool out of its case only when another case actually shares it.
