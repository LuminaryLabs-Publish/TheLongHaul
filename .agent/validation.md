# Validation

**Audit timestamp:** `2026-07-15T14-40-11-04-00`

## Repository evidence

```txt
reviewed implementation revision: 4ab7591224f23f3cb84450f0aa101bd78fe95d25
reviewed pre-audit repository head: e2796634445e63b5cd0ee7ea34f7ab50078755f2
runtime entry: index.html
branch: main
```

## Selection evidence

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledgers: 10
root .agent states: 10
new or missing repositories: 0
runtime-ahead repositories: 0
selected repository: TheLongHaul
selection rule: oldest synchronized eligible timestamp
```

## Source inspection

```txt
RAF callback inspected: yes
previousTime mutation inspected: yes
rawDelta derivation inspected: yes
1 / 15 delta cap inspected: yes
processDrivingBeforeTick inspected: yes
engine.tick invocation inspected: yes
run timer consumer inspected: yes
vehicle and condition consumers inspected: yes
truck/camera/dust presentation consumers inspected: yes
Canvas2D map path inspected: yes
Three.js render submission inspected: yes
Pages workflow inspected: yes
kit and service census preserved: yes
```

## Source-backed observations

```txt
simulation ticks per RAF callback: 1
fixed simulation quantum: no
accumulator: no
residual time: no
maximum substeps: no
explicit overload classification: no
discarded-time receipt: no
visibility clock owner: no
simulation revision: no
render interpolation alpha: no
HostFrameResult: no
FirstClockBoundFrameAck: no
```

## Static rate derivation

```txt
admitted dt per callback <= 1 / 15 second
15 callbacks/sec -> <= 1.000 simulated sec/sec
10 callbacks/sec -> <= 0.667 simulated sec/sec
 5 callbacks/sec -> <= 0.333 simulated sec/sec
```

This is a mathematical consequence of the source clamp and one-step-per-callback path. It is not a measured browser result.

## Changes

```txt
documentation changed: yes
runtime JavaScript changed: no
gameplay timing changed: no
generation changed: no
rendering changed: no
audio changed: no
storage changed: no
provider imports changed: no
workflow or deployment changed: no
branch created: no
pull request created: no
```

## Executed proof

```txt
package test command: unavailable
controlled RAF fixture: unavailable
multi-cadence same-seed fixture: unavailable
low-FPS fixture: unavailable
long-stall and overload fixture: unavailable
pause/visibility clock fixture: unavailable
render interpolation fixture: unavailable
first clock-bound frame fixture: unavailable
root artifact clock fixture: unavailable
Pages clock fixture: unavailable
```

## Claims not made

No claim is made for cadence independence, deterministic stepping, wall-time accuracy, overload correctness, pause/visibility correctness, interpolation correctness, visible-frame convergence, artifact parity, Pages parity or production readiness.
