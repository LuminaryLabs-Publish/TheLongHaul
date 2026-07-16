# Architecture audit: runtime-frame fault containment DSK map

**Timestamp:** `2026-07-16T18-58-24-04-00`  
**Repository head:** `a756b21caee440a818bd23fd6e8556a9b3cb2426`

## Current ownership map

```txt
browser RAF
  -> app host owns recursive scheduling
  -> product phases call Core and product DSK APIs
  -> Three.js, Canvas2D, DOM and WebAudio adapters project results
  -> catch owns only console + overlay projection
```

No existing kit owns the transaction from a failed frame to retired scheduler, retired inputs/resources and one terminal visible result.

## Current phase graph

```txt
frame callback
  1. queue successor RAF
  2. generation step or idle/driving pre-tick
  3. engine.tick(dt)
  4. scene UI projection
  5. gameplay settlement
  6. world streaming
  7. truck and wildlife presentation
  8. camera, HUD and audio
  9. loading UI and map
  10. renderer.render
  11. pressed.clear
```

Any phase can prevent later phases from executing. There is no phase receipt or accepted-frame boundary.

## Required parent domain

`the-long-haul-runtime-frame-fault-containment-retirement-authority-domain`

```txt
runtime-frame-execution
├─ scheduler-generation
├─ phase-boundary
├─ fault-classification
├─ partial-mutation-settlement
├─ input-retirement
├─ audio-retirement
├─ world/generation-retirement
├─ terminal-result-publication
├─ stable-fault-projection
└─ restart-admission
```

## Command and result contract

```txt
RuntimeFrameExecutionCommand
  -> bind document, session, run, scene, scheduler and frame revisions
  -> admit one frame generation
  -> execute named phases with phase receipts
  -> reject stale or retired callbacks
  -> publish RuntimeFrameExecutionResult

RuntimeFrameFaultCommand
  -> classify phase, error and partial-mutation evidence
  -> atomically retire the failed scheduler generation
  -> clear held and one-shot input
  -> mute active audio
  -> cancel or retire generation and world work
  -> prohibit continuation from indeterminate partial state
  -> publish RuntimeFrameFaultResult
  -> project one accessible terminal fault surface
  -> publish FirstFaultFrameAck

RuntimeRestartAdmissionCommand
  -> require explicit user action
  -> choose reload or clean-run restart policy
  -> create a fresh runtime generation
  -> reject callbacks and resources from the failed generation
```

## Integration boundary

The authority coordinates existing Core Scene, Core World, Core Input, Core Simulation, Core Graphics, Transaction Ledger, product DSK and adapter retirement behavior. It must not absorb their internal semantics or convert the host into a second gameplay engine.

## Recommended implementation order

1. Add scheduler generation and stale-callback guards.
2. Add phase IDs and phase receipts.
3. Add a terminal fault result and repeated-fault dedupe.
4. Add input/audio/world/generation retirement adapters.
5. Project and acknowledge one stable fault frame.
6. Add explicit reload/clean-restart admission.
7. Add injected failure fixtures.

## Non-goals

- No automatic continuation from indeterminate partial state.
- No hidden retry loop.
- No broad Core restructure.
- No replacement of existing WebGL recovery or product-policy audits.
