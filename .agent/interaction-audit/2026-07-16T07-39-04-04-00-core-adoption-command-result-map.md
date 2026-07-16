# Interaction audit: Core adoption command/result map

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

The new Core profile is constructed only when the user opens `core-integration.html`. The playable game never receives a command or result that admits the same profile, migrates existing state, or proves that Core-owned descriptors produced the visible interaction response.

## Plan ledger

**Goal:** make Core capability adoption an explicit, revision-bound interaction rather than an implicit difference between two entry points.

- [x] Map current playable and smoke commands.
- [x] Identify missing admission, migration, parity, retirement, and frame results.
- [x] Define stale and duplicate rejection rules.
- [ ] Implement the command/result boundary.
- [ ] Execute interaction and frame convergence fixtures.

## Current command map

```txt
playable user command
  -> browser keyboard or button handler
  -> inline host or existing playable engine kit
  -> gameplay state mutation
  -> Three.js/Canvas2D/DOM projection

Core smoke page load
  -> synchronously create separate Core profile
  -> execute local checks
  -> write pass/fail DOM rows

missing
  -> no command adopts smoke-proven capabilities in the playable engine
  -> no result identifies which owner accepted the command
  -> no migration result binds old and new state
  -> no frame acknowledgement binds a Core result to gameplay output
```

## Required commands

```txt
CoreCapabilityAdmissionCommand
  evidence:
    product release
    playable entry module
    smoke entry module
    Nexus Engine provider revision
    Core profile revision
    capability descriptors

CoreProfileBootstrapCommand
  evidence:
    accepted manifest
    route/run generation
    course seed and schema

CoreStateMigrationCommand
  evidence:
    legacy state revision
    Core state revision
    migration policy version

CoreParityVerificationCommand
  evidence:
    common fixture ID
    common seed
    common command log
    expected semantic outputs

CoreCapabilityRetirementCommand
  evidence:
    adopted profile result
    zero active legacy consumers
    final legacy snapshot
```

## Required terminal results

```txt
CoreCapabilityAdmissionResult
  accepted | rejected | incompatible | duplicate | stale

CoreProfileBootstrapResult
  ready | failed | fallback

CoreStateMigrationResult
  exact | transformed | rejected | rollback

CoreParityVerificationResult
  equivalent | divergent | insufficient-evidence

CoreCapabilityRetirementReceipt
  retired | deferred | rejected

FirstCoreBoundPlayableFrameAck
  accepted Core profile revision
  accepted gameplay revision
  accepted camera/batch/world revisions
  renderer and frame revisions
```

## Rejection rules

```txt
reject two active Nexus Engine provider revisions for one playable generation
reject a Core profile whose meter IDs do not map to the canonical gameplay schema
reject an RNG stream manifest that cannot restore the accepted run
reject duplicate truth ownership after retirement
reject migration from a stale gameplay revision
reject a smoke result whose profile digest differs from the playable profile digest
reject a frame acknowledgement from a retired profile or renderer generation
```

## Interaction continuity

The user-visible game should not switch truth owners mid-frame. Adoption must occur at a safe route boundary, preferably before course generation or through an atomic retry/reset generation. Existing title, generation, driving, pause, result, and loss interactions remain product-owned; the authority only decides which accepted Core services those interactions consume.

## Boundary

The smoke page remains a proof adapter. It must not silently become a second product runtime or be treated as gameplay parity evidence without typed results.