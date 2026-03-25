#!/bin/zsh

cd "$(dirname "$0")" || exit 1

(
  cd ../backend || exit 1
  npm run dev
) &
BACKEND_PID=$!

npm run dev &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
}

trap cleanup INT TERM EXIT

wait "$BACKEND_PID" "$FRONTEND_PID"
