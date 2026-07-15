# Input audit: browser and Core Input context contract

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** make Core Input the accepted semantic state owner while keeping the browser adapter limited to event normalization.

- [x] Inspect browser listener lifecycle.
- [x] Inspect Core Input action, binding and context descriptors.
- [x] Inspect per-frame intent publication.
- [x] Identify lifecycle and context gaps.
- [ ] Implement and execute input lifecycle fixtures.

## Current contract

```txt
browser adapter owns
  keys object
  keydown and keyup
  repeat filtering
  route commands
  camera and map state
  interaction latch
  blur clearing and pause

Core Input owns
  declared actions
  declared keyboard bindings
  declared driving/menu contexts
  latest derived intent snapshot
  reset
```

The two owners are not revision-bound. Context descriptors are declared but the browser adapter does not query or activate them. Direct consumers read browser state before Core Input settlement.

## Required rules

1. Raw DOM events are never gameplay commands.
2. One binding table is the executable action map.
3. Context activation is explicit and route-bound.
4. Held actions carry an `InputGeneration` and are cancelled on lifecycle changes.
5. One-shot actions publish idempotent results.
6. Core Input receives accepted actions, not a later observational mirror.
7. Retry and recovery remain separate semantic actions.
8. Focusable settings controls cannot leak key evidence into gameplay contexts.
9. Blur, hidden state, pause, generation replacement and title return publish cancellation receipts.
10. Presentation acknowledges the first frame containing each accepted effect.

## Context policy

```txt
title: menu navigation and settings only
generating: cancel or lifecycle actions only
driving: held driving, interact, camera, map, pause, retry
paused: resume, settings, retry, title
settings: settings controls and close only
results/loss: retry, fresh seed, title
retired: no actions accepted
```

## Lifecycle result

```txt
InputLifecycleCommand
  -> bind old/new route, visibility and document generations
  -> release held actions
  -> clear transient interaction latches
  -> retire stale event IDs
  -> publish InputLifecycleResult
```

## Validation boundary

No input remapping, context enforcement, lifecycle settlement or device behavior changed.