# Validation

**Audit timestamp:** `2026-07-18T15-38-25-04-00`

## Summary

All 11 Publish repositories were compared. Ten were eligible after excluding Cavalry of Rome. All ten had central ledgers, root `.agent` state, and `main` heads matching their recorded documentation heads. TheLongHaul had the oldest synchronized central timestamp and was the only selected repository.

Source inspection proves that near-world preparation calls occur on every driving frame, while only Core World focus/update and host reconciliation are gated by a changed cell key. It also establishes a conservative 56-object/array caller-owned construction floor per driving frame. It does not prove a visible performance defect without executable browser evidence.

## Checklist

- [x] Compare all accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and root `.agent` states.
- [x] Confirm no eligible runtime-ahead repository.
- [x] Select only TheLongHaul by the oldest synchronized documented-selection rule.
- [x] Inspect bootstrap, shared constants, generation, near-world preparation, controller, frame loop and render-host paths.
- [x] Reconcile 20 installed kits and 36 source-backed surfaces.
- [x] Enumerate every kit and offered service.
- [x] Add the timestamped streaming cadence audit family.
- [x] Change documentation only.
- [ ] Execute streaming domain, browser, artifact and Pages fixtures after implementation.

## Repository evidence

```txt
reviewed runtime source revision: 753488e40e69fc13471df42959628ef3052e5992
reviewed pre-audit repository head: 2c21dbcd06f823633b2bad3d9977ab1ebe6bcbdd
branch: main
selection class: oldest synchronized eligible repository
prior central timestamp: 2026-07-18T03-43-36-04-00
```

## Source observations

```txt
ACTIVE_RADIUS: 1
active desired window: 9 cells
updateWorldStreaming called every driving frame: yes
preparation.setFocus called every driving frame: yes
9 active cell descriptors rebuilt every driving frame: yes
9 mapped request descriptors rebuilt every driving frame: yes
preparation.updateDesired called every driving frame: yes
first pump called every driving frame: yes
3 manual prefetch requests issued every driving frame: yes
second pump called every driving frame: yes
Core World focus/update gated by cell key: yes
near-host reconciliation gated by cell key: yes
controller built-in prefetchDistance: 3
controller/product canonical prefetch plan: no
streaming generation or desired-window digest: no
FirstNearWorldStreamingBoundFrameAck: no
```

## Conservative caller-owned construction floor

```txt
forward vector object                                      1
setFocus envelope + position + velocity                   3
desired array                                              1
9 cell descriptors × (cell + coordinates + bounds)       27
mapped desired array + 9 request descriptors              10
two pump option objects                                    2
3 prefetch cells × (cell + coordinates + bounds)           9
3 request option objects                                   3
                                                         ----
minimum per driving frame                                 56
```

Conditional arithmetic only:

```txt
56 × 60 frames/second = 3,360 constructions/second
3,360 × 60 seconds     = 201,600 constructions/minute
```

Excluded from the floor: controller focus clones, active/prefetch sets, prefetch coordinate objects, enqueue options, eviction arrays, statistics, diagnostics, request clones, pump result objects, callbacks, patch generation, Three.js work and browser internals.

## Inventory

```txt
Core kits: 8
product DSKs: 12
engine-installed kits: 20
Core World effect providers: 2
controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
render surfaces: 3
proposed streaming-cadence surfaces: 20
project validation command: npm test
```

## Documentation changed

```txt
new tracker and turn ledger
new architecture audit
new render audit
new gameplay audit
new interaction audit
new streaming-system contract audit
new deployment fixture gate
new central-sync audit
START_HERE/current-audit/next-steps/known-gaps/validation refreshed
kit-registry.json refreshed
```

## Not changed

```txt
runtime JavaScript, HTML or CSS: no
world, truck, camera, horizon or streaming behavior: no
gameplay, input, scoring or storage: no
tests, packages or workflows: no
deployment: no
branch or pull request: no
```

## Not executed

```txt
npm test: not run
stationary cadence fixture: unavailable
within-cell retained-plan fixture: unavailable
heading-only prefetch fixture: unavailable
cell-transition count fixture: unavailable
allocation/heap/frame profile: not run
artifact and Pages parity: not run
```

## Claims not made

No visible performance defect, performance improvement, frame-time regression, GC pause, memory leak, allocation-byte amount, canonical prefetch correctness, stale-work correctness, matching-frame proof, artifact parity, Pages parity or production readiness is claimed.