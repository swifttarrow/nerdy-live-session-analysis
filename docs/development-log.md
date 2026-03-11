# Development Log — SessionLens

*1-page development log per PRD submission requirements.*

---

## Timeline Summary


| Phase                      | Milestones                                  | Key Output                                               |
| -------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Pre-Search                 | Architecture research, constraint analysis  | Stack decision: LiveKit + MediaPipe + Silero VAD         |
| MVP (M1–M7)                | Project setup → deployment                  | Working pipeline, coaching engine, post-session report   |
| Post-MVP Audio (M8–M10)    | Interruptions, classification, 3rd triggers | Interruption detection, hesitation and spike triggers    |
| Post-MVP Metrics (M11–M12) | Energy level, attention drift               | Voice RMS + expression energy; sustained drift detection |
| Testing & QA (M13–M15)     | Test expansion, labeled clips, latency      | 233 tests; p95 E2E <90 ms measured                       |
| Documentation (M16–M20)    | AI costs, architecture, dev log, privacy    | Submission-ready documentation                           |
| Extensions                 | Presets, kudos, debug mode                  | SessionTypeSelector, KudosToast, `/debug` video playback |
| Polish                     | UI refinement, deployment, handoff          | Production-ready build                                   |


---

## Key Decisions & Rationale

### Technical

**LiveKit over raw WebRTC**
`getUserMedia()` only captures the local camera; the remote participant’s video is not available. LiveKit’s per-participant MediaStreamTracks are the browser-native way to do per-person face detection and VAD without server-side video mixing. LiveKit Cloud provides the WebRTC SFU and handles TURN/STUN; the app can deploy to Vercel, Railway, or any standard host.

**MediaPipe Face Landmarker over cloud vision**
Cloud vision APIs add 200–800 ms latency per frame. MediaPipe WASM + WebGL runs in the browser with p95 ≈ 80 ms per frame, keeping the full pipeline under 500 ms E2E. The 478-point model includes iris landmarks (indices 468, 473), enabling reliable gaze scoring without calibration.

**Silero VAD over transcription**
Full transcription needs server-side processing or heavy client CPU. Silero VAD detects speech/silence with high accuracy and <10 ms per chunk, which is sufficient for talk-time and interruption detection. LiveKit provides separate audio tracks per participant, so stereo diarization is unnecessary.

**Rule-based coaching over LLM**
LLM inference adds 500–2000 ms per decision, which is too slow for non-intrusive nudges. Template-based triggers with configurable thresholds and per-trigger cooldowns produce the right behavior at near-zero latency and cost.

**Browser-first processing**
All CV and audio analysis runs in the browser. This avoids server round-trips (~200–500 ms), avoids sending raw video/audio off-device, and avoids per-minute API costs. Client CPU load is kept low by analyzing at ~5 FPS.

**Iris landmark availability**
The 468-point MediaPipe model lacks iris landmarks; we use the 478-point `FaceLandmarkerResult` (indices 468, 473) for accurate gaze. Without these, only head pose is available.

**VAD misfire**
Silero VAD can fire on background noise; we enable `noiseSuppression: true` in the LiveKit audio capture to reduce ambient noise, and `onVADMisfire` resets speaking state when misfires occur. Covered in unit tests.

**EMA smoother**
When no face is detected, we hold the last score (not decay to zero) so brief occlusions don’t trigger spikes; sustained absence uses a dedicated drift detector.

**Attention drift vs glances**  
A temporal threshold (≥5 s below 0.4) with immediate reset on gaze return avoids false positives from normal gaze variation.

### Product

**Post-session interruption analysis over live feedback**
Interruptions are context-dependent. Real-time feedback risks false positives. We show detailed classification (productive/neutral/unproductive) and breakdown only in the post-session report, where tutors can review counts and patterns. The live “interruptions spike” trigger remains a coarse count-based nudge (tutor→student exceeds threshold).

**Adding Kudos**
Nudges serve as critical feedback. Kudos feel like a good balancing element to round out the coaching experience felt by the tutor.

**Facial Expressions / Emotional States**
Originally aimed for 15 but found it was not useful. Similar expressions
would score similarly, making it difficult to distinguish. Cut this
down to a simple "positive, neutral, negative".

**Post-Session Engagement Score**
Composite of teacher's eye contact, student's eye contact, and
student talking %. Student talking percentage uses a gaussian distribution centered on 70%. Talking score percentage degrades based on distribution. 

This addresses edge cases of teacher/student talking excessively; if
the student talked 100%, that component should not score max points.
And similarly, if the teacher talked 100%, it should not score 0 points.

---

## Calibration & Accuracy Approach

- **Eye contact:** Labeled clips in `test/fixtures/labeled-clips.json` define synthetic scenarios with expected eye contact ranges (tolerance ±0.15). Automated tests check the pipeline outputs against these.
- **Talk-time:** Unit tests simulate VAD segments with known durations and assert percentages within ±1% of expected.
- **Latency:** `PipelineLatencyTracker` (with swappable mock clock) instruments all five stages. E2E p50 ≈ 35 ms, p95 ≈ 90 ms on M-series Mac / Chrome 124.

---

## Implementation Layout


| Spec folder            | Implementation                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `video-processor/`     | `video-processor/` — pipeline, face-landmarker, gaze, frame-sampler, smoothing, attention-drift, emotion    |
| `metrics-engine/`      | `metrics-engine/` — aggregator, talk-time, interruptions, response-latency, monologue-length, energy, VAD   |
| `coaching-system/`     | `coaching-system/` — engine, triggers, config, sensitivity, presets, kudos                                  |
| `analytics-dashboard/` | `analytics-dashboard/` — summary, trends, flagged-moments, recommendations, participation, attention-cycles |
| App / UI               | `src/` — app pages, components, hooks, lib (latency, session store)                                         |


---

## What Would Change With More Time

1. **Persistent session storage** — Metrics JSON is currently only in browser memory; a lightweight API route and database would enable historical analysis.
2. **Multiple rooms** - This is currently setup as a single room
allowing two people to connect. With multiple rooms, we would need
to think about invites and removing polling (currently used as 
workaround to prevent users joining as same role)
3. **LLM recommendations** — Replacing template-based recommendations with `claude-haiku-4-5` would add ~$0.0004/session and support more personalized coaching.
4. **Multi-tab / multi-browser testing** — Full integration tests with two real browser sessions to validate LiveKit track routing end-to-end.
5. **Confidence intervals on gaze** — Reporting uncertainty with the score would help tutors calibrate trust in the metric.
6. **Personalization** - incorporating student's learning preferences,
perhaps tutor's learning preferences as well. For example, if a 
student says they learn best via visuals, we could nudge the tutor
to draw something.
7. **Use Case Flexibility** - screen sharing, teacher with multiple students, cameras off, etc.

