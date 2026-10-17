# Sound Design and Event Cues

The film uses **synthesized music and effects without speech narration**. `audio/score.py` builds the score with NumPy/SciPy at 48 kHz stereo. The retained script does not load outside audio samples or invoke a music-generation API.

The v5 pulse is **104 BPM**. Earlier notes referred to 92 BPM; that is not the current `BPM` value. Music tempo is distinct from particle speed and caption-reading time.

## One timing map for picture and sound

`src/timeline.json` contains story-time sound events and the story-to-film mapping. The score's `F(s)` interpolation places events on the audio timeline. The visual program uses the inverse mapping.

All ranges below are **story coordinates**, not playback timestamps. The 0–102 s story maps to approximately 146.0508 s of film. Synthesis adds one second of audio tail; the encode governs delivered film length. Regenerate the timeline before rebuilding audio when captions or timing change. [Rendering instructions](rendering.md) describe the order.

## Musical arc

| Story range | Sound palette | Narrative job |
|---|---|---|
| 0–22 s | Soft harmonic bed, plucked pulse and a gradually established low beat | Establish the device and charge-control logic |
| 22–34 s | Receding pulse, rising noise and transition accents | Support extrusion and the electrolyte view |
| 34–60 s | Low drone, granular texture and sparse bells | Give the interface more space |
| 60–78 s | Pulse and bass return with greater rhythmic energy | Support the comparative task |
| 78–88 s | Tighter low pulses, dissonance and noise | Build tension for the failure illustration |
| 88–102 s | Reduced tension and harmonic resolution | Leave room for limitations and the final chain |

## Event cues

| Event | Synthesized response | Intention |
|---|---|---|
| Cross-section drawing | Short band-limited noise strokes | Give construction a tactile rhythm |
| Field and channel formation | Low hum, gathering texture and a threshold accent | Mark a state change without speech |
| Electron drift | Fine noise texture | Support motion without crowding the text |
| Extrusion into 3D | Broad whoosh and low-frequency movement | Connect depth to the transition |
| Ion redistribution and EDL formation | Granular ticks followed by a low paired accent | Distinguish motion from an established interface |
| Camera dive | Riser and arrival accent | Make scale change audible |
| Voltage comparison | Rising tones at different ranges | Reinforce voltage indicators |
| Defects and breakdown | Sparse crackles, short zap and heavier impact | Emphasize the schematic sequence |
| Flattening and ending | Settling sound and harmonic close | Return to the opening idea |

At selected impacts, the script lowers music beneath effects and adds a synthesized reverberation response. The packaging pipeline uses loudness normalization targeting −16 LUFS and a −1.5 dBTP ceiling. These are processing targets, rather than a claim that every historical encode was independently measured to match them.

The sounds are editorial cues, not recordings of ions, fields or a real breakdown event. They support explanation without serving as physical evidence.
