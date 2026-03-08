# Milestone 23: Attention Cycles

## Overview

Add attention cycles — gaze patterns over time. "Attention drifted in middle segment" vs. static distraction count. ONE_PAGER: extends attention to temporal patterns.

**Source:** [Post-MVP Plan Phase 2.0c](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2-engagement-quality-extensions)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 02: Face Detection & Gaze
- [ ] Milestone 12: Attention Drift (optional; can build on gaze directly)

## Changes Required

- Segment session into time windows (e.g. beginning, middle, end)
- Per-segment eye contact / attention score
- Detect "drifted in middle segment" pattern
- Post-session: attention cycle visualization or summary
- ONE_PAGER: temporal patterns vs. static count

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit test: synthetic gaze over time → segment scores correct

### Manual Verification

- [ ] Report shows attention by segment
- [ ] "Drifted in middle" pattern detectable

## Tasks

- [001-segment-attention](./tasks/001-segment-attention.md)
- [002-drift-pattern](./tasks/002-drift-pattern.md)
- [003-report-display](./tasks/003-report-display.md)
