# Audio audit: context, loop, suspension and retirement contract

**Timestamp:** `2026-07-15T09-40-51-04-00`

## Plan ledger

**Goal:** own one browser audio graph from accepted unlock through exactly-once retirement.

- [x] Identify long-lived and transient node ownership.
- [x] Define route, visibility and preference policy.
- [x] Define suspension, resume and retirement receipts.
- [ ] Implement the contract.

## Required contract

```txt
AudioContextGeneration
  contextId
  generation
  capability
  unlockRevision
  preferenceRevision
  routeRevision
  visibilityRevision
  state: locked | active | silent | suspended | retired | failed

PersistentLoopLease
  sourceId
  sourceGeneration
  kind: engine | wind
  contextGeneration
  startedAt
  admittedRouteRevision
  gainRevision
  retiredAt

AudioLifecycleResult
  commandId
  contextGeneration
  priorState
  nextState
  acceptedRouteRevision
  acceptedVisibilityRevision
  acceptedPreferenceRevision
  sourceReceipts[]
  failureReason
```

## Invariants

```txt
one active AudioContextGeneration per document host
one engine loop and one wind loop per active generation
no cue admitted from a stale or retired generation
pause and blur settle loop gains without waiting for RAF
hidden state follows an explicit suspend-or-silent policy
resume requires visible document and enabled preference
pagehide/runtime retirement stops and disconnects sources exactly once
retired contexts cannot be resumed or receive cues
all audible/silent state changes publish acknowledgements
```

## Adapter boundary

The authority must not move WebAudio nodes into Nexus Engine core. It should consume semantic engine results and command a browser adapter that owns node creation, scheduling, suspension and disposal.