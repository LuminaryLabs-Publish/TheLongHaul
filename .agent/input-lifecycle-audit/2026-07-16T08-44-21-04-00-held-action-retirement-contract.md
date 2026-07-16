# Input lifecycle audit: held-action retirement contract

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** define the minimum implementation contract for focus-safe continuous and one-shot keyboard actions.

- [x] Identify current mutable input stores.
- [x] Identify lifecycle signals and ownership revisions.
- [x] Define atomic retirement and restoration behavior.
- [ ] Implement and test the contract.

## State model

```txt
InputAdapterState
  generation
  status: active | retiring | retired
  documentGeneration
  routeGeneration
  runGeneration
  heldCodes
  pressedCodes
  acceptedEventIds
  lastRetirement
```

## Admission rules

1. Accept key evidence only while the adapter generation is `active`.
2. Require the event to cite the active document and route generation.
3. Suppress repeated keydown evidence for one-shot actions.
4. Keep continuous held state and one-shot pending state distinct.
5. Do not infer lifecycle ownership from browser event order alone.

## Retirement triggers

```txt
window blur
document visibility becomes hidden
pagehide
freeze when supported
route leaves driving
run clear
retry or fresh generation
run completion
run failure
input adapter replacement
fatal frame error
```

## Atomic retirement

```txt
begin retirement
  -> compare expected generation
  -> if already retired, return stored result
  -> set status retiring
  -> copy held and pressed action IDs into result evidence
  -> clear heldCodes
  -> clear pressedCodes
  -> submit Core Input neutral intent
  -> submit Truck Input neutral request
  -> optionally request safe pause
  -> set status retired
  -> persist HeldInputRetirementResult
```

Neutral intent is:

```txt
throttle: 0
brake: 0
steer: 0
boost: false
interact: false
```

The host must also cancel unconsumed camera, map, pause, retry, and interaction one-shots.

## Restoration

```txt
restore evidence
  -> require retired predecessor
  -> require neutral settlement result
  -> allocate new input generation
  -> initialize empty held and pressed stores
  -> preserve no previous key state
  -> require fresh keydown for movement
```

Do not reconstruct held state by querying keyboard hardware; the browser does not provide a reliable complete key-state snapshot.

## Race handling

- Blur and route exit racing together return one retirement result.
- Hidden followed by pagehide returns the existing result.
- Late keyup from the retired generation is classified `stale`.
- Late keydown from the retired generation is rejected.
- A frame error before `pressed.clear()` triggers retirement.
- Restore before neutral settlement remains blocked.
- A fresh generation cannot share mutable stores with its predecessor.

## Pause policy

Recommended default:

```txt
focus loss while driving
  -> neutralize immediately
  -> request Run pause and lock remaining-time
  -> route to paused when the document is active again
```

A non-pausing policy is acceptable only if neutral settlement is still guaranteed before the next simulation step and the time policy is explicitly documented.

## Required observability

```txt
HeldInputRetirementResult
InputFocusRestoreResult
CoreInputNeutralizationResult
TruckInputNeutralizationResult
FirstNeutralInputFrameAck
```

Diagnostics should expose the active generation, lifecycle status, last retirement reason, held action count, cancelled one-shot count, and matching frame acknowledgement.

## Validation fixtures

- Blur without keyup.
- Hidden tab without keyup.
- Pagehide with `persisted=false`.
- Pagehide/pageshow with `persisted=true`.
- Freeze/resume where available.
- Route exit while throttle is held.
- Retry while a one-shot action is pending.
- Fatal frame error before ordinary pressed clear.
- Late stale keyup and keydown.
- Fresh keydown after restoration.

## Validation boundary

This contract is planned, not implemented. No browser lifecycle or input-safety claim is made.