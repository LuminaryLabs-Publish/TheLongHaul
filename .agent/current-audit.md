# Current audit: delivery terminal result settlement

**Timestamp:** `2026-07-14T14-39-54-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `ed31f1903e0400200688465abfc124268eeadd9e`  
**Status:** `delivery-terminal-result-settlement-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser game with procedural generation, freight driving, depot discovery, condition pressure, scoring, retry, WebGL rendering, a Canvas2D map, DOM UI, audio, persistence and Pages deployment.

The current audit isolates the exact step where an accepted delivery becomes terminal truth.

## Source-backed inventory

```txt
runtime entry point: index.html
Nexus Engine revision: c5548de504072bf09eb68986b98aca0292903803
Three.js version: 0.165.0
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
render surfaces: 3
Pages workflow: present
package manifest: absent
test suite: absent
build command: absent
```

## Complete interaction loop

```txt
boot -> title
  -> start seeded generation
  -> build trunk and five branches
  -> place five depots and choose one destination
  -> prepare terrain, streamed content, hazards and truck
  -> validate route and world
  -> enter timed driving
  -> explore roads and candidate depots
  -> wrong depot adds 20 seconds
  -> correct depot emits an accepted delivery check
  -> same engine step can also contain collision, impact, resource failure or timeout proposals
  -> current system order marks delivery completed first
  -> score result is projected and optionally persisted
  -> retry same seed, generate a new seed or return to title
```

## Domains in use

```txt
browser and import-map lifecycle
Core Scene
Core World
Core Input
Long Haul Delivery
Core Simulation
Vehicle Dynamics
Route Field
Resource Pressure
Hazard Field
Telemetry
procedural course generation
streamed terrain and course content
terminal proposal ordering and outcome settlement
score policy, result persistence and retry lineage
WebGL presentation
DOM UI and HUD
Canvas2D map
WebAudio
localStorage
GitHub Pages deployment
audit governance
```

## Kits and services

```txt
10 engine kits
  Core Scene: scene registry, current scene, transitions, exit validation, snapshots
  Core World: world registry, grid partition, focus, active cells, provider ordering, validation
  Core Input: action manifest, keyboard bindings, contexts, intent, reset
  Long Haul Delivery: seed, generation progress, depots, destination, checks, retry, result, snapshot, reset
  Core Simulation: run reset/start/pause/resume, timer, distance, penalties, collisions, recovery, failure, completion
  Vehicle Dynamics: truck state, input, kinematics, boost, bounds, impacts, reset
  Route Field: markers, corridors, nearest marker, state, reset
  Resource Pressure: fuel, truck, cargo, bounded adjustment, state, reset
  Hazard Field: hazard state, motion, bounds, circle collision, collision events, reset
  Telemetry: truck, run, condition and delivery histories

2 world providers
  terrain cell preparation, update, release, descriptor and snapshot
  road, depot, sign, vegetation and obstacle cell preparation, update, release, descriptor and snapshot

6 browser/product adapters
  procedural course generation
  Three.js presentation
  DOM UI and HUD
  Canvas2D map
  WebAudio
  localStorage
```

## Main finding

`processDrivingBeforeTick()` captures delivery metrics and emits `DeliveryRegionCheck` before `engine.tick()`. The delivery system runs in `simulate`, accepts the destination and immediately builds `runResult` from that pre-tick metric snapshot.

The simulation system runs later in `resolve`. It processes `DeliveryRegionChecked` first and changes the run to `completed`. Collision and impact handlers then skip because the run is no longer `running`; explicit failure requests are ignored because the run is already completed; timeout also applies only while running.

The effective policy is therefore:

```txt
accepted delivery
  > same-step wildlife collision
  > same-step boundary or obstacle impact
  > same-step resource failure
  > same-step timeout
```

That precedence is not declared, versioned or tested. Same-step damage, penalties and condition changes can be absent from the score. The stored result has no RunId, StepId, ResultId, score-policy revision or fingerprint. Results UI and localStorage update have no participant receipts or first matching frame acknowledgement. Retry immediately consumes a transient `Date.now()` ID and does not cite an immutable predecessor outcome.

## Required authority

```txt
the-long-haul-delivery-terminal-result-settlement-authority-domain
```

```txt
DeliveryTerminalSettlementCommand
  -> bind RunId, StepId, seed, route, destination and score-policy revisions
  -> collect delivery, collision, impact, failure and timeout proposals
  -> classify duplicate and conflicting proposals
  -> apply one explicit precedence policy
  -> finalize distance, time, penalties, cargo, truck and fuel
  -> create one immutable RunOutcomeArtifact
  -> publish DeliveryTerminalSettlementResult
  -> persist only the accepted best-score document
  -> project the same artifact into results UI
  -> acknowledge FirstTerminalResultFrameAck

RunRetryCommand
  -> cite the accepted predecessor outcome
  -> allocate successor RunId and retry lineage
  -> reject duplicate, stale and late predecessor work
```

## Audit boundary

This run changes documentation only. It does not alter runtime source, gameplay, scoring, rendering, storage, imports, workflow or deployment behavior.