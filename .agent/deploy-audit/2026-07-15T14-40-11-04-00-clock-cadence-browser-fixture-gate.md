# Deploy audit: clock cadence browser fixture gate

**Timestamp:** `2026-07-15T14-40-11-04-00`

## Plan ledger

**Goal:** prevent a source-only clock refactor from being treated as complete until browser, artifact and deployed behavior agree.

- [x] Confirm the static Pages workflow deploys the repository root from `main`.
- [x] Identify missing executable clock fixtures.
- [x] Define source, artifact and deployed-origin gates.
- [ ] Execute the gates after implementation.

## Current deployment path

```txt
push to main
  -> actions/checkout@v4
  -> actions/configure-pages@v5
  -> actions/upload-pages-artifact@v3 with path: .
  -> actions/deploy-pages@v4
```

The workflow proves configuration only. The repository has no package manifest, build command, test command, controlled RAF harness or deployed timing smoke.

## Required source fixture

```txt
inject controlled callback timestamps
run same seed and scripted input at 30, 60, 90 and 120 Hz
run low-cadence traces at 20, 15, 10 and 5 Hz
inject 250 ms, 1 s and 5 s stalls
exercise pause, blur, hidden, visible, retry and title transitions
capture HostFrameResult and SimulationStepResult streams
assert matching accepted simulation snapshots where policy permits
assert explicit deferred/discarded receipts under overload
```

## Required artifact fixture

```txt
serve the exact uploaded root artifact
verify pinned imports resolve
execute controlled-clock harness against artifact index.html
capture truck, timer, condition, hazard and terminal snapshots
capture WebGL Canvas2D and DOM frame revisions
verify no source-only helper or fixture dependency is required
```

## Required deployed Pages fixture

```txt
open the deployed Pages URL
confirm the deployed commit identity
run supported cadence and visibility smoke
capture first clock-bound visible-frame acknowledgement
compare source, artifact and deployed result hashes
```

## Gate matrix

```txt
source controlled clock: not available
source cadence matrix: not available
source visibility/resume: not available
source overload policy: not available
artifact controlled clock: not available
deployed cadence smoke: not available
first clock-bound frame ack: not available
source/artifact/Pages parity: not available
```

## Boundary

No workflow run, browser session, artifact or deployed page was executed during this documentation audit.
