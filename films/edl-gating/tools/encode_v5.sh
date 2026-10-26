#!/bin/sh
# Optional POSIX convenience wrapper. Windows: python tools/encode.py --variant all
# Historical filename retained; this invokes the current encoder profiles.
exec "${PYTHON:-python3}" "$(dirname "$0")/encode.py" --variant all "$@"
