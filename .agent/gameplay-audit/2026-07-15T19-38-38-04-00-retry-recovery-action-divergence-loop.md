# Gameplay audit: retry and recovery action divergence

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** make retry and roadside recovery distinct semantic actions with one truthful binding and result path each.

- [x] Trace declared actions and keyboard bindings.
- [x] Trace live `KeyR` and `KeyE` consumers.
- [x] Trace recovery eligibility and retry generation replacement.
- [x] Identify the action-contract divergence.
- [ ] Implement semantic action settlement and gameplay fixtures.

## Declared contract

```txt
KeyE -> interact
KeyR -> recovery
```

## Executable contract

```txt
KeyE while driving
  -> set interactWanted
  -> evaluate stuck, fuel, road and world bounds
  -> recover when eligible
  -> otherwise check a nearby depot

KeyR while driving
  -> retry the same seed
  -> clear world and reset domains
  -> enter generation
```

The live behavior has a `retry` action that is absent from the Core Input manifest and a `recovery` binding that does not execute its declared semantic action.

## Risk surface

- Input help, telemetry or remapping derived from the Core Input descriptor can report the wrong behavior.
- A future consumer may treat `KeyR` as recovery while the host still treats it as retry.
- Retry replaces the run and world, while recovery mutates the current run; conflating them crosses a major lifecycle boundary.
- No typed result distinguishes accepted recovery, recovery unavailable, retry accepted, retry rejected or stale route input.

## Required settlement

```txt
RecoveryActionCommand
  -> require driving context and recovery eligibility
  -> publish RecoveryActionResult
  -> preserve the current run generation

RetryActionCommand
  -> require an eligible driving, pause, result or loss context
  -> allocate a new generation attempt
  -> retire the current run and presentation generation
  -> publish RetryActionResult
```

Both commands must originate from the same versioned action map and publish matching first-effect frame acknowledgements.

## Validation boundary

No gameplay behavior changed and no keyboard fixture was executed.