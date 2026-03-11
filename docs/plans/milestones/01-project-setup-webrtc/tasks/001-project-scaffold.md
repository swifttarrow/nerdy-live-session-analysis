# Task 001: Project Scaffold

## Goal

Create the project structure, build tooling, and base configuration for a Vite/React app with LiveKit and MediaPipe dependencies.

## Deliverables

- [ ] `package.json` with dependencies: `livekit-client` (or `@livekit/components-react`), `@mediapipe/tasks-vision`, Vite, React
- [ ] `vite.config.ts` or equivalent build config
- [ ] `src/` directory structure (app, lib, pages)
- [ ] `public/` or `models/` for MediaPipe model (`face_landmarker.task`)
- [ ] `README.md` with setup instructions
- [ ] `Makefile` or `package.json` scripts: `make run` / `npm run dev`, `npm run build`
- [ ] `.env.example` with `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

## Notes

- Use Vite for fast dev; Node/React or Next.js acceptable
- LiveKit Cloud provides WebRTC; app can deploy to Railway, Vercel, Fly.io, or any host
- See plan for full file list

## Verification

- `npm install` succeeds
- `npm run build` succeeds
- `npm run dev` starts dev server
