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
| **LLM / Summarization** | Post-session recommendations are **rule-based templates** in the current implementation — no LLM calls | **$0.00** |

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
| LLM / summarization | **$0.00** | Rule-based; no API calls |
| LiveKit Cloud SFU | ~**$0.003–$0.006** | ~$0.006/participant-minute on Hobby plan; 30 min × 2 participants = $0.006–$0.012 per session |
| Storage (metrics JSON) | ~**$0.000001** | ~10 KB of JSON per session; S3/R2 at $0.023/GB |
| **Total per session** | **~$0.01** | Dominated entirely by LiveKit egress |

---

## Production Cost Projections

**Assumptions:**
- 30-minute session average
- 2 participants per session
- LiveKit Cloud: ~$0.006/participant-minute (Hobby/Growth plan estimate)
- Storage: $0.023/GB (Cloudflare R2 or AWS S3); 10 KB metrics JSON per session
- LLM: $0.00 (not used; if added in M26, see addendum below)

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

## Addendum: If LLM Recommendations Are Added (M26)

If post-session recommendations are upgraded to LLM-generated (e.g., using `claude-haiku-4-5` for cost efficiency):

| Component | Per-session estimate |
|-----------|---------------------|
| Input tokens (session summary) | ~500 tokens |
| Output tokens (recommendations) | ~200 tokens |
| Model: claude-haiku-4-5 at $0.25/$1.25 per M tokens | ~$0.000125 + $0.00025 = **~$0.0004/session** |
| At 1,000 sessions/day | **~$0.40/day** (~$12/month) |

LLM cost remains negligible relative to SFU infrastructure at any realistic scale.

---

## Key Takeaways

1. **The dominant cost is LiveKit SFU egress** — not AI inference.
2. **All vision and audio AI runs in the browser at zero marginal cost** — this is a deliberate architecture decision for latency, privacy, and cost.
3. **Rule-based coaching is free** — LLM is an optional post-MVP enhancement that adds <$0.001/session.
4. **Scaling from 100 → 100K sessions/day increases cost linearly** — approximately $10/month per 1,000 daily sessions.
