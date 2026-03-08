# Task 001: Instrument Pipeline

## Goal

Add latency instrumentation to pipeline stages.

## Deliverables

- [ ] Timing for: frame capture, MediaPipe, gaze, smoothing, metrics emission
- [ ] Per-stage duration logged or exposed
- [ ] Optional: performance marks for DevTools

## Notes

- Target: <500 ms frame-to-display (per plan)
- Non-blocking; minimal overhead

## Verification

- Instrumentation produces timing data
- Can compute p50/p95 from runs
