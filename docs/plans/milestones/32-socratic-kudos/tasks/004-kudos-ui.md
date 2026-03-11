# Task 004: Kudos UI

## Goal

Display kudos with positive styling, Socratic-only, alongside nudges.

## Deliverables

- [x] KudosToast component — green/emerald styling (vs gray nudges)
- [x] Icons per type: ❓ open-ended, ⏳ wait time, 🔮 hypothetical
- [x] Session page: show kudos when Socratic preset, above nudges
- [x] Debug page: same behavior for video replay
- [x] Auto-dismiss after 8s; manual dismiss
- [x] Wire transcription flow: blob → /api/transcribe → kudosEngine.onTranscript (engine calls /api/classify-kudos)

## Notes

- Kudos and nudges share same bottom-right stack; kudos rendered first
- Filter kudos by sessionPreset in UI as backup (engine also gates)

## Verification

- KudosToast appears with green border/background
- Kudos show in session and debug when Socratic
- Dismiss works; auto-dismiss after 8s
