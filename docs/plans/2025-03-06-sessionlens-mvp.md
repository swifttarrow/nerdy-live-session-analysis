# SessionLens MVP Implementation Plan

**Engagement model:** See [ONE_PAGER.md](../../ONE_PAGER.md) — basic metrics (eye contact, speaking time) describe what happened; engagement-quality signals (student talk ratio, response latency) infer whether learning is likely.

## Overview

Build SessionLens—a browser-first, real-time engagement intelligence system for **live tutor–student tutoring sessions**. The system must analyze video interactions between both participants. The MVP delivers a video call (WebRTC/LiveKit), video/audio analysis, eye contact and speaking-time metrics (student talk ratio as primary engagement-quality signal), non-intrusive coaching nudges, and a post-session summary within the 24-hour gate requirements.

**Architecture:** WebRTC/LiveKit for the video call (tutor + student); browser-side processing (MediaPipe Face Landmarker, Silero VAD) on both streams; backend for session CRUD, LiveKit tokens, and post-session LLM.

**Fundamental requirement:** Live tutor–student interaction requires both video feeds. `getUserMedia` alone cannot access the remote participant's video—WebRTC/LiveKit is necessary.

---

## Current State Analysis

| Aspect | State |
|--------|-------|
| Codebase | Empty (greenfield) |
| Research | Complete: architecture-research.md, pre-search-checklist.md, video-pipeline-deep-dive.md |
| Decisions | Locked: browser-first processing + WebRTC/LiveKit for video call; MediaPipe, Silero VAD, rule-based coaching |
| Constraints | Latency <500 ms; 1 Hz metric updates; eye contact ≥85%; talk-time ≥95% |

**Key constraints discovered:**
- WebRTC required for tutor–student video call; Railway blocks UDP → deploy to Fly.io or LiveKit Cloud
- MediaPipe `detectForVideo()` is synchronous → consider Web Worker for long sessions
- Diarization with single mic is hard → channel-based when stereo; simplified fallback for MVP

---

## Desired End State

**MVP (24h gate):**
- Live video call between tutor and student (WebRTC/LiveKit)
- Real-time video ingestion with frame extraction from **both** feeds (local + remote)
- Face detection and tracking for both participants
- Two engagement metrics: eye contact score, speaking time balance
- Metric updates at 1 Hz minimum
- Non-intrusive coaching with ≥2 trigger types
- Post-session summary with key metrics and ≥1 improvement recommendation
- Latency <500 ms frame-to-display
- One-command setup and run; clear README
- Deployed and publicly accessible

**Verification:**
- `make test` (or `npm test`) passes
- `make lint` (or `npm run lint`) passes
- Manual: two users join session, conduct call, observe metrics and nudges for both, generate post-session report
- Latency measured via instrumentation

---

## What We're NOT Doing

- Server-side video/audio processing (browser-first processing)
- Cloud vision or cloud transcription for real-time path
- Interruptions detection (defer to post-MVP)
- Energy level, attention drift (defer)
- Full LLM post-session (template first; LLM optional)
- Auth / OAuth (session tokens only for demo)
- Multi-participant (1 tutor : 1 student only)
- Session-type presets (Lecture, Practice, Socratic) — General only

---

## Phase 1: Project Setup & WebRTC/LiveKit Video Call

### Overview

Establish project structure, build tooling, and **WebRTC/LiveKit video call** so tutor and student can join a session. The analysis client must receive both streams: local (own camera) and remote (other participant). Extract frames at 1–2 fps from each stream for downstream processing.

### Changes Required

**New files:**
- `package.json` — Node/React or Vite app; dependencies: `livekit-client` (or `@livekit/components-react`), `@mediapipe/tasks-vision`
- `vite.config.ts` or `next.config.js` — build config
- `src/` — app structure
- `src/lib/livekit/` or `src/lib/webrtc/` — room connection, token fetch
- `src/lib/video/` — frame extraction from video elements
- `src/lib/video/frame-sampler.ts` — 1–2 fps sampling via `requestVideoFrameCallback` or `requestAnimationFrame` with frame skip; accepts `HTMLVideoElement` (local or remote)
- `src/pages/` or `src/app/` — session page with video call UI
- `public/` or `models/` — `face_landmarker.task` (MediaPipe model)
- `README.md` — setup instructions
- `Makefile` or `package.json` scripts — `make run` / `npm run dev`

**Backend (minimal for Phase 1):**
- API route or server endpoint to generate LiveKit access tokens (or use LiveKit Cloud API key)
- `.env.example` — `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (if self-hosted) or LiveKit Cloud credentials

**Key logic:**
- Create/join LiveKit room; tutor and student connect with distinct identities
- Attach local and remote video tracks to `<video>` elements
- Frame sampler: for each video element, process every 15–30 frames at 30 fps → 1–2 Hz
- Output: `VideoFrame` or `ImageData` per stream for downstream MediaPipe
- Role assignment: local participant = tutor (or configurable); remote = student

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (if configured)
- [ ] No TypeScript errors

#### Manual Verification
- [ ] `npm run dev` starts app
- [ ] Two browser tabs/windows: one joins as tutor, one as student
- [ ] Video call works: both see each other
- [ ] Frame sampler logs at 1–2 Hz for both streams (console or debug UI)
- [ ] Graceful handling when camera denied or remote participant disconnects

**Note:** Pause for human confirmation after this phase before proceeding.

---

## Phase 2: Face Detection & Gaze

### Overview

Integrate MediaPipe Face Landmarker; process **each stream** (tutor + student) separately; derive eye contact score from iris landmarks and head pose; apply temporal smoothing (EMA).

### Changes Required

**Files:**
- `src/lib/video/face-landmarker.ts` — MediaPipe Face Landmarker init, `detectForVideo()` wrapper
- `src/lib/video/gaze.ts` — derive `eye_contact_score` from iris position + head pose (per video-pipeline-deep-dive.md)
- `src/lib/video/smoothing.ts` — EMA for score smoothing (α ≈ 0.2–0.3)
- `src/lib/video/pipeline.ts` — orchestrate: per-stream frame → MediaPipe → gaze → smoothing → score; map local stream → tutor, remote → student
- `package.json` — add `@mediapipe/tasks-vision`
- Model: `face_landmarker.task` in `public/` or served via CDN

**Config (from video-pipeline-deep-dive):**
- `numFaces: 1` per stream (each feed has one participant)
- `runningMode: "VIDEO"`
- Downscale to 480p or 640×480 before inference if needed for latency
- GPU delegate when available

**Output:** `{ tutor: { eye_contact_score: 0.85 }, student: { eye_contact_score: 0.78 } }`

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] Unit test: mock landmarks → gaze derivation returns expected score range
- [ ] Latency: instrument pipeline; assert p95 < 500 ms (or document if exceeded)

#### Manual Verification
- [ ] Face detected for both tutor and student; eye contact scores update at 1–2 Hz
- [ ] Looking at camera → score ~0.7–1.0; looking away → score drops
- [ ] No face: graceful degradation (last known or 0)
- [ ] Correct attribution: tutor metrics from local stream, student from remote (or vice versa)

**Note:** Pause for human confirmation after this phase before proceeding.

---

## Phase 3: Audio Pipeline

### Overview

Integrate Silero VAD for voice activity; compute talk-time (channel-based if stereo, or single-speaker fallback). Output speaking balance for tutor vs student.

### Changes Required

**Files:**
- `src/lib/audio/` — audio pipeline
- `src/lib/audio/vad.ts` — Silero VAD (WASM/JS); segment speech vs silence
- `src/lib/audio/talk-time.ts` — aggregate talk-time per channel or single stream
- `src/lib/audio/pipeline.ts` — Web Audio API → VAD → talk-time
- `package.json` — add Silero VAD (e.g. `@ricky0123/vad-web` or equivalent)
- `src/lib/session/` — session context (tutor left, student right, or single-mic)

**Logic:**
- Channel-based: if stereo, left = tutor, right = student; compute % per channel
- Single-mic: show combined "speaking" boolean or single talk-time % (simplified for MVP)
- Output: `{ tutor: { talk_time_percent: 0.65 }, student: { talk_time_percent: 0.35 } }` or equivalent

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] Unit test: synthetic VAD segments → talk-time % in expected range

#### Manual Verification
- [ ] Speaking into mic updates talk-time
- [ ] Stereo (if available): tutor vs student separation works
- [ ] Single-mic: at least combined speaking indicator or simplified ratio
- [ ] No audio: graceful handling

**Note:** Pause for human confirmation after this phase before proceeding.

---

## Phase 4: Metrics & Coaching Engine

### Overview

Aggregate video + audio outputs at 1 Hz; emit JSON metrics payload; implement rule-based coaching engine with ≥2 triggers (e.g. "student silent >45 s", "tutor talk >85%", "low eye contact"); state machine with cooldowns. Aligned with ONE_PAGER.

### Changes Required

**Files:**
- `src/lib/metrics/aggregator.ts` — combine eye contact + talk-time; emit at 1 Hz
- `src/lib/coaching/engine.ts` — rule-based triggers, state machine, cooldowns
- `src/lib/coaching/triggers.ts` — trigger definitions (student_silent, low_eye_contact, tutor_talk_dominant)
- `src/lib/coaching/config.ts` — thresholds (in-memory for MVP): `student_silent_sec: 45`, `tutor_talk_threshold: 0.85`, `eye_contact_threshold: 0.5`, etc. (ONE_PAGER)
- `src/lib/session/metrics-schema.ts` — Zod schema for metrics payload (optional but recommended)

**Metrics payload (from PRD):**
```json
{
  "timestamp": "2024-01-15T14:32:45Z",
  "session_id": "session_123",
  "metrics": {
    "tutor": { "eye_contact_score": 0.85, "talk_time_percent": 0.65, "current_speaking": true },
    "student": { "eye_contact_score": 0.78, "talk_time_percent": 0.35, "current_speaking": false }
  }
}
```

**Triggers (≥2 for MVP; ONE_PAGER-aligned):**
1. Student silent >45 s → "Student has been silent for 45 seconds" / "Check for understanding"
2. Tutor talk >85% → "Tutor speaking 85% of time" / "Try asking a question"
3. Low eye contact (<0.5 for 30s) → "Student may be distracted" or "Try making more eye contact"
4. (Optional, post-MVP) Student hesitating repeatedly → "Student hesitating repeatedly" (response latency)

**Delivery:** Subtle visual (corner badge, icon pulse, toast); non-intrusive.

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] Unit tests: synthetic metric streams → triggers fire at expected times; cooldowns respected
- [ ] `npm test` passes

#### Manual Verification
- [ ] Metrics update at 1 Hz in UI
- [ ] Nudge fires when student silent 45+ s (or simulated)
- [ ] Nudge fires when eye contact low for 30s
- [ ] Nudges are subtle (no modal)
- [ ] Cooldown prevents spam

**Note:** Pause for human confirmation after this phase before proceeding.

---

## Phase 5: Post-Session Summary

### Overview

Generate post-session summary with key metrics and ≥1 improvement recommendation. Start with template-based; optional LLM (GPT-4o mini) if time permits.

### Changes Required

**Files:**
- `src/lib/post-session/summary.ts` — aggregate session metrics, generate summary
- `src/lib/post-session/recommendations.ts` — template-based recommendations (e.g. "Increase student talk time" when tutor >85%)
- `src/lib/post-session/report.ts` — combine summary + recommendations; output JSON or structured object
- `src/pages/report.tsx` or similar — display report

**Template structure (ONE_PAGER post-session analytics):**
- Key metrics: engagement score, eye contact avg, tutor talk balance (student talk ratio), moments of confusion/frustration, persistence patterns, session duration
- At least one recommendation: e.g. "Student spoke 20% of the time. Consider asking more open-ended questions to increase engagement."
- Optional: LLM call with metrics + brief context for richer text

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] Unit test: mock session data → report contains expected fields and ≥1 recommendation

#### Manual Verification
- [ ] End session → report displays
- [ ] Report shows key metrics
- [ ] Report includes ≥1 actionable recommendation
- [ ] Recommendation is relevant to metrics (e.g. low student talk → suggest questions)

**Note:** Pause for human confirmation after this phase before proceeding.

---

## Phase 6: Dashboard & UI

### Overview

Build session UI: live metrics display, nudge toasts, session start/end flow, consent/disclosure. Ensure non-intrusive coaching delivery.

### Changes Required

**Files:**
- `src/components/` — reusable components
- `src/components/MetricsDisplay.tsx` — live eye contact + talk-time
- `src/components/NudgeToast.tsx` — subtle nudge display
- `src/components/ConsentBanner.tsx` — pre-session consent and disclosure
- `src/pages/session.tsx` — main session view: video feeds, metrics, nudges
- `src/App.tsx` or routing — session → report flow
- Styling (CSS/Tailwind) — minimal, readable

**UX:**
- Consent before analysis starts
- Video call view: tutor + student feeds (local + remote)
- Live metrics for both participants side-by-side or overlay
- Nudges: corner badge or small toast; auto-dismiss
- End session button → navigate to report

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

#### Manual Verification
- [ ] Consent shown before session
- [ ] Live metrics visible and updating
- [ ] Nudges appear when triggers fire; not disruptive
- [ ] End session → report loads
- [ ] Responsive on desktop; acceptable on smaller screens

**Note:** Pause for human confirmation after this phase before proceeding.

---

## Phase 7: Deployment & Polish

### Overview

One-command setup and run; clear README; deploy to **Fly.io or LiveKit Cloud** (WebRTC required; Railway blocks UDP); publicly accessible URL.

### Changes Required

**Files:**
- `README.md` — setup (Node version, `npm install`, `npm run dev`), one-command run, deployment notes, LiveKit env vars
- `package.json` — `"scripts": { "dev": "...", "build": "...", "start": "...", "setup": "npm install" }`
- `Dockerfile` (optional) — for containerized run
- `fly.toml` — Fly.io deployment (if self-hosting LiveKit or backend)
- `.env.example` — `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (or LiveKit Cloud equivalents)
- `Makefile` — `make run` = `npm run dev` or `docker compose up`

**Deployment:**
- **Fly.io** or **LiveKit Cloud** — WebRTC requires UDP; Railway is unsuitable
- LiveKit Cloud: use managed service; no self-hosted TURN
- Ensure HTTPS for `getUserMedia` and WebRTC (required in production)
- Backend: token generation for LiveKit room access
- Public URL shared for evaluation

### Success Criteria

#### Automated Verification
- [ ] `npm run build` succeeds
- [ ] Fresh clone: `git clone` → `npm install` → `npm run dev` works
- [ ] `make run` or documented one-command succeeds

#### Manual Verification
- [ ] README is clear; evaluator can run without prior context
- [ ] Deployed app is publicly accessible
- [ ] Video call works in production (HTTPS): two users can join and see each other
- [ ] Full flow: consent → join room → video call → metrics for both → nudges → end → report

**Note:** Pause for human confirmation after this phase before proceeding.

---

## References

- Engagement model: `ONE_PAGER.md`
- Research: `docs/research/architecture-research.md`
- Pre-Search: `docs/research/pre-search-checklist.md`
- Video Pipeline: `docs/research/video-pipeline-deep-dive.md`
- Handoff: `docs/handoffs/research-to-planning.md`
- PRD: `docs/PRD.md`
- Requirements: `docs/REQUIREMENTS.md`
