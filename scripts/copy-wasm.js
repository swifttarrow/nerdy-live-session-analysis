#!/usr/bin/env node
/**
 * Copy ONNX Runtime WASM files and VAD assets to public/ for browser use.
 * Also downloads the MediaPipe face_landmarker model if missing.
 *
 * Required by:
 * - @ricky0123/vad-web (onnxruntime-web WASM, vad worklet, silero model)
 * - @mediapipe/tasks-vision (face_landmarker.task model)
 */
const fs = require("fs");
const path = require("path");

const dest = path.join(__dirname, "../public");
if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

// ─── 1. ONNX Runtime WASM ─────────────────────────────────────────────────
const ortSrc = path.join(__dirname, "../node_modules/onnxruntime-web/dist");
if (fs.existsSync(ortSrc)) {
  const wasmFiles = fs.readdirSync(ortSrc).filter((f) => f.endsWith(".wasm"));
  for (const file of wasmFiles) {
    fs.copyFileSync(path.join(ortSrc, file), path.join(dest, file));
    console.log(`Copied ${file} → public/${file}`);
  }
} else {
  console.warn("onnxruntime-web not found — skipping WASM copy.");
}

// ─── 2. VAD worklet and model ──────────────────────────────────────────────
const vadDist = path.join(__dirname, "../node_modules/@ricky0123/vad-web/dist");
if (fs.existsSync(vadDist)) {
  const vadFiles = fs.readdirSync(vadDist).filter((f) => f.endsWith(".js") || f.endsWith(".wasm") || f.endsWith(".onnx"));
  for (const file of vadFiles) {
    fs.copyFileSync(path.join(vadDist, file), path.join(dest, file));
    console.log(`Copied ${file} → public/${file}`);
  }
}

// ─── 3. MediaPipe face_landmarker model ────────────────────────────────────
const faceModelPath = path.join(dest, "face_landmarker.task");
const faceModelUrl =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

if (fs.existsSync(faceModelPath)) {
  console.log("face_landmarker.task already exists, skipping download");
} else {
  try {
    const { execSync } = require("child_process");
    execSync(`curl -sfSL "${faceModelUrl}" -o "${faceModelPath}"`, {
      stdio: "pipe",
    });
    console.log("Downloaded face_landmarker.task → public/");
  } catch (err) {
    console.warn("Could not download face_landmarker.task:", err.message);
    console.warn("App will fall back to CDN at runtime.");
  }
}

console.log("Asset setup complete.");
