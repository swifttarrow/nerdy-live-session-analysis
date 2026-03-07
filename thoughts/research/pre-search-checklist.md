# Pre-Search Checklist (PRD Appendix)

*Direct answers to the PRD Appendix: Pre-Search Checklist. Completes before coding.*

---

## Phase 1: Define Your Constraints

### 1. Scale and load


| Question            | Answer                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| Concurrent sessions | Target: 100 (MVP) → 1K (early) → 10K (scale); design for horizontal scaling |
| Session length      | 30 min average; support 15–90 min                                           |
| Video resolution    | 720p @ 30 fps (test scenarios); analyze at 1–2 fps for metrics              |
| Latency target      | <500 ms frame-to-displayed-metric                                           |
| Throughput          | 1–2 Hz metric updates minimum                                               |


### 2. Budget


| Question   | Answer                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| Cloud APIs | Prefer local/free where possible; Whisper $0.006/min if needed; GPT-4o mini for summaries |
| Vision     | MediaPipe (free) in-browser; avoid cloud vision for cost                                  |
| Constraint | MVP: minimize cloud spend; full build: budget for LLM + optional Whisper                  |


### 3. Timeline


| Question            | Answer                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 24-hour MVP         | Video pipeline + 2 metrics (eye contact, talk-time) + 2 nudge types + post-session template |
| Riskiest dependency | Gaze accuracy on webcam; validate with labeled clips before building coaching               |


### 4. Compliance and data sensitivity


| Question            | Answer                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| Consent             | Explicit consent before analysis; disclose what is measured (face, gaze, audio)      |
| Retention           | Configurable; recommend 30–90 days default; deletion on request                      |
| Processing location | Browser-first keeps video/audio local; server only for metrics, config, post-session |
| Restrictions        | Consider FERPA/COPPA if minors; document in architecture                             |


### 5. Team and skills


| Question          | Answer                                                                        |
| ----------------- | ----------------------------------------------------------------------------- |
| CV experience     | MediaPipe is approachable; no custom model training required                  |
| Real-time systems | Web Workers, requestAnimationFrame, WebSocket                                 |
| Preference        | Browser-based for latency + privacy; server for accuracy-critical diarization |


---

## Phase 2: Architecture Discovery

### 1. Video processing


| Topic                        | Finding                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| MediaPipe vs OpenCV vs cloud | MediaPipe: ~2–10 ms inference, 468 landmarks, gaze-capable; OpenCV: lower-level; cloud: $1–1.50/1K images, 200–500 ms latency |
| Frame rate for 1–2 Hz        | 1–2 fps analysis sufficient; sample every 15–30 frames at 30 fps                                                              |
| Multiple participants        | Two feeds (tutor, student); process separately; assign by stream/channel                                                      |


### 2. Audio processing


| Topic              | Finding                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Local vs cloud     | Silero VAD: ~1 ms, free; Whisper: $0.006/min, 100–500 ms; GPT-4o Transcribe with diarization: same price |
| Diarization        | Channel-based if stereo/dual-mic; else WhisperLiveKit, pyannote, or GPT-4o Transcribe                    |
| Talk-time accuracy | VAD + diarization; 95% achievable with clean channels or strong diarization model                        |


### 3. Gaze and eye contact


| Topic           | Finding                                                             |
| --------------- | ------------------------------------------------------------------- |
| Libraries       | MediaPipe Face Landmarker (web); MediaPipe Iris + Kalman (research) |
| Calibration     | Minimal for MediaPipe; optional per-user calibration for edge cases |
| Webcam accuracy | Studies report 85–91% with CNN/MediaPipe on webcam                  |


### 4. Real-time architecture


| Topic                | Finding                                                          |
| -------------------- | ---------------------------------------------------------------- |
| WebRTC vs WebSocket  | WebRTC: sub-500 ms, UDP; WebSocket: simpler, TCP, higher latency |
| Metric aggregation   | Client (browser) for lowest latency; server if centralized       |
| Latency minimization | Browser-side CV; sample frames; avoid cloud round-trips          |


### 5. Coaching system


| Topic                | Finding                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| Notification fatigue | Cooldowns per trigger type; configurable thresholds; max nudges per session |
| Thresholds           | Store in DB; editable without deploy; session-type presets                  |
| Configurability      | JSON config: `{ "student_silent_min": 3, "eye_contact_threshold": 0.5 }`    |


### 6. Integrations


| Topic               | Finding                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| Video platform      | Standalone for MVP; WebRTC/LiveKit for future Zoom/Meet-style integration |
| Post-session format | JSON report; PDF export optional; API for downstream tools                |


---

## Phase 3: Post-Stack Refinement

### 1. Security and failure modes


| Topic            | Finding                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| Video/audio drop | Graceful degradation; show last known metrics; "Connection unstable" message |
| Malicious input  | Validate frame dimensions, sample rate; timeouts; rate limits                |
| Auth             | Session tokens; optional OAuth for production                                |


### 2. Testing


| Topic             | Finding                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| Labeled clips     | Create 5–10 clips with known eye contact / talk-time; use for accuracy validation |
| Latency tests     | Instrument pipeline; assert each stage < budget; E2E test with mock clock         |
| Coaching triggers | Unit tests with synthetic metric streams; integration test with recorded session  |


### 3. Tooling


| Topic             | Finding                                                               |
| ----------------- | --------------------------------------------------------------------- |
| Latency profiling | Chrome DevTools Performance; custom timestamps in pipeline            |
| Logging           | Structured logs (session_id, stage, duration); optional OpenTelemetry |


### 4. Deployment


| Topic       | Finding                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| Target      | Fly.io (WebRTC) or Railway (browser-only); Docker Compose for one-command |
| One-command | `docker compose up` or `npm run dev` with README                          |
| Monitoring  | Health check; latency percentiles; error rate                             |


### 5. Observability


| Topic     | Finding                                                    |
| --------- | ---------------------------------------------------------- |
| Metrics   | p50/p95 latency per stage; metric update rate; nudge count |
| Debugging | Session replay with stored metrics; correlation IDs        |


