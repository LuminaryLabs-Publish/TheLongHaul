# Current audit: map-open input context and focus ownership

**Timestamp:** `2026-07-17T07-38-20-04-00`  
**Reviewed pre-audit repository head:** `d868fdc0758934a9be4fd70cc5ba479deced6398`  
**Status:** `map-open-input-context-focus-authority-audited`

## Summary

TheLongHaul opens its Canvas2D field map without leaving the `driving` scene. `preTickDriving()` first reads held vehicle keys, submits Core Input and Truck input, samples Course/Run and spends fuel; only then does it consume `KeyM` and toggle the map. Every subsequent frame continues Truck, Run, world streaming, camera, HUD, audio and rendering.

`updateMapPanel()` only toggles the panel's `open` class and `aria-hidden`. There is no map-session ID, explicit gameplay policy, map-specific input context, focus destination, announcement result, exact close settlement or first map-mode-bound frame.

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
selected: LuminaryLabs-Publish/TheLongHaul
selection: oldest synchronized documented timestamp
selected prior timestamp: 2026-07-17T01-01-09-04-00
```

## Complete interaction loop

```txt
page load
  -> ordered bootstrap
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

start
  -> generate and verify course package
  -> prepare initial cells and provider
  -> reset gameplay domains
  -> enter driving

driving
  -> read held controls
  -> submit Input and Truck intent
  -> sample Course and Run
  -> spend fuel and settle interactions
  -> tick engine
  -> stream cells and update presentation

map open
  -> consume M after current-frame driving admission
  -> toggle DOM/ARIA state
  -> retain driving scene and held controls
  -> continue simulation, streaming, audio and both render surfaces

close/outcome
  -> M, pause, completion, failure or reset closes the map
  -> no shared map-session settlement result
```

## Domains in use

Browser startup, ordered modules, document/RAF/resize/keyboard/focus/storage; Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger; World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife; procedural course and infinite-cell generation; patch preparation; Core World provider; WebGL, Canvas2D, DOM, WebAudio, storage, tests, Actions, Pages and governance.

## Kit and service census

All kit IDs and offered services are enumerated in `trackers/2026-07-17T07-38-20-04-00/project-breakdown.md` and `kit-registry.json`.

```txt
engine-installed kits:               20
world providers:                      1
controllers:                          1
browser/product adapters:             9
proof/deployment adapters:            4
total source-backed surfaces:        35
planned map-mode surfaces:           18
```

## Source-backed finding

The visible map is not an admitted gameplay mode. Current behavior approximates live driving, but no contract distinguishes it from restricted or suspended policy. Raw held keys, semantic actions, simulation clocks, streaming, focus, announcements and close reasons are not bound to one map generation.

## Required authority

`the-long-haul-map-open-input-context-focus-authority-domain`

```txt
MapModeAdmissionCommand
  -> MapModeAdmissionResult
MapInputContextCommitCommand
  -> MapInputContextResult
MapFocusCommitCommand
  -> MapFocusCommitResult
MapModeSettlementCommand
  -> MapModeSettlementResult
  -> FirstMapModeBoundFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, gameplay, keyboard, focus, ARIA, Canvas2D, WebGL, tests, workflows and deployment were unchanged. No preferred map policy or production failure is claimed.