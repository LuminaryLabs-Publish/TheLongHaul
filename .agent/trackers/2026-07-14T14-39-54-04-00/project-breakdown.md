# Project breakdown: delivery terminal result settlement

**Timestamp:** `2026-07-14T14-39-54-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `ed31f1903e0400200688465abfc124268eeadd9e`  
**Status:** `delivery-terminal-result-settlement-authority-audited`

## Summary

TheLongHaul is a complete static browser freight game. The current audit isolates the terminal engine step. The accepted depot result is built before the resolve phase completes, and delivery becomes completed before same-step impacts, failures or timeout can settle. The resulting precedence is implicit, the score can omit same-step effects, and the result has no immutable identity, persistence receipt, retry lineage or matching frame acknowledgement.

## Plan ledger

**Goal:** document every active domain, kit and service, then define the minimum terminal authority needed to settle one exclusive and reproducible run outcome.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare ten eligible repositories against ten central ledger entries.
- [x] Confirm all ten have root `.agent` state.
- [x] Confirm every current eligible repository head matches its recorded repo-local documentation head.
- [x] Select only `TheLongHaul` by the oldest eligible central update timestamp.
- [x] Inspect the interaction loop, engine composition, terminal event order, score construction, results UI, persistence and retry.
- [x] Preserve the full 19-surface source-backed inventory.
- [x] Add one new timestamped tracker and audit family.
- [x] Update all required root `.agent` files and the machine registry.
- [ ] Implement the planned terminal-settlement authority.
- [ ] Add executable same-step conflict, persistence, retry and browser-frame fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible non-Cavalry repositories: 10
central ledger entries: 10
root .agent states: 10
new repositories: 0
ledger-missing repositories: 0
root-agent-missing repositories: 0
runtime-ahead repositories: 0
selected: TheLongHaul
selection rule: oldest eligible central documentation timestamp
selected prior central update: 2026-07-14T09-03-47-04-00
excluded: TheCavalryOfRome
```

## Complete interaction loop

```txt
boot
  -> load pinned Three.js and Nexus Engine providers
  -> create ten engine kits and two world providers
  -> create WebGL, DOM, Canvas2D, WebAudio and storage adapters
  -> enter title

start
  -> choose seed
  -> generate trunk, five branches and confusing fork
  -> place five candidate depots
  -> choose one valid destination
  -> register and stream terrain and course providers
  -> configure hazards and truck
  -> validate route and world
  -> enter timed driving

driving
  -> admit keyboard intent
  -> update truck, route, condition, hazards and telemetry
  -> discover roads and depots
  -> reject wrong yards with a 20-second penalty
  -> recover once when stuck or empty
  -> fail on timeout, destroyed cargo, disabled truck, exhausted fuel or unrecoverable stuck state
  -> accept the valid stopped depot check

terminal step
  -> capture delivery metrics before engine tick
  -> Delivery simulate system creates runResult on accepted check
  -> Simulation resolve system marks run completed
  -> later same-step collision and impact handlers skip because status is completed
  -> explicit fail is ignored after completion
  -> timeout applies only while running
  -> host transitions to results and writes best score

post-run
  -> show golf-style score
  -> retry same seed
  -> generate new seed
  -> return to title
```

## Domains in use

```txt
browser document, keyboard, blur, resize, RAF and localStorage lifecycle
import-map and immutable provider resolution
Nexus Engine world, scheduler, clock, events and resources
Core Scene routing and transition validation
Core World registry, grid partition and provider lifecycle
Core Input actions, bindings, contexts and intent
Long Haul Delivery seed, generation, depots, checks, retry and result
Core Simulation timing, distance, penalties, recovery, failure and completion
Vehicle Dynamics heavy-truck motion and impacts
Route Field markers, corridors and nearest-marker queries
Resource Pressure fuel, truck and cargo values
Hazard Field wildlife motion and collision proposals
Telemetry bounded resource histories
procedural course graph and depot generation
streamed terrain and route-content effects
terminal proposal ordering and outcome settlement
score policy and best-score persistence
retry lineage and predecessor evidence
Three.js WebGL presentation
DOM menus, HUD, results, loss and failure projection
Canvas2D exploration map
WebAudio synthesis
GitHub Pages deployment
audit and central-ledger governance
```

## Implemented kits and offered services

### 1. `core-scene-kit`

```txt
scene registry
current scene
transition request
exit validation
scene snapshot
```

### 2. `core-world-domain`

```txt
world register and remove
grid partition
focus
active-cell lifecycle
provider ordering
world validation
```

### 3. `long-haul-core-input-kit`

```txt
action manifest
keyboard bindings
input contexts
driving intent
input reset
```

### 4. `long-haul-delivery-domain-kit`

```txt
seed
generation progress
candidate depots
destination selection
depot checks
retry
run result
snapshot and load
reset
```

### 5. `long-haul-core-simulation-kit`

```txt
run reset and start
pause and resume
timer and remaining time
distance sampling
penalty ledger
collision count
recovery
failure
completion
```

### 6. `vehicle-dynamics-kit`

```txt
heavy-truck state
vehicle input
kinematics
boost
bounds
impact events
reset
```

### 7. `long-haul-route`

```txt
route markers
route corridors
nearest marker
route state
reset
```

### 8. `long-haul-condition`

```txt
fuel
truck condition
cargo condition
bounded adjustment
state
reset
```

### 9. `long-haul-wildlife`

```txt
hazard state
hazard motion
bounds
circle collision
collision events
reset
```

### 10. `long-haul-telemetry`

```txt
truck history
run history
condition history
delivery history
reset
```

## World providers and services

### `long-haul-terrain-provider`

```txt
foundation phase
terrain:surface capability
prepare cell
update cell
release cell
effect descriptor
active-cell snapshot
reset
```

### `long-haul-course-provider`

```txt
population phase
requires terrain:surface
provides route:content
prepare cell
update cell
release cell
roads
depots
signs
vegetation
obstacles
effect descriptor
active-cell snapshot
reset
```

## Browser, product and deployment adapters

```txt
procedural-course-generator
  seed hash, deterministic RNG, five-branch graph, confusing fork,
  depot placement, par calculation, course validation, generation plan

three-webgl-presentation-adapter
  renderer, scene, camera, lighting, atmosphere, streamed meshes,
  truck rig, wildlife rig, dust, shadows, resize, RAF

dom-scene-hud-adapter
  title, help, settings, generation progress, HUD, pause,
  results, loss, toast, failure overlay

canvas-map-adapter
  explored roads, depots, rejected yards, truck marker, resize

web-audio-adapter
  engine, wind, click, wrong-yard, impact and delivery cues

browser-storage-adapter
  settings document and best-score document

github-pages-workflow
  main trigger, Pages configuration, root artifact upload and deployment
```

## Source-backed census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
```

## Main finding

The current terminal sequence is source-order dependent:

```txt
browser captures pre-tick metrics
  -> DeliveryRegionCheck
  -> delivery simulate system accepts destination
  -> buildRunResult(pre-tick metrics)
  -> DeliveryRegionChecked
  -> simulation resolve marks completed
  -> collision loops require running and skip
  -> impact loops require running and skip
  -> failure request refuses to replace completed
  -> timeout requires running and skips
```

This creates a real policy but does not name it. A valid delivery currently wins over every same-step loss or damage proposal. Because score construction already occurred, same-step penalties, collisions and condition changes can be omitted from the result.

Additional evidence gaps:

```txt
no RunId or StepId on terminal proposals
no TerminalProposalId
no conflict classifier
no precedence-policy revision
no final metric receipt
no immutable ResultId or result fingerprint
no bounded result history
no versioned best-score document
no best-score write/readback receipt
no retry predecessor citation
no first terminal-result frame acknowledgement
```

## Required authority

```txt
the-long-haul-delivery-terminal-result-settlement-authority-domain
```

```txt
DeliveryTerminalSettlementCommand
  -> bind RunId, StepId, seed, route, destination and score policy
  -> collect delivery, collision, impact, failure and timeout proposals
  -> classify duplicates, conflicts, stale work and predecessor work
  -> apply one explicit versioned precedence policy
  -> finalize all penalties and resource values
  -> calculate one immutable score
  -> publish RunOutcomeArtifact
  -> publish DeliveryTerminalSettlementResult
  -> persist accepted best-score evidence with receipts
  -> project the same artifact into results UI
  -> acknowledge FirstTerminalResultFrameAck

RunRetryCommand
  -> cite predecessor RunOutcomeArtifact
  -> allocate successor RunId and retry lineage
  -> preserve predecessor evidence
  -> reject late predecessor work
```

## Validation boundary

Documentation only. Runtime source, gameplay, scoring, rendering, persistence, package scripts, tests, workflows and deployment behavior were not changed or executed.