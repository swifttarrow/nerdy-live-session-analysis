# Task 001: Metrics Aggregator

## Goal

Combine video (eye contact) and audio (talk-time) outputs; emit JSON metrics payload at 1 Hz.

## Deliverables

- [ ] `src/lib/metrics/aggregator.ts` — combine eye contact + talk-time
- [ ] Emit at 1 Hz minimum
- [ ] Output format per PRD:
```json
{
  "timestamp": "2024-01-15T14:32:45Z",
  "session_id": "session_123",
  "metrics": {
    "tutor": { "eye_contact_score": 0.85, "talk_time_percent": 0.65, "current_speaking": true },
    "student": { "eye_contact_score": 0.78, "talk_time_percent": 0.35, "current_speaking": false }
  }
}
```

## Notes

- Wire video pipeline and audio pipeline outputs into aggregator
- Per ONE_PAGER: engagement-quality signals

## Verification

- Metrics payload emitted at 1 Hz
- All fields populated correctly
