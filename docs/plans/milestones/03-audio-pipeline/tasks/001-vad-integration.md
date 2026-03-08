# Task 001: VAD Integration

## Goal

Integrate Silero VAD for voice activity detection; segment speech vs silence from audio stream.

## Deliverables

- [ ] `src/lib/audio/vad.ts` — Silero VAD wrapper
- [ ] Use `@ricky0123/vad-web` or equivalent (WASM/JS)
- [ ] Web Audio API → VAD; output speech/silence segments

## Notes

- Diarization with single mic is hard → channel-based when stereo; simplified fallback for MVP
- LiveKit: each participant has own audio track → VAD per track

## Verification

- VAD detects speech when speaking; silence when not
- No audio: graceful handling
