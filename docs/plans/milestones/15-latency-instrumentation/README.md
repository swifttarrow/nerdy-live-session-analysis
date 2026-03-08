# Milestone 15: Latency Instrumentation

## Overview

Instrument pipeline for latency; assert per-stage budget; E2E test with mock clock; document p50/p95.

**Source:** [Post-MVP Plan Phase 5.3](../../2025-03-07-sessionlens-post-mvp-draft.md#group-5-testing--quality-assurance)  
**Est:** 1h

## Dependencies

- [ ] MVP complete (Milestones 01–07)

## Changes Required

- Instrument pipeline: frame capture → MediaPipe → gaze → smoothing → metrics
- Per-stage timing; assert budget (e.g. <500 ms p95)
- E2E test with mock clock for deterministic latency assertions
- Document p50/p95 in README or docs

## Success Criteria

### Automated Verification

- [x] Latency instrumentation in place
- [x] E2E test with mock clock passes
- [x] Per-stage budget asserted or documented

### Manual Verification

- [ ] p50/p95 documented
- [ ] Latency meets <500 ms target or deviation documented

## Tasks

- [001-instrument-pipeline](./tasks/001-instrument-pipeline.md)
- [002-e2e-latency-test](./tasks/002-e2e-latency-test.md)
- [003-document-latency](./tasks/003-document-latency.md)
