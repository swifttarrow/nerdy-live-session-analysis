# Task 002: Kudos Engine

## Goal

Create kudos engine with LLM-based classification for open-ended questions and hypotheticals.

## Deliverables

- [x] KudosType: open_ended_question, good_wait_time, hypothetical_scenario
- [x] POST /api/classify-kudos — gpt-4.1-nano classifies transcript
- [x] createKudosEngine(onKudos, { preset, classifyKudosUrl }) — receives transcripts via onTranscript()
- [x] Socratic preset gate — only fire when preset === "socratic"
- [x] 90s cooldown per kudos type
- [x] classifyFn option for testing (inject mock, bypass fetch)

## Notes

- Kudos 3 (good wait time) handled by coaching engine, not kudos engine
- One kudos per transcript max (prioritize open_ended_question over hypothetical_scenario)
- LLM classification improves recall over prior keyword heuristics (e.g. "Tell me more", "Consider a scenario where...")

## Verification

- Transcript classified as open-ended → open_ended_question kudos
- Transcript classified as hypothetical → hypothetical_scenario kudos
- Non-Socratic preset → no kudos
