# Architecture audit: map-open input context and focus DSK map

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Current ownership

```txt
window keyboard listeners
  -> keys + pressed collections
  -> preTickDriving
     -> Core Input intent
     -> Truck input
     -> Course/Run sampling
     -> fuel spending
     -> KeyM toggle

mapOpen boolean
  -> updateMapPanel
     -> CSS class
     -> aria-hidden
  -> drawMap
     -> mutable Course/Delivery/Truck reads
```

No domain owns map-session identity, map policy, keyboard-context replacement, focus, announcement, close settlement or matching-frame proof.

## Existing DSK boundaries

- `core-scene-kit` owns route identity and transitions but map open is not a scene.
- `long-haul-input` declares a map action and supports contexts, but the browser adapter bypasses a map-specific context and reads raw held keys.
- `long-haul-truck-kit`, `long-haul-run-kit` and `core-simulation-kit` continue to mutate during map open.
- `core-camera-kit`, Core World, WebGL and audio continue to project the live driving state.
- `canvas-map-adapter` and DOM own presentation only and should not decide gameplay policy.

## Proposed DSK family

```txt
the-long-haul-map-open-input-context-focus-authority-domain
├─ map-mode-manifest-kit
├─ map-session-identity-kit
├─ map-mode-admission-kit
├─ map-mode-policy-kit
├─ map-input-context-kit
├─ map-driving-action-mask-kit
├─ map-simulation-policy-kit
├─ map-focus-target-kit
├─ map-announcement-kit
├─ map-close-command-kit
├─ map-mode-settlement-kit
├─ map-focus-restoration-kit
├─ map-route-retirement-kit
├─ map-revision-digest-kit
├─ map-frame-commit-kit
├─ first-map-mode-bound-frame-ack-kit
├─ map-mode-browser-fixture-kit
└─ pages-map-mode-parity-fixture-kit
```

## Authority rule

The authority chooses policy and emits immutable results. Core Input applies the accepted context; Truck/Run/Simulation obey the accepted action/suspension policy; DOM and Canvas2D project it. No renderer or raw event listener should infer map-mode semantics.

## Boundary

Proposed only. No runtime DSK, adapter or fixture was implemented.