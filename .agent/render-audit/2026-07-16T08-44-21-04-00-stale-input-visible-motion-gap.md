# Render audit: stale input visible-motion gap

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** bind input retirement to the first frame that proves the truck, camera, HUD, map, and audio no longer consume stale control evidence.

- [x] Trace held input into visible presentation.
- [x] Identify all affected render surfaces.
- [x] Identify the missing frame acknowledgement.
- [ ] Implement and execute neutral-frame proof.

## Current projection chain

```txt
keys
  -> preTickDriving intent
  -> Core Input and Truck Input
  -> Truck state and meter changes
  -> truck rig transform and wheel/body animation
  -> Core Camera target and descriptor
  -> HUD speed/road/meters
  -> Canvas2D truck marker
  -> WebAudio engine/wind gain
  -> renderer.render(scene, camera)
```

## Affected surfaces

### Three.js game canvas

Stale throttle, brake, steer, or boost can alter truck position, heading, wheel rotation, body roll, camera target, streamed-world focus, sun/shadow focus, and visible hazard/collision response.

### Canvas2D map

The map marker is derived from the authoritative Truck state. A stale input can move or rotate the marker after focus restoration.

### DOM HUD

Speed, road name, fuel, truck condition, cargo condition, remaining time, penalties, and interaction prompts can continue changing from stale input effects.

### WebAudio

Engine oscillator frequency/gain and wind gain are updated from Truck speed and current Core Input throttle. A stale input can therefore remain audible as well as visible.

## Missing proof

```txt
HeldInputRetirementResult: absent
neutral Core Input revision: absent
neutral Truck Input revision: absent
neutral simulation revision: absent
neutral camera descriptor revision: absent
neutral HUD/map/audio projection revision: absent
FirstNeutralInputFrameAck: absent
```

A frame that happens to show a stationary truck is not sufficient. The acknowledgement must cite the retirement result and the accepted input/simulation revisions that produced it.

## Required frame contract

```txt
HeldInputRetirementResult
  -> CoreInputRevision with zero throttle/brake/steer/boost
  -> TruckInputRevision with zero throttle/brake/steer/boost
  -> SimulationRevision
  -> CameraDescriptorRevision
  -> HudProjectionRevision
  -> MapProjectionRevision
  -> AudioProjectionRevision
  -> VisibleFrameRevision
  -> FirstNeutralInputFrameAck
```

The acknowledgement should report:

- retirement reason;
- retired input generation;
- route and run generation;
- accepted neutral Core/Truck input revisions;
- truck speed and steering state at frame submission;
- camera descriptor revision;
- map/HUD/audio projection revisions;
- frame timestamp and renderer generation.

## Failure policy

If neutral settlement or matching frame proof does not complete before a bounded deadline, keep the driving route paused or blocked from new input. Do not silently resume with the old held store.

## Validation boundary

No visual defect was reproduced and no render code changed. The source proves only that lifecycle retirement and matching frame acknowledgement are absent.