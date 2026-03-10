# Milestone 30: Instructor Delivery Quality Metrics (Stretch)

## Overview

Add tutor delivery quality metrics from audio/video analysis. Delivery quality strongly affects attention and cognitive load (Cognitive Load Theory); poor delivery increases extraneous load and suppresses student participation. Research (Chi et al., Graesser et al.) shows that concise, structured, fluent explanations correlate with higher learning gains.

**Source:** [Post-MVP Plan Phase 2d](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2d-instructor-delivery-quality-stretch)  
**Est:** 3–4h

## Rationale

- **Moderating variable:** Some "student engagement problems" are actually tutor delivery problems. Low student talk ratio may reflect rambling tutors; high response latency may reflect unclear explanations.
- **Signals to measure:** Speech fluency (filler word rate, pause frequency, speech restart rate), explanation structure (avg monologue length, turn-taking frequency, question density), confidence (speech rate consistency, prosody variation).

## Dependencies

- [ ] Milestone 03: Audio Pipeline
- [ ] Milestone 21: Response Latency (for turn-taking)
- [ ] Optional: transcription (Whisper) for filler-word detection — Tier 2 fallback

## Changes Required

- **Speech fluency:** filler word rate (ums/min) — requires transcription or keyword spotting; pause frequency and speech restart rate from VAD segments
- **Explanation structure:** average tutor monologue length (seconds), turn-taking frequency, question density (requires transcription for full accuracy)
- **Confidence signals:** speech rate consistency, vocal energy/prosody variation from audio
- Add `deliveryQuality` or `tutorDelivery` to metrics payload and session summary
- Post-session: delivery quality breakdown in report

## Success Criteria

### Automated Verification

- [ ] Unit tests: synthetic VAD/transcript → delivery metrics in expected range

### Manual Verification

- [ ] Delivery metrics visible in post-session report
- [ ] Metrics correlate with known good/poor delivery in test clips

## Tasks

- [001-delivery-fluency](./tasks/001-delivery-fluency.md) — filler rate, pause frequency, restart rate
- [002-delivery-structure](./tasks/002-delivery-structure.md) — monologue length, turn-taking, question density
- [003-delivery-confidence](./tasks/003-delivery-confidence.md) — speech rate, prosody
- [004-report-integration](./tasks/004-report-integration.md) — add to summary and report
