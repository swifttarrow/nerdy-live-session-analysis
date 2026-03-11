# Task 001: Transcription Pipeline

## Goal

Capture tutor speech segments and transcribe them via Whisper API. Transcripts are then classified by gpt-4.1-nano for kudos 1 and 4.

## Deliverables

- [x] POST /api/transcribe — accepts audio blob (webm), returns { text }
- [x] TranscriptionCapturer — MediaRecorder-based capture on speech start/end
- [x] Audio pipeline — optional transcriptionOptions for tutor track
- [x] Min segment duration 1.5s to skip filler

## Notes

- Whisper API ~$0.006/min; requires OPENAI_API_KEY
- Only tutor speech captured (kudos reinforce tutor behavior)
- Transcription runs async; kudos fire shortly after tutor stops speaking

## Verification

- Audio blob sent to API produces transcript
- Short segments (<1.5s) skipped
