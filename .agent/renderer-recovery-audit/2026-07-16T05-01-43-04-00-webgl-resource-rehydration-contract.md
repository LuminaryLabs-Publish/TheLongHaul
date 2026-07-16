# Renderer recovery audit: WebGL resource rehydration contract

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Summary

The product can release streamed cell resources during normal world lifecycle, but it cannot reconstruct the complete active presentation graph after WebGL context loss. Recovery needs immutable descriptors, dependency ordering and generation-bound results.

## Plan ledger

**Goal:** make every GPU resource either reconstructable from accepted CPU-side state or explicitly disposable and replaceable.

- [x] Classify shared, atmosphere, streamed, rig and transient resources.
- [x] Define reconstruction order and ownership.
- [x] Define stale-generation rejection and terminal results.
- [ ] Implement manifests and forced-loss fixtures.

## Resource classes

### Shared static resources

```txt
primitive geometries
shared road/terrain/vehicle/environment materials
shared dust material
```

Rebuild from immutable construction descriptors before any dependent mesh is recreated.

### Atmosphere and lighting

```txt
sky geometry and shader material
hemisphere light
directional light and shadow configuration
fog and background
```

Rebuild after renderer creation and before the first world frame.

### Streamed world resources

```txt
terrain geometry per active cell
water meshes
cell groups
sign CanvasTextures and materials
instanced tree/crown/grass meshes
cell obstacles and content groups
```

Rebuild from accepted course data, Core World active cells and provider descriptors. Do not rely on invalidated GPU objects.

### Persistent rigs

```txt
truck/cargo/wheels
wildlife presentation
camera-dependent sky/light placement
```

Rebuild from accepted vehicle, hazard and camera state.

### Transient resources

```txt
dust particle BufferGeometry and current particle state
```

Either rebuild from a CPU snapshot or retire and restart as a declared transient reset.

## Rehydration contract

```txt
ResourceDescriptor {
  resourceId
  resourceClass
  dependencies
  owner
  sourceRevision
  rendererGeneration
  reconstruct
  verify
  retire
}
```

```txt
ResourceRehydrationResult {
  resourceId
  accepted
  rendererGeneration
  sourceRevision
  dependencyResults
  verification
  failure
}
```

## Recovery order

```txt
renderer and capabilities
  -> shared geometry
  -> shared materials/textures
  -> atmosphere and lighting
  -> active terrain cells
  -> active content cells
  -> truck rig
  -> wildlife rig
  -> transient dust policy
  -> camera/resize
  -> render and FirstRecoveredFrameAck
```

## Invariants

- One active renderer generation owns all GPU projections.
- A reconstructed resource cites the accepted CPU-side source revision.
- Active cells at recovery settlement match Core World, not the pre-loss visual cache.
- Old-generation callbacks cannot attach objects to the replacement scene.
- Failed mandatory resources terminate in `RenderFallbackResult`.
- Optional transient resources may reset only when that reset is declared in the result.

## Boundary

Contract documentation only. No manifest, reconstruction callback, verification probe or runtime recovery path exists yet.