# SessionLens

Real-time engagement intelligence for live tutor–student sessions. Analyzes eye contact and speaking time for both participants, provides non-intrusive coaching nudges, and generates a post-session summary.

## Prerequisites

- Node.js 20+
- A [LiveKit Cloud](https://cloud.livekit.io) account (free tier works)

## Setup

```bash
make setup
```

This single command installs dependencies, copies WASM files, creates `.env.local` from `.env.example` (if missing), and downloads the MediaPipe face model. Then edit `.env.local` with your LiveKit credentials.

## Running

```bash
make run
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Two-participant flow

1. Open two browser tabs/windows
2. First tab: join as **tutor** (or use default identity)
3. Second tab: join as **student**
4. Both participants will see each other's video and live metrics
5. Coaching nudges appear when engagement signals drop
6. Click **End Session** to view the post-session report

## Testing

```bash
make test
# or: npm test
```

## Building

```bash
make build
# or: npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `LIVEKIT_URL` | LiveKit server WebSocket URL (e.g. `wss://your-project.livekit.cloud`) |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |

Room status is updated via 1s polling against `/api/room/status`.

## Architecture

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Video analysis**: MediaPipe Face Landmarker (browser WASM) — eye contact scoring at 1–2 Hz
- **Audio analysis**: Silero VAD via `@ricky0123/vad-web` — per-participant talk-time
- **Coaching engine**: Rule-based triggers with cooldowns
- **Post-session**: Template-based summary and recommendations

All video/audio processing runs entirely in the browser — no data is sent to any server.

## Deployment

Deploy to [Fly.io](https://fly.io) or similar (WebRTC requires UDP — Railway is not supported).

```bash
fly launch
fly deploy
```

Ensure HTTPS is enabled (required for `getUserMedia` and WebRTC in production).
