# AI Cost Analysis — SessionLens

*As required by the PRD submission checklist.*

---

## AI Components in Use

### Browser-Side Models (Zero API Cost)


| Component                             | What it does                                                                                 | Cost                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **MediaPipe Face Landmarker**         | 478-point face landmark detection per frame; derives gaze score and facial expression energy | **$0.00** — runs entirely in the browser via WebAssembly + WebGL |
| **Silero VAD** (`@ricky0123/vad-web`) | Voice Activity Detection; detects speech start/end per participant audio track               | **$0.00** — runs entirely in the browser via ONNX Runtime Web    |


Both models run locally in the user's browser. No video or audio is sent to any external API for these components. There is no per-session or per-minute fee for vision and VAD.

### Server-Side / API (Current Implementation)


| Component                       | What it does                                                                            | Cost                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **LiveKit SFU** (LiveKit Cloud) | WebRTC Selective Forwarding Unit; routes audio/video between participants               | Varies by plan; see below                                         |
| **Whisper API** (M32)           | Transcription for Socratic kudos; tutor speech segments when teacher + Socratic preset | **~$0.006/min** of audio; ~$0.06–$0.18/session when used          |
| **GPT-4.1-nano** (M32)         | Kudos classification (open-ended questions, hypotheticals) from transcript             | **~$0.0005–$0.001/session** when Socratic kudos on                 |
| **GPT-4o** (M26)                | Post-session LLM recommendations; optional "Get AI-Personalized Recommendations" button | **~$0.003/session** when used; template fallback when unavailable |


---

## Per-Session Cost Estimate (Current Implementation)

**Assumptions:**

- Average session length: 30 minutes
- Video resolution used for analysis: 640×480 (downsampled from webcam feed)
- Analysis frame rate: ~5 FPS (frame sampler cadence)
- Participants: 2 (tutor + student)
- LLM: not used (rule-based recommendations)
- Whisper: used only when teacher + Socratic preset; tutor speaks ~40–70% of time → ~10–20 min audio


| Component                    | Per-session cost      | Notes                                                                                         |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| MediaPipe (gaze + landmarks) | **$0.00**             | Browser-side WASM/WebGL                                                                       |
| Silero VAD                   | **$0.00**             | Browser-side ONNX                                                                             |
| Whisper (M32 Socratic kudos) | **$0** or ~**$0.06–$0.18** | Optional; only when teacher + Socratic preset; ~$0.006/min of tutor audio                 |
| GPT-4.1-nano (M32 kudos)    | **$0** or ~**$0.0005–$0.001** | Per-transcript classification when Socratic kudos on; ~20–40 calls/session             |
| LLM recommendations (M26)    | **$0** or ~**$0.003** | Optional; only when user clicks "Get AI-Personalized Recommendations"                         |
| LiveKit Cloud SFU            | ~**$0.003–$0.006**    | ~$0.006/participant-minute on Hobby plan; 30 min × 2 participants = $0.006–$0.012 per session |
| Storage (metrics JSON)       | ~**$0.000001**        | ~10 KB of JSON per session; S3/R2 at $0.023/GB                                                |
| **Total per session**        | **~$0.01–$0.20**      | Base ~$0.01 (LiveKit); +Whisper when Socratic; +LLM when user requests                        |


---

## Production Cost Projections

**Assumptions:**

- 30-minute session average
- 2 participants per session
- LiveKit Cloud: ~$0.006/participant-minute (Hobby/Growth plan estimate)
- Storage: $0.023/GB (Cloudflare R2 or AWS S3); 10 KB metrics JSON per session
- LLM: $0 or ~$0.003/session when user requests AI recommendations (M26)
- Whisper: $0 or ~$0.10/session when teacher + Socratic preset (assume 30% of sessions)


| Sessions/day | LiveKit (SFU) | Whisper | Storage | LLM | Total/day  | Total/month  |
| ------------ | ------------- | ------- | ------- | --- | ---------- | ------------ |
| 100          | ~$0.36        | ~$3     | ~$0.00  | $0  | **~$3.40** | **~$102**    |
| 1,000        | ~$3.60        | ~$30    | ~$0.00  | $0  | **~$33.60**| **~$1,008**  |
| 10,000       | ~$36          | ~$300   | ~$0.01  | $0  | **~$336**  | **~$10,080** |
| 100,000      | ~$360         | ~$3,000 | ~$0.10  | $0  | **~$3,360**| **~$100,800** |

*Whisper column assumes 30% of sessions use Socratic kudos (teacher + Socratic preset).*


> **LiveKit note:** At scale (>1K participants/day), LiveKit offers volume pricing. Self-hosted LiveKit eliminates the per-minute fee entirely, leaving only infrastructure costs (~$0.02–$0.05/session for a mid-tier server).

---

## Development & Testing Costs


| Item                                            | Cost                           |
| ----------------------------------------------- | ------------------------------ |
| Claude API (code generation during development) | ~$5–$20 total                  |
| LiveKit Cloud (testing)                         | ~$1–$5 total for test sessions |
| Whisper API (Socratic kudos testing)            | ~$1–$5 total                   |
| Vercel (dev/staging)                            | Free tier or <$5/month         |
| **Total development cost**                      | **~$10–$35**                   |


---

## Addendum: LLM Recommendations (M26) — Implemented

Post-session recommendations support optional LLM-generated suggestions via "Get AI-Personalized Recommendations" button. Uses `gpt-4o`:


| Component                                    | Per-session estimate        |
| -------------------------------------------- | --------------------------- |
| Input tokens (session summary)               | ~500 tokens                 |
| Output tokens (recommendations)              | ~200 tokens                 |
| Model: gpt-4o at $2.50/$10 per M tokens      | $0.003/session when used    |
| At 1,000 sessions/day (assuming 50% use LLM) | **~$1.50/day** (~$45/month) |


LLM cost remains negligible relative to SFU infrastructure.

---

## Addendum: Whisper + GPT-4.1-nano (M32) — Socratic Kudos

Socratic kudos use Whisper to transcribe tutor speech, then GPT-4.1-nano to classify each transcript for open-ended questions and hypotheticals. Both run only when the teacher is in session and the Socratic preset is selected.


| Component                         | Per-session estimate        |
| --------------------------------- | --------------------------- |
| Tutor audio transcribed           | ~10–20 min (40–70% of 30 min) |
| Whisper API: $0.006/min           | ~$0.06–$0.18/session when used |
| Transcript segments               | ~20–40 per session          |
| GPT-4.1-nano: ~$0.00002/call     | ~$0.0005–$0.001/session     |
| At 1,000 sessions/day (30% Socratic) | **~$30/day** Whisper + **~$0.30/day** nano (~$900/month + ~$9/month) |

**Privacy note:** When Socratic kudos are active, tutor audio is sent to OpenAI for transcription and transcript text is sent for classification. Users should be informed via consent/disclosure.

---

## Key Takeaways

1. **LiveKit SFU is the base cost** — ~$0.01/session for typical usage.
2. **Vision and VAD run in the browser at zero marginal cost** — MediaPipe and Silero stay local; no video/audio egress for these.
3. **Transcription (Whisper) adds cost when Socratic kudos are on** — ~$0.06–$0.18/session; tutor audio is sent to OpenAI. Optional (teacher + Socratic preset only).
4. **Kudos classification (GPT-4.1-nano) adds ~$0.0005–$0.001/session** — negligible vs Whisper; improves recall over prior keyword heuristics.
5. **Rule-based coaching and kudos 3 (wait time) are free** — no API calls. LLM recommendations add ~$0.003/session when used.
6. **Scaling cost depends on feature mix** — base ~$100/month per 1,000 daily sessions (LiveKit); add ~$900/month if 30% use Socratic kudos (Whisper); nano adds ~$9/month.

