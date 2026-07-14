# Gameplay audit: absent player loop and first contract

## Current finding

No gameplay implementation exists.

## Complete current loop

```txt
open repository
  -> read # TheLongHaul
  -> end
```

## Absent executable stages

```txt
boot
menu
start command
generation or loading
spawn
driving or movement
route reading
risk and failure
discovery
delivery
score or grade
result
retry
shutdown
```

These are loop categories that a product manifest may choose to declare. They are not current gameplay claims.

## Required first gameplay contract

The first implementation should define one deterministic state machine with named states, admitted commands, typed results, reset behavior, and terminal outcomes. A minimal example boundary is:

```txt
Boot
  -> StartCommand
Menu
  -> BeginRunCommand
Run
  -> CompleteRunCommand or FailRunCommand
Result
  -> RetryCommand or ReturnToMenuCommand
```

The actual states and commands must come from checked-in product intent, not this audit.

## Proof requirement

Before gameplay is described as implemented, a headless fixture must prove that every admitted command produces a terminal result, invalid commands preserve the predecessor, reset is deterministic, and snapshots expose the accepted state revision.