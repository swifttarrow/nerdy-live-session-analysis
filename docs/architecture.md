# Architecture Document — SessionLens

*1–2 page overview per PRD submission requirements.*

---

## System Overview

SessionLens is a browser-first, real-time engagement analysis system for live tutoring sessions. It captures face landmarks, gaze direction, and speech activity from each participant's webcam/microphone, computes engagement metrics at 1 Hz, delivers non-intrusive coaching nudges to the tutor, and generates a post-session summary report.

**Design principle:** All computer vision and audio analysis runs in the user's browser. No raw video or audio is sent to a server. This minimizes latency, eliminates per-minute cloud AI costs, and keeps session data local.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) + React 18 | SSR + client components; Vercel-deployable |
| Language | TypeScript | Type safety across pipeline modules |
| Video transport | LiveKit (WebRTC SFU) | Only way to access remote participant's video/audio in browser; handles NAT traversal |
| Face detection | MediaPipe Face Landmarker (WASM + WebGL) | Sub-100 ms per frame; 478-point landmarks; iris detection; runs entirely in browser |
| Voice activity | Silero VAD (`@ricky0123/vad-web`, ONNX Runtime Web) | Per-track VAD without stereo mixing; >95% accuracy on speech detection |
| Metrics validation | Zod | Runtime schema validation for the 1 Hz metrics payload |
| Testing | Vitest | Fast, ESM-native; 147 tests |
| Deployment | Vercel (frontend) + LiveKit Cloud (SFU) | Zero-config deploy; LiveKit Cloud handles TURN/STUN |

---

## Spec-to-Code Mapping

The requirements specify a modular structure. Our implementation maps as follows:

| Spec folder | Implementation |
|-------------|----------------|
| `video-processor/` | `src/lib/video/` — pipeline, face-landmarker, gaze, frame-sampler, smoothing, attention-drift |
| `metrics-engine/` | `src/lib/metrics/` (aggregator) + `src/lib/audio/` (talk-time, interruptions) + `src/lib/energy/` |
| `coaching-system/` | `src/lib/coaching/` — engine, triggers, config, sensitivity, presets |
| `analytics-dashboard/` | `src/app/report/` + `src/lib/post-session/` (summary, trends, flagged-moments, recommendations) |
| `docs/` | `docs/` — architecture, latency, privacy-compliance, development-log |

---

## Component Map

```
Browser (Tutor's tab)
├── ConsentBanner           — pre-session disclosure + opt-in
├── Session Page            — orchestrates all pipelines
│   ├── LiveKit Room        — WebRTC connection; per-participant audio/video tracks
│   ├── Video Pipeline
│   │   ├── FrameSampler    — captures frames from video element at ~5 FPS
│   │   ├── FaceLandmarker  — MediaPipe WASM; detects 478 landmarks per frame
│   │   ├── GazeScore       — derives eye contact score from iris + head pose
│   │   ├── EmaSmoother     — exponential moving average; removes jitter
│   │   └── AttentionDrift  — detects sustained gaze-away (>5s) per participant
│   ├── Audio Pipeline
│   │   ├── Silero VAD      — per-track speech detection
│   │   ├── TalkTime        — accumulates speaking milliseconds; computes %
│   │   ├── InterruptionTracker — detects overlapping speech events
│   │   └── VoiceEnergy     — RMS energy from Web Audio API AnalyserNode
│   ├── Metrics Aggregator  — combines all signals; emits SessionMetrics at 1 Hz
│   ├── Coaching Engine     — rule-based triggers with per-trigger cooldowns
│   └── NudgeToast          — non-intrusive overlay notification
└── Report Page             — post-session summary + recommendations
```

---

## Data Flow

### Real-Time Path (1 Hz, target <500 ms E2E)

```
[Tutor camera]                      [Student camera]
      │                                    │
FrameSampler (~5 FPS)             FrameSampler (~5 FPS)
      │                                    │
FaceLandmarker (MediaPipe)        FaceLandmarker (MediaPipe)
      │                                    │
GazeScore + EmaSmoother           GazeScore + EmaSmoother
      │                                    │
AttentionDrift detector           AttentionDrift detector
      │                                    │
      └────────────┬───────────────────────┘
                   │
[Tutor mic]    MetricsAggregator    [Student mic]
      │         (1 Hz emit)               │
Silero VAD ────────┤──────────── Silero VAD
TalkTime           │             TalkTime
InterruptionTracker│             InterruptionTracker
VoiceEnergy        │             VoiceEnergy
                   │
         SessionMetrics JSON
         {timestamp, session_id,
          metrics: {tutor: {...}, student: {...}}}
                   │
           CoachingEngine
           (rule-based triggers)
                   │
              NudgeToast ──→ Tutor sees nudge
```

### Post-Session Path

```
SessionMetrics[] history
        │
aggregateSessionSummary()
        │
generateRecommendations()   ← rule-based templates (no LLM)
        │
SessionReport JSON
        │
Report Page (browser)
```

---

## Latency Budget

All stages run in the browser; no network round-trip for analysis.

| Stage | p50 | p95 | Budget |
|-------|-----|-----|--------|
| Frame capture | ~0.1 ms | ~0.5 ms | < 1 ms |
| MediaPipe face detection | ~30 ms | ~80 ms | < 200 ms |
| Gaze score derivation | ~0.5 ms | ~1.5 ms | < 10 ms |
| EMA smoothing | ~0.1 ms | ~0.2 ms | < 1 ms |
| Metrics emit + validation | ~0.5 ms | ~1.5 ms | < 5 ms |
| **E2E (frame → metric display)** | **~35 ms** | **~90 ms** | **< 500 ms** |

The 500 ms target is met with ~5.5× headroom. See `docs/latency.md` for instrumentation details.

---

## Metric Methodology

### Eye Contact Score [0–1]
Derived from MediaPipe 478-point landmarks:
- **Iris centering** (60% weight): normalized offset of iris from eye socket center; 1.0 = perfectly centered
- **Head facing** (40% weight): face symmetry (yaw) + nose-midpoint alignment (pitch)
- EMA smoothed (α = 0.55) for responsive feedback; missing-face decays toward 0 so gaze-away shows promptly

### Talk-Time Percent [0–1]
- Silero VAD fires `speechStart` / `speechEnd` per participant audio track
- Milliseconds accumulated per participant; percent = participant_ms / total_ms
- Per-track VAD (LiveKit's per-participant tracks) eliminates need for stereo diarization

### Energy Level [0–1]
- **Voice RMS** (60% weight): `sqrt(mean(buffer²))` from Web Audio API AnalyserNode
- **Expression energy** (40% weight): mouth openness + brow raise from face landmarks
- Null-safe combination; falls back to available signal if one is missing

### Attention Drift (boolean)
- Eye contact score < 0.4 for ≥5 consecutive seconds → drift = true
- Resets immediately when gaze returns (no hysteresis needed; brief glances never accumulate)

### Interruptions
- Real-time: `InterruptionTracker` detects when one participant starts speaking while the other is active
- Post-session: `detectOverlaps()` on VAD segment arrays for batch analysis and classification (productive vs. unproductive)

### Engagement Score (Stretch: Delivery Moderation)
- Current: weighted combination of talk balance (40%), tutor eye contact (20%), student eye contact (40%)
- **Stretch (M31):** Factor instructor delivery quality as moderating variable. Poor delivery (rambling, filler words, disorganized explanations) dampens the score — some "student engagement problems" are tutor-driven. Delivery signals: fluency (filler rate, pause frequency), structure (monologue length, turn-taking), confidence (prosody)

---

## Key Architecture Decisions

### 1. WebRTC + LiveKit (not WebSocket screen share)
`getUserMedia()` only captures the local user's camera. To analyze the remote participant's video, the browser must receive their MediaStreamTrack via WebRTC. LiveKit provides an SFU that routes individual participant tracks, enabling per-participant face detection and VAD without audio mixing.

### 2. Browser-First Processing
All CV and audio analysis runs in WebAssembly/WebGL in the user's browser:
- **Latency**: eliminates server round-trip (~200–500 ms saved)
- **Privacy**: raw video and audio never leave the device
- **Cost**: zero per-minute AI inference cost (see `ai-cost-analysis.md`)
- **Tradeoff**: CPU/GPU load on the client; mitigated by ~5 FPS analysis rate

### 3. MediaPipe (not cloud vision)
Cloud vision APIs (Google Vision, AWS Rekognition) add 200–800 ms latency per frame — incompatible with the 500 ms E2E budget. MediaPipe WASM with WebGL backend achieves p95 < 80 ms in-browser.

### 4. Silero VAD (not transcription)
Full transcription (Whisper, Deepgram) requires either server-side processing or significant client resources. Silero VAD detects speech start/end with >95% accuracy at <10 ms latency — sufficient for talk-time and interruption detection without transcription.

### 5. Rule-Based Coaching (not LLM real-time)
Real-time LLM inference adds 500–2000 ms latency per nudge decision — incompatible with non-intrusive coaching. Rule-based triggers with configurable thresholds and per-trigger cooldowns achieve the same behavioral goals at zero latency and zero cost.

### 6. Fly.io / LiveKit Cloud (not Railway)
Railway does not support UDP, which is required for WebRTC STUN/TURN. LiveKit Cloud handles TURN relay infrastructure; the Next.js frontend deploys to Vercel.

---

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| Gaze accuracy depends on camera angle | Scores may be lower for off-axis setups | EMA smoothing reduces noise; thresholds are calibrated conservatively |
| Eye contact ≠ actual attention | Score measures camera gaze, not cognitive engagement | Combined with talk-time and energy for richer picture |
| VAD misfire on background noise | Talk-time may overcounting | `onVADMisfire` callback resets speaking state |
| MediaPipe requires 478 landmarks | Partial occlusion → null score | EMA "last value" strategy holds previous score |
| Browser energy usage | May increase CPU/temperature on older devices | ~5 FPS analysis rate keeps CPU at ~10–20% on M-series Macs |
| No persistent storage | Session data lives in browser memory | Post-session report displayed immediately; persisting to DB is post-MVP |
