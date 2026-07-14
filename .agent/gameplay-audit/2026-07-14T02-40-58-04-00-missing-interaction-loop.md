# Gameplay audit: missing interaction loop

## Finding

There is no gameplay implementation.

## Complete current loop

```txt
open repository
  -> read # TheLongHaul
  -> end
```

## Absent player-facing stages

```txt
boot
menu
start command
generation or loading
spawn
movement or driving
route reading
risk and failure
discovery
delivery
scoring
result
retry
shutdown
```

These names are listed only as categories that a future game might need to declare. They are not claims about current or approved design.

## Required first proof

The first gameplay commit should expose one deterministic state machine and a test that proves every accepted command produces a typed result. A visual host should render snapshots from that truth rather than become the state owner.
