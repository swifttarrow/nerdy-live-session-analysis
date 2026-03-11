# Handoff: Research → Planning

**From:** Architecture Research (Pre-Search)  
**To:** Implementation Planning  
**Date:** 2025-03-06

---

## Summary of Research Outputs

| Artifact | Location | Purpose |
|----------|----------|---------|
| Architecture Research | `docs/research/architecture-research.md` | Full 7-phase analysis: system understanding, architecture options, technical decisions, diagrams, risks, MVP architecture |
| Pre-Search Checklist | `docs/research/pre-search-checklist.md` | Direct answers to PRD Appendix checklist |

---

## Key Decisions (Locked for Planning)

1. **WebRTC/LiveKit required** — Live tutor–student interaction requires both video feeds; `getUserMedia` cannot access remote participant. WebRTC/LiveKit conducts the video call.
2. **Browser-first processing** — MediaPipe Face Landmarker in-browser on both streams; Silero VAD; metrics + coaching client-side; WebSocket for session state; backend for post-session LLM and LiveKit tokens.
3. **Video:** MediaPipe Face Landmarker (not OpenCV, not cloud) — latency and cost. Process local + remote streams separately.
4. **Audio:** Silero VAD + channel-based diarization when possible; WhisperLiveKit or GPT-4o Transcribe for single-mic.
5. **Gaze:** MediaPipe landmarks + temporal smoothing; target ≥85%.
6. **Coaching:** Rule-based + state machine; configurable thresholds; cooldowns.
7. **Post-session:** GPT-4o mini for summaries.
8. **Deployment:** LiveKit Cloud for WebRTC; app can deploy to Vercel, Railway, Fly.io, or any host.

---

## Constraint Priority (Confirmed)

Speed > Scale > Cost > Privacy

## Video Pipeline Deep Dive

See `docs/research/video-pipeline-deep-dive.md` for:
- Frame capture: `requestVideoFrameCallback` + 1–2 fps sampling
- MediaPipe Face Landmarker config and outputs
- Gaze derivation from iris landmarks (no direct API)
- Temporal smoothing (EMA)
- Latency budget (~125 ms total, well under 500 ms)
- Web Worker strategy for non-blocking inference

## Open Questions for Planning

- Exact trigger state machine (cooldowns, debounce).
- Config schema (DB vs env).
- Evaluation harness: format for labeled clips, accuracy scripts.

---

## Recommended Build Order (from Research)

1. WebRTC/LiveKit video call (tutor + student join room; both streams to analysis client)
2. Video ingestion + frame extraction from both streams (browser)
3. Face detection + gaze (MediaPipe, per stream)
4. Audio pipeline: VAD + diarization
5. Metrics aggregation + JSON output
6. Coaching engine (2 triggers MVP → 5 full)
7. Post-session (template → LLM)
8. Dashboard / UI
9. Deployment + one-command (Vercel, Railway, Fly.io, or any host; LiveKit Cloud for WebRTC)

---

## Risks to Mitigate in Plan

- Gaze accuracy: include calibration/validation step.
- WebRTC deployment: use LiveKit Cloud; app can deploy to Vercel, Railway, Fly.io, or any host.
- Latency budget: allocate per-stage targets in plan.
