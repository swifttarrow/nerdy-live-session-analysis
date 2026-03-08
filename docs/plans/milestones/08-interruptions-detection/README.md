# Milestone 08: Interruptions Detection

## Overview

Detect and count speaking overlaps (tutor and student talking at the same time). VAD per LiveKit track → overlap count + directional attribution (who interrupted whom).

**Source:** [Post-MVP Plan Phase 1.1](../../2025-03-07-sessionlens-post-mvp-draft.md#group-1-audio--metrics-extensions)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 07: Deployment & Polish (MVP complete)
- [ ] Milestone 03: Audio Pipeline (VAD per track)

## Changes Required

- Run VAD on tutor track and student track independently
- Overlap = both have speech in same time window (e.g. 100–200 ms)
- Count overlapping windows; aggregate per session
- Directional attribution: who interrupted whom (student→tutor vs tutor→student)

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit test: synthetic VAD segments → overlap count correct
- [ ] Unit test: directional attribution correct

### Manual Verification

- [ ] Overlap count updates when both speak simultaneously
- [ ] Direction (who interrupted whom) logged or displayed
- [ ] Single-mic: document "interruptions N/A" and show 0 or omit

## Tasks

- [001-overlap-detection](./tasks/001-overlap-detection.md)
- [002-directional-attribution](./tasks/002-directional-attribution.md)
- [003-session-aggregation](./tasks/003-session-aggregation.md)
- [004-unit-tests](./tasks/004-unit-tests.md)
