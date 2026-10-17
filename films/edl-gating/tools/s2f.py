"""Map comma-separated story times to film times using the exported warp."""
import argparse
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('times', help='For example: 40,83')
parser.add_argument('--timeline', default='src/timeline.json')
args = parser.parse_args()
data = json.loads((ROOT / args.timeline).read_text(encoding='utf-8'))
try:
    times = [float(value) for value in args.times.split(',')]
except ValueError:
    parser.error('Expected comma-separated numeric story times')
if any(not np.isfinite(t) or t < data['warp']['S'][0] or t > data['warp']['S'][-1] for t in times):
    parser.error('Time is outside the story timeline')
print(','.join(f'{np.interp(t, data["warp"]["S"], data["warp"]["T"]):.6f}' for t in times))
