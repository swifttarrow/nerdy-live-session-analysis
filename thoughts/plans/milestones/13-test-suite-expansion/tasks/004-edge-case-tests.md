# Task 004: Edge Case Tests

## Goal

Add tests for edge cases: no face, no audio, poor video, dropped frames.

## Deliverables

- [ ] No face: pipeline degrades gracefully; no crash
- [ ] No audio: talk-time handles; VAD silent
- [ ] Poor video quality: face detection may fail; graceful fallback
- [ ] Dropped frames: pipeline continues; no accumulation

## Notes

- REQUIREMENTS: "Handles edge cases"
- Target: 4+ edge case tests

## Verification

- `npm test` passes
- 15+ total tests
- Edge cases documented
