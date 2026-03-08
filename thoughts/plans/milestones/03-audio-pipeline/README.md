# Milestone 03: Audio Pipeline

## Overview

Integrate Silero VAD for voice activity; compute talk-time (channel-based if stereo, or single-speaker fallback). Output speaking balance for tutor vs student.

**Source:** [MVP Plan Phase 3](../../2025-03-06-sessionlens-mvp.md#phase-3-audio-pipeline)

## Dependencies

- [ ] Milestone 01: Project Setup & WebRTC

## Changes Required

- `src/lib/audio/vad.ts` — Silero VAD (WASM/JS); segment speech vs silence
- `src/lib/audio/talk-time.ts` — aggregate talk-time per channel or single stream
- `src/lib/audio/pipeline.ts` — Web Audio API → VAD → talk-time
- `src/lib/session/` — session context (tutor left, student right, or single-mic)
- `package.json` — add Silero VAD (e.g. `@ricky0123/vad-web` or equivalent)

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit test: synthetic VAD segments → talk-time % in expected range

### Manual Verification

- [ ] Speaking into mic updates talk-time
- [ ] Stereo (if available): tutor vs student separation works
- [ ] Single-mic: at least combined speaking indicator or simplified ratio
- [ ] No audio: graceful handling

## Tasks

- [001-vad-integration](./tasks/001-vad-integration.md)
- [002-talk-time-aggregation](./tasks/002-talk-time-aggregation.md)
- [003-audio-pipeline](./tasks/003-audio-pipeline.md)
- [004-session-context](./tasks/004-session-context.md)
- [005-unit-tests](./tasks/005-unit-tests.md)
