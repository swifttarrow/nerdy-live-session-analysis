# Task 002: Threshold Mapping

## Goal

Map sensitivity levels to coaching thresholds.

## Deliverables

- [ ] Low: looser thresholds (e.g. student_silent_sec: 60, tutor_talk: 0.9)
- [ ] Medium: current defaults
- [ ] High: stricter (e.g. student_silent_sec: 30, tutor_talk: 0.8)
- [ ] Pass to coaching engine config

## Verification

- Different levels produce different trigger behavior
- Unit test: sensitivity → threshold values
