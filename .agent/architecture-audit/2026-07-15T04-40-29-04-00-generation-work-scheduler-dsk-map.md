# Architecture audit: generation work scheduler DSK map

**Timestamp:** `2026-07-15T04-40-29-04-00`

## Summary

Course content is deterministic, but host scheduling is not owned by a domain. Browser RAF directly decides when one generation unit executes, while Delivery owns unit-count progress and Core World, Route Field, Hazard Field, Vehicle Dynamics and presentation adapters receive mutations during the partially prepared attempt.

## Current ownership

```txt
DOM Start/Retry action
  -> host startGeneration()
  -> reset eight runtime participants
  -> create host-local generation object and unit closures
  -> Delivery begins a progress plan

browser RAF
  -> host stepGeneration()
  -> execute one closure
  -> mutate host, engine, Core World or renderer state
  -> Delivery records one completed ID

final closures
  -> route validation
  -> Core World validation
  -> generation.ready = true
  -> later frame starts Simulation and transitions to driving
```

## Domain map

```txt
Core Scene
  owns route transition eligibility

Long Haul Delivery
  owns seed, plan IDs, completed IDs, phase and ratio

Core Simulation
  owns run start after readiness

Core World
  owns world registration, cells, providers and validation

Route Field
  owns depot markers and corridors

Hazard Field
  owns generated wildlife

Vehicle Dynamics / Resource Pressure / Input / Telemetry
  own reset and playable-run state

Three.js / DOM adapters
  own partial-world and progress presentation

browser host
  currently owns queue construction, execution cadence, failure catch and ready adoption
```

## Gap

No DSK owns:

```txt
generation attempt identity
work queue revision
frame-time budget
unit cost class
weighted progress
cancellation and visibility lifecycle
partial-attempt resource retirement
atomic ready adoption
first playable frame evidence
```

## Required composition

```txt
the-long-haul-generation-work-budget-readiness-authority-domain
  composes:
    generation-attempt-command-kit
    generation-attempt-revision-kit
    generation-work-queue-kit
    generation-frame-budget-policy-kit
    generation-unit-cost-classification-kit
    generation-work-admission-kit
    generation-unit-result-kit
    generation-weighted-progress-kit
    generation-cancellation-kit
    generation-visibility-lifecycle-kit
    generation-predecessor-retirement-kit
    generation-ready-adoption-kit
    generation-failure-rollback-kit
    first-playable-generation-frame-kit
    browser-cadence-matrix-fixture-kit
    browser-long-task-observer-fixture-kit
    source-pages-generation-parity-kit
    generation-diagnostics-adapter-kit
```

## Contract boundary

The authority should coordinate existing kits and providers, not replace course generation, Core World, simulation, vehicle, hazard or renderer ownership.