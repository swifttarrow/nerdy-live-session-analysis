# SessionLens Architecture Research

**Pre-Search / Architecture Discovery for Real-Time Engagement Intelligence**

*Source: PRD (thoughts/PRD.md), Requirements (thoughts/REQUIREMENTS.md)*  
*Scope: Full feature set (not MVP-only)*

---

## Phase 1 — System Understanding

### Project Summary (5–10 Bullets)

- **Purpose:** Real-time engagement intelligence for live tutoring—analyze video/audio, measure eye contact, speaking time, interruptions, energy, attention drift; deliver non-intrusive coaching nudges and post-session analytics.
- **Core loop:** Tutor + student in video call → frames/audio ingested → face/gaze + VAD/diarization → metrics aggregated at 1–2 Hz → coaching engine fires nudges → post-session summary + recommendations.
- **Primary components:** Video pipeline (frame extraction, face detection, gaze), audio pipeline (VAD, diarization, talk-time), metrics engine, coaching engine, post-session LLM summarization, dashboard/UI.
- **Hardest challenges:** Sub-500 ms latency end-to-end; eye contact accuracy ≥85% on webcam; speaker diarization (tutor vs student) with ≥95% talk-time accuracy; graceful degradation on poor video/audio.
- **Scale:** 100 → 10K → 100K sessions/day; 30 min avg session; 720p @ 30 fps; 99.5%+ uptime.
- **Latency:** <500 ms frame-to-metric; 1–2 Hz metric updates; coaching nudges timely and non-disruptive.
- **External dependencies:** MediaPipe/OpenCV or cloud vision; Vosk/Whisper or cloud transcription; LLM for post-session summaries; WebRTC or WebSocket for streaming; deployment (Railway, Fly.io, etc.).
- **AI/LLM:** Gaze/face (CV models); transcription + diarization (Whisper/Vosk or cloud); post-session summarization and recommendations (GPT-4o mini or similar).

---

### Hard Problems

| # | Problem | Why It's Difficult |
|---|---------|--------------------|
| 1 | **Sub-500 ms latency** | Frame capture → face/gaze → metrics → display spans multiple stages; network, encoding, and inference add up; cloud APIs add round-trip; browser vs server tradeoffs. |
| 2 | **Eye contact accuracy ≥85%** | Webcam quality, lighting, head pose, camera angle vary; MediaPipe/gaze models trained on different conditions; calibration for “looking at camera” is non-trivial. |
| 3 | **Speaker diarization (tutor vs student)** | Two-speaker diarization is easier than N-speaker but still needs robust VAD + labeling; local (Vosk/Whisper) vs cloud latency/cost; overlap detection adds complexity. |
| 4 | **Talk-time accuracy ≥95%** | Depends on diarization quality; VAD false positives/negatives; segment boundaries; real-time vs batch processing tradeoffs. |
| 5 | **Coaching nudge timing** | Avoid fatigue; configurable thresholds; contextual triggers (e.g., “student silent 3 min” vs “low eye contact 30 s”); non-disruptive delivery. |
| 6 | **Graceful degradation** | Poor video (low res, dropped frames), poor audio, connectivity issues; system must not crash and should degrade metrics gracefully. |
| 7 | **Deployment & one-command run** | WebRTC needs UDP/TURN; Railway blocks inbound UDP; Fly.io more flexible; Docker/Compose for evaluators; persistent processes for stateful connections. |
| 8 | **Privacy & consent** | What is captured, retained, who can access; retention policies; compliance (e.g., FERPA, COPPA for minors). |

---

## Phase 2 — Architecture Exploration

### Architecture A: Browser-First (Client-Side Processing)

**High-Level Design**

- Video/audio captured in browser via `getUserMedia`; MediaPipe Face Landmarker runs in-browser (WebAssembly).
- Silero VAD + lightweight diarization (e.g., channel-based: tutor left, student right) or simple heuristics in Web Workers.
- Metrics aggregated in main thread; coaching engine runs client-side; WebSocket to backend for session state, nudges config, and post-session upload.
- Post-session: upload metrics + optional transcript to backend; LLM summarization server-side.

**Key Components**

- Frontend: React/Vue/Svelte + MediaPipe Tasks Vision (Face Landmarker), Web Audio API, Web Workers.
- Backend: Node.js/Python API for session CRUD, config, post-session LLM calls.
- Database: PostgreSQL (sessions, metrics, config); Redis optional for real-time state.
- Storage: S3 or equivalent for recordings/artifacts if needed.

**Data Flow**

```
User (webcam/mic) → Browser
  → MediaPipe Face Landmarker (in-browser)
  → Gaze/eye contact score
  → Web Audio → Silero VAD (WASM/JS) → talk-time
  → Metrics aggregation (1–2 Hz)
  → Coaching engine (client)
  → UI (metrics + nudges)
  → WebSocket: session state, config
  → Post-session: upload → LLM summarization → report
```

**Strengths**

- Lowest latency (no server round-trip for CV).
- No video/audio egress to server (privacy-friendly).
- Scales with users (compute on client).
- Bonus points for browser-based implementation.

**Weaknesses**

- Gaze accuracy may be lower than server-side models; limited to browser-supported models.
- Diarization without clear channel separation is hard (two people on same mic).
- Heavier client; older devices may struggle.
- Post-session still needs backend + LLM.

**Best Use Case**

- MVP and demos where latency is paramount; single-user or small-scale; privacy-sensitive; evaluator runs locally.

---

### Architecture B: Server-Side Pipeline (Centralized Processing)

**High-Level Design**

- WebRTC or WebSocket sends video/audio to server; LiveKit or custom SFU ingests streams.
- Server runs MediaPipe/OpenCV (Python) or cloud vision for face/gaze; Whisper/Vosk or cloud for transcription + diarization.
- Metrics engine aggregates; coaching engine runs server-side; pushes nudges via WebSocket.
- Post-session: LLM summarization on server; store in PostgreSQL + object storage.

**Key Components**

- Frontend: React/Vue; WebRTC client (LiveKit JS SDK or raw); WebSocket for metrics/nudges.
- Backend: Python FastAPI or Node.js; video/audio workers (process frames, run VAD/diarization).
- LiveKit Server (or similar) for WebRTC SFU; Redis for room state.
- PostgreSQL: sessions, metrics, config; S3: recordings, artifacts.
- Queue: Redis/RabbitMQ for async jobs (post-session LLM).

**Data Flow**

```
User → WebRTC → LiveKit SFU → Server
  → Frame extraction (1–2 fps for metrics)
  → MediaPipe / cloud vision → face, gaze
  → Audio → VAD → diarization → talk-time
  → Metrics aggregation
  → Coaching engine
  → WebSocket push (metrics + nudges)
  → Frontend display
  → Post-session: LLM → report → DB + storage
```

**Strengths**

- Full control over models (Python CV stack, Whisper, etc.).
- Richer diarization (Whisper with diarization, pyannote, etc.).
- Centralized config, logging, observability.
- Easier to swap cloud vs local models.

**Weaknesses**

- Higher latency (network + server inference).
- Video/audio egress; privacy and bandwidth concerns.
- Server cost scales with concurrent sessions.
- Railway UDP limitations complicate WebRTC.

**Best Use Case**

- Production at scale; need best accuracy; willing to pay for cloud APIs; have control over deployment (Fly.io, AWS, etc.).

---

### Architecture C: Hybrid (Edge + Cloud)

**High-Level Design**

- Browser runs lightweight face detection + VAD; sends only metadata (face bbox, VAD segments) or downsampled frames to server.
- Server runs gaze estimation, diarization, metrics aggregation, coaching.
- Reduces bandwidth vs full video upload; keeps heavy diarization/LLM server-side.

**Key Components**

- Frontend: MediaPipe Face Detector (lightweight) + Silero VAD; sends compact payloads.
- Backend: Gaze model, diarization (Whisper/pyannote), metrics, coaching, LLM.
- Database, storage, queue as in Architecture B.

**Data Flow**

```
User → Browser
  → Face detection (light) + VAD
  → Send: bboxes, VAD segments, optional low-res frames
  → Server: gaze, diarization, metrics, coaching
  → WebSocket: metrics + nudges
  → Post-session: LLM → report
```

**Strengths**

- Lower bandwidth than full video upload.
- Server retains control over accuracy-critical pieces.
- Compromise between latency and capability.

**Weaknesses**

- More complex; two codebases (browser + server) for CV.
- Gaze from low-res or bbox-only may be less accurate.
- Still need server round-trip for metrics.

**Best Use Case**

- Bandwidth-constrained or privacy-conscious production; need server-side diarization but want to limit video upload.

---

## Phase 3 — Deep Technical Decisions

### Decision 1: Video Processing Location (Browser vs Server)

| Option | Description | Complexity | Latency | Cost | Maintainability | Scalability |
|--------|-------------|------------|---------|------|-----------------|-------------|
| **A: Browser** | MediaPipe Face Landmarker in-browser | Low | Best (~50–100 ms) | Zero inference cost | Medium (browser quirks) | Excellent |
| **B: Server** | Python MediaPipe/OpenCV on server | Medium | Higher (150–400 ms) | Server compute | High | Limited by server |
| **C: Cloud** | Google Vision / AWS Rekognition | Low | Highest (200–500 ms+) | $1–1.50/1K images | High | Good |

**Recommendation:** **Browser-first** for MVP and full build. MediaPipe Face Landmarker achieves real-time performance and ~90%+ gaze accuracy in studies; keeps latency under 500 ms. Add server-side fallback only if browser accuracy is insufficient.

---

### Decision 2: Audio Pipeline (VAD + Diarization)

| Option | Description | Complexity | Latency | Cost | Accuracy |
|--------|-------------|------------|---------|------|----------|
| **A: Silero VAD + channel-based** | Tutor/student on separate channels (stereo or separate streams) | Low | ~1 ms (VAD) | Free | High if channels clean |
| **B: Whisper + diarization** | WhisperLiveKit, pyannote, or GPT-4o Transcribe with diarization | Medium | 100–500 ms | $0.006/min (Whisper) | High |
| **C: Vosk + custom diarization** | Local Vosk + speaker embedding clustering | Medium | 50–200 ms | Free | Variable |

**Recommendation:** **Silero VAD + channel-based** when possible (e.g., separate mics or stereo). For single-mic: **WhisperLiveKit** or **GPT-4o Transcribe with Diarization** ($0.006/min) for best accuracy. Vosk for fully local, lower cost, with more tuning.

---

### Decision 3: Gaze / Eye Contact Estimation

| Option | Description | Accuracy | Latency | Calibration |
|--------|-------------|----------|---------|-------------|
| **A: MediaPipe Face Landmarker** | 468 landmarks, iris; derive gaze from geometry | ~85–91% (webcam) | <50 ms | Minimal |
| **B: MediaPipe + Kalman filter** | Smoothing for head movement | Slightly better | +5–10 ms | Low |
| **C: Custom CNN (e.g., Gaze360)** | Research models, unconstrained gaze | Higher potential | Higher | More |

**Recommendation:** **MediaPipe Face Landmarker** with simple temporal smoothing (e.g., exponential moving average). Meets 85% target; add Kalman if jitter is an issue.

---

### Decision 4: Real-Time Transport (WebRTC vs WebSocket)

| Option | Description | Latency | Complexity | Deployment |
|--------|-------------|---------|------------|------------|
| **A: WebRTC** | RTP/UDP, sub-500 ms | Best | High | Needs UDP/TURN; Railway limited |
| **B: WebSocket + MediaRecorder** | Chunked video/audio over WS | Higher | Medium | Works on Railway |
| **C: LiveKit Cloud** | Managed WebRTC | Best | Low | Paid; no self-host UDP issues |

**Recommendation:** **WebSocket + MediaRecorder** for MVP (Railway-friendly). For production with best latency: **Fly.io + LiveKit self-hosted** or **LiveKit Cloud**. WebRTC preferred when UDP is available.

---

### Decision 5: Coaching Engine Design

| Option | Description | Flexibility | Latency | Fatigue Risk |
|--------|-------------|-------------|---------|--------------|
| **A: Rule-based thresholds** | Configurable thresholds (e.g., silent >3 min, eye contact <0.5) | High | Minimal | Medium (tuning) |
| **B: Time-windowed state machine** | States per trigger type; cooldowns | High | Minimal | Low |
| **C: LLM-based (real-time)** | LLM decides when to nudge | Medium | High | Low (context-aware) |

**Recommendation:** **Rule-based + state machine** with cooldowns and configurable thresholds. Store config in DB; no code changes for tuning. LLM only for post-session recommendations.

---

### Decision 6: Post-Session Summarization

| Option | Description | Cost | Quality |
|--------|-------------|------|---------|
| **A: GPT-4o mini** | Summarize metrics + transcript | ~$0.15/1M in, $0.60/1M out | Good |
| **B: GPT-4o** | Richer reasoning | ~$2.50/1M in, $10/1M out | Best |
| **C: Template-based** | No LLM; fill template from metrics | Free | Adequate |

**Recommendation:** **GPT-4o mini** for cost-effective summaries and recommendations. ~500 tokens in (metrics + transcript summary), ~300 out ≈ $0.0002/session.

---

### Decision 7: Deployment Target

| Option | Description | WebRTC | Cost | One-Command |
|--------|-------------|--------|------|-------------|
| **A: Railway** | Easy deploy; no inbound UDP | Limited | ~$5–20/mo | Yes |
| **B: Fly.io** | Full UDP; global | Yes | ~$5–30/mo | Yes |
| **C: Vercel + separate worker** | Serverless + persistent worker | No (worker elsewhere) | Variable | More complex |

**Recommendation:** **Fly.io** for full WebRTC support and one-command Docker deploy. **Railway** if browser-based processing makes WebRTC unnecessary (video stays in browser).

---

## Phase 4 — System Diagram

### Recommended: Browser-First Architecture (MVP + Full)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser (Client)                               │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ getUserMedia│  │ MediaPipe Face   │  │ Web Audio   │  │ Silero VAD │ │
│  │ (video/audio)│→│ Landmarker      │→ │ API         │→ │ (WASM/JS)  │ │
│  └─────────────┘  │ (gaze, landmarks)│  └─────────────┘  └─────┬──────┘ │
│                   └──────────────────┘                           │       │
│                            │                                    │       │
│                            ▼                                    ▼       │
│                   ┌─────────────────────────────────────────────────┐   │
│                   │         Metrics Aggregator (1–2 Hz)              │   │
│                   │  eye_contact, talk_time, interruptions, etc.  │   │
│                   └─────────────────────────┬─────────────────────┘   │
│                                             │                         │
│                   ┌─────────────────────────▼─────────────────────┐   │
│                   │         Coaching Engine (rule-based)          │   │
│                   │  triggers, cooldowns, configurable thresholds │   │
│                   └─────────────────────────┬─────────────────────┘   │
│                                             │                         │
│                   ┌─────────────────────────▼─────────────────────┐   │
│                   │         UI: Metrics + Nudges                 │   │
│                   └──────────────────────────────────────────────┘   │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Backend (Server)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Session API │  │ Config Store│  │ PostgreSQL  │  │ Object Storage  │ │
│  │ (CRUD)      │  │ (thresholds)│  │ (sessions,  │  │ (recordings,    │ │
│  └──────┬──────┘  └─────────────┘  │  metrics)   │  │  artifacts)     │ │
│         │                          └─────────────┘  └─────────────────┘ │
│         │                                                               │
│         │  Post-session upload (metrics + transcript)                    │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              LLM Service (GPT-4o mini)                           │   │
│  │  Summarization, recommendations, improvement plan               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Server-Side Alternative (When Server Processing Required)

```
User (WebRTC)
 │
 ▼
LiveKit SFU / WebSocket
 │
 ├── Video Frames (1–2 fps) ──→ MediaPipe / Cloud Vision ──→ Face, Gaze
 │
 ├── Audio Stream ──→ Silero VAD ──→ Whisper/Diart ──→ Diarization, Talk-Time
 │
 ▼
Metrics Aggregator ──→ Coaching Engine ──→ WebSocket Push
 │
 ▼
Post-Session ──→ LLM ──→ Report ──→ PostgreSQL + S3
```

---

## Phase 5 — Risks & Unknowns

### Top Technical Risks

1. **Gaze accuracy below 85%** on diverse webcams/lighting; may require calibration or fallback to server-side model.
2. **Diarization with single mic** — tutor and student on same channel may not reach 95% talk-time accuracy without strong models.
3. **Railway UDP block** — prevents native WebRTC TURN; forces WebSocket or browser-only processing.
4. **Latency budget overflow** — frame capture (33 ms) + inference (50–100 ms) + aggregation (50 ms) + render (16 ms) can exceed 500 ms under load.
5. **Browser compatibility** — MediaPipe, WebCodecs, Web Workers vary across Safari/Firefox/Chrome.
6. **Notification fatigue** — poorly tuned thresholds could make nudges annoying; needs config and testing.

### Unknowns Worth Researching

- MediaPipe Face Landmarker gaze-to-camera mapping for “eye contact” definition (angle threshold, distance).
- WhisperLiveKit vs pyannote vs GPT-4o Transcribe diarization accuracy on tutoring-style audio.
- Fly.io UDP behavior and TURN setup for WebRTC in production.
- Actual frame rate needed for 1–2 Hz metric updates (e.g., 1 fps may suffice vs 5 fps).

### Fast Experiments

1. **Gaze baseline:** Run MediaPipe Face Landmarker on 5–10 labeled clips (looking at camera vs away); measure accuracy.
2. **Latency budget:** Instrument each stage (capture → inference → aggregation → render); identify bottleneck.
3. **VAD + channel:** If stereo or dual-mic possible, test Silero VAD + channel-based talk-time; measure error vs ground truth.
4. **WhisperLiveKit:** Run with tiny.en + diarization on 5 min sample; measure latency and diarization quality.
5. **Browser load:** Profile MediaPipe + VAD on mid-range laptop; check CPU and frame drops.

---

## Phase 6 — MVP Architecture

**Simplified architecture for fastest path to working demo:**

### What to Build First

1. **Browser video pipeline:** `getUserMedia` → MediaPipe Face Landmarker → gaze score (simplified: head pose or iris direction).
2. **Browser audio pipeline:** Web Audio → Silero VAD (or simple energy threshold) → talk-time per channel if stereo; else single-speaker VAD only for MVP.
3. **Metrics aggregator:** 1 Hz; output JSON with `eye_contact_score`, `talk_time_percent` for tutor/student.
4. **Coaching engine:** 2 triggers — “student silent >3 min”, “low eye contact”; rule-based; config in memory.
5. **Post-session:** Template-based summary (no LLM) or minimal LLM call.
6. **UI:** Simple dashboard with live metrics + nudge toasts.
7. **Backend:** Minimal — session create/finish, store metrics; optional WebSocket for config.

### What to Fake or Defer

- **Diarization:** Use channel-based if stereo; else show combined talk-time or “speaking” boolean only.
- **Interruptions:** Defer to post-MVP.
- **Energy level, attention drift:** Defer.
- **Full LLM post-session:** Start with template; add LLM when stable.
- **WebRTC:** Use `getUserMedia` only; no SFU for MVP.

### What to Simplify

- Single-page app; no auth for demo.
- In-memory or SQLite for sessions.
- No recording storage initially.
- Fixed thresholds; no DB-backed config for MVP.

> *"A simple pipeline with reliable metrics beats a complex pipeline with broken latency."*

---

## Phase 7 — Iteration Mode

### Decisions (Confirmed)

1. **Constraint priority:** Speed > Scale > Cost > Privacy
2. **Architecture:** Browser-first
3. **Deep dive completed:** Video pipeline → [`thoughts/research/video-pipeline-deep-dive.md`](video-pipeline-deep-dive.md)

### Implications

- **Speed:** Prioritize latency (browser-side CV, frame sampling, Web Worker if needed); avoid cloud round-trips.
- **Scale:** Browser-first scales with users (client compute); backend stays lightweight.
- **Cost:** Already minimized by browser processing; LLM only for post-session.
- **Privacy:** Video/audio stays local; no server upload for analysis.

### Remaining Deep Dives (Optional)

- Audio pipeline (diarization, VAD)
- Coaching engine (state machine, config schema)
- Evaluation harness (labeled clips, accuracy scripts)
- Deployment (Fly.io vs Railway, Docker Compose)
- Observability (latency tracing, metric logging)

---

## Appendix: AI Cost Analysis (Preliminary)

### Assumptions

- Average session: 30 min
- Video: 720p @ 30 fps; analyze at 1–2 fps → ~1,800–3,600 frames/session
- Audio: 30 min → Whisper if used: $0.006/min × 30 = $0.18/session
- Post-session LLM: GPT-4o mini, ~800 tokens/session ≈ $0.0002/session
- Storage: 30 min recording ~500 MB compressed; S3 Standard $0.023/GB-month

### Development & Testing

| Item | Est. Cost |
|------|-----------|
| Whisper API (testing) | $5–20 |
| GPT-4o mini (summaries) | $1–5 |
| Cloud Vision (if tested) | $5–15 |
| **Total dev** | **~$15–50** |

### Production Projections (Browser-First, No Video Upload)

| Users (sessions/day) | 100 | 1K | 10K | 100K |
|----------------------|-----|-----|------|------|
| Video processing | $0 | $0 | $0 | $0 |
| LLM / summarization | ~$20 | ~$200 | ~$2K | ~$20K |
| Storage (metrics, reports) | ~$1 | ~$10 | ~$100 | ~$1K |
| **Total estimated** | **~$25** | **~$220** | **~$2.1K** | **~$21K** |

### Production Projections (Server-Side with Video/Audio Upload)

| Users (sessions/day) | 100 | 1K | 10K | 100K |
|----------------------|-----|-----|------|------|
| Video (cloud vision @ 2 fps) | ~$270 | ~$2.7K | ~$27K | ~$270K |
| Whisper transcription | ~$1.8K | ~$18K | ~$180K | ~$1.8M |
| LLM summarization | ~$20 | ~$200 | ~$2K | ~$20K |
| Storage (recordings) | ~$350 | ~$3.5K | ~$35K | ~$350K |
| **Total estimated** | **~$2.5K** | **~$24K** | **~$244K** | **~$2.4M** |

*Browser-first dramatically reduces cost by avoiding video/audio upload and cloud vision/transcription.*

---

## References

- MediaPipe Face Landmarker: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js
- Silero VAD: https://github.com/snakers4/silero-vad
- WhisperLiveKit: Real-time STT + diarization
- Google Cloud Vision pricing: $1.50/1K images
- OpenAI Whisper: $0.006/min; GPT-4o Transcribe with Diarization: $0.006/min
- WebRTC vs WebSocket: WebRTC sub-500 ms; WebSocket higher latency
- LiveKit self-hosting: UDP 50000–60000, TURN; Railway blocks inbound UDP
- S3 Standard: ~$0.023/GB-month
