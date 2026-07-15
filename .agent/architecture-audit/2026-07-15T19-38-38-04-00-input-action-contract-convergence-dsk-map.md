# Architecture audit: input action contract convergence DSK map

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** make one semantic action authority own browser evidence, bindings, contexts, Core Input publication and gameplay consumption.

- [x] Map declared Core Input actions and bindings.
- [x] Map browser event producers and direct command consumers.
- [x] Identify duplicate state owners.
- [x] Identify the recovery/retry mapping contradiction.
- [x] Define parent and child authority surfaces.
- [ ] Implement and validate the authority.

## Current ownership

```txt
window keyboard listeners
  -> mutable keys object
  -> direct scene, camera, map and retry commands
  -> per-frame driving derivation
  -> Core Input intent mirror
  -> vehicle and simulation consumers

Core Input kit
  -> action manifest
  -> keyboard bindings
  -> driving/menu contexts
  -> intent snapshot
  -> no browser event admission
  -> no one-shot action results
```

## Structural gap

```txt
browser evidence owner: host
held-action owner: host keys object
one-shot command owner: host listeners
binding contract owner: Core Input descriptor
context contract owner: Core Input descriptor
runtime context enforcement: absent
accepted action result: absent
```

The descriptor and executable path can diverge without rejection. The clearest example is `KeyR`: declared as `recovery`, executed as `retry`, while recovery is contextually executed through `KeyE`.

## Required DSK family

```txt
the-long-haul-input-action-contract-context-convergence-authority-domain
  input-event-admission-kit
  browser-keyboard-event-adapter-kit
  input-device-generation-kit
  input-action-map-revision-kit
  input-binding-resolution-kit
  input-context-revision-kit
  route-input-context-policy-kit
  held-action-state-kit
  repeat-and-duplicate-rejection-kit
  focus-target-input-guard-kit
  input-command-envelope-kit
  input-event-admission-result-kit
  input-action-result-kit
  core-input-state-publication-kit
  action-consumer-binding-kit
  stale-input-rejection-kit
  input-lifecycle-retirement-kit
  first-input-action-ack-kit
  first-input-effect-frame-ack-kit
  keyboard-context-artifact-pages-fixture-kit
```

## Command flow

```txt
InputEventAdmissionCommand
  -> validate document, device, event, map, context and route revisions
  -> normalize browser evidence
  -> reject repeat, stale, retired or out-of-context evidence
  -> update immutable held-action state
  -> publish InputEventAdmissionResult

InputActionCommand
  -> resolve one semantic action from the accepted map
  -> publish InputActionResult exactly once
  -> update Core Input from the same result
  -> permit gameplay and presentation consumption
  -> publish FirstInputActionAck
  -> publish FirstInputEffectFrameAck
```

## Boundary rules

- The browser adapter owns raw DOM event normalization only.
- Core Input owns accepted semantic action state.
- Scene, camera, map, retry, recovery and vehicle consumers cannot read raw key codes.
- Route context changes retire incompatible held actions.
- The action manifest and executable binding table are one versioned artifact.
- Recovery and retry must have distinct, truthful semantics.

## Validation boundary

No DSK or runtime implementation was added. This file defines the required authority and proof surface only.