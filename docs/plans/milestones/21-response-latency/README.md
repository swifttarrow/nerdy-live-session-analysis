# Milestone 21: Response Latency

## Overview

Implement response latency — time between tutor stops speaking and student starts. Real-time nudge "Student hesitating repeatedly" + post-session. ONE_PAGER: cognitive signal.

**Source:** [Post-MVP Plan Phase 2.0a](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2-engagement-quality-extensions)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 03: Audio Pipeline (VAD per track)
- [ ] Milestone 10: Third Coaching Triggers (basic trigger may exist)

## Changes Required

- Compute: time from tutor VAD silence to student VAD speech
- Track per turn; aggregate "hesitation" count (e.g. >3 long pauses in 2 min)
- Real-time nudge: "Student hesitating repeatedly"
- Post-session: response latency stats in report
- Per ONE_PAGER: hesitant vs. confident vs. disengaged

## Success Criteria

### Automated Verification

- [x] `npm run build` succeeds
- [x] Unit test: synthetic VAD → latency computed correctly

### Manual Verification

- [x] Response latency updates in real time
- [x] Nudge fires when hesitation pattern detected
- [x] Report shows latency stats

## Tasks

- [001-latency-computation](./tasks/001-latency-computation.md)
- [002-hesitation-detection](./tasks/002-hesitation-detection.md)
- [003-nudge-report](./tasks/003-nudge-report.md)
