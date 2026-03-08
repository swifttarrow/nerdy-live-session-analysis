# Milestone 29: Interruptions Tier 2 Transcription (Stretch)

## Overview

Add Tier 2 interruption classification: transcription of overlap segments; content-based classification (clarifying, procedural, off-topic). Stretch — requires transcription.

**Source:** [Post-MVP Plan Phase 1.1c](../../2025-03-07-sessionlens-post-mvp-draft.md#group-1-audio--metrics-extensions)  
**Est:** 3–4h

## Dependencies

- [ ] Milestone 08: Interruptions Detection
- [ ] Milestone 09: Interruption Classification (Tier 1)
- [ ] Transcription: Whisper or similar for overlapping segments

## Changes Required

- Transcribe overlapping speech segments (Whisper or browser equivalent)
- Keyword/heuristic classification: clarifying ("why", "what", "how", "wait"), procedural, off-topic
- Map to productive/neutral/unproductive
- Include in post-session report or live metrics
- Tier 3 (LLM semantic) deferred

## Success Criteria

### Manual Verification

- [ ] Overlap segments transcribed
- [ ] Content-based classification improves over Tier 1
- [ ] Report shows refined productive/neutral/unproductive

## Tasks

- [001-transcription-integration](./tasks/001-transcription-integration.md)
- [002-content-classification](./tasks/002-content-classification.md)
- [003-report-integration](./tasks/003-report-integration.md)
