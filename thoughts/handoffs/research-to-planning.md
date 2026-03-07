# Handoff: Research → Planning

**From:** Architecture Research (Pre-Search)  
**To:** Implementation Planning  
**Date:** 2025-03-06

---

## Summary of Research Outputs

| Artifact | Location | Purpose |
|----------|----------|---------|
| Architecture Research | `thoughts/research/architecture-research.md` | Full 7-phase analysis: system understanding, architecture options, technical decisions, diagrams, risks, MVP architecture |
| Pre-Search Checklist | `thoughts/research/pre-search-checklist.md` | Direct answers to PRD Appendix checklist |

---

## Key Decisions (Locked for Planning)

1. **Browser-first architecture** — MediaPipe Face Landmarker in-browser; Silero VAD; metrics + coaching client-side; WebSocket for session state; backend for post-session LLM.
2. **Video:** MediaPipe Face Landmarker (not OpenCV, not cloud) — latency and cost.
3. **Audio:** Silero VAD + channel-based diarization when possible; WhisperLiveKit or GPT-4o Transcribe for single-mic.
4. **Gaze:** MediaPipe landmarks + temporal smoothing; target ≥85%.
5. **Coaching:** Rule-based + state machine; configurable thresholds; cooldowns.
6. **Post-session:** GPT-4o mini for summaries.
7. **Deployment:** Fly.io if WebRTC needed; Railway if browser-only (no video upload).

---

## Constraint Priority (Confirmed)

Speed > Scale > Cost > Privacy

## Video Pipeline Deep Dive

See `thoughts/research/video-pipeline-deep-dive.md` for:
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

1. Video ingestion + frame extraction (browser)
2. Face detection + gaze (MediaPipe)
3. Audio pipeline: VAD + diarization
4. Metrics aggregation + JSON output
5. Coaching engine (2 triggers MVP → 5 full)
6. Post-session (template → LLM)
7. Dashboard / UI
8. Deployment + one-command

---

## Risks to Mitigate in Plan

- Gaze accuracy: include calibration/validation step.
- Railway UDP: confirm browser-only path or plan Fly.io.
- Latency budget: allocate per-stage targets in plan.
