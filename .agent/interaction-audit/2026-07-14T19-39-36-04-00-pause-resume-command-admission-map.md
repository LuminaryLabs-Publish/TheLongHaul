# Interaction audit: pause and resume command admission

**Timestamp:** `2026-07-14T19-39-36-04-00`

## Current commands

```txt
Escape in driving
  -> mutable browser key write
  -> pauseGame()
  -> Core Simulation pause
  -> vehicle zero
  -> scene transition

Escape or button in paused
  -> resumeGame()
  -> Core Simulation resume
  -> scene transition
```

## Missing command results

```txt
PauseCommandId
PauseRevision
pause policy revision
browser key-settlement receipt
Core Input settlement receipt
system suspension receipts
stale command rejection
ResumeCommandId
fresh-input admission receipt
FirstPausedFrameAck
FirstResumedFrameAck
```

## Required result map

```txt
PauseRunCommand
  -> Accepted | Duplicate | Stale | Rejected
  -> PauseRunResult
  -> participant receipts
  -> FirstPausedFrameAck

ResumeRunCommand
  -> Accepted | Duplicate | Stale | Rejected
  -> ResumeRunResult
  -> fresh-input boundary
  -> FirstResumedFrameAck
```

Keyboard, button, blur and future GameHost callers should use the same authority rather than directly mutating scene and simulation state.
