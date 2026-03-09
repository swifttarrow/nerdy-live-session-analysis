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
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Pusher credentials for real-time room status (optional; falls back to polling) |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher client config (optional) |

### Real-time room status (optional)

For instant updates when participants join/leave (instead of 2s polling):

1. Create a [Pusher](https://pusher.com) account (free Sandbox plan).
2. Add Pusher env vars to `.env.local` (see `.env.example`).
3. In [LiveKit Cloud](https://cloud.livekit.io) → Settings → Webhooks, add a webhook:
   - URL: `https://your-domain.com/api/webhooks/livekit` (use ngrok for local dev)
   - Events: `participant_joined`, `participant_left`

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
