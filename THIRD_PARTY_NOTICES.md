# Third-party software and references

Project code is MIT; original media and written material are CC BY 4.0. Dependencies and referenced works retain their own terms.

## Rendering and audio dependencies

| Component | Version or role | License and source |
| --- | --- | --- |
| Three.js | 0.170.0, scene rendering | [MIT, r170](https://github.com/mrdoob/three.js/blob/r170/LICENSE) |
| puppeteer-core | 23.11.1, browser capture | [Apache-2.0](https://github.com/puppeteer/puppeteer/blob/puppeteer-core-v23.11.1/LICENSE) |
| NumPy | Audio synthesis | [BSD-3-Clause](https://numpy.org/doc/stable/license.html) |
| SciPy | Filters and convolution | [BSD-3-Clause](https://scipy.org/about/) |
| Pillow | Image processing tools | [HPND and included notices](https://github.com/python-pillow/Pillow/blob/main/LICENSE) |
| FFmpeg | Normalization and encoding | [Build-dependent LGPL/GPL terms](https://ffmpeg.org/legal.html) |
| Chrome or Chromium | Browser rendering | Install separately; [Chromium licenses](https://www.chromium.org/chromium-projects/) and the chosen browser's terms apply |
| Noto CJK | Chinese text | [SIL OFL 1.1](https://github.com/notofonts/noto-cjk/blob/main/LICENSE) |
| DejaVu | Latin text and symbols | [DejaVu/Bitstream Vera notices](https://dejavu-fonts.github.io/License.html) |

Browser binaries, fonts, dependency environments and third-party music samples are not distributed in this source tree. Generated film sound is provided by the included synthesis program; the production handoff identifies it as the source of the delivered soundtrack.

## Production-method references

The EDL production handoff identifies these repositories as references. The pinned revisions record that handoff's reference context. They are not runtime dependencies or a claim that every feature or example was used.

| Reference | Revision | Stated role and terms |
| --- | --- | --- |
| [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | [`d33bdea`](https://github.com/lemomo-ai/lemo-opuscar/tree/d33bdea74eeecde3922b0fbad227f0d3dc7afe75) | Director/technical methods; [MIT](https://github.com/lemomo-ai/lemo-opuscar/blob/d33bdea74eeecde3922b0fbad227f0d3dc7afe75/LICENSE) |
| [onetake](https://github.com/feitangyuan/onetake) | [`4157581`](https://github.com/feitangyuan/onetake/tree/415758128aa45cc54340df40d8109363447f582e) | Continuous motion and time-based composition; [PolyForm Noncommercial 1.0.0](https://github.com/feitangyuan/onetake/blob/415758128aa45cc54340df40d8109363447f582e/LICENSE) |
| [Awesome Opus Video Prompts](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts) | [`7f73121`](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/tree/7f731215e5efbce772caf49d8dd016f310a97377) | Prompt and director-method reference; CC BY 4.0 as recorded in the handoff |
| [Chinese prompt collection](https://github.com/Reger-c/opus5.5-video-prompts) | [`7977c80`](https://github.com/Reger-c/opus5.5-video-prompts/tree/7977c807781d4ba7c235247b8899a72575a30d00) | Suggested during planning; actual use was not established; no license recorded in the handoff |

Reference repositories are linked rather than bundled. Their licenses are not replaced by this project's licenses. In particular, the MIT notice here does not grant permission to redistribute onetake code commercially. The producer described method inspiration; an absence of identical whole lines is not proof of independent implementation.

Four Bilibili examples were proposed during planning but could not be accessed in the production environment. They are not presented as analyzed sources; the [case reference note](films/edl-gating/docs/references_bilibili.md) preserves that distinction.
