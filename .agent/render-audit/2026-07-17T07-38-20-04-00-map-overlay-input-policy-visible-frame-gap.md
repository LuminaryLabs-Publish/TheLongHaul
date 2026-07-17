# Render audit: map overlay and input-policy visible-frame gap

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Current frame

The map panel becomes visible by toggling one CSS class and `aria-hidden`. The same RAF continues to update truck visuals, camera, wildlife, HUD, audio, Canvas2D map and WebGL world. No frame receipt identifies which map policy, input context or focus state produced the visible overlay.

## Gap

A player can see the paper map while the truck continues to respond to held controls. That may be an intended live-driving mode, but the frame does not prove it. The visible surface has no policy badge, generation digest or `FirstMapModeBoundFrameAck`, and focus/announcement state is outside the frame contract.

## Required render contract

```txt
MapModeAdmissionResult
  + MapInputContextResult
  + MapFocusCommitResult
  + map viewport/content result
  -> MapFrameCommitResult
  -> FirstMapModeBoundFrameAck
```

WebGL and Canvas2D may continue rendering simultaneously, but both must consume the same accepted map-mode generation. Late frames from a retired map session must be rejected.

## Boundary

No visual, Canvas2D, WebGL, DOM or CSS behavior changed.