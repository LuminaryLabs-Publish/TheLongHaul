# Gameplay audit: settings-to-driving motion loop

**Timestamp:** `2026-07-15T00-38-54-04-00`

## Interaction loop

```txt
title
  -> open Settings
  -> toggle Camera movement
  -> save settings document
  -> return to title
  -> generate course
  -> enter driving

or

driving
  -> pause
  -> open Settings
  -> toggle Camera movement
  -> save settings document
  -> return to paused
  -> resume

active driving frame
  -> process input and simulation
  -> update truck suspension and cargo
  -> update chase/cab camera
  -> submit WebGL frame
```

## Current gameplay effect

The setting does not alter vehicle simulation, route logic, hazards, scoring, or delivery. It affects presentation only.

The current presentation adoption is partial:

```txt
gated by setting
  rough-road truck oscillation
  rough-road camera bob

not gated by setting
  steering roll
  acceleration and braking pitch
  cargo sway
  speed-driven FOV
```

## Gameplay risk

No score or physics divergence is identified. The risk is contract ambiguity:

```txt
player selects one named setting
  -> only a subset of described effects adopts it
  -> no result tells the UI what was actually applied
  -> no frame acknowledgement proves the new profile is visible
```

## Required lifecycle

```txt
request preference
  -> validate supported profile
  -> prepare presentation participants
  -> persist accepted document
  -> adopt one revision
  -> return to predecessor scene
  -> render first matching frame
  -> publish acknowledgement
```

## Retained behavior

Course generation, driving physics, delivery checks, terminal scoring, retry, pause, map exploration, and audio remain outside this audit.