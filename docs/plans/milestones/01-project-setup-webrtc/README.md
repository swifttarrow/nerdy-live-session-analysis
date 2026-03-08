# Milestone 01: Project Setup & WebRTC/LiveKit Video Call

## Overview

Establish project structure, build tooling, and WebRTC/LiveKit video call so tutor and student can join a session. The analysis client must receive both streams: local (own camera) and remote (other participant). Extract frames at 1–2 fps from each stream for downstream processing.

**Source:** [MVP Plan Phase 1](../../2025-03-06-sessionlens-mvp.md#phase-1-project-setup--webrtclivekit-video-call)

## Dependencies

- None (greenfield)

## Changes Required

- `package.json` — Node/React or Vite app; dependencies: `livekit-client`, `@mediapipe/tasks-vision`
- `vite.config.ts` or `next.config.js` — build config
- `src/` — app structure
- `src/lib/livekit/` or `src/lib/webrtc/` — room connection, token fetch
- `src/lib/video/` — frame extraction from video elements
- `src/lib/video/frame-sampler.ts` — 1–2 fps sampling via `requestVideoFrameCallback` or `requestAnimationFrame` with frame skip
- `src/pages/` or `src/app/` — session page with video call UI
- `public/` or `models/` — `face_landmarker.task` (MediaPipe model)
- API route or server endpoint for LiveKit access tokens
- `.env.example` — `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

## Success Criteria

### Automated Verification

- [x] `npm run build` succeeds
- [ ] `npm run lint` passes (if configured)
- [x] No TypeScript errors

### Manual Verification

- [ ] `npm run dev` starts app
- [ ] Two browser tabs/windows: one joins as tutor, one as student
- [ ] Video call works: both see each other
- [ ] Frame sampler logs at 1–2 Hz for both streams (console or debug UI)
- [ ] Graceful handling when camera denied or remote participant disconnects

## Tasks

- [001-project-scaffold](./tasks/001-project-scaffold.md)
- [002-livekit-room-connection](./tasks/002-livekit-room-connection.md)
- [003-token-api](./tasks/003-token-api.md)
- [004-frame-sampler](./tasks/004-frame-sampler.md)
- [005-session-page-ui](./tasks/005-session-page-ui.md)
