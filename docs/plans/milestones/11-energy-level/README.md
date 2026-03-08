# Milestone 11: Energy Level

## Overview

Add energy level signal — voice tone + facial expression. PRD optional for MVP; included in post-MVP.

**Source:** [Post-MVP Plan Phase 1.3](../../2025-03-07-sessionlens-post-mvp-draft.md#group-1-audio--metrics-extensions)  
**Est:** 3–4h

## Dependencies

- [ ] Milestone 02: Face Detection & Gaze
- [ ] Milestone 03: Audio Pipeline

## Changes Required

- Voice: energy/pitch from audio (e.g. RMS, spectral features)
- Facial expression: from MediaPipe face landmarks (e.g. mouth openness, brow position)
- Combine into energy level score (0–1 or low/medium/high)
- Add to metrics payload; optional nudge or post-session insight

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit test: synthetic inputs → energy score in expected range

### Manual Verification

- [ ] Energy level updates with speaking intensity and expression
- [ ] Visible in metrics or report

## Tasks

- [001-voice-energy](./tasks/001-voice-energy.md)
- [002-facial-expression](./tasks/002-facial-expression.md)
- [003-combined-score](./tasks/003-combined-score.md)
- [004-metrics-integration](./tasks/004-metrics-integration.md)
