# Credits and References

## Contributions

| Contributor or tool | Role |
|---|---|
| Human project contributor | Selected the course topic; organized the physical explanation and its limits; set the creative direction; reviewed clarity, pacing, charge colors, spatial separation and the breakdown illustration; requested and selected revisions |
| Web-based GPT assistant | Helped formulate the brief and coordinate production requirements |
| Grok Bot | Assisted with scene and camera code, captions, synthesized music and effects, rendering and iterative production |
| Codex | Assisted with public source preparation, documentation, portability work and viewing-copy checks |

The project is credited as **Scientific Animation Workflow**. Personal identifying information and full private conversations are not included. Service names identify production roles; the surviving records do not establish the underlying model used by Grok Bot. Names in reference-repository titles are not evidence of the model that produced this film.

## Original project material

The scene, motion, typography and soundtrack are supplied as programmatic project material. The retained audio script synthesizes its score and effects with NumPy/SciPy and contains no external audio-file loader or music-model API call. The producer's handoff also describes the soundtrack as synthesized without outside samples. This is the recorded production chain, not an assertion of exclusive rights over an AI-generated style or every possible generated element.

Original code is offered under MIT; original film, audio content and documentation are offered under CC BY 4.0 to the extent applicable rights exist. Attribute **Scientific Animation Workflow contributors**, identify the material, link to the project and license, and indicate changes. Third-party components retain their own licenses; see the [code license](../../../LICENSE), [media/documentation license](../../../LICENSE-MEDIA.md) and [third-party notices](../../../THIRD_PARTY_NOTICES.md).

## Method references

The handoff records the following repositories and snapshots. These credits distinguish studying a method from distributing another project's implementation.

| Reference | Recorded snapshot | Relation to the case |
|---|---|---|
| [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar/tree/d33bdea74eeecde3922b0fbad227f0d3dc7afe75) | `d33bdea74eeecde3922b0fbad227f0d3dc7afe75` | Director/technique documents informed continuity, deterministic frames and coordinated sound; handoff records MIT |
| [onetake](https://github.com/feitangyuan/onetake/tree/415758128aa45cc54340df40d8109363447f582e) | `415758128aa45cc54340df40d8109363447f582e` | Continuous-motion and transition principles; handoff records PolyForm Noncommercial 1.0.0, which does not become MIT through this project |
| [Awesome Opus 5.5 Video Prompts](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/tree/7f731215e5efbce772caf49d8dd016f310a97377) | `7f731215e5efbce772caf49d8dd016f310a97377` | Director-toolkit and example references; handoff records CC BY 4.0 |
| [Opus 5.5 Video Prompts: Chinese collection](https://github.com/Reger-c/opus5.5-video-prompts/tree/7977c807781d4ba7c235247b8899a72575a30d00) | `7977c807781d4ba7c235247b8899a72575a30d00` | Included in the requested reference list; actual reading is not established; handoff records no repository license file |

The producer reported no whole-line matches between selected reference material and the film's main scene, audio and rendering scripts. Line matching is **not** a complete originality or license audit. No reference repository, its full prompt collection or its toolchain is bundled here; adding their code requires checking the relevant terms.

Four Bilibili videos were proposed as aesthetic references, but the production record reports failed retrieval and no viewing or audiovisual analysis. They appear separately in [the reference-access record](references_bilibili.md).

## Scientific background

The topic comes from course material and the contributor's physical brief. The explanation concerns established mechanisms, not a claimed invention. Two primary papers provide limited background support for the [scientific scope](scientific-scope.md):

- M. J. Panzer and C. D. Frisbie, [“Polymer Electrolyte-Gated Organic Field-Effect Transistors: Low-Voltage, High-Current Switches for Organic Electronics and Testbeds for Probing Electrical Transport at High Charge Carrier Density”](https://pubs.acs.org/doi/abs/10.1021/ja0708767), *Journal of the American Chemical Society* **129**, 6599–6607 (2007), DOI: `10.1021/ja0708767`.
- [“Impact of Large Gate Voltages and Ultrathin Polymer Electrolytes on Carrier Density in Electric-Double-Layer-Gated Two-Dimensional Crystal Transistors”](https://pubs.acs.org/doi/10.1021/acsami.2c13140), *ACS Applied Materials & Interfaces*, DOI: `10.1021/acsami.2c13140`.

These are contextual citations verified from publisher abstracts, not copied figures, bundled papers or a validation of the failure illustration.

## Software and typography

The stack comprises Three.js, Puppeteer/Chrome, FFmpeg, Python, NumPy and SciPy. The recorded font families are Noto Sans CJK SC, Noto Serif CJK SC, DejaVu Serif, DejaVu Sans and DejaVu Sans Mono. Font binaries, browser installations and dependency environments are not bundled as project assets. Refer to the [rendering instructions](rendering.md) and [third-party notices](../../../THIRD_PARTY_NOTICES.md) for their separate terms.
