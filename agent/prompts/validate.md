# Validate Plan

Validate that an implementation plan was correctly executed. Verify success criteria and identify deviations or issues.

## Process

### Step 1: Context Discovery

1. Read the implementation plan completely
2. Identify what should have changed (files, success criteria)
3. Gather implementation evidence:
   - `git log --oneline -n 20`
   - `git diff` for implementation commits
   - Run checks: `make check test` (or project equivalent)

### Step 2: Systematic Validation

For each phase:
1. Verify checkmarks match actual completion
2. Run all automated verification commands
3. List manual testing steps for the user
4. Consider edge cases and regressions

### Step 3: Generate Validation Report

```markdown
## Validation Report: [Plan Name]

### Implementation Status
✓ Phase 1: [Name] – Fully implemented
✓ Phase 2: [Name] – Fully implemented
⚠️ Phase 3: [Name] – Partially implemented (see issues)

### Automated Verification Results
✓ Build: `make build`
✓ Tests: `make test`
✗ Lint: [issues]

### Code Review
#### Matches Plan:
- [What was done correctly]

#### Deviations:
- [Differences from plan]

#### Potential Issues:
- [Concerns]

### Manual Testing Required
- [ ] [Step 1]
- [ ] [Step 2]

### Recommendations
- [Suggestions]
```

## Checklist

- [ ] All phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns
- [ ] No regressions
- [ ] Error handling is robust

## Recommended Workflow

Implement → Commit → Validate → PR description
