# Create Handoff

Write a handoff document to transfer work to another agent in a new session. Be thorough but **concise**—compact context without losing key details.

## Process

### 1. Filepath & Metadata

Create under `docs/handoffs/YYYY-MM-DD_HH-MM-SS_description.md`:
- YYYY-MM-DD: today's date
- HH-MM-SS: current time (24h, e.g. 13-00-00)
- description: brief kebab-case description

### 2. Handoff Document

```markdown
---
date: [ISO date/time]
git_commit: [Current commit hash]
branch: [Current branch]
topic: "[Task Name]"
tags: [implementation, relevant-components]
status: complete
type: handoff
---

# Handoff: [concise description]

## Task(s)
[Description of tasks with status: completed, in progress, planned]
[Reference plan/research documents]

## Critical References
[2–3 most important file paths or specs]

## Recent Changes
[Changes made in file:line syntax]

## Learnings
[Patterns, root causes, info for next agent]

## Artifacts
[Exhaustive list of produced/updated files—plans, research, code]

## Action Items & Next Steps
[What the next agent should do]

## Other Notes
[Relevant codebase locations, documents]
```

### 3. Response to User

```
Handoff created at: `docs/handoffs/YYYY-MM-DD_HH-MM-SS_description.md`

Resume in a new session by reading this file and continuing from the Action Items.
```

## Guidelines

- More information, not less—minimum is the template
- Be thorough and precise
- Avoid excessive code snippets—prefer `path/to/file.ext:line` references
- Include both high-level objectives and key details
