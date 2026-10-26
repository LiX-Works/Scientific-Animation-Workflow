# Sound design and event cues

The English v6 edition uses **synthesized music and effects without narration**. `audio/score.py` generates 85 seconds of 48 kHz stereo audio with NumPy/SciPy. It loads no external audio samples and calls no music-generation API.

The score has a continuous **108 BPM** grid. Tempo is independent of particle speed and camera motion. The musical bus is raised by **2 dB** relative to the earlier English review arrangement; transition effects are not all raised with it.

## Picture and sound share a timeline

`src/timeline.json` contains the 0–102 story-coordinate events and their mapping to the **85-second playback timeline**. The score's `F(s)` interpolation places these events in the mix. Regenerate the timeline before rebuilding audio after a timing change. The visual program's internal staging clock is not the output duration.

| Playback time | Musical or sound role |
|---|---|
| 0–10 s | Soft harmony, plucked pulse and a restrained low beat establish the device |
| 10–16 s | A gradual low-frequency build supports the dimensional reveal; one main accent lands at 13.65 s |
| 15–30 s | The pulse continues beneath the electrolyte transition and ion redistribution |
| 30–47 s | A scale-change cue leads into a quieter, textured interface passage |
| 47–62 s | Pulse and bass support the return to the device and the voltage comparison |
| 62–75 s | Tension builds toward the schematic breakdown at 70 s, then settles |
| 75–85 s | Reduced tension and harmonic resolution leave room for the limits and closing statement |

## Event cues

Construction uses short filtered-noise strokes. Field/channel formation receives low gathering textures; drift uses a fine noise layer. Dimensional and scale transitions use broad sweeps and low movement. Ion redistribution and interface formation receive granular ticks and paired accents. The voltage comparison uses rising tones at different ranges.

The breakdown cue restores the original film's three-layer construction at levels suited to this arrangement:

- **1.4 s crackle**, with filtered noise and a decaying envelope.
- **1.2 s downward bass impact**.
- **3.5 s low-frequency tail**, beginning 20 ms after impact, followed by quieter reverberation.

This restores the construction and decay character of the original cue; it does not copy an old full soundtrack or reproduce the historical waveform byte for byte. Music is ducked around major impacts and continues underneath their tails.

## Export level

Normalize the complete raw mix **once**, targeting **−14 LUFS** with a **−1 dBTP processing ceiling**, then reuse that normalized master when encoding variants or excerpts. The approved final AAC measured approximately **−14.0 LUFS and −1.2 dBTP**. Targets and measured encode levels are different quantities; do not normalize an already approved master a second time.

The original Chinese v5 film used 104 BPM and a different reading-time arrangement. Those settings are historical. [Rendering instructions](rendering.md) describe the current pipeline.

These sounds are editorial cues, not recordings or acoustic predictions of ions, fields or a physical breakdown event.
