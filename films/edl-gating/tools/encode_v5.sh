#!/bin/sh
# Optional POSIX convenience wrapper. Windows: python tools/encode.py --variant all
exec "${PYTHON:-python3}" "$(dirname "$0")/encode.py" --variant all "$@"
