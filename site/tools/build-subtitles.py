"""Build optional English captions from the current EDL film's explanation cards."""
import argparse
from bisect import bisect_right
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FILM = ROOT / 'films/edl-gating'


def plain_text(value):
    value = re.sub(r'<br\s*/?>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', '', value))


def stamp(seconds):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    secs, millis = divmod(remainder, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02}.{millis:03}'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=ROOT / 'gallery/edl-gating.en.vtt')
    args = parser.parse_args()
    timeline = json.loads((FILM / 'src/timeline.json').read_text(encoding='utf-8'))
    source = (FILM / 'src/film.js').read_text(encoding='utf-8')
    story, film = timeline['warp']['S'], timeline['warp']['T']

    def mapped(seconds):
        index = max(0, min(len(story) - 2, bisect_right(story, seconds) - 1))
        return film[index] + (seconds - story[index]) / (story[index + 1] - story[index]) * (film[index + 1] - film[index])

    # The approved film already has English artwork. Keep only its actual short
    # explanation cards, plus its opening title, limits and closing statement.
    # These boundaries lie outside the local comparison-speed transition.
    cards = re.findall(r"^cap\(([\d.]+),\s*([\d.]+),\s*'([^']*)'\);", source, re.M)
    if not cards:
        parser.error('No explanation cards found in the current film source')
    cues = [(.2, 4.4, 'Electric-double-layer gating')]
    cues.extend((float(start), float(end), plain_text(text)) for start, end, text in cards)
    limits = [
        'Strong interfacial fields remain.',
        'Intrinsic breakdown field: unchanged.',
        'Electrochemical stability still limits bias.',
    ]
    closing = 'Higher capacitance → lower gate voltage\nLess high-voltage stress for the same ΔQ.'
    if not all(text in source for text in limits) or closing.replace('\n', '<br>') not in source:
        parser.error('The film limits or closing statement changed; review caption wording')
    cues.extend([(89.8, 96.2, '\n'.join(limits)), (96.4, 102, closing)])
    cues.sort(key=lambda cue: cue[0])

    lines = [
        'WEBVTT', '',
        'NOTE Optional captions for the English showcase edition; no narration.',
        'The artwork is already in English. Enable captions only if useful.', '',
    ]
    previous_end = 0.0
    for index, (start, end, text) in enumerate(cues, 1):
        start, end = mapped(start), mapped(end)
        if not (previous_end <= start < end <= timeline['dur'] + 1e-6):
            parser.error(f'Invalid or overlapping cue {index}: {start}–{end}')
        previous_end = end
        lines.extend([str(index), f'{stamp(start)} --> {stamp(end)}', text, ''])
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print(f'Wrote {len(cues)} optional English captions to {args.out.name}; final cue ends at {stamp(previous_end)}.')


if __name__ == '__main__':
    main()
