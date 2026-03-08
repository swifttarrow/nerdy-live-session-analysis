# Task 002: Deployment Config

## Goal

Add deployment configuration for Fly.io or LiveKit Cloud.

## Deliverables

- [ ] `fly.toml` — Fly.io deployment (if self-hosting LiveKit or backend)
- [ ] `Dockerfile` (optional) — for containerized run
- [ ] `.env.example` — `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (or LiveKit Cloud equivalents)
- [ ] HTTPS required for `getUserMedia` and WebRTC in production

## Notes

- WebRTC requires UDP; Railway blocks UDP → use Fly.io or LiveKit Cloud
- LiveKit Cloud: use managed service; no self-hosted TURN
- Backend: token generation for LiveKit room access

## Verification

- Config valid for target platform
- Env vars documented
