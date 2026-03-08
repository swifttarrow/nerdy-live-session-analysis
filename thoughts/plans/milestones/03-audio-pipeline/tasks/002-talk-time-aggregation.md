# Task 002: Talk-Time Aggregation

## Goal

Aggregate talk-time per channel or single stream; compute % for tutor vs student.

## Deliverables

- [ ] `src/lib/audio/talk-time.ts` — aggregate talk-time
- [ ] Channel-based: if stereo, left = tutor, right = student; compute % per channel
- [ ] Single-mic: combined "speaking" boolean or single talk-time % (simplified for MVP)
- [ ] Output: `{ tutor: { talk_time_percent: 0.65 }, student: { talk_time_percent: 0.35 } }`

## Notes

- Per ONE_PAGER: student talk ratio is primary engagement-quality signal

## Verification

- Unit test: synthetic VAD segments → talk-time % in expected range
- Manual: speaking into mic updates display
