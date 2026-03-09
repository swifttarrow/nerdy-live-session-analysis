# Milestone 22: Participation Balance

## Overview

Enhance participation balance with engagement interpretation — student talk ratio + "passive vs. engaged" framing in report. ONE_PAGER: primary behavioral signal.

**Source:** [Post-MVP Plan Phase 2.0b](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2-engagement-quality-extensions)  
**Est:** 1–2h

## Dependencies

- [ ] Milestone 03: Audio Pipeline
- [ ] Milestone 05: Post-Session Summary

## Changes Required

- Student talk ratio already in metrics; add explicit interpretation
- Report framing: "passive" (low student talk) vs. "engaged" (balanced)
- ONE_PAGER: primary behavioral signal for actionable insight
- Optional: real-time framing in metrics display

## Success Criteria

### Automated Verification

- [x] `npm run build` succeeds
- [x] Unit test: talk ratio → interpretation correct

### Manual Verification

- [x] Report shows passive/engaged framing
- [x] Interpretation aligns with metrics

## Tasks

- [001-interpretation-logic](./tasks/001-interpretation-logic.md)
- [002-report-framing](./tasks/002-report-framing.md)
