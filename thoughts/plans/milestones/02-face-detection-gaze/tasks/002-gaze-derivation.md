# Task 002: Gaze Derivation

## Goal

Derive eye contact score from iris landmarks and head pose for each detected face.

## Deliverables

- [ ] `src/lib/video/gaze.ts` — derive `eye_contact_score` from iris position + head pose
- [ ] Per video-pipeline-deep-dive.md: use iris landmarks and head orientation
- [ ] Output: score in range 0–1 (0 = looking away, 1 = direct eye contact)

## Notes

- Each stream (tutor, student) processed separately
- Map local stream → tutor, remote → student

## Verification

- Mock landmarks → gaze derivation returns expected score range
- Unit test covers edge cases (no face, partial face)
