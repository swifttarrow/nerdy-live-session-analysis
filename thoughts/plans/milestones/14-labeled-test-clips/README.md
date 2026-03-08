# Milestone 14: Labeled Test Clips

## Overview

Create labeled test clips for metric validation (gaze, talk-time). 5–10 clips with known eye contact / talk-time ratios for accuracy validation.

**Source:** [Post-MVP Plan Phase 5.2](../../2025-03-07-sessionlens-post-mvp-draft.md#group-5-testing--quality-assurance)  
**Est:** 1–2h

## Dependencies

- [ ] Milestone 02: Face Detection & Gaze
- [ ] Milestone 03: Audio Pipeline

## Changes Required

- 5–10 labeled clips (video + audio or metadata)
- Known: eye contact level, talk-time ratio
- Use for accuracy validation before coaching logic
- Optional: automated test that runs pipeline on clips and asserts within tolerance

## Success Criteria

### Automated Verification

- [ ] Pipeline runs on labeled clips
- [ ] Output within tolerance of labels (if automated)
- [ ] Or: manual validation checklist

### Manual Verification

- [ ] Clips cover range: high/low eye contact, balanced/unbalanced talk
- [ ] Validation confirms pipeline accuracy

## Tasks

- [001-create-clips](./tasks/001-create-clips.md)
- [002-label-metadata](./tasks/002-label-metadata.md)
- [003-validation-test](./tasks/003-validation-test.md)
