# Task 001: Voice Energy

## Goal

Extract voice energy/pitch from audio for energy level signal.

## Deliverables

- [x] Compute RMS or spectral features from audio stream
- [x] Output: voice energy score (0–1 or normalized)
- [x] Use Web Audio API; run alongside VAD

## Notes

- Per post-MVP: voice tone contributes to energy level
- Avoid heavy processing; keep latency low

## Verification

- Louder speech → higher energy
- Unit test with synthetic audio
