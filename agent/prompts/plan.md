# Create Implementation Plan

Create a detailed implementation plan through an interactive, iterative process. Be skeptical, thorough, and collaborative.

## Initial Response

If no task/ticket provided, ask for:
1. Task description or ticket reference
2. Relevant context, constraints, requirements
3. Links to related research

## Process

### Step 1: Context Gathering

1. Read all mentioned files fully (tickets, research docs, related plans)
2. Research the codebase to find relevant files and understand current implementation
3. Cross-reference requirements with actual code
4. Present informed understanding and focused questions

### Step 2: Research & Discovery

After clarifications:
- Spawn parallel research for deeper investigation
- Find relevant files, patterns, and conventions
- Present findings and design options
- Get alignment on approach before writing the plan

### Step 3: Plan Structure

Propose phase structure and get feedback before writing details.

### Step 4: Write the Plan

Save to `thoughts/plans/YYYY-MM-DD-description.md`:

```markdown
# [Feature] Implementation Plan

## Overview
[Brief description]

## Current State Analysis
[What exists, constraints discovered]

## Desired End State
[Specification and how to verify]

## What We're NOT Doing
[Out-of-scope items]

## Phase 1: [Name]
### Overview
[What this phase accomplishes]

### Changes Required
**File**: `path/to/file.ext`
**Changes**: [Summary]

### Success Criteria
#### Automated Verification:
- [ ] `make test`
- [ ] `make lint`

#### Manual Verification:
- [ ] Feature works as expected
- [ ] Edge cases verified

**Note**: Pause for human confirmation after this phase before proceeding.

---

## Phase 2: [Name]
[Same structure...]

## References
- Research: `thoughts/research/[relevant].md`
- Ticket: [reference]
```

### Step 5: Iterate

Present the plan and refine based on feedback.

## Guidelines

- **Be skeptical**: Question vague requirements, verify with code
- **Be interactive**: Get buy-in at each step
- **Be thorough**: Include file:line references, measurable success criteria
- **No open questions**: Resolve all questions before finalizing
