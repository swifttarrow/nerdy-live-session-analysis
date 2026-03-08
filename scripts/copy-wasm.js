#!/usr/bin/env node
/**
 * Copy ONNX Runtime WASM files to public/ so they can be served to the browser.
 * Required by @ricky0123/vad-web which depends on onnxruntime-web.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../node_modules/onnxruntime-web/dist");
const dest = path.join(__dirname, "../public");

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

if (!fs.existsSync(src)) {
  console.warn("onnxruntime-web not found — skipping WASM copy.");
  process.exit(0);
}

const wasmFiles = fs.readdirSync(src).filter((f) => f.endsWith(".wasm"));
for (const file of wasmFiles) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  console.log(`Copied ${file} → public/${file}`);
}

// Also copy the vad worklet JS if present
const vadDist = path.join(__dirname, "../node_modules/@ricky0123/vad-web/dist");
if (fs.existsSync(vadDist)) {
  const vadFiles = fs.readdirSync(vadDist).filter((f) => f.endsWith(".js") || f.endsWith(".wasm") || f.endsWith(".onnx"));
  for (const file of vadFiles) {
    fs.copyFileSync(path.join(vadDist, file), path.join(dest, file));
    console.log(`Copied ${file} → public/${file}`);
  }
}

console.log("WASM copy complete.");
