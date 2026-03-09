# AI Cost Analysis — SessionLens

*As required by the PRD submission checklist.*

---

## AI Components in Use

### Browser-Side Models (Zero API Cost)

| Component | What it does | Cost |
|-----------|-------------|------|
| **MediaPipe Face Landmarker** | 478-point face landmark detection per frame; derives gaze score and facial expression energy | **$0.00** — runs entirely in the browser via WebAssembly + WebGL |
| **Silero VAD** (`@ricky0123/vad-web`) | Voice Activity Detection; detects speech start/end per participant audio track | **$0.00** — runs entirely in the browser via ONNX Runtime Web |

Both models run locally in the user's browser. No video or audio is sent to any external API. There is no per-session or per-minute fee.

### Server-Side / API (Current Implementation)

| Component | What it does | Cost |
|-----------|-------------|------|
| **LiveKit SFU** (LiveKit Cloud) | WebRTC Selective Forwarding Unit; routes audio/video between participants | Varies by plan; see below |
| **GPT-4o** (M26) | Post-session LLM recommendations; optional "Get AI-Personalized Recommendations" button | **~$0.003/session** when used; template fallback when unavailable |

---

## Per-Session Cost Estimate (Current Implementation)

**Assumptions:**
- Average session length: 30 minutes
- Video resolution used for analysis: 640×480 (downsampled from webcam feed)
- Analysis frame rate: ~5 FPS (frame sampler cadence)
- Participants: 2 (tutor + student)
- LLM: not used (rule-based recommendations)

| Component | Per-session cost | Notes |
|-----------|-----------------|-------|
| MediaPipe (gaze + landmarks) | **$0.00** | Browser-side WASM/WebGL |
| Silero VAD | **$0.00** | Browser-side ONNX |
| LLM recommendations (M26) | **$0** or ~**$0.003** | Optional; only when user clicks "Get AI-Personalized Recommendations" |
| LiveKit Cloud SFU | ~**$0.003–$0.006** | ~$0.006/participant-minute on Hobby plan; 30 min × 2 participants = $0.006–$0.012 per session |
| Storage (metrics JSON) | ~**$0.000001** | ~10 KB of JSON per session; S3/R2 at $0.023/GB |
| **Total per session** | **~$0.01** | Dominated by LiveKit egress; LLM adds <$0.001 when used |

---

## Production Cost Projections

**Assumptions:**
- 30-minute session average
- 2 participants per session
- LiveKit Cloud: ~$0.006/participant-minute (Hobby/Growth plan estimate)
- Storage: $0.023/GB (Cloudflare R2 or AWS S3); 10 KB metrics JSON per session
- LLM: $0 or ~$0.003/session when user requests AI recommendations (M26)

| Sessions/day | LiveKit (SFU) | Storage | LLM | Total/day | Total/month |
|-------------|--------------|---------|-----|-----------|-------------|
| 100 | ~$0.36 | ~$0.00 | $0 | **~$0.36** | **~$11** |
| 1,000 | ~$3.60 | ~$0.00 | $0 | **~$3.60** | **~$108** |
| 10,000 | ~$36 | ~$0.01 | $0 | **~$36** | **~$1,080** |
| 100,000 | ~$360 | ~$0.10 | $0 | **~$360** | **~$10,800** |

> **LiveKit note:** At scale (>1K participants/day), LiveKit offers volume pricing. Self-hosted LiveKit eliminates the per-minute fee entirely, leaving only infrastructure costs (~$0.02–$0.05/session for a mid-tier server).

---

## Development & Testing Costs

| Item | Cost |
|------|------|
| Claude API (code generation during development) | ~$5–$20 total |
| LiveKit Cloud (testing) | ~$1–$5 total for test sessions |
| Vercel/Fly.io hosting (dev/staging) | Free tier or <$5/month |
| **Total development cost** | **~$10–$30** |

---

## Addendum: LLM Recommendations (M26) — Implemented

Post-session recommendations support optional LLM-generated suggestions via "Get AI-Personalized Recommendations" button. Uses `gpt-4o`:

| Component | Per-session estimate |
|-----------|---------------------|
| Input tokens (session summary) | ~500 tokens |
| Output tokens (recommendations) | ~200 tokens |
| Model: gpt-4o at $2.50/$10 per M tokens | ~$0.00125 + $0.002 = **~$0.003/session** when used |
| At 1,000 sessions/day (assuming 50% use LLM) | **~$1.50/day** (~$45/month) |

Template fallback when `OPENAI_API_KEY` is unset or request fails. LLM cost remains negligible relative to SFU infrastructure.

---

## Key Takeaways

1. **The dominant cost is LiveKit SFU egress** — not AI inference.
2. **All vision and audio AI runs in the browser at zero marginal cost** — this is a deliberate architecture decision for latency, privacy, and cost.
3. **Rule-based coaching is free** — LLM is an optional post-MVP enhancement that adds ~$0.003/session when used.
4. **Scaling from 100 → 100K sessions/day increases cost linearly** — approximately $10/month per 1,000 daily sessions.
