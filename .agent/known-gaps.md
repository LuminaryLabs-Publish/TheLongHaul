# Known gaps

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Intent

Track every missing contract needed to stop a failed runtime generation safely.

## Scheduler and callback lifecycle

- The next RAF is scheduled before current-frame work begins.
- No scheduler generation or active-frame token exists.
- No callback checks whether its generation has been retired.
- The catch path does not cancel or suppress future product work.
- Repeated failures can call `showBootError()` and `console.error()` repeatedly.

## Phase execution and partial mutation

- Generation, input, engine tick, gameplay, streaming, visual, HUD, audio, map and render phases have no typed receipts.
- No phase declares whether it can mutate authoritative state.
- No journal records the last fully accepted phase.
- A thrown phase can leave earlier mutations committed and later projections absent.
- No policy decides whether a partially advanced run must be retired, rolled back or reloaded.

## Generation failure settlement

- `stepGeneration()` stores `generation.error`, but does not transition to a terminal scene.
- The outer engine tick and render loop remain active after a generation error.
- Prepared patches and partially registered resources have no fault-generation identity.
- No clean-retry receipt proves generation resources were retired.

## Input and interaction retirement

- `pressed.clear()` executes only at the end of a successful frame.
- A failure can retain one-shot camera, map, pause, retry or interaction evidence.
- Held keyboard state is not cleared by the runtime fault path.
- The failure panel has no dedicated focus/announcement settlement.
- Reload is available, but no typed restart admission distinguishes safe retry from mandatory reload.

## Audio and world retirement

- The fault path does not mute the engine or wind loops.
- It does not call `clearWorld()`.
- It does not remove the Core World registration or release streamed cells.
- It does not retire patch-preparation work or reject late ready patches.
- GPU resources remain governed only by ordinary cell and WebGL lifecycle paths.

## Result and visible proof

- No `RuntimeFrameFaultResult` exists.
- No `RuntimeRetirementResult` exists.
- No `FirstFaultFrameAck` exists.
- The visible overlay does not prove the gameplay scheduler has stopped.
- No diagnostic correlates the fault phase, scheduler generation and terminal frame.

## Validation and deployment

- No phase-failure injection fixture exists.
- No repeated-error suppression fixture exists.
- No stale-RAF or stale-input fixture exists.
- No audio/world retirement fixture exists.
- No source/build/Pages terminal-fault parity fixture exists.

## Retained gaps

Product-policy runtime adoption remains unresolved. Earlier browser-focus, Core adoption, WebGL recovery, accessibility, input-contract, host-clock, audio, generation-budget, motion, pause, delivery and rollback gaps remain preserved in prior audit families.

## Completion boundary

Do not claim runtime crash containment, clean restart, partial-frame integrity, scheduler retirement, stable fault projection, artifact parity, Pages parity or production readiness until every injected phase failure produces one terminal result, retires the old generation and proves no later callback performs product work.
