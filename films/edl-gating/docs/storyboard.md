# Storyboard and timing

The current **English v6 edition runs for 85 seconds**, with 2,550 frames at 30 fps. Times below are playback times, rounded for navigation.

| Playback time | Explanatory beat | Visual continuity |
|---|---|---|
| 0:00–0:10 | Establish the cross-section, gate control and a conducting channel | Electrons flow continuously from source to drain; conventional current is shown separately |
| 0:10–0:16 | Reveal the device in three dimensions | One continuous accelerating rotation; the pale top and darker front/side faces make depth visible |
| 0:15–0:23 | Replace the dielectric illustration with an electrolyte | The gate, channel and interface remain recognizable as mobile ions appear |
| 0:23–0:30 | Rearrange ions at the interfaces | Anions gather near the gate, cations near the semiconductor; the potential profile emphasizes both interfaces |
| 0:30–0:37 | Enter the lower interface | Macro and magnified representations hand off during a continuous camera move |
| 0:37–0:47 | Inspect the closely separated charge layers | Ionic and electronic layers, an effective distance and a capacitance relation carry the explanation |
| 0:47–0:51 | Return to the complete device | The conventional reference appears for comparison |
| 0:51–1:02 | Compare a common target change in channel charge | The voltage indicators differ while the channel-charge parameter is shared |
| 1:02–1:13 | Illustrate high-field stress and breakdown | Defects and a branching path are schematic; the main sound/visual impact occurs at 1:10 |
| 1:13–1:21 | State the limits of the comparison | Strong local fields, unchanged intrinsic breakdown strength and electrochemical limits remain explicit |
| 1:21–1:25 | Return to the flat view and close | The final gate-charge row spans the gate; higher capacitance leads to lower voltage for the same target ΔQ |

The 3D reveal begins at **10.0 s**, with its main audio accent at **13.65 s**. The comparison's former 60–64 s passage is compressed smoothly into 60–62 s; subsequent events move two seconds earlier. The music continues across these transitions.

## Editing the timing

The source retains a **0–102 story coordinate** for scene actions. `src/timeline.json` exports the current story-to-playback mapping and its 85-second duration. The visual implementation also retains an internal 87-second staging clock, wrapped by an editorial adjustment. Render using **playback seconds** through `window.render(t)` and `window.DUR`; neither 102 nor 87 is the output duration.

The original v5 edition ran for 146.1 seconds with Chinese graphics and a 104 BPM score. Those figures do not apply to the current render plan.

See [rendering](rendering.md), [sound design](sound_cues.md) and [scientific scope](scientific-scope.md).
