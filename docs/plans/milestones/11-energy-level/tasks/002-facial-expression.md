# Task 002: Facial Expression

## Goal

Extract facial expression cues from MediaPipe face landmarks for energy level.

## Deliverables

- [ ] Use mouth openness, brow position from face landmarks
- [ ] Output: expression energy score (0–1)
- [ ] Map to engagement/energy (e.g. animated vs. flat)

## Notes

- MediaPipe Face Landmarker provides landmark positions
- Per post-MVP: facial expression contributes to energy

## Verification

- More animated expression → higher score
- Unit test with mock landmarks
