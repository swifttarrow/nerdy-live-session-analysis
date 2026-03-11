# Task 003: Good Wait Time (Kudos 3)

## Goal

Detect when tutor gives student 3–8 seconds of think time before student responds. Fire kudos from coaching engine.

## Deliverables

- [x] Config: goodWaitTimeMinMs (3000), goodWaitTimeMaxMs (8000)
- [x] updateTriggerState returns { state, goodWaitTime? } when latency in range
- [x] Coaching engine: optional onKudos, preset; fire good_wait_time when goodWaitTime && socratic
- [x] 90s cooldown for good_wait_time kudos

## Notes

- Uses existing response-latency tracking (tutorStoppedAtMs, studentJustStarted)
- No transcription needed — pure timing signal
- Below 3s: may not be real think time; above 8s: edges toward hesitation

## Verification

- Tutor stops → 5s silence → student speaks → good_wait_time kudos (Socratic)
- Tutor stops → 1s → student speaks → no kudos
- Lecture preset → no kudos even with good latency
