# Architecture audit: browser-focus input release DSK map

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** preserve existing domain ownership while adding one narrow lifecycle authority between browser evidence and accepted gameplay input.

- [x] Map every installed engine kit.
- [x] Map the Core World provider and patch controller.
- [x] Map browser, presentation, proof, and deployment adapters.
- [x] Locate the held-input ownership gap.
- [ ] Implement the planned authority without moving simulation truth into DOM listeners.

## Existing composition

```txt
browser evidence
  -> keyboard adapter
  -> Core Input intent
  -> Long Haul Truck input event
  -> engine tick
  -> Truck / Course / Run / Delivery / Wildlife state
  -> Core Simulation meters
  -> Core Camera descriptor
  -> Core Graphics batches
  -> Three.js / Canvas2D / DOM / WebAudio projection
```

## Existing DSK ownership

| Domain | Kit/API | Authoritative services |
|---|---|---|
| Scene | Core Scene / `coreScene` | Route registry, exit validation, transition identity, current route |
| World | Core World / `coreWorld` | World registration, focus, active cells, provider lifecycle |
| Input | Core Input / `coreInput` | Semantic action declaration and current intent snapshot |
| Data | Core Data / `coreData` | Schema, package envelope, digest and named randomness |
| Simulation | Core Simulation / `coreSimulation` | Resource meter state, rates, locks, thresholds |
| Camera | Core Camera / `coreCamera` | Portable smoothed camera descriptor |
| Graphics | Core Graphics / `coreGraphics` | Instance-batch state, cell writes and release receipts |
| Transactions | Core Transaction Ledger / `coreTransactionLedger` | Apply-once operation settlement |
| Truck | `long-haul-truck-kit` / `longHaulTruck` | Vehicle state and kinematics |
| Course | `long-haul-course-kit` / `longHaulCourse` | Course state, exploration and route queries |
| Run | `long-haul-run-kit` / `longHaulRun` | Run telemetry, penalties, recovery and terminal state |
| Delivery | `long-haul-delivery-kit` / `longHaulDelivery` | Depot evaluation and delivery result |
| Wildlife | `long-haul-wildlife-kit` / `longHaulWildlife` | Crossing-hazard state and motion |

## Adapter boundary

The browser keyboard adapter currently owns mutable DOM evidence:

```txt
keys: Record<KeyboardEvent.code, boolean>
pressed: Set<KeyboardEvent.code>
```

It is not a DSK and has no generation, snapshot, retirement result, or stale-event rejection. Core Input owns the latest mirrored semantic intent, while Truck owns the latest submitted vehicle intent. The host can therefore leave both consumers active when the DOM evidence owner loses focus.

## Missing parent domain

`the-long-haul-browser-focus-held-input-release-authority-domain`

The domain should coordinate, not replace, existing owners.

| Planned surface | Responsibility |
|---|---|
| `input-focus-generation-kit` | Allocate and retire immutable adapter generations |
| `document-focus-observer-kit` | Convert focus/blur evidence into lifecycle commands |
| `visibility-lifecycle-observer-kit` | Convert hidden/visible evidence into lifecycle commands |
| `pagehide-bfcache-observer-kit` | Handle navigation and persisted-page ownership |
| `freeze-resume-observer-kit` | Handle browser page suspension where supported |
| `route-input-retirement-kit` | Retire input when leaving the driving route |
| `run-input-retirement-kit` | Retire input on clear, retry, completion and failure |
| `held-action-clear-kit` | Clear continuous actions exactly once |
| `one-shot-action-clear-kit` | Cancel unconsumed one-shot commands exactly once |
| `neutral-core-input-settlement-kit` | Publish zero semantic intent to Core Input |
| `neutral-truck-input-settlement-kit` | Publish zero vehicle intent to Truck DSK |
| `stale-key-evidence-rejection-kit` | Reject events from retired generations |
| `held-input-retirement-result-kit` | Publish typed reason, revisions and affected actions |
| `focus-loss-pause-policy-kit` | Optionally request a route-safe pause |
| `first-neutral-input-frame-ack-kit` | Bind neutral simulation state to presentation |
| `browser-input-lifecycle-fixture-kit` | Execute real-browser lifecycle evidence |

## Command flow

```txt
DOM lifecycle evidence
  -> InputFocusLifecycleCommand
  -> validate DocumentGeneration
  -> validate RouteGeneration
  -> validate InputAdapterGeneration
  -> validate RunGeneration
  -> retire keys and pressed
  -> Core Input neutral intent
  -> Truck neutral input
  -> HeldInputRetirementResult
  -> optional Core Scene / Run pause request
  -> engine tick
  -> render neutral state
  -> FirstNeutralInputFrameAck
```

## Ownership constraints

- DOM listeners may emit evidence only; they must not become simulation truth owners.
- Core Input remains the semantic intent snapshot owner.
- Truck remains the vehicle-state owner.
- Run remains the pause/terminal owner.
- Core Scene remains the route-transition owner.
- The lifecycle authority coordinates neutralization and retirement across these owners.
- A restored page must create a fresh generation before accepting new key evidence.
- Delayed events from an old generation must be classified as stale, not applied.

## Validation boundary

No DSK, adapter, event, result, or fixture was implemented. This document defines the required ownership map only.