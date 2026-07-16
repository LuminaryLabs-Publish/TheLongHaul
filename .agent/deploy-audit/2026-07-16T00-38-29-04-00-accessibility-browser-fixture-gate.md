# Deploy audit: accessibility browser, artifact and Pages fixture gate

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

Static Pages deployment is configured, but no executable fixture proves that source, uploaded artifact and deployed Pages expose the same accessibility tree, focus behavior, announcement cadence or canvas alternatives.

## Plan ledger

**Goal:** prevent accessibility readiness claims until browser evidence is captured against source, artifact and deployed origin.

- [x] Identify source-level semantic gaps.
- [x] Define required browser fixtures and evidence.
- [x] Preserve the existing deployment workflow.
- [ ] Implement the accessibility authority.
- [ ] Execute all fixtures against source, artifact and Pages.

## Required browser matrix

```txt
Chromium + keyboard and accessibility tree
Firefox + keyboard and accessibility tree
WebKit + keyboard and accessibility tree
at least one desktop screen reader
at least one mobile screen reader or accessibility inspector
200% text/reflow
forced colors/high contrast
reduced motion
low callback cadence and background/resume
```

## Required fixtures

### Route and focus

```txt
title -> how -> title
 title -> settings -> title
 driving -> pause -> settings -> pause -> driving
 driving -> results/loss -> retry/new/title
focus enters accepted route
focus restores to accepted invoker
inactive routes are not focusable or semantically active
```

### Live regions and announcements

```txt
60 Hz driving for 30 seconds produces bounded announcement count
timer milestones announce once
condition thresholds announce once per transition
interaction prompt announces once per eligibility transition
penalty and delivery events announce exactly once
results/failure announce once with correct priority
stale predecessor run events do not announce after retry
```

### Progress and canvases

```txt
generation exposes role/value/text progression
progress reaches ready before driving route adoption
game canvas alternative cites current run/route revision
map summary matches explored roads and depot state
map open/close changes semantic state once
```

### Lifecycle

```txt
blur and visibility loss
pause and resume
retry and new course
return to title
document pagehide
late timeout/toast callback rejection
```

## Evidence packet

```txt
source commit SHA
artifact workflow/run ID and artifact hash
Pages deployment URL and deployment commit
browser/version
assistive technology/version
accessibility-tree snapshots
focus trace
announcement transcript with event IDs
DOM and canvas alternative snapshots
matching visible-frame screenshots
pass/fail result per fixture
```

## Gate

No accessibility conformance, screen-reader correctness, focus correctness, announcement correctness, artifact parity, Pages parity or production readiness may be claimed until the matrix passes.

No workflow or deployment file changed in this audit.