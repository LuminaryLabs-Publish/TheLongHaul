# Gameplay audit: partial-frame mutation crash loop

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Current risk loop

```txt
pre-tick mutates input, meters or requests
  -> engine tick commits DSK state
  -> gameplay or streaming phase throws
  -> later HUD/render/input-clear phases do not finish
  -> failure overlay appears
  -> next RAF runs against partially advanced state
```

The current catch cannot determine which mutations completed. Continuing the run is therefore not a proven-safe recovery policy.

## Gameplay contract needed

- Bind each frame to one run and scheduler generation.
- Record the last fully accepted phase.
- On fault, prevent later run mutations.
- Retire one-shot and held input.
- Treat indeterminate partial application as terminal unless a domain-specific rollback receipt exists.
- Preserve the Transaction Ledger's apply-once semantics without pretending it rolls back unrelated mutations.
- Require a fresh run generation for clean retry.

## Fixtures

- Throw before `engine.tick`.
- Throw immediately after `engine.tick`.
- Throw during delivery settlement.
- Throw during world streaming.
- Throw during HUD/audio/render.
- Prove no later callback advances run time, distance, penalties or delivery state.
