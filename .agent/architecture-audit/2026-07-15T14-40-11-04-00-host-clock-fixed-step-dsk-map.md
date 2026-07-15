# Architecture audit: host clock fixed-step DSK map

**Timestamp:** `2026-07-15T14-40-11-04-00`

## Plan ledger

**Goal:** assign clock, simulation-step and render-frame responsibilities without moving browser ownership into gameplay kits.

- [x] Preserve current kit ownership.
- [x] Identify the host-only timing boundary.
- [x] Separate wall time, simulation time and render time.
- [x] Define command, result, revision and proof surfaces.
- [ ] Implement the authority.

## Current composition

```txt
browser RAF and performance.now
  -> product host derives variable dt
  -> driving host mutates input and interaction requests
  -> Nexus Engine tick advances all installed domains
  -> product host projects accepted state into Three.js Canvas2D DOM and WebAudio
```

The engine-installed kits remain responsible for domain truth. The browser host remains responsible for callback timestamps and render submission. The missing layer is an explicit time-admission authority between those two responsibilities.

## Existing DSK and provider map

```txt
Core Scene
  core-scene-kit

Core World
  core-world-domain
  long-haul-terrain-provider
  long-haul-course-provider

Core Input
  long-haul-core-input-kit

Game truth
  long-haul-delivery-domain-kit
  long-haul-core-simulation-kit
  vehicle-dynamics-kit
  long-haul-route
  long-haul-condition
  long-haul-wildlife
  long-haul-telemetry

Product adapters
  procedural-course-generator
  three-webgl-presentation-adapter
  dom-scene-hud-adapter
  canvas-map-adapter
  web-audio-adapter
  browser-storage-adapter

Deployment
  github-pages-workflow
```

## Proposed parent domain

```txt
the-long-haul-host-clock-fixed-step-simulation-frame-authority-domain
```

## Proposed subkits

```txt
host-frame-command-kit
  receives one browser callback timestamp and expected revisions

monotonic-clock-source-kit
  owns timestamp source identity and first-sample baseline

wall-delta-normalization-kit
  rejects negative or invalid deltas and publishes normalized wall time

fixed-step-accumulator-kit
  owns accumulated admitted wall time

simulation-step-admission-kit
  admits fixed quanta into Nexus Engine ticks

max-substep-budget-kit
  bounds catch-up work per host frame

residual-time-retention-kit
  carries incomplete time into the next host frame

overload-time-policy-kit
  classifies defer, drop, pause or fail behavior

discarded-time-receipt-kit
  records every intentionally discarded interval

pause-clock-settlement-kit
  binds run and route suspension to clock state

visibility-resume-baseline-kit
  settles hidden and visible transitions without implicit time debt

simulation-revision-kit
  identifies each accepted fixed step

render-interpolation-kit
  derives interpolation alpha from accepted residual time

host-frame-result-kit
  publishes steps, residual, overload, render revisions and status

first-clock-bound-frame-ack-kit
  proves one visible frame consumed the intended simulation revisions

cadence-matrix-fixture-kit
visibility-resume-fixture-kit
source-pages-clock-parity-kit
host-clock-diagnostics-adapter-kit
```

## Ownership rules

```txt
browser host owns callback timestamps only
clock authority owns admission and overload policy
Core Simulation owns run time and terminal state
Vehicle Dynamics owns truck integration
other kits consume the same accepted fixed delta
presentation reads accepted snapshots and interpolation data
no renderer may invent simulation time
no gameplay kit may read performance.now directly
no dropped interval may remain unreported
```

## Command/result contract

```txt
HostFrameCommand
  HostFrameId
  ClockRevision
  callbackTimestamp
  expectedRouteRevision
  expectedRunRevision
  expectedVisibilityRevision

HostFrameResult
  normalizedWallDelta
  acceptedStepCount
  SimulationStepResult[]
  residualSeconds
  interpolationAlpha
  deferredSeconds
  discardedSeconds
  overloadClassification
  renderedSimulationRevisions
  status
```

## Boundary

This document defines architecture only. It does not claim the proposed DSK family is implemented or that current gameplay is cadence-independent.
