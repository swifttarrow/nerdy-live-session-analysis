# Task 001: Delivery Fluency

## Goal

Compute speech fluency metrics: filler word rate (ums/min), pause frequency, speech restart rate.

## Deliverables

- [ ] Filler word rate from transcription (Whisper) or keyword spotting — um/uh per minute
- [ ] Pause frequency from VAD segments — gaps between speech segments
- [ ] Speech restart rate — aborted starts (requires VAD or transcription)
- [ ] Add to metrics payload / session summary

## Notes

- Filler detection without transcription: limited; consider Tier 2 (transcription) for accuracy
- Pause/restart from VAD: feasible with segment analysis
