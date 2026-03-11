# SessionLens: Milestone Takeaways

High-level takeaways from each milestone and task, plus notable technical challenges. Milestones 16–19 omitted per scope.

**Source:** [Milestones Index](plans/milestones/_index.md)

---

## Milestone 01: Project Setup & WebRTC/LiveKit Video Call

**Takeaway:** Establishes the foundation: project scaffold, LiveKit room connection, token API, and frame extraction at 1–2 fps from both local and remote streams. Critical for downstream MediaPipe and VAD processing.

### Tasks

- **001-project-scaffold:** Vite/React app with LiveKit and MediaPipe dependencies; build and dev scripts.
- **002-livekit-room-connection:** Room connection with per-participant tracks; local and remote streams available.
- **003-token-api:** Server endpoint for LiveKit access tokens; env vars for credentials.
- **004-frame-sampler:** 1–2 fps sampling via `requestVideoFrameCallback` or rAF with frame skip; output compatible with MediaPipe `detectForVideo()`.
- **005-session-page-ui:** Session page with video call UI; graceful handling of camera denied or participant disconnect.

### Technical Challenges

- `getUserMedia()` cannot capture remote participants' video — only local camera. LiveKit's per-participant MediaStreamTracks are required for per-person face detection and VAD.
- LiveKit Cloud provides the WebRTC SFU; the app can deploy to Vercel, Railway, Fly.io, or any standard host.

---

## Milestone 02: Face Detection & Gaze

**Takeaway:** Integrates MediaPipe Face Landmarker to derive eye contact scores from iris landmarks and head pose, with EMA smoothing. Enables tutor vs. student gaze attribution.

### Tasks

- **001-face-landmarker-init:** MediaPipe Face Landmarker init; `detectForVideo()` wrapper; 478-point model for iris landmarks.
- **002-gaze-derivation:** Eye contact score (0–1) from iris position + head pose; per-stream processing.
- **003-smoothing:** EMA (α ≈ 0.2–0.3) for score smoothing; "last value" vs. "zero" when no face detected.
- **004-video-pipeline:** Orchestrate frame → MediaPipe → gaze → smoothing → score per stream.
- **005-unit-tests:** Mock landmarks → gaze derivation returns expected score range.

### Technical Challenges

- MediaPipe 468-point model lacks iris landmarks; must use 478-point model (indices 468, 473) for accurate gaze.
- When no face detected: "last value" chosen over "zero" to avoid false triggers on brief occlusions (e.g. hand over face).

---

## Milestone 03: Audio Pipeline

**Takeaway:** Silero VAD for voice activity; talk-time aggregation per channel; session context for tutor/student attribution. Foundation for participation balance and interruption detection.

### Tasks

- **001-vad-integration:** Silero VAD (WASM/JS); segment speech vs. silence.
- **002-talk-time-aggregation:** Aggregate talk-time per channel or single stream; percentages.
- **003-audio-pipeline:** Web Audio API → VAD → talk-time; pipeline orchestration.
- **004-session-context:** Tutor left, student right, or single-mic fallback.
- **005-unit-tests:** Synthetic VAD segments → talk-time % in expected range.

### Technical Challenges

- Silero VAD can misfire on keyboard clicks or background noise; `onVADMisfire` callback resets speaking state to prevent talk-time inflation.
- LiveKit per-participant audio tracks eliminate need for stereo diarization.

---

## Milestone 04: Metrics & Coaching Engine

**Takeaway:** Aggregates video + audio at 1 Hz; emits JSON metrics; rule-based coaching engine with ≥2 triggers, state machine, and cooldowns. Aligned with ONE_PAGER.

### Tasks

- **001-metrics-aggregator:** Combine eye contact + talk-time; emit at 1 Hz.
- **002-triggers-definition:** Trigger definitions (student silent >45 s, tutor talk >85%, low eye contact).
- **003-coaching-engine:** State machine: trigger conditions → fire → cooldown → reset; non-intrusive delivery.
- **004-metrics-schema:** Zod schema for metrics payload (optional).
- **005-unit-tests:** Synthetic metric streams → triggers fire at expected times; cooldowns respected.

### Technical Challenges

- Rule-based coaching over LLM: real-time LLM adds 500–2000 ms per decision; template triggers achieve correct outcomes at zero latency and cost.

---

## Milestone 05: Post-Session Summary

**Takeaway:** Generates post-session report with key metrics and ≥1 improvement recommendation. Template-based for MVP; optional LLM augmentation later.

### Tasks

- **001-summary-aggregation:** Aggregate session metrics for report.
- **002-recommendations:** Template-based recommendations (e.g. low student talk → suggest questions).
- **003-report-generation:** Combine summary + recommendations; output JSON or structured object.
- **004-report-page:** Display report after session end.
- **005-unit-tests:** Mock session data → report contains expected fields and ≥1 recommendation.

---

## Milestone 06: Dashboard & UI

**Takeaway:** Session UI with live metrics, nudge toasts, consent/disclosure, and session → report flow. Ensures non-intrusive coaching delivery.

### Tasks

- **001-consent-banner:** Pre-session consent and disclosure per privacy requirements.
- **002-metrics-display:** Live eye contact + talk-time display.
- **003-nudge-toast:** Subtle nudge display; no modal.
- **004-session-view:** Main session view: video feeds, metrics, nudges.
- **005-routing-flow:** Session → report flow; responsive layout.

---

## Milestone 07: Deployment & Polish

**Takeaway:** One-command setup; clear README; deploy to Fly.io or LiveKit Cloud. Publicly accessible URL for evaluator.

### Tasks

- **001-readme-setup:** Setup instructions; Node version, `npm install`, `npm run dev`.
- **002-deployment-config:** Dockerfile (optional), fly.toml; env vars.
- **003-deploy:** Deploy to Fly.io or LiveKit Cloud.
- **004-verification:** Fresh clone → install → dev works; full flow verified in production.

---

## Milestone 08: Interruptions Detection

**Takeaway:** Detects speaking overlaps (tutor and student talking simultaneously). VAD per LiveKit track → overlap count + directional attribution (who interrupted whom).

### Tasks

- **001-overlap-detection:** Both tracks have speech in same time window (100–200 ms); count overlapping windows.
- **002-directional-attribution:** Student→tutor vs. tutor→student; who interrupted whom.
- **003-session-aggregation:** Aggregate per session.
- **004-unit-tests:** Synthetic VAD segments → overlap count and attribution correct.

### Technical Challenges

- Single-mic: document "interruptions N/A" and show 0 or omit.

---

## Milestone 09: Interruption Classification

**Takeaway:** Classifies interruptions as productive/neutral/unproductive using Tier 1 heuristics (no transcription). Post-session breakdown in report.

### Tasks

- **001-classification-heuristics:** Productive (student→tutor), unproductive (tutor→student excessive), neutral (short/ambiguous).
- **002-report-integration:** Add to post-session report.
- **003-unit-tests:** Synthetic interruptions → classification correct.

### Technical Challenges

- Directionality from LiveKit per-track VAD enables productive vs. unproductive distinction without LLM sentiment.

---

## Milestone 10: Third Coaching Triggers

**Takeaway:** Adds third+ coaching trigger; wires all triggers (interruptions spike, response latency). PRD requires ≥3 triggers.

### Tasks

- **001-interruptions-spike-trigger:** Nudge when tutor→student interruptions exceed threshold.
- **002-response-latency-trigger:** "Student hesitating repeatedly" (or basic version); depends on M21.
- **003-wire-all-triggers:** All 3+ triggers with cooldowns; non-intrusive delivery.
- **004-unit-tests:** All triggers fire at expected times.

---

## Milestone 11: Energy Level

**Takeaway:** Adds energy level signal from voice (RMS, spectral features) and facial expression (MediaPipe landmarks). Combined score 0–1; optional nudge or post-session insight.

### Tasks

- **001-voice-energy:** RMS, spectral features from audio.
- **002-facial-expression:** Mouth openness, brow position from face landmarks.
- **003-combined-score:** Energy level score (0–1 or low/medium/high).
- **004-metrics-integration:** Add to metrics payload.

---

## Milestone 12: Attention Drift

**Takeaway:** Detects distraction/disengagement from gaze patterns (looking away, head turn). Sustained low eye contact → drift signal; temporal threshold to distinguish from brief glances.

### Tasks

- **001-drift-detection:** Low eye contact sustained → attention drift signal.
- **002-temporal-threshold:** ≥5 consecutive seconds below 0.4; immediate reset on gaze return.
- **003-metrics-integration:** Add to metrics; optional nudge or post-session insight.

### Technical Challenges

- Initial implementation with any low-gaze frame → too many false positives. Temporal threshold (≥5 s) with immediate reset eliminates without look-back or hysteresis.

---

## Milestone 13: Test Suite Expansion

**Takeaway:** Expands to 15+ tests for Excellent Technical Implementation. Unit, integration, and edge-case coverage.

### Tasks

- **001-gaze-talk-time-tests:** Gaze derivation, talk-time aggregation.
- **002-coaching-trigger-tests:** Triggers fire at expected times; cooldowns respected.
- **003-integration-tests:** Full pipeline with recorded session.
- **004-edge-case-tests:** No face, no audio, poor video, dropped frames.

---

## Milestone 14: Labeled Test Clips

**Takeaway:** 5–10 labeled clips with known eye contact / talk-time ratios for accuracy validation. Pipeline runs on clips; output within tolerance.

### Tasks

- **001-create-clips:** 5–10 clips (video + audio or metadata).
- **002-label-metadata:** Known eye contact level, talk-time ratio.
- **003-validation-test:** Automated test or manual checklist; pipeline within tolerance.

---

## Milestone 15: Latency Instrumentation

**Takeaway:** Instruments pipeline for latency; per-stage budget; E2E test with mock clock; documents p50/p95.

### Tasks

- **001-instrument-pipeline:** Frame capture → MediaPipe → gaze → smoothing → metrics; per-stage timing.
- **002-e2e-latency-test:** Mock clock for deterministic assertions; assert budget (e.g. <500 ms p95).
- **003-document-latency:** p50/p95 in README or docs.

### Technical Challenges

- `PipelineLatencyTracker` with swappable mock clock; E2E p50 ≈ 35 ms, p95 ≈ 90 ms on M-series Mac / Chrome 124.

---

## Milestone 20: Privacy & Compliance

**Takeaway:** Privacy & Compliance document for submission. What is captured, consent/disclosure, retention, access control, FERPA/COPPA notes.

### Tasks

- **001-what-is-captured:** Face landmarks, gaze vectors, VAD; no raw video/audio egress unless opted in.
- **002-consent-retention:** Pre-session wording; configurable retention (30–90 days); deletion on request.
- **003-compliance-notes:** FERPA/COPPA if minors; processing location (browser-first keeps data local).

---

## Milestone 21: Response Latency

**Takeaway:** Time between tutor stops speaking and student starts. Real-time nudge "Student hesitating repeatedly" + post-session stats. Cognitive signal per ONE_PAGER.

### Tasks

- **001-latency-computation:** Time from tutor VAD silence to student VAD speech; per turn.
- **002-hesitation-detection:** Aggregate "hesitation" count (e.g. >3 long pauses in 2 min).
- **003-nudge-report:** Real-time nudge + post-session latency stats in report.

---

## Milestone 22: Participation Balance

**Takeaway:** Enhances participation balance with engagement interpretation — "passive" vs. "engaged" framing in report. Primary behavioral signal per ONE_PAGER.

### Tasks

- **001-interpretation-logic:** Student talk ratio → passive/engaged interpretation.
- **002-report-framing:** Report shows passive vs. engaged; aligns with metrics.

---

## Milestone 23: Attention Cycles

**Takeaway:** Gaze patterns over time; segment session into windows (beginning, middle, end). "Attention drifted in middle segment" vs. static count. Temporal patterns per ONE_PAGER.

### Tasks

- **001-segment-attention:** Per-segment eye contact / attention score.
- **002-drift-pattern:** Detect "drifted in middle segment" pattern.
- **003-report-display:** Attention cycle visualization or summary in report.

---

## Milestone 24: Post-Session Trend Analysis (Stretch)

**Takeaway:** Trend analysis across sessions. Requires session storage; "Compared to previous sessions, eye contact improved 10%."

### Tasks

- **001-session-storage:** Store session metrics per session; optional backend/db.
- **002-trend-computation:** Eye contact over sessions, talk ratio over sessions.
- **003-report-integration:** Comparison to prior sessions in report.

---

## Milestone 25: Post-Session Flagged Moments (Stretch)

**Takeaway:** Flag moments for review: low eye contact, long silence, interruption spike. Timestamps + reason; optional link to replay.

### Tasks

- **001-flag-detection:** Flag moments; store timestamps + reason.
- **002-report-display:** List of flagged moments in report.

---

## Milestone 26: Post-Session LLM Recommendations (Stretch)

**Takeaway:** LLM-powered personalized recommendations. Replace or augment template; fallback to template if LLM fails; document in AI Cost Analysis.

### Tasks

- **001-llm-integration:** LLM call (e.g. GPT-4o mini); input: session metrics, context.
- **002-prompt-design:** Personalized recommendation text.
- **003-fallback-cost:** Fallback to template; cost documented.

---

## Milestone 27: Configurable Nudge Sensitivity (Stretch)

**Takeaway:** UI controls for nudge sensitivity (Low, Medium, High). Maps to coaching thresholds; persist preference (localStorage or session).

### Tasks

- **001-sensitivity-ui:** Slider or preset selector.
- **002-threshold-mapping:** Map to student_silent_sec, tutor_talk_threshold, eye_contact_threshold.
- **003-persist-apply:** Persist preference; apply at runtime.

---

## Milestone 28: Session-Type Presets (Stretch)

**Takeaway:** Presets: Lecture (tutor-heavy OK), Practice (balanced), Socratic (student-heavy). Different coaching thresholds per preset.

### Tasks

- **001-preset-definitions:** Preset definitions with thresholds and optional metric weights.
- **002-preset-ui:** Select preset before/during session.
- **003-preset-logic:** Coaching behavior and report interpretation differ by preset.

---

## Milestone 29: Interruptions Tier 2 Transcription (Stretch)

**Takeaway:** Tier 2 classification: transcribe overlap segments; content-based classification (clarifying, procedural, off-topic). Requires Whisper or equivalent.

### Tasks

- **001-transcription-integration:** Transcribe overlapping speech segments.
- **002-content-classification:** Keyword/heuristic: clarifying ("why", "what", "how"), procedural, off-topic.
- **003-report-integration:** Refined productive/neutral/unproductive in report when Tier 2 transcripts available.

### Technical Challenges

- Transcription deferred: requires Whisper or audio capture; content-based classification improves over Tier 1 when transcripts provided.

---

## Milestone 30: Instructor Delivery Quality (Stretch)

**Takeaway:** Tutor delivery strongly affects attention and cognitive load. Poor delivery (rambling, filler words, disorganized explanations) increases extraneous load and suppresses student participation. Some "student engagement problems" are actually tutor delivery problems. Add delivery quality metrics: speech fluency (filler rate, pause frequency, restart rate), explanation structure (monologue length, turn-taking, question density), confidence (prosody).

### Tasks

- **001-delivery-fluency:** Filler word rate, pause frequency, speech restart rate from VAD/transcription.
- **002-delivery-structure:** Avg tutor monologue length, turn-taking frequency, question density.
- **003-delivery-confidence:** Speech rate consistency, vocal energy/prosody variation.
- **004-report-integration:** Add delivery quality to session summary and report.

### Technical Challenges

- Filler detection without transcription is limited; Tier 2 (Whisper) improves accuracy. Pause/restart and monologue length feasible from VAD segments.

---

## Milestone 31: Engagement Score with Delivery Moderation (Stretch)

**Takeaway:** Factor instructor delivery quality into engagement score as a moderating variable. When tutor delivery is poor, the engagement score is adjusted to reflect that some "student engagement problems" may be tutor-driven. Recommendations distinguish tutor-delivery issues from student-engagement issues.

### Tasks

- **001-moderation-formula:** Define formula; integrate delivery quality into `aggregateSessionSummary()`.
- **002-report-display:** Show delivery-adjusted engagement score; explain when delivery is low.
- **003-recommendations:** Delivery-aware recommendation logic — suggest delivery improvements when delivery low + engagement low.

---

## Cross-Cutting Technical Challenges

- **Browser-first processing:** All CV and audio analysis in browser eliminates server round-trips (saves 200–500 ms), keeps raw video/audio local (privacy), removes per-minute API costs. Tradeoff: client CPU; mitigated by ~5 FPS analysis limit.
- **MediaPipe latency:** Google Vision/AWS Rekognition add 200–800 ms; MediaPipe WASM + WebGL achieves p95 ≈ 80 ms in-browser, keeping pipeline under 500 ms E2E.
- **Interruptions as post-session insight:** Real-time feedback risks false positives (clarifying question vs. tutor cutting off). Detailed classification surfaced only in post-session report; live trigger remains coarse count-based nudge.
- **Calibration:** Labeled clips (`test/fixtures/labeled-clips.json`) with ±0.15 tolerance for eye contact; VAD tests assert ±1% for talk-time; `PipelineLatencyTracker` with mock clock for deterministic latency assertions.
