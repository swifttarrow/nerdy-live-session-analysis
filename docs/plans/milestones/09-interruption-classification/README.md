# Milestone 09: Interruption Classification

## Overview

Classify interruptions as productive/neutral/unproductive using Tier 1 heuristics (no transcription). Post-session breakdown in report.

**Source:** [Post-MVP Plan Phase 1.1b](../../2025-03-07-sessionlens-post-mvp-draft.md#group-1-audio--metrics-extensions)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 08: Interruptions Detection

## Changes Required

- Tier 1 heuristics: productive (student→tutor), unproductive (tutor→student excessive), neutral (short/ambiguous)
- Output: `{ productive: N, unproductive: M, neutral: K }` plus directional breakdown
- Add to post-session report

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit test: synthetic interruptions → classification correct

### Manual Verification

- [ ] Post-session report shows productive/neutral/unproductive breakdown
- [ ] Heuristics align with research (student→tutor = productive by default)

## Tasks

- [001-classification-heuristics](./tasks/001-classification-heuristics.md)
- [002-report-integration](./tasks/002-report-integration.md)
- [003-unit-tests](./tasks/003-unit-tests.md)
