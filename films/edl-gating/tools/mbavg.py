"""Average render.mjs --mb PNG subframes in approximate linear-light space.
Source subframes are preserved. This is optional temporal sampling, not a change
to the animation model. Use a fresh directory for every sampling configuration.
"""
import argparse
from pathlib import Path
import re
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('directory', type=Path)
parser.add_argument('--samples', type=int, help='Expected --mb count; otherwise inferred across all groups')
parser.add_argument('--force', action='store_true', help='Replace existing averaged JPEG files')
args = parser.parse_args()
groups = {}
for file in args.directory.glob('*_s*.png'):
    match = re.fullmatch(r'(.+)_s(\d+)\.png', file.name)
    if match:
        groups.setdefault(match[1], {})[int(match[2])] = file
if not groups:
    parser.error('No motion-blur subframes found')
expected = args.samples if args.samples is not None else max(max(g) for g in groups.values()) + 1
if expected < 2:
    parser.error('At least two subframes per group are required')
for base, group in groups.items():
    if set(group) != set(range(expected)):
        parser.error(f'{base}: expected subframes 0..{expected - 1}, got {sorted(group)}')
    if (args.directory / f'{base}.jpg').exists() and not args.force:
        parser.error(f'{base}.jpg exists; use --force or a fresh directory')
for base, group in sorted(groups.items()):
    arrays = []
    for index in range(expected):
        with Image.open(group[index]) as image:
            arrays.append((np.asarray(image.convert('RGB'), dtype=np.float32) / 255) ** 2.2)
    if any(image.shape != arrays[0].shape for image in arrays):
        parser.error(f'{base}: subframe dimensions differ')
    averaged = sum(arrays) / expected
    output = np.clip(averaged ** (1 / 2.2) * 255 + .5, 0, 255).astype(np.uint8)
    with (args.directory / f'{base}.jpg').open('wb' if args.force else 'xb') as destination:
        Image.fromarray(output).save(destination, format='JPEG', quality=96)
print('Averaged', len(groups), 'groups; source subframes preserved')
