"""Normalize procedural audio and encode H.264/AAC MP4 from rendered frames."""
import argparse
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PROFILES = {'master': (None, '256k'), 'medium': (95, '192k'), 'viewing': (55, '192k'), 'preview': (22.5, '128k')}


def positive(value):
    value = float(value)
    if not math.isfinite(value) or value <= 0:
        raise argparse.ArgumentTypeError('must be a finite positive number')
    return value


def nonnegative(value):
    value = int(value)
    if value < 0:
        raise argparse.ArgumentTypeError('must be a nonnegative integer')
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frames', default='frames', help='Directory relative to the film folder, or absolute')
    parser.add_argument('--ext', choices=['jpg', 'png'], default='jpg')
    parser.add_argument('--audio', default='audio/mix.wav')
    parser.add_argument('--timeline', default='src/timeline.json')
    parser.add_argument('--fps', type=positive, default=30)
    parser.add_argument('--duration', type=positive, help='Film seconds to encode; default: timeline dur minus start time')
    parser.add_argument('--start-number', type=nonnegative, default=0, help='First frame number, matching render --from')
    parser.add_argument('--variant', choices=[*PROFILES, 'all'], default='medium')
    parser.add_argument('--out', help='Single output MP4; cannot be used with --variant all')
    parser.add_argument('--output-dir', default='output', help='Output folder for named variants; relative to the film folder')
    parser.add_argument('--ffmpeg', default=os.environ.get('FFMPEG', 'ffmpeg'))
    parser.add_argument('--force', action='store_true', help='Replace existing generated MP4 files')
    parser.add_argument('--plan', action='store_true', help='Validate inputs and print commands without running FFmpeg')
    args = parser.parse_args()
    if args.variant == 'all' and args.out:
        parser.error('--out is only available with a single variant')
    if args.fps > 240:
        parser.error('--fps must be at most 240')
    frames, audio = ROOT / args.frames, ROOT / args.audio
    if not frames.is_dir() or not audio.is_file():
        parser.error('Rendered frame directory and source audio must exist')
    try:
        duration = args.duration or float(json.loads((ROOT / args.timeline).read_text(encoding='utf-8'))['dur']) - args.start_number / args.fps
    except (OSError, ValueError, KeyError) as error:
        parser.error(f'Cannot read timeline: {error}')
    if not math.isfinite(duration) or duration <= 0:
        parser.error('Duration must be positive')
    count = math.ceil(duration * args.fps - 1e-9)
    for i in range(args.start_number, args.start_number + count):
        if not (frames / f'f{i:05d}.{args.ext}').is_file():
            parser.error(f'Missing frame f{i:05d}.{args.ext}; expected {count} consecutive frames')
    ffmpeg = shutil.which(args.ffmpeg)
    if not ffmpeg:
        parser.error('FFmpeg not found; install it or pass --ffmpeg /path/to/ffmpeg')
    variants = list(PROFILES) if args.variant == 'all' else [args.variant]
    reference_duration = None
    if any(PROFILES[variant][0] is not None for variant in variants):
        try:
            reference_duration = float(json.loads((ROOT / args.timeline).read_text(encoding='utf-8'))['dur'])
            if not math.isfinite(reference_duration) or reference_duration <= 0:
                raise ValueError('timeline duration must be positive and finite')
        except (OSError, ValueError, KeyError) as error:
            parser.error(f'Cannot read bitrate reference timeline: {error}')
    outputs = [(variant, ROOT / args.out if args.out else ROOT / args.output_dir / f'v5_{variant}.mp4') for variant in variants]
    for _, out in outputs:
        if out.exists() and not args.force:
            parser.error(f'Output exists: {out}; use --force to replace generated video')
    with tempfile.TemporaryDirectory(prefix='edl-encode-') as temporary:
        temp = Path(temporary)
        normalized = temp / 'normalized.wav'
        prefix = [ffmpeg, '-nostdin', '-hide_banner', '-loglevel', 'error']
        normalize = prefix + ['-n', '-i', str(audio), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', str(normalized)]
        commands = [normalize]
        for variant, out in outputs:
            target_mb, audio_rate = PROFILES[variant]
            # Frame numbering preserves film time; seek audio to the same time.
            inputs = ['-framerate', str(args.fps), '-start_number', str(args.start_number), '-i', str(frames / f'f%05d.{args.ext}')]
            audio_input = ['-ss', str(args.start_number / args.fps), '-i', str(normalized)]
            video = ['-frames:v', str(count), '-vf', 'scale=1920:1080:flags=lanczos', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-bf', '3']
            sound = ['-c:a', 'aac', '-b:a', audio_rate, '-t', str(count / args.fps), '-movflags', '+faststart']
            overwrite = '-y' if args.force else '-n'
            if target_mb is None:
                commands.append(prefix + [overwrite] + inputs + audio_input + video + ['-crf', '16', '-tune', 'film'] + sound + [str(out)])
            else:
                # Decimal MB budget for the complete film; a short smoke clip gets
                # the same target bitrate as the full film, not the full 55/95 MB.
                kbps = max(64, int((target_mb * 1e6 * 8 / reference_duration - int(audio_rate[:-1]) * 1000) / 1000))
                codec = video + ['-b:v', f'{kbps}k']
                passlog = str(temp / variant)
                commands.append(prefix + ['-y'] + inputs + codec + ['-pass', '1', '-passlogfile', passlog, '-an', '-f', 'null', os.devnull])
                commands.append(prefix + [overwrite] + inputs + audio_input + codec + ['-pass', '2', '-passlogfile', passlog] + sound + [str(out)])
        if args.plan:
            print(json.dumps({'frames': count, 'fps': args.fps, 'duration': count / args.fps, 'commands': commands}, indent=2))
            return
        for _, out in outputs:
            out.parent.mkdir(parents=True, exist_ok=True)
        for command in commands:
            subprocess.run(command, check=True)
        for variant, out in outputs:
            print(f'{variant}: {out} ({out.stat().st_size / 1e6:.2f} MB)')


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as error:
        raise SystemExit(f'FFmpeg failed with exit code {error.returncode}') from error
