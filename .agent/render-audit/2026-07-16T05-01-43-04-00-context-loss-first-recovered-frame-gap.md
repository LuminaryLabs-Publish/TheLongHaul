# Render audit: context loss and first recovered frame gap

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Summary

The WebGL surface has a complete normal render path but no explicit lost-context render state. A lost context can invalidate the renderer and GPU resources while the recursive RAF, camera updates, streamed-world updates and DOM routes continue without a typed presentation result.

## Plan ledger

**Goal:** require every renderer generation to end in ordinary retirement, a recovered presented frame, or an actionable fallback.

- [x] Inspect renderer construction and configuration.
- [x] Inspect shared, streamed, atmosphere and rig resources.
- [x] Inspect ordinary cell release.
- [x] Inspect resize and recursive RAF submission.
- [x] Confirm no context-loss/restoration authority is present.
- [ ] Force loss and prove reconstruction and first-frame convergence.

## Current visible-frame path

```txt
accepted engine/world state
  -> update truck, camera, wildlife and dust
  -> draw Canvas2D map
  -> renderer.render(scene, camera)
  -> no RenderProjectionResult
  -> next RAF schedules immediately
```

## Resource graph at risk

```txt
WebGLRenderer
PerspectiveCamera
Scene / worldRoot
shadow maps
shared Box/Cylinder/Wheel/Sphere/Cone/Plane/Circle geometries
shared MeshStandard/Basic/Points materials
sky sphere geometry and ShaderMaterial
terrain PlaneGeometry per active cell
cell-owned sign textures and materials
InstancedMesh vegetation and grass
truck, cargo and wheel meshes
wildlife meshes
BufferGeometry dust particles
```

## Missing render evidence

```txt
rendererGeneration: absent
contextGeneration: absent
resourceManifestRevision: absent
loss event result: absent
presentation-suspended result: absent
active-cell rehydration result: absent
stale-frame rejection: absent
replacement-renderer result: absent
fallback frame: absent
FirstRecoveredFrameAck: absent
```

## Required visible settlement

```txt
context loss accepted
  -> stop old-generation render submissions
  -> preserve or explicitly pause simulation
  -> show bounded recovery state outside invalid WebGL work
  -> rebuild resources from accepted descriptors/state
  -> resize and restore camera projection
  -> present one frame from the new generation
  -> publish FirstRecoveredFrameAck
```

## Boundary

No visual failure was reproduced. No renderer, resource, shader, material, geometry, texture, RAF or UI behavior was changed.