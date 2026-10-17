#!/bin/sh
# Optional POSIX wrapper; Node entry point also works on Windows.
exec node "$(dirname "$0")/serve.mjs" "$@"
