# Milestone 07: Deployment & Polish

## Overview

One-command setup and run; clear README; deploy to Fly.io or LiveKit Cloud (WebRTC required; Railway blocks UDP); publicly accessible URL.

**Source:** [MVP Plan Phase 7](../../2025-03-06-sessionlens-mvp.md#phase-7-deployment--polish)

## Dependencies

- [ ] Milestone 06: Dashboard & UI

## Changes Required

- `README.md` — setup (Node version, `npm install`, `npm run dev`), one-command run, deployment notes, LiveKit env vars
- `package.json` — scripts: `dev`, `build`, `start`, `setup`
- `Dockerfile` (optional) — for containerized run
- `fly.toml` — Fly.io deployment (if self-hosting LiveKit or backend)
- `.env.example` — LiveKit credentials

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Fresh clone: `git clone` → `npm install` → `npm run dev` works
- [ ] `make run` or documented one-command succeeds

### Manual Verification

- [ ] README is clear; evaluator can run without prior context
- [ ] Deployed app is publicly accessible
- [ ] Video call works in production (HTTPS): two users can join and see each other
- [ ] Full flow: consent → join room → video call → metrics for both → nudges → end → report

## Tasks

- [001-readme-setup](./tasks/001-readme-setup.md)
- [002-deployment-config](./tasks/002-deployment-config.md)
- [003-deploy](./tasks/003-deploy.md)
- [004-verification](./tasks/004-verification.md)
