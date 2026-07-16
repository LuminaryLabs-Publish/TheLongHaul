# Render audit: Core descriptors do not reach the playable frame

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

The new Core profile can produce a portable camera descriptor and Core Graphics instance-batch release receipts. The playable frame still derives camera motion and instance visibility directly inside `index.html`; no accepted Core descriptor or batch revision is bound to `renderer.render()`.

## Plan ledger

**Goal:** bind the visible Three.js frame to accepted Core Camera, Core Graphics, Core World, and release revisions without moving rendering ownership into simulation kits.

- [x] Inspect Core Camera smoke behavior.
- [x] Inspect Core Graphics batch smoke behavior.
- [x] Inspect playable camera and instance ownership.
- [x] Identify the missing descriptor-to-render bridges.
- [ ] Implement renderer-neutral bridge results.
- [ ] Prove the first Core-bound playable frame.

## Current smoke path

```txt
Core Camera target
  -> smoothing.update
  -> portable descriptor
  -> structuredClone succeeds
  -> DOM check reports pass

Core Graphics cell instances
  -> replaceCell
  -> flush
  -> removeCell
  -> flush release receipt
  -> DOM check reports pass
```

## Current playable path

```txt
vehicle and host state
  -> host-local smoothing math
  -> direct Three.js camera position/look/FOV mutation

active Core World cells and host objects
  -> direct Three.js geometry/material/instance allocation
  -> direct matrix and visibility updates
  -> provider-specific disposal

renderer.render(scene, camera)
  -> no Core Camera descriptor revision
  -> no Core Graphics batch revision
  -> no patch-preparation revision
  -> no Core adoption generation
```

## Gap map

```txt
portable camera descriptor: present in smoke
playable camera bridge: absent
camera descriptor adoption result: absent
camera descriptor/frame revision binding: absent

instance-batch descriptors: present in smoke
playable instance-batch bridge: absent
batch release receipt consumption: absent
batch/world-cell/frame convergence: absent

patch-ready result: present in smoke controller
playable cell activation bridge: absent
patch-ready/visible-cell acknowledgement: absent

FirstCoreBoundPlayableFrameAck: absent
```

## Required render bridges

```txt
CameraDescriptorAdoptionCommand
  -> bind CoreProfileRevision, CameraDescriptorRevision,
     playable route, vehicle, camera-mode, viewport, and frame revisions
  -> validate descriptor kind and mode
  -> apply position/look/FOV to the Three.js camera
  -> publish CameraDescriptorAdoptionResult

InstanceBatchAdoptionCommand
  -> bind CoreProfileRevision, InstanceBatchRevision,
     CoreWorldCellRevision, asset/material mappings, and renderer generation
  -> translate descriptor deltas to Three.js instances
  -> consume release receipts exactly once
  -> publish InstanceBatchAdoptionResult

CoreBoundFrameCommand
  -> require accepted camera, batch, world, and renderer revisions
  -> submit one frame
  -> publish FirstCoreBoundPlayableFrameAck
```

## Visual proof requirements

```txt
camera pose equals accepted descriptor within tolerance
FOV and mode equal accepted descriptor
visible tree/grass/sign/depot counts equal accepted batch snapshot
released cell instances are absent from the next accepted frame
active patch IDs equal accepted Core World/patch preparation state
no host-only camera or instance mutation bypasses the adopted revision
smoke and playable descriptor fixtures use the same Core profile
source, root artifact, and Pages present the same profile identity
```

## Boundary

No visual defect was reproduced. The finding is that the new renderer-neutral descriptors and receipts are not yet authoritative for the playable frame.