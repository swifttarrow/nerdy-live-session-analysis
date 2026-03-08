# Task 003: Token API

## Goal

Provide a backend endpoint or API route to generate LiveKit access tokens for room join.

## Deliverables

- [ ] API route or server endpoint for LiveKit token generation
- [ ] Use LiveKit Cloud API key or self-hosted credentials from env
- [ ] Token includes room name and participant identity (tutor/student)

## Notes

- `.env.example` documents `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Auth/OAuth deferred for MVP — session tokens only for demo

## Verification

- Client can fetch token and successfully join room
- Invalid/missing credentials fail gracefully
