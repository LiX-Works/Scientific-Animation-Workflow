#!/bin/sh
# Legacy positional interface: sh tools/mux.sh [fps] [frames_dir] [extra encode options]
FPS=${1:-30}
FRAMES=${2:-frames}
if [ "$#" -gt 0 ]; then shift; fi
if [ "$#" -gt 0 ]; then shift; fi
exec "${PYTHON:-python3}" "$(dirname "$0")/encode.py" --fps "$FPS" --frames "$FRAMES" --variant master --out output/final.mp4 "$@"
