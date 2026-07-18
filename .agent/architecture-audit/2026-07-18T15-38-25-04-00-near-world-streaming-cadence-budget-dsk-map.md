# Architecture audit: near-world streaming cadence and budget DSK map

**Timestamp:** `2026-07-18T15-38-25-04-00`  
**Status:** `near-world-streaming-desired-set-cadence-work-budget-authority-audited`

## Existing ownership

```txt
Core World
  -> world registration
  -> uniform-grid partition
  -> focus and active-cell lifecycle
  -> provider ordering

long-haul-world-patch-preparation-controller
  -> focus normalization
  -> desired active and prefetch membership
  -> request deduplication
  -> queue ordering
  -> generation and activation budgets
  -> cache and eviction
  -> statistics and snapshots

Long Haul browser host
  -> derives near-cell key
  -> reconstructs active 3x3 desired window
  -> republishes preparation focus
  -> invokes updateDesired
  -> invokes two pumps
  -> adds a product-owned prefetch strip
  -> conditionally updates Core World and Three.js hosts

three-webgl-presentation-adapter
  -> realizes accepted near patches
  -> releases retired hosts and resources
```

The current boundary gives the host frame loop ownership of cadence and repeated request-shape construction. Core World owns active cells, while the preparation controller owns desired/prepared records. No generation identity proves that both authorities consume the same admitted focus and desired-window plan.

## Installed DSKs and services

| DSK | Services relevant to this audit |
|---|---|
| `core-world-domain` | world register/remove; partition; focus; update; active cells; provider lifecycle; validation; snapshot |
| `long-haul-world-profile-kit` | gameplay cell size/radius; horizon and atlas policy; configure; snapshot/reset |
| `long-haul-course-kit` | course state; exploration; route sampling; snapshot/load/reset |
| `long-haul-run-kit` | run state; distance; penalties; completion/failure; snapshot/load/reset |
| `core-graphics-kit` | streamed instance-batch cell replace/remove; flush; release receipts |
| `core-transaction-ledger-kit` | apply-once and duplicate classification for terminal gameplay operations |

## Provider and controller services

| Surface | Services |
|---|---|
| `long-haul-course-provider` | prepared-cell admission; update; release; descriptor; preparation snapshot/restore/reset |
| `long-haul-world-patch-preparation-controller` | `setFocus`; `updateDesired`; built-in forward prefetch; `request`; `pump`; `prime`; `release`; ready/released queues; cache; eviction; diagnostics; stats; snapshot/reset |
| `three-webgl-presentation-adapter` | realize/release near-cell hosts; instance-batch replacement; resource disposal; rendered frame |

## Current command flow

```txt
RAF driving frame
  -> updateWorldStreaming()
      -> preparation.setFocus(fresh object graph)
      -> construct 9 cell descriptors
      -> construct 9 desired request descriptors
      -> preparation.updateDesired(...)
      -> preparation.pump({ maximum: 6 })
      -> construct and request 3 manual prefetch cells
      -> preparation.pump({ maximum: 2 })
      -> if near-cell key changed
          -> coreWorld.setFocus(...)
          -> coreWorld.updateWorld(...)
          -> reconcileCells()
```

The first seven steps are not admitted by a stable focus key, desired-window key, direction key, queue-state predicate, or work budget result.

## Required authority

**Proposed, not implemented:**

`the-long-haul-near-world-streaming-desired-set-cadence-work-budget-authority-domain`

```txt
StreamingGenerationAdmissionCommand
  -> courseGeneration
  -> nearWorldGeneration
  -> StreamingGenerationAdmissionResult

StreamingFocusAdmissionCommand
  -> nearCellKey
  -> quantizedDirectionKey
  -> priorAcceptedFocus
  -> changed | retained | rejected-stale
  -> StreamingFocusAdmissionResult

DesiredWindowSettlementCommand
  -> activeWindowPlan
  -> activeMembershipDiff
  -> retainedMembership
  -> DesiredWindowSettlementResult

PrefetchPlanCommand
  -> controllerPrefetchPolicy
  -> productPrefetchPolicy
  -> overlap classification
  -> canonical requests
  -> PrefetchPlanResult

PatchPreparationPumpCommand
  -> queueState
  -> generationBudget
  -> started | retained-idle | blocked | rejected-stale
  -> PatchPreparationPumpResult

StreamingProjectionCommitCommand
  -> accepted active cells
  -> realized host cells
  -> NearWorldStreamingDigest
  -> FirstNearWorldStreamingBoundFrameAck
```

## Proposed DSK surfaces

1. `near-world-streaming-generation-kit`
2. `near-world-focus-key-kit`
3. `near-world-direction-key-kit`
4. `near-world-desired-window-plan-kit`
5. `near-world-desired-window-cache-kit`
6. `near-world-desired-window-diff-kit`
7. `near-world-prefetch-policy-kit`
8. `near-world-prefetch-plan-kit`
9. `near-world-prefetch-overlap-settlement-kit`
10. `near-world-patch-queue-state-kit`
11. `near-world-pump-admission-kit`
12. `near-world-pump-budget-kit`
13. `near-world-stale-work-rejection-kit`
14. `near-world-work-diagnostics-kit`
15. `near-world-streaming-work-digest-kit`
16. `near-world-frame-digest-kit`
17. `first-near-world-streaming-bound-frame-ack-kit`
18. `near-world-cadence-fixture-kit`
19. `near-world-allocation-profile-fixture-kit`
20. `pages-near-world-streaming-parity-fixture-kit`

## Placement rule

Do not move course semantics or patch generation into the renderer. Add one renderer-neutral product authority around the existing Core World and patch-preparation controller. The host should submit focus evidence and consume immutable settlement results; it should not reconstruct unchanged desired membership or independently layer prefetch policies every frame.

## Completion boundary

Architecture convergence requires one accepted streaming generation to own focus, desired membership, prefetch membership, pump work, active Core World cells, realized near hosts, and the first matching presented frame.