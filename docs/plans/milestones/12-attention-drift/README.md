# Milestone 12: Attention Drift

## Overview

Add attention drift / distraction detection. PRD optional for MVP; included in post-MVP.

**Source:** [Post-MVP Plan Phase 1.4](../../2025-03-07-sessionlens-post-mvp-draft.md#group-1-audio--metrics-extensions)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 02: Face Detection & Gaze

## Changes Required

- Detect distraction/disengagement from gaze patterns (looking away, head turn)
- Low eye contact sustained → attention drift signal
- Add to metrics; optional nudge or post-session insight
- Distinguish from brief glances (temporal threshold)

## Success Criteria

### Automated Verification

- [x] `npm run build` succeeds
- [x] Unit test: synthetic gaze → drift detection correct

### Manual Verification

- [ ] Looking away for extended period → drift detected
- [ ] Brief glances not flagged
- [ ] Visible in metrics or report

## Tasks

- [001-drift-detection](./tasks/001-drift-detection.md)
- [002-temporal-threshold](./tasks/002-temporal-threshold.md)
- [003-metrics-integration](./tasks/003-metrics-integration.md)
