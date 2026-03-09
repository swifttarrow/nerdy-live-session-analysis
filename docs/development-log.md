# Development Log — SessionLens

*1-page development log per PRD submission requirements.*

---

## Timeline Summary

| Phase | Milestones | Key Output |
|-------|-----------|-----------|
| Pre-Search | Architecture research, constraint analysis | Stack decision: LiveKit + MediaPipe + Silero VAD |
| MVP (M1–M7) | Project setup → deployment | Working pipeline, coaching engine, post-session report |
| Post-MVP Audio (M8–M10) | Interruptions, classification, 3rd triggers | Interruption detection, hesitation and spike triggers |
| Post-MVP Metrics (M11–M12) | Energy level, attention drift | Voice RMS + expression energy; sustained drift detection |
| Testing & QA (M13–M15) | Test expansion, labeled clips, latency | 147 tests; p95 E2E <90 ms measured |
| Documentation (M16–M20) | AI costs, architecture, dev log, privacy | Submission-ready documentation |

---

## Key Decisions & Rationale

**LiveKit over raw WebRTC**
Early research showed that `getUserMedia()` cannot capture remote participants' video — only the local camera. LiveKit's per-participant MediaStreamTracks are the only browser-native path to per-person face detection and VAD without server-side video mixing. Railway was ruled out because it blocks UDP (required for WebRTC STUN/TURN).

**MediaPipe Face Landmarker over cloud vision**
Google Vision and AWS Rekognition add 200–800 ms round-trip latency per frame. MediaPipe WASM + WebGL achieves p95 ≈ 80 ms in-browser, keeping the full pipeline under 500 ms E2E. The 478-point model also provides iris landmarks (indices 468, 473) enabling accurate gaze centering scores without any calibration step.

**Silero VAD over transcription**
Full transcription would require either server-side processing or significant client CPU. Silero VAD detects speech/silence with >95% accuracy at <10 ms per chunk — exactly what's needed for talk-time and interruption detection. Each LiveKit participant has a separate audio track, eliminating the need for stereo diarization.

**Rule-based coaching over LLM**
Real-time LLM inference (even with a fast model) adds 500–2000 ms per decision, making it incompatible with non-intrusive nudges. Template-based triggers with configurable thresholds and 2-minute cooldowns achieve the correct behavioral outcomes at zero latency and cost.

**Post-session interruption analysis over live feedback**
Interruptions are social signals; they can mean different things depending on context. Real-time feedback risks false positives — e.g., a student interrupting to ask a clarifying question vs. the tutor cutting the student off. We surface the detailed classification (productive/neutral/unproductive) and breakdown only in the post-session report, where tutors can review counts and patterns with full context. The live "interruptions spike" trigger remains a coarse, count-based nudge (tutor→student exceeds threshold) rather than a contextual judgment.

**Browser-first processing**
Keeping all CV and audio analysis in the browser eliminates server round-trips (saves 200–500 ms), prevents raw video/audio from leaving the device (privacy), and removes per-minute API costs. The tradeoff is client CPU load, which is kept acceptable by limiting analysis to ~5 FPS.

---

## Challenges & Workarounds

**Iris landmark availability**
MediaPipe's 468-point model does not include iris landmarks. The solution was to use the 478-point `FaceLandmarkerResult` model, which adds iris center points at indices 468 (left) and 473 (right). Without these, gaze estimation degrades to head-pose only (significantly less accurate).

**VAD misfire on background noise**
Silero VAD occasionally fires `speechStart` for keyboard clicks or background noise. The `onVADMisfire` callback resets speaking state, preventing talk-time inflation. Tested against synthetic noise in unit tests.

**EMA smoother "last value" vs "zero" strategy**
When no face is detected, the smoother must decide whether to hold the last score or decay to zero. "Last value" was chosen as the default because brief occlusions (hand covering face) should not spike the coaching trigger, while sustained absence (participant left frame) is better handled by a dedicated drift detector.

**Attention drift vs. brief glances**
An initial implementation that set `isDrifting = true` on any low-gaze frame generated too many false positives for natural gaze variation. The temporal threshold approach (≥5 consecutive seconds below 0.4) with an immediate reset on gaze return eliminates this without any look-back window or hysteresis.

**Interruption classification**
Distinguishing "productive" interruptions (student jumping in excitedly) from "unproductive" ones (tutor cutting student off) required directionality. LiveKit's per-track VAD enables this: tutor→student = potentially unproductive; student→tutor = engagement signal. Threshold-based classification was implemented rather than LLM sentiment to stay within latency budget.

---

## Calibration & Accuracy Approach

- **Eye contact:** Labeled test clips (`test/fixtures/labeled-clips.json`) define 8 synthetic scenarios with known expected eye contact ranges (tolerance ±0.15). Automated tests validate the pipeline produces values within tolerance.
- **Talk-time:** Unit tests simulate VAD segments with known durations and assert percentages within ±1% of expected.
- **Latency:** `PipelineLatencyTracker` with swappable mock clock instruments all 5 stages; E2E p50 ≈ 35 ms, p95 ≈ 90 ms on M-series Mac / Chrome 124.

---

## What Would Change With More Time

1. **Persistent session storage** — metrics JSON currently lives only in browser memory; adding a lightweight API route to store to a database would enable historical analysis.
2. **LLM recommendations** — swapping template-based recommendations for `claude-haiku-4-5` would add ~$0.0004/session and produce more personalized coaching.
3. **Multi-tab / multi-browser testing** — full integration testing with two real browser sessions to validate LiveKit track routing end-to-end.
4. **Confidence intervals on gaze** — reporting uncertainty alongside the score would help tutors calibrate how much to trust the metric.
