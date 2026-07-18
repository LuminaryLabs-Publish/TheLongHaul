# Streaming-system audit: desired-set cadence and work-budget contract

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Configuration

```txt
CELL_SIZE: 192
ACTIVE_RADIUS: 1
active window: 3 × 3 = 9 cells
preparation retainRadius: 2
preparation prefetchDistance: 3
preparation cacheLimit: 120
preparation generationBudget: 3
preparation activationBudget: 4
host pump maximums per driving frame: 6, then 2
host manual prefetch strip: 3 cells at two cells forward
```

## Current cadence

`frame()` calls `updateWorldStreaming()` on every driving frame.

`updateWorldStreaming()` always:

1. derives the truck cell and forward vector;
2. calls `preparation.setFocus()`;
3. reconstructs the 3x3 desired cell list;
4. maps it into another nine request descriptors;
5. calls `preparation.updateDesired()`;
6. calls `preparation.pump({ maximum: 6 })`;
7. constructs and requests three forward-strip cells;
8. calls `preparation.pump({ maximum: 2 })`.

Only afterward does `key !== lastCellKey` gate Core World focus/update and host reconciliation.

## Controller work

At the pinned Nexus Engine revision, `setFocus()` rebuilds normalized position, velocity, forward and center state, then returns a structured clone.

`updateDesired()`:

- creates new active and prefetch sets;
- resolves every submitted cell record;
- runs built-in forward prefetch for up to three steps;
- releases cells absent from the new active set;
- clears and repopulates desired sets;
- checks ready membership;
- runs cache eviction through spread, filter and sort work;
- returns a new statistics snapshot with cloned focus and diagnostics.

Each `pump()` sorts the queue and returns a result even when the queue is empty. The host ignores all returned results.

## Conservative caller-owned construction floor

```txt
56 objects or arrays per driving frame
3,360 per second at a hypothetical 60 displayed frames/second
201,600 per minute at that same hypothetical cadence
```

This floor excludes controller-owned work and does not represent measured allocation bytes.

## Prefetch ownership gap

The controller already derives forward prefetch through `prefetchDistance: 3`. The product additionally requests a three-cell strip two cells forward. The center strip cell can overlap the controller's forward request depending on quantized heading, while side-strip cells extend the policy.

No immutable result records:

- which authority owns each prefetch request;
- whether requests overlap;
- whether an overlap was deduplicated;
- whether a request was retained from the prior generation;
- whether heading-only changes require a new plan;
- whether a pump was necessary after settlement.

## Required cadence policy

```txt
cell-key change
  -> settle a new active 3x3 membership

quantized direction-key change
  -> settle a new prefetch plan only when policy requires it

unchanged cell and direction keys
  -> retain active and prefetch plans
  -> do not rebuild caller descriptors
  -> pump only when queue/inflight state requires work

course generation change or world retirement
  -> reject stale focus, desired, prefetch and pump work
```

## Required budget result

```txt
PatchPreparationPumpResult
  streamingGeneration
  queueRevisionBefore
  requestedMaximum
  startedCount
  inflightCount
  queuedAfter
  retainedIdle
  budgetExhausted
  rejectedStale
```

## Diagnostics

Bound internal diagnostics should record:

```txt
focus transitions
desired-window transitions
direction transitions
retained frames
prefetch overlaps
pump calls
idle pump calls
started patch jobs
stale work rejections
maximum queue depth
```

## Validation fixtures

- 600 stationary driving frames.
- 600 frames moving inside one cell.
- One cardinal cell transition.
- One diagonal cell transition.
- Heading reversal without cell movement.
- Queue empty, non-empty and inflight states.
- Retry/new-course generation retirement.
- Active Core World and realized-host membership comparison.
- Browser allocation and frame-time profile.

## Completion boundary

Do not claim a lower-allocation or lower-cost streaming path until executable evidence shows fewer admitted calls and equivalent deterministic patch, obstacle, road and host membership.