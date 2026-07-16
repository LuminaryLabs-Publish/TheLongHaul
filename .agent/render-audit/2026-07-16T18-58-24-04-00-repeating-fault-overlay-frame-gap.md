# Render audit: repeating fault-overlay frame gap

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Finding

The renderer is called near the end of the normal frame. The successor RAF is queued before any phase executes. When a phase throws, `showBootError()` makes the failure overlay visible, but the render scheduler remains active.

```txt
RAF N queues RAF N+1
  -> phase throws
  -> DOM overlay becomes visible
  -> no scheduler retirement
  -> RAF N+1 executes normal product phases again
```

The visible overlay therefore proves only DOM mutation. It does not prove that gameplay, world streaming, audio or rendering stopped.

## Required projection contract

```txt
RuntimeFrameFaultResult accepted
  -> retire old scheduler generation
  -> project terminal fault model
  -> focus/announce once
  -> render or expose one stable fault surface
  -> publish FirstFaultFrameAck
  -> reject every old-generation visual callback
```

## Render-specific gaps

- No fault-frame generation is bound to the overlay.
- No acknowledgement correlates the overlay with scheduler retirement.
- Repeated failures may repeatedly alter text and log errors.
- Normal Three.js rendering may continue behind the overlay.
- Canvas2D map and DOM HUD can remain at a different partial frame revision.
- No source/artifact/Pages fixture proves stable terminal presentation.
