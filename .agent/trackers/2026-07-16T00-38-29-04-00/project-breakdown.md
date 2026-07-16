# Project breakdown: The Long Haul accessible HUD, route and announcement authority

**Timestamp:** `2026-07-16T00-38-29-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `d3b8c99bf4a8ccb6a5246e81f8cdaa9f1513e1bf`  
**Status:** `accessible-hud-route-announcement-authority-audited`

## Summary

TheLongHaul is a complete static Nexus Engine freight game with deterministic generation, driving, exploration, depot discovery, recovery, scoring, Three.js, Canvas2D, DOM UI, WebAudio, browser storage and Pages deployment.

The active HUD is one `aria-live="polite"` region whose timer, speed, road, fuel, damage, cargo, depot count, penalties, recovery state and interaction prompt are rewritten during every driving frame. Route projection only changes CSS classes, while focus ownership, inactive-screen semantics, generation progress, discrete toasts, outcomes and canvas/map alternatives have no shared accessibility projection result or visible-frame acknowledgement.

This is a source-backed semantic ownership and evidence gap. No screen-reader failure or conformance defect was reproduced.

## Plan ledger

**Goal:** derive one revision-bound accessible read model from accepted game state, keep continuous telemetry quiet and queryable, announce only meaningful changes, and bind route focus to the matching visible frame.

- [x] Compare all 11 accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and root `.agent` states.
- [x] Confirm no new, ledger-missing, root-agent-missing, undocumented or runtime-ahead eligible repository.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Inspect the shell, screens, HUD, generation UI, map, toasts, outcomes, route projection, keyboard path, RAF and retained audit state.
- [x] Identify the complete interaction loop, domains, kits, providers, adapters and offered services.
- [x] Preserve all 20 source-backed surfaces.
- [x] Define one parent accessibility authority with 20 coordinating surfaces.
- [x] Add the timestamped tracker and focused audit family.
- [x] Refresh the required root `.agent` documents.
- [x] Change documentation only.
- [ ] Implement and execute browser, artifact and Pages accessibility fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0

TheLongHaul       2026-07-15T19-38-38-04-00 selected
MyCozyIsland      2026-07-15T19-58-42-04-00
IntoTheMeadow     2026-07-15T20-38-13-04-00
PrehistoricRush   2026-07-15T20-59-46-04-00
HorrorCorridor    2026-07-15T21-39-15-04-00
TheOpenAbove      2026-07-15T22-00-36-04-00
ZombieOrchard     2026-07-15T22-40-29-04-00
TheUnmappedHouse  2026-07-15T23-00-03-04-00
PhantomCommand    2026-07-16T00-00-40-04-00
AetherVale        2026-07-16T00-26-16-04-00
TheCavalryOfRome  excluded
```

## Complete interaction loop

```txt
boot
  -> parse static screens, canvas, HUD, map and failure shell
  -> import pinned Three.js and Nexus Engine
  -> install ten engine kits and two world providers
  -> restore settings
  -> enter title and start RAF

route interaction
  -> button or keyboard evidence invokes a route transition
  -> Core Scene accepts the target
  -> updateSceneUi removes .active from every screen
  -> updateSceneUi adds .active to the current screen
  -> no route focus owner or restoration result is published

course preparation
  -> generation advances in bounded work units
  -> visual percent, phase detail and phase classes update
  -> no progressbar state or semantic progress result is published

driving frame
  -> browser input derives driving intent
  -> simulation and vehicle state advance
  -> updateHud rewrites timer, speed, road, fuel, damage,
     cargo, checked depots, penalties, recovery and prompt
  -> the entire HUD remains one aria-live=polite region
  -> map may draw into Canvas2D
  -> Three.js renders the world
  -> no AccessibleStateRevision or accessible-frame ack is published

discrete event
  -> penalty, delivery or warning writes #toast text/class
  -> completion or failure activates a result screen
  -> no priority announcement result or explicit focus transfer exists
```

## Domains in use

```txt
browser document, route, focus, keyboard, visibility, resize and RAF lifecycle
provider resolution and pinned module identity
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
course generation, work scheduling, readiness, streaming and exploration
depot interaction, recovery, retry, terminal outcome and scoring
settings, motion preference, audio and browser storage
Three.js WebGL world presentation
Canvas2D paper-map presentation
DOM title, help, settings, generation, HUD, pause, results, loss, toast and failure presentation
semantic route projection, focus ownership, telemetry summarization, announcement policy and canvas alternatives
source, artifact and Pages deployment proof
repo-local and central audit governance
```

## Implemented kit and service census

### Engine-installed kits

1. `core-scene-kit`: scene registry, current scene, transitions, exit validation and snapshots.
2. `core-world-domain`: world registration, partitioning, focus, active-cell lifecycle, provider ordering and validation.
3. `long-haul-core-input-kit`: action manifest, keyboard bindings, contexts, driving-intent snapshot and reset.
4. `long-haul-delivery-domain-kit`: seed, generation progress, candidates, destination selection, depot checks, retry, result, snapshot and reset.
5. `long-haul-core-simulation-kit`: run reset/start, pause/resume, timer, distance, penalties, collisions, recovery, failure and completion.
6. `vehicle-dynamics-kit`: truck state, input, kinematics, boost, bounds, impact events and reset.
7. `long-haul-route`: markers, corridors, nearest-marker query, state and reset.
8. `long-haul-condition`: fuel, truck and cargo condition, bounded adjustment, state and reset.
9. `long-haul-wildlife`: hazard state, motion, bounds, collisions, events and reset.
10. `long-haul-telemetry`: truck, run, condition and delivery histories plus reset.

### Core World providers

1. `long-haul-terrain-provider`: prepare, update and release cells; publish terrain effects, active-cell snapshots and reset.
2. `long-haul-course-provider`: prepare, update and release cells; publish roads, depots, signs, vegetation, obstacles, effects, snapshots and reset.

### Browser and product adapters

1. `procedural-course-generator`: seed hash, deterministic RNG, five-branch graph, confusing fork, depots, par, validation and generation plan.
2. `browser-keyboard-input-adapter`: keydown/up, held state, repeat filtering, direct route/camera/map/interaction/retry dispatch and blur clearing.
3. `three-webgl-presentation-adapter`: renderer, scene, camera, lighting, atmosphere, streamed meshes, truck/wildlife rigs, dust, shadows, resize, RAF and render submit.
4. `dom-scene-hud-adapter`: title, help, settings, generation, HUD, pause, results, loss, toast and failure projection.
5. `canvas-map-adapter`: explored roads, depots, rejected yards, truck marker and map resize.
6. `web-audio-adapter`: context unlock, master bus, engine/wind loops, cues and RAF gain updates.
7. `browser-storage-adapter`: settings document, motion preference and best-score document.

### Deployment adapter

1. `github-pages-workflow`: main-push trigger, Pages configuration, root artifact upload and Pages deployment.

```txt
engine-installed kits: 10
Core World providers: 2
browser/product adapters: 7
deployment adapters: 1
total source-backed surfaces: 20
render surfaces: 3
planned accessibility authority surfaces: 20
```

## Main finding

```txt
#hud aria-live="polite": present
per-frame HUD descendant mutation: present
continuous telemetry announcement policy: absent
announcement coalescing/throttling: absent
priority event announcement result: absent
route focus owner: absent
focus restoration: absent
inactive-screen inert/aria-hidden settlement: absent
generation progress semantics: absent
toast live-region policy: absent
outcome alert/focus result: absent
game-canvas state-bound alternative: absent
map semantic summary: absent
AccessibilityProjectionResult: absent
FirstAccessibleRouteFrameAck: absent
FirstVisualAccessibleConvergenceAck: absent
```

`updateHud()` mutates multiple textual descendants every driving frame while their common ancestor is live. This permits high-frequency semantic churn without defining which changes are meaningful enough to announce. In contrast, penalties, interaction availability, generation progress, completion and failure do not have dedicated priority, deduplication or acknowledgement policy.

`updateSceneUi()` changes only `.active` classes and the body driving class. It does not explicitly move focus, restore the invoker, mark inactive route surfaces inert, publish a route announcement or bind semantic state to the first matching visible frame.

## Required authority

`the-long-haul-accessible-hud-route-announcement-authority-domain`

```txt
AccessibilityProjectionCommand
  -> bind document, route, run, simulation, HUD, map,
     input, focus and visible-frame revisions
  -> derive one immutable AccessibleReadModel
  -> keep continuous telemetry queryable but non-chattering
  -> coalesce and throttle meaningful telemetry changes
  -> publish priority announcements for penalties,
     interaction eligibility, generation, completion and failure
  -> settle inactive-screen semantics and route focus
  -> restore focus when overlays close
  -> publish state-bound game-canvas and map alternatives
  -> reject stale, duplicate and retired projections
  -> publish AccessibilityProjectionResult
  -> acknowledge FirstAccessibleRouteFrameAck
  -> acknowledge FirstVisualAccessibleConvergenceAck
```

### Planned surfaces

```txt
accessible-state-revision-kit
accessible-read-model-kit
route-semantic-projection-kit
route-focus-owner-kit
focus-restoration-kit
inactive-screen-inertness-kit
hud-telemetry-semantic-kit
hud-announcement-throttle-kit
announcement-priority-policy-kit
penalty-status-announcement-kit
interaction-affordance-announcement-kit
generation-progress-semantic-kit
outcome-alert-projection-kit
toast-live-region-adapter-kit
game-canvas-alternative-kit
map-semantic-summary-kit
accessibility-projection-result-kit
stale-accessibility-projection-rejection-kit
first-accessible-route-frame-ack-kit
first-visual-accessible-convergence-ack-kit
```

## Required proof

```txt
continuous speed/timer changes do not produce unbounded announcements
meaningful timer thresholds and condition warnings announce once
penalties and interaction eligibility use explicit priority and deduplication
course generation exposes bounded progress semantics
route transitions move focus to an accepted target
closing settings/pause restores focus to the accepted invoker
inactive screens cannot retain semantic or keyboard focus ownership
result and failure routes publish one alert and matching focus result
canvas and map alternatives cite the accepted game/map revision
stale projections cannot overwrite a newer route or run
source, root artifact and Pages expose matching accessibility results
```

## Repo-local output

Added:

```txt
.agent/trackers/2026-07-16T00-38-29-04-00/project-breakdown.md
.agent/turn-ledger/2026-07-16T00-38-29-04-00.md
.agent/architecture-audit/2026-07-16T00-38-29-04-00-accessible-hud-route-announcement-dsk-map.md
.agent/render-audit/2026-07-16T00-38-29-04-00-rapid-live-hud-semantic-frame-gap.md
.agent/gameplay-audit/2026-07-16T00-38-29-04-00-driving-telemetry-accessibility-loop.md
.agent/interaction-audit/2026-07-16T00-38-29-04-00-accessibility-command-result-map.md
.agent/accessibility-audit/2026-07-16T00-38-29-04-00-hud-focus-announcement-contract.md
.agent/deploy-audit/2026-07-16T00-38-29-04-00-accessibility-browser-fixture-gate.md
.agent/central-sync-audit/2026-07-16T00-38-29-04-00-oldest-selection-accessibility-reconciliation.md
```

Refreshed:

```txt
.agent/START_HERE.md
.agent/current-audit.md
.agent/next-steps.md
.agent/known-gaps.md
.agent/validation.md
.agent/kit-registry.json
```

## Validation boundary

```txt
documentation changed: yes
runtime JavaScript changed: no
HTML or CSS changed: no
input, gameplay, rendering, audio or storage changed: no
packages or dependencies changed: no
workflow or deployment changed: no
branch created: no
pull request created: no

package test command: unavailable
keyboard/focus fixture: unavailable
accessibility-tree fixture: unavailable
live-region cadence fixture: unavailable
screen-reader announcement fixture: unavailable
canvas/map alternative fixture: unavailable
artifact and Pages parity: unavailable
```

No accessibility conformance, screen-reader correctness, focus correctness, announcement correctness, canvas alternative correctness, artifact parity, Pages parity or production readiness is claimed.