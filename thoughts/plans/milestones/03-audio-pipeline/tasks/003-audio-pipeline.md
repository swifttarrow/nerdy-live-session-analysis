# Task 003: Audio Pipeline

## Goal

Orchestrate Web Audio API → VAD → talk-time; wire to LiveKit audio tracks.

## Deliverables

- [ ] `src/lib/audio/pipeline.ts` — orchestration
- [ ] Connect to LiveKit audio tracks (local + remote)
- [ ] Output: tutor and student talk-time percentages, current_speaking boolean

## Notes

- LiveKit: tutor track (local), student track (remote) — run VAD on each
- Single-mic fallback: document limitation

## Verification

- Pipeline runs; talk-time updates in real time
- Stereo (if available): tutor vs student separation works
