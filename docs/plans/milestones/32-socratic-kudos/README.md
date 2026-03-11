# Milestone 32: Socratic Kudos

## Overview

Add real-time positive reinforcement (kudos) when the tutor follows Socratic method practices. Kudos are shown only when the session preset is Socratic.

**Source:** [One-Pager](../../../one-pager.md) — Live Socratic kudos  
**Est:** 4–6h

## Dependencies

- [x] Milestone 28: Session-Type Presets (Socratic preset)
- [x] Milestone 21: Response Latency
- [x] Milestone 29: Transcription (Whisper) for tutor speech

## Kudos Implemented

| Kudos | Detection | Signal |
|-------|-----------|--------|
| **1. Open-ended probing questions** | LLM (gpt-4.1-nano) classifies transcript | Transcription + /api/classify-kudos |
| **3. Good wait time** | Response latency 3–8 seconds (tutor stops → student responds) | VAD + timing |
| **4. Hypotheticals** | LLM (gpt-4.1-nano) classifies transcript | Transcription + /api/classify-kudos |

## Changes Required

- Transcription pipeline: capture tutor speech segments, send to Whisper API
- Kudos engine: LLM classification for kudos 1 and 4 via gpt-4.1-nano; metrics-based for kudos 3
- Coaching engine: emit good-wait-time kudos when response latency in range
- KudosToast UI: positive (green) styling, Socratic-only display
- Cooldowns: 90 seconds per kudos type to avoid fatigue

## Success Criteria

### Automated Verification

- [x] Build passes
- [x] Tests pass

### Manual Verification

- [x] Kudos 1 fires when tutor asks open-ended question (Socratic preset)
- [x] Kudos 3 fires when tutor pauses 3–8s before student responds (Socratic preset)
- [x] Kudos 4 fires when tutor uses hypothetical language (Socratic preset)
- [x] No kudos when preset is Lecture or Practice
- [x] KudosToast displays with distinct positive styling

## Tasks

- [001-transcription-pipeline](./tasks/001-transcription-pipeline.md)
- [002-kudos-engine](./tasks/002-kudos-engine.md)
- [003-good-wait-time](./tasks/003-good-wait-time.md)
- [004-kudos-ui](./tasks/004-kudos-ui.md)
