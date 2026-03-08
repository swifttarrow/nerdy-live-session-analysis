# Milestone 20: Privacy & Compliance

## Overview

Create Privacy & Compliance document. REQUIREMENTS: "Privacy considerations documented"; "Consent required"; "Clearly disclose what is measured."

**Source:** [Post-MVP Plan Phase 4.5](../../2025-03-07-sessionlens-post-mvp-draft.md#group-4-documentation--submission)  
**Est:** 1–2h

## Dependencies

- [ ] ConsentBanner implemented (Milestone 06)

## Changes Required

- **What is captured:** Face landmarks, gaze vectors, VAD/diarization features; no raw video/audio egress unless recording opted in
- **Consent & disclosure:** Pre-session wording per pre-search-checklist
- **Retention:** Configurable; 30–90 days default; deletion on request
- **Access control:** Tutor: own sessions; QA/admin: role-based; aggregate: anonymized
- **Compliance:** FERPA/COPPA if minors; processing location (browser-first keeps data local)

## Success Criteria

### Manual Verification

- [x] Document complete
- [x] Aligns with ConsentBanner and implementation
- [x] Meets submission checklist

## Tasks

- [001-what-is-captured](./tasks/001-what-is-captured.md)
- [002-consent-retention](./tasks/002-consent-retention.md)
- [003-compliance-notes](./tasks/003-compliance-notes.md)
