# Current audit: browser-focus held-input release

**Timestamp:** `2026-07-16T08-44-21-04-00`  
**Reviewed pre-audit repository head:** `d46394b3a848d769fac1228731e820990dbeb1f4`  
**Status:** `browser-focus-held-input-release-authority-audited`

## Summary

The playable game has been comprehensively rewritten since the prior documented head. The current `index.html` boots a modular host, one Nexus Engine revision, eight Core kits, five product DSKs, one Core World effect provider, patch preparation, Core Graphics instance batches, Three.js presentation, a Canvas2D map, DOM UI, WebAudio, storage, tests, and a main-branch smoke workflow.

The focused gap is input retirement when the document loses focus or lifecycle ownership. The host records held keys and one-shot presses, but only `keyup` clears held state and the RAF clears `pressed` after an ordinary frame. No focus/visibility/page lifecycle result neutralizes accepted input before simulation resumes.

## Plan ledger

**Goal:** give the browser keyboard adapter one revision-bound retirement transaction that prevents stale throttle, brake, steering, boost, map, camera, retry, or pause evidence from surviving focus and route changes.

- [x] Compare all eligible Publish repositories and central ledgers.
- [x] Select TheLongHaul as the only runtime-ahead priority repository.
- [x] Inspect all changed runtime, test, and workflow files.
- [x] Map the current interaction loop, domains, kits, controllers, adapters, and services.
- [x] Trace held input from DOM events through Core Input, truck simulation, camera, HUD, audio, and rendering.
- [x] Confirm lifecycle clearing and browser fixtures are absent.
- [x] Preserve runtime and deployment unchanged.
- [ ] Implement `InputFocusGeneration`, retirement results, neutral submissions, and first-neutral-frame proof.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledgers: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 1

selected: LuminaryLabs-Publish/TheLongHaul
selection class: runtime-ahead priority
previous documented head: f9cf4fa71c2a76cd23202787f63c5ff5b2d1f6be
reviewed pre-audit head: d46394b3a848d769fac1228731e820990dbeb1f4
ahead by: 44 commits
oldest fallback not used: ZombieOrchard at 2026-07-16T03-41-28-04-00
```

## Complete interaction loop

```txt
index.html
  -> import map pins Three.js 0.165.0 and Nexus Engine b941c9b...
  -> bootstrap.mjs exports dependencies to the host scope
  -> load eleven ordered application chunks
  -> create Core Scene, Core World, Core Input,
     Core Data, Core Simulation, Core Camera,
     Core Graphics, Core Transaction Ledger,
     and five Long Haul product DSKs
  -> create Three.js renderer, scene, camera, batches, materials and rigs

Start the Haul
  -> choose seed
  -> transition title -> generating
  -> generate five-branch course
  -> create and verify Core Data course envelope
  -> load course and delivery state
  -> create patch-preparation controller
  -> build and prime initial cells
  -> load wildlife and reset truck/run/meters
  -> register Core World provider and active cells
  -> start run and unlock remaining-time meter
  -> transition generating -> driving

Driving frame
  -> derive intent from mutable held-key state
  -> mirror intent into Core Input
  -> submit Truck Input, Course Sample and Run Sample
  -> consume meters and apply idempotent penalties
  -> tick Nexus Engine once
  -> resolve collisions, wildlife, delivery and terminal state
  -> update patch preparation and Core World cells
  -> update truck, wildlife, Core Camera descriptor and HUD
  -> update WebAudio and Canvas2D map
  -> render one Three.js frame

Terminal loop
  -> accepted depot creates scored result
  -> failed meter/run condition creates loss result
  -> retry same seed or generate fresh seed
  -> clear world and rebuild one new run generation
```

## Domains in use

```txt
browser startup and ordered module loading
browser keyboard evidence and focus lifecycle
Core Scene routing and transition validation
Core World registration, focus, provider and active-cell lifecycle
Core Input action manifest, bindings and intent snapshot
Core Data schemas, course envelopes, digest verification and named RNG
Core Simulation resource meters and thresholds
Core Camera smoothing and portable descriptor
Core Graphics instance-batch descriptors and cell replacement
Core Transaction Ledger apply-once settlement
Long Haul truck simulation
Long Haul course exploration and route queries
Long Haul run telemetry, penalties, recovery and outcomes
Long Haul delivery evaluation
Long Haul wildlife simulation
procedural course and course-cell generation
patch preparation, prefetch, cache and activation
Three.js WebGL presentation and GPU-resource ownership
Canvas2D map projection
DOM routes, HUD, progress, results and failures
WebAudio loops and cues
browser settings and best-score storage
Node smoke validation and GitHub Actions
Pages/static deployment
repo-local and central audit governance
```

## Kits and offered services

```txt
Core Scene kit
  scene registry, current scene, exit validation,
  transition request, transition identity, snapshot

Core World domain
  world registration/removal, uniform-grid partition,
  focus, active cells, provider ordering, validation, snapshot

Core Input kit
  semantic actions, keyboard bindings, contexts,
  mutable driving-intent snapshot, reset

Core Data kit
  course schema, package envelope, digest verification,
  named streams, stream fork/range/choose, RNG snapshot/restore

Core Simulation kit
  fuel, truck-condition, cargo-condition, remaining-time,
  bounded spend/restore, rates, locks, thresholds, reset

Core Camera kit
  target descriptor, position/look/FOV smoothing,
  snap, mode, portable camera descriptor

Core Graphics kit
  batch registration, cell replacement/removal,
  matrix writes, flush, bounds, release receipt

Core Transaction Ledger kit
  run ledger identity, apply-once, duplicate classification,
  metadata, terminal operation result, snapshot

Long Haul Truck kit
  truck state, road-vehicle kinematics, input,
  grip/surface response, impulse, teleport, recovery pose,
  reset, snapshot/load

Long Haul Course kit
  course package state, exploration, discovered depots,
  nearest-road/depot queries, sample, reset, snapshot/load

Long Haul Run kit
  run state, clock, distance, maximum speed, off-road time,
  penalties, collision count, stuck detection, recovery,
  completion/failure, score payload, snapshot/load

Long Haul Delivery kit
  candidate depots, valid depot, duplicate checks,
  accepted/rejected result, delivered state, reset, snapshot/load

Long Haul Wildlife kit
  hazard load/reset, deterministic crossing state,
  motion, direction, damage/radius descriptors, snapshot/load

Course World effect provider
  prepared cell admission, update/release,
  effect descriptor, patch snapshot/restore/reset

Patch preparation controller
  focus, desired set, prefetch, generation/activation budgets,
  cache, priming, ready patches, release, snapshot/reset

Browser and product adapters
  seed selection, procedural generation, cell descriptors,
  ordered module bootstrap, keyboard capture, Three.js rendering,
  DOM routes/HUD, Canvas map, WebAudio, storage

Proof and deployment adapters
  Node playability smoke, static-shell smoke,
  main/pull-request smoke workflow, static Pages delivery
```

## Main finding

```txt
held key store: present
one-shot pressed store: present
keydown admission: present
keyup release: present
frame-end one-shot clear: present

window blur retirement: absent
document hidden retirement: absent
pagehide retirement: absent
freeze retirement: absent
route-generation retirement: absent
adapter-generation identity: absent
neutral Core Input result: absent
neutral Truck Input result: absent
FirstNeutralInputFrameAck: absent
browser focus-loss fixture: absent
```

The browser may omit `keyup` when focus changes. Because `preTickDriving()` derives throttle, brake, steering, and boost from `keys` every frame, stale held evidence can be copied into both Core Input and Long Haul Truck state after focus returns. The risk also applies to one-shot commands left in `pressed` until an ordinary frame clears them.

This is a source-backed lifecycle and evidence gap. No runaway-truck incident was reproduced during this documentation audit.

## Required authority

`the-long-haul-browser-focus-held-input-release-authority-domain`

```txt
InputFocusLifecycleCommand
  -> bind DocumentGeneration
  -> bind RouteGeneration
  -> bind InputAdapterGeneration
  -> bind RunGeneration and SimulationRevision
  -> classify active, blurred, hidden, page-hidden,
     frozen, retired, replaced, or restored
  -> retire held and one-shot evidence exactly once
  -> publish HeldInputRetirementResult
  -> submit neutral Core Input and Truck Input state
  -> reject stale evidence from retired generations
  -> optionally request a route-safe pause result
  -> render one matching neutral-motion frame
  -> publish FirstNeutralInputFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, input behavior, simulation, gameplay, rendering, audio, storage, tests, workflow, and deployment were not changed.