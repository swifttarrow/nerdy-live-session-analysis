# Video Pipeline Deep Dive

**Subsystem:** Video ingestion, frame extraction, face detection, gaze estimation  
**Architecture:** Browser-first (confirmed)  
**Constraint priority:** Speed > Scale > Cost > Privacy

---

## 1. Pipeline Overview

```
getUserMedia (720p @ 30fps)
    │
    ▼
Frame sampling (1–2 fps for metrics)
    │
    ▼
MediaPipe Face Landmarker
    │
    ├── Face detection + 468 landmarks
    ├── Iris landmarks (478 total with iris)
    └── Output: landmarks, blendshapes, transform matrix
    │
    ▼
Gaze / eye contact derivation
    │
    ▼
Temporal smoothing (EMA / Kalman)
    │
    ▼
eye_contact_score (0–1)
```

---

## 2. Frame Capture Strategy

### Target: 1–2 Hz metric updates, <500 ms latency

| Approach | Pros | Cons |
|----------|------|------|
| **requestAnimationFrame** | Simple, 60 Hz | Syncs to display, not video; may process same frame twice or skip; blocks main thread |
| **requestVideoFrameCallback** | Syncs to actual video frames; more efficient | Chrome 83+, limited Safari support (check caniuse) |
| **Fixed interval (500–1000 ms)** | Predictable; 1–2 Hz exactly | May sample redundant frames; simpler |

**Recommendation:** Use `requestVideoFrameCallback` when available (Chrome, Edge); fallback to `requestAnimationFrame` with **frame skipping** (process every 15–30 frames at 30 fps → 1–2 Hz). Avoid processing every frame—MediaPipe `detect()` is synchronous and blocks.

### Latency budget (per frame)

| Stage | Target | Notes |
|-------|--------|-------|
| Frame capture | ~33 ms | 1 frame at 30 fps |
| Canvas/video element read | ~5 ms | getImageData or drawImage |
| MediaPipe inference | 20–50 ms | Face Landmarker on 720p; varies by device |
| Gaze derivation | <5 ms | Simple geometry |
| Smoothing | <1 ms | EMA |
| **Total per frame** | **60–95 ms** | Well under 500 ms |
| **Display + aggregation** | +50 ms | Render, metrics update |

**Bottleneck:** MediaPipe inference. If CPU-bound, consider:
- Downscale to 480p or 640×480 before inference (MediaPipe accepts various sizes)
- Run in Web Worker (see below)

---

## 3. MediaPipe Face Landmarker

### Configuration

```javascript
const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: path,  // face_landmarker.task
    delegate: "GPU"        // or "CPU"; GPU faster on supported devices
  },
  outputFaceBlendshapes: true,
  outputFacialTransformationMatrix: true,
  outputFaceBoundingBox: true,
  numFaces: 2,            // tutor + student if both in frame; else 1
  runningMode: "VIDEO",
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### Outputs used

| Output | Use |
|--------|-----|
| `faceLandmarks` | 468 3D points; includes iris (478 with iris) |
| `facialTransformationMatrix` | Head pose (4×4); useful for gaze |
| `faceBlendshapes` | Expression (optional; energy level, attention drift) |
| `faceBoundingBox` | Crop for efficiency; multi-face detection |

### Known issues

- **Blocking:** `detectForVideo()` is synchronous; blocks main thread. Use Web Worker for long-running sessions.
- **Iris quality:** Some reports that Face Landmarker iris is worse than legacy Face Mesh with `refine_landmarks=True`; monitor accuracy.
- **Multi-face:** `numFaces: 2` for tutor + student in same frame; requires assignment logic (e.g., left vs right, or by position).

---

## 4. Gaze / Eye Contact Derivation

**MediaPipe does not output gaze direction directly.** It provides landmarks; you derive "looking at camera" from geometry.

### Iris-based approach

- Iris landmarks: center of iris relative to eye corners.
- When looking at camera: iris centered in eye.
- When looking away: iris shifted toward direction of gaze.

**Simplified heuristic:**

1. Get left/right eye corner landmarks and iris center.
2. Compute iris position relative to eye bounding box (normalized 0–1).
3. "Looking at camera" ≈ iris near center (e.g., 0.4–0.6 in both x and y).
4. Score: `eye_contact_score = 1 - distance_from_center` (clamped 0–1).

### Head pose

- Use `facialTransformationMatrix` to extract yaw, pitch, roll.
- If head is turned >30° away, reduce eye contact score even if iris is centered.
- Combine: `score = max(0, iris_score - head_penalty)`.

### Calibration

- Optional: per-user calibration (capture 5 s "look at camera" vs "look away") to tune thresholds.
- MVP: use fixed thresholds; validate against labeled clips.

### Target accuracy

- PRD: ≥85% eye contact accuracy.
- Studies: 85–91% achievable with MediaPipe + webcam.
- Validate with 5–10 labeled clips before locking thresholds.

---

## 5. Temporal Smoothing

Raw per-frame scores are noisy. Use:

- **Exponential moving average:** `score_smooth = α * score_raw + (1-α) * score_smooth`; α ≈ 0.2–0.3.
- **Kalman filter:** Better for head movement; more complex.
- **Windowed average:** Last N frames; simple but adds latency.

**Recommendation:** EMA for MVP; Kalman if jitter is an issue.

---

## 6. Two Participants (Tutor + Student)

### Scenario A: Separate video feeds

- Each participant has own `getUserMedia` stream.
- Process each stream independently; no assignment needed.
- Metrics: `tutor.eye_contact_score`, `student.eye_contact_score`.

### Scenario B: Single feed (split screen or picture-in-picture)

- Use `numFaces: 2`; MediaPipe returns multiple faces.
- Assignment: by position (e.g., left = tutor, right = student) or by size (larger = tutor).
- Configurable; document assumption.

### Scenario C: Single participant (self-view)

- `numFaces: 1`; one score.
- MVP can start with single participant (tutor view only).

---

## 7. Graceful Degradation

| Condition | Behavior |
|-----------|----------|
| No face detected | Return last known score or 0; don't crash |
| Low confidence | Reduce weight in smoothing; or skip frame |
| Poor lighting | Lower detection confidence; show "Low quality" in UI |
| Dropped frames | Skip; next sample at next interval |
| Model load failure | Fallback: show "Analysis unavailable" |

---

## 8. Performance Optimizations

| Optimization | Impact |
|--------------|--------|
| Downscale before inference | 720p → 480p can halve inference time |
| GPU delegate | 2–3× faster on supported devices |
| Web Worker | Keeps main thread responsive; no frame drops |
| Sample at 1 Hz | Half the compute vs 2 Hz |
| Skip frames when no face | Reduce load when no one in frame |

---

## 9. Web Worker Strategy

MediaPipe `detectForVideo()` blocks. Options:

1. **Main thread:** Simpler; may cause jank if inference >16 ms.
2. **Web Worker:** Offload inference; use `OffscreenCanvas` + `VideoFrame` (transferable).
3. **Async:** MediaPipe JS doesn't support async detect; Worker is the only option.

**Implementation sketch:**

- Main thread: capture frame via `requestVideoFrameCallback` → draw to `OffscreenCanvas` → transfer to Worker.
- Worker: run Face Landmarker; post results back.
- Main thread: receive results; update metrics; render.

**Caveat:** `FaceLandmarker` in Worker may require separate build or `createFromOptions` in Worker context; verify MediaPipe Tasks Vision Worker support.

---

## 10. Resolution and Frame Rate

| Setting | Value | Rationale |
|---------|-------|------------|
| Capture resolution | 720p (1280×720) | PRD test scenario; sufficient for face |
| Analysis resolution | 480p or 640×480 | Faster inference; face still detectable |
| Capture fps | 30 | Standard webcam |
| Analysis fps | 1–2 | Matches metric update target |

---

## 11. Latency Budget Summary

| Stage | Budget | Cumulative |
|-------|--------|------------|
| Frame capture | 33 ms | 33 ms |
| Transfer to Worker (if used) | 5 ms | 38 ms |
| MediaPipe inference | 50 ms | 88 ms |
| Gaze derivation | 5 ms | 93 ms |
| Smoothing | 1 ms | 94 ms |
| Post to main thread | 5 ms | 99 ms |
| Metrics aggregation | 10 ms | 109 ms |
| Render | 16 ms | 125 ms |
| **Total** | | **~125 ms** |

Well under 500 ms target. Headroom for slower devices.

---

## 12. Testing Checklist

- [ ] Labeled clips: 5 "looking at camera" + 5 "looking away"; measure accuracy.
- [ ] Latency: instrument each stage; assert p95 < 500 ms.
- [ ] Frame rate: verify 1–2 Hz metric updates.
- [ ] No face: verify graceful degradation.
- [ ] Two faces: verify correct assignment.
- [ ] Low light: verify degradation or fallback.
- [ ] Safari/Firefox: verify `requestVideoFrameCallback` fallback.

---

## 13. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mediapipe/tasks-vision` | Latest | Face Landmarker |
| `face_landmarker.task` | Bundled | Model weights |

No additional CV dependencies for MVP.
