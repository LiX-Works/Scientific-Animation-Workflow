"""Build English explanation subtitles from the EDL film's story-to-film time mapping."""
from bisect import bisect_right
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
timeline = json.loads((ROOT / 'films/edl-gating/src/timeline.json').read_text(encoding='utf-8'))
story, film = timeline['warp']['S'], timeline['warp']['T']


def mapped(seconds):
    index = max(0, min(len(story) - 2, bisect_right(story, seconds) - 1))
    return film[index] + (seconds - story[index]) / (story[index + 1] - story[index]) * (film[index + 1] - film[index])


def stamp(seconds):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    secs, millis = divmod(remainder, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02}.{millis:03}'


# Concise translations of the film's explanation cards, with its illustrative limits retained.
# Component labels remain in the original Chinese artwork.
cues = [
    (.6, 3.9, 'Electric-double-layer gating\nWhy can the same channel control need a lower gate voltage?'),
    (4.4, 7, 'Gate voltage creates a field through the gate dielectric.'),
    (7, 10, 'Holes move away; electrons enter the surface region from source and drain.'),
    (10, 12, 'Above threshold, an electron inversion layer forms a conducting channel.'),
    (12, 14.6, 'With source–drain bias: electrons move S → D; conventional current flows D → S.'),
    (14.6, 17.2, 'Gate voltage controls the channel; source–drain voltage drives transport.'),
    (17.2, 19.4, 'Opposite gate and channel charges, separated by a dielectric: a capacitor.'),
    (19.4, 22.4, 'Q = CV. In the parallel-plate picture, C = εA/d: smaller separation, larger capacitance.'),
    (22.4, 25.4, 'For the same induced charge change: ΔV = ΔQ/C.'),
    (25.4, 28.4, 'A larger effective gate capacitance means less voltage is needed.'),
    (28.4, 31.4, 'Replace the solid gate dielectric with an ionic liquid or ion gel.'),
    (31.4, 34.6, 'Positive and negative ions can move. The unbiased electrolyte is approximately neutral.'),
    (34.6, 37.6, 'Bias redistributes ions: anions approach the gate; cations approach the semiconductor.'),
    (37.6, 40.6, 'Cations stay on the electrolyte side, with induced electrons on the semiconductor side.'),
    (40.6, 44, 'The bulk is approximately neutral; voltage drops mainly across the two interfaces.'),
    (44, 50.4, 'Zoom into the semiconductor–electrolyte interface.'),
    (50.4, 53, 'The illustrated cation and electron layers are separated by about 1 nm.'),
    (53, 55.4, 'Here d is an effective charge-separation distance, not the electrolyte thickness.'),
    (55.4, 57.6, 'Very small charge separation can give a large capacitance per unit area.'),
    (57.6, 60.4, 'The ion layer acts like an effective gate charge layer close to the channel.'),
    (60.4, 64, 'Return to device scale and compare the two gate-control schemes.'),
    (64, 67, 'Use the same target: induce the same change in channel charge, ΔQ.'),
    (67, 70.6, 'Both channels accumulate charge together, but need different gate voltages.'),
    (70.6, 74, 'ΔV = ΔQ/C. With a larger effective capacitance, EDL gating needs less voltage.'),
    (74, 78, 'Illustrative example only: 100× capacitance would need 1/100 of the voltage change.'),
    (78, 81, 'For a fixed solid dielectric thickness, E ≈ V/d: higher voltage gives a stronger field.'),
    (81, 85, 'Prolonged high-field stress can lead to defects, leakage, and insulation degradation.'),
    (85, 87.4, 'A connected defect path illustrates gate-dielectric breakdown.'),
    (87.4, 89.8, 'Lower gate-voltage operation reduces reliance on high voltage and related failure risks.'),
    (89.8, 96.2, 'Limits: local interface fields can remain strong; intrinsic breakdown strength is not raised.\nElectrochemical stability still matters. Source–drain high-field and heating failures remain possible.'),
    (97, 102, 'Ion redistribution → EDL → larger effective gate capacitance\n→ less gate voltage for the same ΔQ → reduced reliance on high-voltage operation.'),
]
lines = ['WEBVTT', '', 'NOTE English explanation-card translations. Original component labels remain in Chinese.', '']
for index, (start, end, text) in enumerate(cues, 1):
    lines.extend([str(index), f'{stamp(mapped(start))} --> {stamp(mapped(end))} line:5% position:50% size:92% align:center', text, ''])
destination = ROOT / 'gallery/edl-gating.en.vtt'
destination.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {len(cues)} explanation cues to {destination.name}.')
