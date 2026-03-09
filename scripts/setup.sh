#!/usr/bin/env bash
# One-command setup: install deps, copy WASM, env template, and MediaPipe model.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "==> Installing dependencies..."
npm install

echo "==> Copying WASM files..."
node scripts/copy-wasm.js

echo "==> Setting up environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "    Created .env.local from .env.example"
  echo "    Edit .env.local with your LiveKit credentials before running."
else
  echo "    .env.local already exists, skipping"
fi

echo "==> Downloading MediaPipe face model..."
MODEL_URL="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
MODEL_PATH="public/face_landmarker.task"
if [ ! -f "$MODEL_PATH" ]; then
  mkdir -p public
  curl -sSL "$MODEL_URL" -o "$MODEL_PATH"
  echo "    Downloaded face_landmarker.task"
else
  echo "    face_landmarker.task already exists, skipping"
fi

echo ""
echo "Setup complete. Next steps:"
echo "  1. Edit .env.local with your LiveKit credentials (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)"
echo "  2. Run: make run  (or npm run dev)"
echo "  3. Open http://localhost:3000"
echo ""
