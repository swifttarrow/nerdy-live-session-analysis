# Research Codebase

Conduct comprehensive research across the codebase to answer the user's question. Use parallel sub-agents when helpful, then synthesize findings.

## CRITICAL: Document What Exists

- DO NOT suggest improvements or changes unless explicitly asked
- DO NOT perform root cause analysis unless explicitly asked
- DO NOT propose future enhancements or critique the implementation
- ONLY describe what exists, where it exists, how it works, and how components interact

## Process

1. **Read any directly mentioned files first** – If the user mentions specific files, read them fully before spawning sub-tasks.

2. **Decompose the research question** – Break into composable areas. Use TodoWrite to track subtasks.

3. **Research in parallel** – Use sub-agents or targeted searches to investigate different aspects concurrently:
   - Find WHERE files and components live
   - Understand HOW specific code works
   - Find examples of existing patterns

4. **Synthesize findings** – Wait for all research to complete. Compile results with file:line references.

5. **Write research document** to `thoughts/research/YYYY-MM-DD-description.md`:

```markdown
---
date: [ISO date]
topic: "[Research Question]"
tags: [research, relevant-components]
status: complete
---

# Research: [Topic]

## Research Question
[Original query]

## Summary
[High-level documentation answering the question]

## Detailed Findings
### [Component/Area 1]
- What exists (path/to/file.ext:line)
- How it connects to other components

### [Component/Area 2]
...

## Code References
- `path/to/file.py:123` – Description
- `another/file.ts:45-67` – Description

## Open Questions
[Areas needing further investigation]
```

6. **Present summary** to the user with key file references.

## Guidelines

- Use parallel tasks to maximize efficiency
- Always run fresh research—don't rely solely on existing docs
- Focus on concrete file paths and line numbers
- Document what IS, not what SHOULD BE
