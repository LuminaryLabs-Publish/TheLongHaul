# Architecture audit: course-generation admission DSK map

**Timestamp:** `2026-07-14T09-03-47-04-00`  
**Reviewed revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`

## Summary

The implementation composes ten Nexus Engine kits and two Core World effect providers, then wraps them in a large browser host that owns procedural generation, rendering, audio, storage, input listeners, and UI. The composition is functional, but generation lacks one parent transaction that prepares and validates all participants before adoption.

## Current hierarchy

```txt
TheLongHaul browser host
  Core Scene
  Core World
    long-haul-terrain-provider
    long-haul-course-provider
  Core Input
  Long Haul Delivery
  Core Simulation
  Vehicle Dynamics
  Route Field
  Resource Pressure
  Hazard Field
  Telemetry

browser-owned services
  procedural course generator
  Three.js presentation
  DOM scene and HUD projection
  Canvas2D exploration map
  WebAudio
  localStorage
  RAF and lifecycle listeners
```

## Current service ownership

| Owner | Truth or service |
|---|---|
| Core Scene | Route state and allowed exits. |
| Core World | World identity, partition, focus, provider lifecycle, active cells, validation. |
| Long Haul Delivery | Seed, generation progress, destination identity, checked depots, retry, final score. |
| Core Simulation | Timer, distance, status, penalties, collisions, recovery, failure. |
| Core Input | Normalized driving intent. |
| Vehicle Dynamics | Truck position, velocity, heading, input, boost, impacts. |
| Route Field | Road graph projection as markers and corridors plus depot queries. |
| Resource Pressure | Fuel, truck condition, cargo condition. |
| Hazard Field | Wildlife state and collisions. |
| Telemetry | Bounded history over four core resources. |
| Browser host | Candidate route construction, generation sequencing, direct resource mutation, rendering, camera, exploration, map, audio, storage, and failure overlay. |

## Current dependency flow

```txt
seed
  -> procedural graph
  -> route field
  -> delivery candidate depots
  -> chosen valid destination
  -> terrain cache
  -> Core World providers
  -> streamed render cells
  -> hazards
  -> truck
  -> route validation
  -> world validation
  -> run start
```

The dependency order is encoded in a JavaScript array of generation units, not a DSK dependency manifest. Unit completion is reported to the delivery kit, but the units mutate live state directly.

## Gap

```txt
candidate resource graph: absent
participant prepare receipts: absent
atomic adoption: absent
predecessor preservation: absent
complete disposal manifest: absent
rollback result: absent
offscreen probe frame: absent
generation attempt supersession: absent
```

## Required parent domain

```txt
the-long-haul-course-generation-admission-rollback-authority-domain
```

It should coordinate delivery, route, world, hazards, truck, rendering, and scene entry without replacing their existing service ownership.

## Target DSK map

```txt
Course Generation Authority
  generation-attempt-identity-kit
  seed-revision-kit
  generation-plan-manifest-kit
  generation-unit-receipt-kit
  course-graph-candidate-kit
  route-field-candidate-kit
  destination-candidate-kit
  terrain-cell-candidate-kit
  world-provider-candidate-kit
  hazard-candidate-kit
  truck-candidate-kit
  course-validation-receipt-kit
  generation-resource-manifest-kit
  offscreen-course-probe-kit
  generation-rollback-kit
  predecessor-generation-preservation-kit
  course-generation-result-kit
  first-admitted-course-frame-kit
```

## Admission rule

A generation is playable only when one result binds the same attempt ID, seed, route fingerprint, destination ID, active-cell manifest, hazard manifest, truck spawn, scene revision, and first visible frame. Any failed or superseded attempt must dispose only its own candidates and leave the accepted predecessor intact.
