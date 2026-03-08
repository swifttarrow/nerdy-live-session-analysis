# Generate Milestones & Tasks from Plan

Takes an implementation plan and generates a structured milestone/task breakdown under `docs/plans/milestones/`.

---

## When to Use

- After a plan is approved and before implementation
- When you need granular, trackable tasks for each phase
- When coordinating work across sessions or team members

---

## Input

You will receive:

1. **Plan path** — e.g. `docs/plans/2025-03-06-sessionlens-mvp.md`
2. Optional: custom milestone naming, task granularity preferences

Read the plan completely before generating.

---

## Output Structure

```
docs/plans/milestones/
├── 01-milestone-slug/
│   ├── README.md          # Milestone overview, success criteria, dependencies
│   └── tasks/
│       ├── 001-task-slug.md
│       ├── 002-task-slug.md
│       └── ...
├── 02-milestone-slug/
│   ├── README.md
│   └── tasks/
│       └── ...
└── _index.md              # Master index: milestones, order, links to plan
```

---

## Process

### Step 1: Parse the Plan

1. Read the plan file fully
2. Identify phases/sections that map to milestones (e.g. "Phase 1: ...", "Phase 2: ...")
3. Extract for each phase:
   - Overview / goal
   - Changes required (files, logic, config)
   - Success criteria (automated + manual verification)
   - Dependencies on prior phases

### Step 2: Create Milestone Directories

For each phase in the plan:

- Create `docs/plans/milestones/NN-slug/` where:
  - `NN` = zero-padded phase number (01, 02, …)
  - `slug` = kebab-case from phase title (e.g. `project-setup-webrtc`)

### Step 3: Write Milestone README

Each `docs/plans/milestones/NN-slug/README.md` must include:

```markdown
# Milestone N: [Phase Title]

## Overview
[From plan phase overview]

## Dependencies
- [ ] Milestone N-1 (if applicable)
- [ ] [Other prerequisites]

## Changes Required
[Summarized from plan; link to plan section]

## Success Criteria

### Automated Verification
- [ ] [From plan]

### Manual Verification
- [ ] [From plan]

## Tasks
- [001-task-slug](./tasks/001-task-slug.md)
- [002-task-slug](./tasks/002-task-slug.md)
```

### Step 4: Decompose into Tasks

Break each phase into **concrete, implementable tasks**. Each task should:

- Be completable in one focused session (roughly 30–90 min)
- Have a clear deliverable (file created, test passing, etc.)
- Be ordered so dependencies are respected

**Task file format** — `docs/plans/milestones/NN-slug/tasks/MMM-task-slug.md`:

```markdown
# Task MMM: [Short Title]

## Goal
[One sentence: what this task accomplishes]

## Deliverables
- [ ] [Concrete output 1]
- [ ] [Concrete output 2]

## Notes
[Relevant file paths, config, or gotchas from the plan]

## Verification
[How to confirm this task is done]
```

Use `MMM` = zero-padded task number (001, 002, …) within each milestone.

### Step 5: Create Master Index

Create `docs/plans/milestones/_index.md`:

```markdown
# Milestones: [Plan Title]

**Source plan:** [path to plan]

## Milestone Order

| # | Milestone | Status |
|---|-----------|--------|
| 1 | [01-slug](./01-slug/) | Pending |
| 2 | [02-slug](./02-slug/) | Pending |
| ... | ... | ... |

## Quick Links
- [Plan](../YYYY-MM-DD-plan-name.md)
- [Research](../../research/...) (if referenced)
```

---

## Guidelines

- **One milestone per plan phase** — preserve the plan's phase structure
- **Tasks are atomic** — each task = one logical unit of work
- **Preserve success criteria** — copy automated and manual verification from the plan into milestone READMEs
- **Link back to plan** — each milestone README should reference the source plan section
- **Slug consistently** — use kebab-case, no spaces, lowercase
- **Respect order** — milestones and tasks follow the plan's dependency order

---

## Example Mapping (SessionLens MVP)

| Plan Phase | Milestone Dir | Example Tasks |
|------------|---------------|---------------|
| Phase 1: Project Setup & WebRTC | `01-project-setup-webrtc/` | Create package.json, Add LiveKit client, Frame sampler, Token API |
| Phase 2: Face Detection & Gaze | `02-face-detection-gaze/` | MediaPipe init, Gaze derivation, Pipeline orchestration |
| Phase 3: Audio Pipeline | `03-audio-pipeline/` | Silero VAD, Talk-time aggregation, Pipeline wiring |
| ... | ... | ... |

---

## Invocation

Attach this prompt and the plan, then:

> Generate milestones and tasks from @docs/plans/[plan-file].md

Or:

> Create milestone breakdown for the SessionLens MVP plan
