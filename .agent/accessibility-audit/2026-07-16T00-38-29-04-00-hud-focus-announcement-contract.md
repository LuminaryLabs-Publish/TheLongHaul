# Accessibility audit: HUD, focus and announcement contract

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

The current DOM exposes useful text and native buttons, but it does not define an accessibility state model. The gameplay HUD is globally live at frame cadence, route focus is unmanaged, inactive routes are hidden only through presentation classes, and the map/game canvases have no dynamic alternative tied to accepted state.

## Plan ledger

**Goal:** define the smallest complete accessibility contract for route semantics, focus continuity, useful telemetry, meaningful announcements and canvas alternatives.

- [x] Inventory route, HUD, progress, toast, outcome and canvas semantics.
- [x] Separate continuous data from discrete events.
- [x] Define focus, announcement and alternative-text policies.
- [x] Define stale-work and lifecycle rules.
- [ ] Implement and test with browser accessibility APIs and assistive technology.

## Accessible read model

```txt
AccessibleReadModel
  route:
    id
    revision
    title
    description
    primaryAction
    focusTarget
  run:
    generation
    status
    remainingTimeBucket
    finalMinute
  vehicle:
    speedBucket
    roadName
    fuelBucket
    truckConditionBucket
    cargoConditionBucket
  delivery:
    checkedCount
    totalDepots
    interactionAvailable
    interactionLabel
  penalties:
    totalSeconds
    latestAcceptedEvent
  map:
    open
    exploredRoadCount
    discoveredDepotCount
    rejectedDepotCount
    currentRoad
  announcement:
    eventId
    kind
    priority
    deduplicationKey
```

## Telemetry policy

```txt
speed: queryable, announce only explicit thresholds or user request
timer: queryable, announce configured milestone thresholds
fuel/truck/cargo: announce only bucket or critical-threshold transitions
road: announce meaningful road change, not every nearest-edge fluctuation
checked depots: announce accepted new check only
penalty total: announce the accepted penalty event, not repeated totals
interaction prompt: announce availability transition once
```

## Route and focus policy

```txt
only the accepted route is semantically active
inactive screens are hidden and inert
route entry moves focus to a stable heading or primary action
opening settings records the invoker and moves focus into settings
closing settings restores focus when the invoker remains valid
pause/resume follows the same overlay-generation contract
results and loss receive terminal focus once
retry/new course retires predecessor focus work
```

## Announcement policy

```txt
polite:
  generation phase milestone
  road change
  interaction available
  non-critical condition threshold

assertive:
  collision/major penalty when immediate action matters
  critical fuel/condition threshold
  run failure

terminal route announcement:
  delivery accepted and score
  run failed and reason
```

Messages must be derived from structured descriptors, not read back from arbitrary DOM strings.

## Canvas alternatives

### Game canvas

The static label must be replaced or supplemented by a state-bound summary containing route, run status, current road, interaction availability and critical condition state. It must not attempt to narrate every rendered object.

### Map canvas

Expose a concise structured summary: map open/closed, current road, explored route count, discovered depots, rejected depots and current objective. The summary must cite the same map/run revision as the drawn frame.

## Lifecycle

```txt
blur/hidden/page retirement -> cancel pending announcements and focus work
pause -> retain run state but adopt pause route semantics
retry/new course -> allocate a new run generation
route change -> retire predecessor semantic projection
late callback -> reject by expected revision
```

## Completion gate

Do not claim accessibility readiness until keyboard traversal, route focus, live-region cadence, priority announcements, progress semantics, canvas alternatives and source/artifact/Pages parity have executable proof.

Documentation only. No conformance claim is made.