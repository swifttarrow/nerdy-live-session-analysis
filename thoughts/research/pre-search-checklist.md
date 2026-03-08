# Pre-Search Checklist (PRD Appendix)

*Direct answers to the PRD Appendix: Pre-Search Checklist. Completes before coding.*

**Output requirement:** Each architecture discovery point must end with a **Decision** + **Rationale** (see `architecture-research.md` → Research Output Definition).

**Engagement model (ONE_PAGER):** Engagement spans four dimensions—cognitive, behavioral, agentic, emotional. *Basic metrics* (eye contact, speaking time, interruptions, energy, attention) describe what happened; *engagement-quality signals* (response latency, explanation length, student talk ratio, number of attempts, question asking, tone/sentiment) infer whether learning is likely. The latter matter more for actionable insight.

---

## Fundamental Requirement: Live Tutor–Student Interaction

**The system must analyze live video interactions between a tutor and a student.** Both participants are typically in different locations (remote tutoring). Therefore we need **both video feeds** (tutor + student). A single browser's `getUserMedia` only captures that device's camera—it cannot access the remote participant's video. **WebRTC/LiveKit (or equivalent) is required** to conduct the video call and deliver both streams to the analysis client.

---

## Phase 1: Define Your Constraints

### 1. Scale and load


| Question            | Answer                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| Concurrent sessions | Target: 100 (MVP) → 1K (early) → 10K (scale); design for horizontal scaling      |
| Session length      | 30 min average; support 15–90 min                                                |
| Video resolution    | 720p @ 30 fps (test scenarios); analyze at 1–2 fps for metrics                   |
| Latency target      | <500 ms frame-to-displayed-metric                                                |
| Throughput          | 1–2 Hz metric updates minimum                                                    |
| Participant model   | **MVP: 1 tutor vs 1 student** (1:1); design notes for 1 tutor + N students below |


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


**Privacy considerations for video analysis**


| Topic            | Finding                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| What is captured | Browser-first: face landmarks, gaze vectors, VAD/diarization features; no raw video/audio egress to server unless recording   |
| Who can access   | Tutor: own sessions only; QA/admin: role-based; aggregate analytics: anonymized                                               |
| Disclosure       | Clear pre-session wording: "We analyze face position, gaze direction, and speech patterns for coaching. No raw video stored." |
| Evaluation       | "Privacy analysis" and "Privacy not addressed" in Documentation criteria                                                      |



| **Decision**                                                                                                                    | **Rationale**                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Browser-first: process locally; upload only metrics + optional transcript post-session; no raw video/audio to server by default | Minimizes exposure; aligns with latency and cost; evaluation requires privacy documentation.                |
| Explicit consent + disclosure before session start; configurable retention; deletion on request                                 | REQUIREMENTS: "Consent required"; "Clearly disclose what is measured"; evaluation rewards privacy analysis. |


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
| Source of video feeds        | WebRTC/LiveKit: local stream (own camera) + remote stream (other participant); analysis client receives both                  |
| MediaPipe vs OpenCV vs cloud | MediaPipe: ~2–10 ms inference, 468 landmarks, gaze-capable; OpenCV: lower-level; cloud: $1–1.50/1K images, 200–500 ms latency |
| Frame rate for 1–2 Hz        | 1–2 fps analysis sufficient; sample every 15–30 frames at 30 fps                                                              |
| Multiple participants        | Two feeds (tutor, student) from WebRTC; process each stream separately; assign by local vs remote                             |



| **Decision**                                                                           | **Rationale**                                                                                                                           |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| MediaPipe Face Landmarker in-browser                                                   | Latency target <500 ms; cloud adds 200–500 ms round-trip; MediaPipe ~2–10 ms inference keeps us well under budget. Zero inference cost. |
| Sample at 1–2 fps (every 15–30 frames @ 30 fps)                                        | 1–2 Hz metric updates sufficient for coaching; full 30 fps unnecessary and would exceed latency budget.                                 |
| Process tutor and student feeds separately; local = tutor (or student), remote = other | WebRTC delivers both streams to analysis client; clear attribution for metrics.                                                         |


**Participant model: 1:1 vs 1 tutor + N students**


| Aspect       | 1 tutor : 1 student (MVP)                       | 1 tutor : N students (future)                                                                  |
| ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Video feeds  | 2 (tutor, student); one stream each             | N+1 feeds; tutor + N student streams                                                           |
| Diarization  | 2-speaker; channel-based or simple heuristics   | N+1 speaker; requires pyannote/Whisper diarization; channel-based only if N mics               |
| Talk-time    | Tutor vs student ratio; single student baseline | Per-student talk time; equity metric (are some students silent?); aggregate student %          |
| Eye contact  | Tutor gaze at camera; student gaze at screen    | Tutor gaze distribution across students (who is tutor looking at?); per-student attention      |
| Nudges       | "Student hasn't spoken in 5 min"                | "Student B hasn't spoken in 5 min"; "Consider checking in with Student C"                      |
| Latency      | 2× face detection per frame; manageable         | (N+1)× face detection; may need to sample students (round-robin) or reduce fps per participant |
| Post-session | One student to analyze                          | Per-student breakdown; equity report; "which students got most attention"                      |



| **Decision**                                                                                                      | **Rationale**                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| MVP: 1:1 only; architecture supports N+1 streams (separate processing per feed)                                   | REQUIREMENTS and evaluator test scenarios assume 1:1; bonus points for multi-participant but not required.                           |
| 1:N design: process each feed independently; aggregate metrics per participant; diarization becomes critical path | Keeps pipeline modular; main changes: diarization (N+1 speakers), equity metrics, per-student nudges, sampling strategy for latency. |


### 2. Audio processing


| Topic              | Finding                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Local vs cloud     | Silero VAD: ~1 ms, free; Whisper: $0.006/min, 100–500 ms; GPT-4o Transcribe with diarization: same price |
| Diarization        | Channel-based if stereo/dual-mic; else WhisperLiveKit, pyannote, or GPT-4o Transcribe                    |
| Talk-time accuracy | VAD + diarization; 95% achievable with clean channels or strong diarization model                        |



| **Decision**                                                                                       | **Rationale**                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Silero VAD (local) for voice activity                                                              | ~1 ms latency, free; meets real-time requirement.                                                                                                               |
| Channel-based diarization when stereo/dual-mic; WhisperLiveKit or GPT-4o Transcribe for single-mic | Channel-based: zero cost, high accuracy if channels clean. Single-mic: need strong model; both options ~$0.006/min; GPT-4o Transcribe has built-in diarization. |


### 3. Gaze and eye contact


| Topic           | Finding                                                             |
| --------------- | ------------------------------------------------------------------- |
| Libraries       | MediaPipe Face Landmarker (web); MediaPipe Iris + Kalman (research) |
| Calibration     | Minimal for MediaPipe; optional per-user calibration for edge cases |
| Webcam accuracy | Studies report 85–91% with CNN/MediaPipe on webcam                  |



| **Decision**                                          | **Rationale**                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| MediaPipe Face Landmarker + temporal smoothing (EMA)  | Meets 85% target; studies show 85–91% on webcam. Kalman optional if jitter is an issue.           |
| Minimal calibration; optional per-user for edge cases | MediaPipe works out-of-box; avoid friction for MVP; add calibration only if accuracy falls short. |


### 4. Real-time architecture


| Topic                   | Finding                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Fundamental requirement | System must analyze **live tutor–student interaction**; both video feeds required                      |
| WebRTC vs WebSocket     | WebRTC: sub-500 ms, UDP; required for video call (remote participant's stream)                         |
| Why WebRTC is needed    | `getUserMedia` only captures local camera; cannot access remote participant's video without WebRTC/SFU |
| Metric aggregation      | Client (browser) for lowest latency; server if centralized                                             |
| Latency minimization    | Browser-side CV; sample frames; avoid cloud round-trips                                                |



| **Decision**                                      | **Rationale**                                                                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WebRTC/LiveKit is required** for the video call | Tutor and student are typically remote; we need both feeds. WebRTC delivers remote stream to analysis client. Without it, we cannot analyze live tutor–student interaction (except same-room edge case). |
| Use LiveKit Cloud or Fly.io; Railway unsuitable   | Railway blocks inbound UDP; WebRTC TURN needs UDP. LiveKit Cloud is managed; Fly.io supports self-hosted LiveKit.                                                                                        |
| Client-side metric aggregation                    | Lowest latency; no server round-trip for metrics; aligns with browser-first processing.                                                                                                                  |


### 5. Coaching system


| Topic                | Finding                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| Notification fatigue | Cooldowns per trigger type; configurable thresholds; max nudges per session |
| Thresholds           | Store in DB; editable without deploy; session-type presets                  |
| Configurability      | JSON config: `{ "student_silent_sec": 45, "tutor_talk_threshold": 0.85, "eye_contact_threshold": 0.5 }` (ONE_PAGER: 45s, 85%) |



| **Decision**                                                       | **Rationale**                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Rule-based + state machine with cooldowns; configurable thresholds | Avoid notification fatigue; no code deploy for tuning; LLM only for post-session, not real-time. |
| Store thresholds in DB; JSON config schema                         | Editable without deploy; session-type presets for different tutoring contexts.                   |


**Coaching intrusiveness (subtle vs explicit)**


| Topic           | Finding                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| PRD requirement | "Non-intrusive"; "Subtle visual indicators (not disruptive to session flow)"                      |
| Options         | Subtle: corner badge, icon pulse; Standard: short inline text; Explicit: modal, full-screen alert |
| Evaluation      | "Proper timing (not disruptive)" rewarded; "Disruptive timing" penalized                          |



| **Decision**                                                          | **Rationale**                                                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Subtle by default: small corner badge or icon pulse; no modals in MVP | Session flow is paramount; explicit nudges risk disrupting teaching; requirements and evaluation both favor non-disruptive delivery. |
| Configurable per-nudge type (subtle / standard / explicit) for future | Power users may want more explicit feedback; defer to post-MVP; keep MVP strictly subtle.                                            |


### 6. Metrics by session type


| Topic        | Finding                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Benchmarks   | Lecture: 70–80% tutor; Practice: 30–50% tutor; Socratic: 40–60% tutor (from REQUIREMENTS Starter Kit)                                 |
| Primary diff | Talk-time ratio expected range varies; interruptions matter more in practice; eye contact universal; energy/attention drift universal |
| MVP scope    | Single threshold set for MVP; session-type presets as config (not UI) for early scale                                                 |



| **Decision**                                                                                                             | **Rationale**                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Session-type presets: Lecture, Practice, Socratic, General; each with different talk-time thresholds and primary metrics | Benchmarks differ by pedagogy; one-size-fits-all would misfire (e.g., "tutor talks too much" in lecture is normal).      |
| MVP: General preset only; add Lecture/Practice/Socratic when coaching matures                                            | Reduces scope; evaluator test scenarios don't require session-type selection; can add later without architecture change. |


### 7. Integrations


| Topic               | Finding                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Video platform      | **SessionLens IS the video call**—tutor and student connect via WebRTC/LiveKit; we conduct the session |
| Post-session format | JSON report; PDF export optional; API for downstream tools                                             |



| **Decision**                                                               | **Rationale**                                                                                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build video call with LiveKit (or equivalent); not standalone getUserMedia | Live tutor–student interaction requires both feeds; WebRTC/LiveKit delivers remote participant's video. We are the video platform for the session. |
| JSON report as primary; PDF optional; API for downstream                   | JSON machine-readable; PDF for human sharing; API enables integrations.                                                                            |


### 8. Post-session feedback design

**Teaching principles (foundation for coaching)**

Effective feedback requires a shared definition of "good tutoring." High-impact behaviors to anchor feedback:


| Principle  | Poor                         | Good                       | Excellent                                 |
| ---------- | ---------------------------- | -------------------------- | ----------------------------------------- |
| Diagnosis  | Tutor jumps into explanation | Tutor asks a few questions | Tutor precisely identifies misconception  |
| Guidance   | Tutor gives answer           | Tutor hints                | Tutor leads student to derive solution    |
| Engagement | Lecture style                | Some questions             | Student actively thinking the entire time |


Core principle: **maximize student thinking time** (target ~30% tutor / 70% student talk; avoid 80/20).

**Feedback structure**


| Topic          | Finding                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Formula        | Observation → Impact → Alternative technique                                                               |
| Specificity    | Specific moments with timestamps; avoid vague ("be more engaging")                                         |
| Behavior-level | "At 12:05, the student said X. Instead of explaining, try asking: 'What do you think would happen if...?'" |
| Focus          | One skill at a time per week; avoid feedback overload                                                      |


**Post-session report design**

*ONE_PAGER post-session analytics: engagement score, moments of confusion/frustration, tutor talk balance, persistence patterns.*

| Topic               | Finding                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Timestamped moments | Flag specific moments for review (e.g., "12:05 – Student confused about base case; tutor explained 3 min; missed opportunity: ask student to explain") |
| Key metrics         | Student talk time (primary engagement-quality signal); tutor talk balance; moments of confusion/frustration; persistence patterns; avoid metric overload |
| LLM summarization   | Use transcript + metrics to generate Observation → Impact → Alternative; cite timestamps                                                               |
| Debrief structure   | Optional: tutor self-reflection (2 min) + coach observation (3 min) + improvement focus (2 min)                                                        |


**Flagged segment playback**


| Topic     | Finding                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Replay    | Each flagged moment in the report is clickable; tutor can replay that segment                                                    |
| Dual view | Show both tutor and student video simultaneously (side-by-side or picture-in-picture) so tutor sees the full interaction context |
| Storage   | Requires session recording (or at least flagged segments) to be stored; browser-first MVP may need opt-in recording for playback |



| **Decision**                                                                                                                    | **Rationale**                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Include segment playback for all flagged moments; dual view (tutor + student)                                                   | Enables "at 12:05, try..." feedback with visual context; tutor can see themselves and the student to understand the moment. Seeing both feeds reinforces the suggested alternative. |
| Store flagged segments (or full session) for playback; document storage/retention implications                                  | Playback requires persisted video; align with privacy/retention decisions; may be opt-in for MVP.                                                                                   |
| Ground post-session feedback in rubric (Diagnosis, Guidance, Engagement); LLM output follows Observation → Impact → Alternative | Without shared principles, feedback is subjective; formula makes feedback actionable and specific.                                                                                  |
| Include timestamped moments in report; LLM cites specific times when suggesting alternatives                                    | Enables "at 12:05, try..." style feedback; aligns with effective coaching practice.                                                                                                 |
| Prioritize student talk time as primary metric; surface "tutor vs student %" prominently                                        | Core principle: maximize student thinking; most actionable signal for coaching.                                                                                                     |
| One improvement focus per report; configurable weekly coaching themes                                                           | Avoid overload; manageable and measurable improvement.                                                                                                                              |


**Techniques to suggest in alternatives**

When LLM suggests "Alternative technique," draw from core tutoring techniques:


| Technique            | Example prompts                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Socratic questioning | "What do you notice?" / "What's the goal of this step?" / "What happens if we remove this?" |
| Error diagnosis      | "Walk me through your thinking." / "Where do you think it went wrong?"                      |
| Explain-back         | "Can you explain that back to me in your own words?"                                        |
| Guide, don't solve   | "What do you think the next step should be?" instead of giving the answer                   |



| **Decision**                                                                    | **Rationale**                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Include technique library in LLM system prompt for post-session recommendations | Ensures alternatives are concrete and actionable; avoids generic advice. |


---

## Phase 3: Post-Stack Refinement

### 1. Security and failure modes


| Topic            | Finding                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| Video/audio drop | Graceful degradation; show last known metrics; "Connection unstable" message |
| Malicious input  | Validate frame dimensions, sample rate; timeouts; rate limits                |
| Auth             | Session tokens; optional OAuth for production                                |



| **Decision**                                                                 | **Rationale**                                                  |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Graceful degradation: show last known metrics; "Connection unstable" message | Avoid crashes; user stays informed; metrics degrade, not fail. |
| Validate frame dimensions, sample rate; timeouts; rate limits                | Prevent abuse; bounded resource use.                           |
| Session tokens for MVP; OAuth for production                                 | Minimal auth for demo; OAuth when multi-tenant.                |


**Poor video quality and connectivity**


| Topic               | Finding                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Poor video          | Low res, blur, dim lighting, occlusion; MediaPipe may fail or return low-confidence landmarks |
| Connectivity        | Dropped frames, network stalls; audio/video stream interruptions                              |
| Evaluation criteria | "Handles video quality variations gracefully"; "Fails with video quality issues" penalized    |



| **Decision**                                                                                                                                 | **Rationale**                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Poor video: emit confidence score with metrics; skip or down-sample low-quality frames; show "Video quality low" when confidence < threshold | Avoid false nudges from bad input; user knows when metrics are unreliable; evaluation expects graceful handling. |
| Connectivity: same as existing—last known metrics, "Connection unstable" banner; pause nudge firing when no recent data                      | Consistent with security/failure approach; no new mechanisms; evaluator test scenarios include poor quality.     |


### 2. Testing


| Topic             | Finding                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| Labeled clips     | Create 5–10 clips with known eye contact / talk-time; use for accuracy validation |
| Latency tests     | Instrument pipeline; assert each stage < budget; E2E test with mock clock         |
| Coaching triggers | Unit tests with synthetic metric streams; integration test with recorded session  |



| **Decision**                                                                 | **Rationale**                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 5–10 labeled clips for gaze/talk-time validation before coaching             | Riskiest dependency is gaze accuracy; validate before building on it.      |
| Instrument pipeline; assert per-stage budget; E2E with mock clock            | Latency is a hard requirement; catch regressions early.                    |
| Unit tests (synthetic streams) + integration (recorded session) for coaching | Rule-based triggers are testable; integration catches real-world behavior. |


### 3. Tooling


| Topic             | Finding                                                               |
| ----------------- | --------------------------------------------------------------------- |
| Latency profiling | Chrome DevTools Performance; custom timestamps in pipeline            |
| Logging           | Structured logs (session_id, stage, duration); optional OpenTelemetry |



| **Decision**                                                          | **Rationale**                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Chrome DevTools Performance + custom timestamps in pipeline           | Identify bottlenecks; per-stage timing for latency budget. |
| Structured logs (session_id, stage, duration); OpenTelemetry optional | Debuggable; correlation; OTel when scaling.                |


### 4. Deployment


| Topic       | Finding                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| Target      | Fly.io or LiveKit Cloud (WebRTC required); Docker Compose for one-command |
| One-command | `docker compose up` or `npm run dev` with README                          |
| Monitoring  | Health check; latency percentiles; error rate                             |



| **Decision**                                            | **Rationale**                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Fly.io or LiveKit Cloud** for MVP; Railway unsuitable | WebRTC is required for tutor–student video call. Railway blocks UDP. LiveKit Cloud is managed; Fly.io supports self-hosted LiveKit. |
| `docker compose up` or `npm run dev` with README        | Evaluator-friendly; one-command run.                                                                                                |


### 5. Observability


| Topic     | Finding                                                    |
| --------- | ---------------------------------------------------------- |
| Metrics   | p50/p95 latency per stage; metric update rate; nudge count |
| Debugging | Session replay with stored metrics; correlation IDs        |



| **Decision**                                               | **Rationale**                                      |
| ---------------------------------------------------------- | -------------------------------------------------- |
| p50/p95 latency per stage; metric update rate; nudge count | Key SLIs; catch latency drift and nudge behavior.  |
| Session replay with stored metrics; correlation IDs        | Debug production issues; trace session end-to-end. |


---

## Phase 4: Stretch Goals

*Beyond MVP. Product acts as a **teaching copilot for tutors**, not a replacement.*

Organized by the three deep structural problems in tutoring. **Priority: Engagement > Diagnosis > Memory** (see rationale below).

### Engagement


| Stretch goal                       | Problem addressed                                                                               | Approach                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Passive learning detection         | Student just watches; nods; can't reproduce later; illusion of learning                         | Beyond talk-time: detect "student watching" pattern (low student speech, long tutor monologues); nudge "Try having student explain back"     |
| Session structure + goal alignment | Poor structure (random homework → solve → end); tutor/student/parent solving different problems | Detect homework-help vs learning pattern; detect misalignment from transcript; suggest structure (diagnose → one concept → practice → recap) |
| Student confidence signals         | Math anxiety, "I don't know" responses, learned helplessness; harder to detect online           | Voice/facial cues for disengagement; suggest techniques ("Try: What do you think the first step is?")                                        |


### Diagnosis


| Stretch goal                             | Problem addressed                                                                                                                  | Approach                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Concept diagnosis + prerequisite mapping | Tutors struggle to identify misconceptions, prerequisite gaps, root causes; students jump to advanced material without foundations | LLM + transcript to surface likely conceptual gaps; map to prerequisite concepts; suggest diagnostic questions; flag "student may need X first" |


### Memory


| Stretch goal                        | Problem addressed                                                           | Approach                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Session continuity + learning graph | Next session starts from scratch; no knowledge tracking; ephemeral sessions | Session notes; concept mastery tracking; "Last time you worked on X" at session start; concept graph across sessions |
| Automatic practice generation       | No spaced practice; shallow coverage; low retention                         | Generate practice problems from session content; spaced repetition schedule                                          |


### Feedback loops


| Stretch goal                                   | Problem addressed                                                                      | Approach                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Post-session student summary + retention check | Students leave not knowing what they improved; tutors don't know if explanation worked | Auto-generate "What we covered / what to practice / what's next" for student; optional follow-up (next-session quiz or self-report) |


### Tooling (lower priority for this project)


| Stretch goal           | Problem addressed                                                                                                | Approach                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shared workspace       | Weak whiteboards; no persistent notes; lost session history                                                      | Out of scope for engagement analysis; note as integration opportunity                                                                                        |
| Communication friction | Explaining math/code without good tools; tool-switching; lag; screen share issues; explanations take 2–3× longer | Assess after release; we may not have control over many factors (platform, student setup, network). Determine course of action once we have real usage data. |



| **Decision**                                                   | **Rationale**                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prioritize Engagement > Diagnosis > Memory for stretch roadmap | **Commercial use case:** optimize for customer return. Getting diagnosis faster doesn't help if the student stops using the platform because sessions feel passive or unengaging. Engagement drives retention; diagnosis and memory matter once students keep coming back. |
| Teaching copilot, not replacement                              | Tutors remain in control; AI suggests, tutors decide; aligns with "personalized improvement recommendations" in REQUIREMENTS.                                                                                                                                              |


