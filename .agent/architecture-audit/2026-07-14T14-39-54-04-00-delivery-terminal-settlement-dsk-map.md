# Architecture audit: delivery terminal settlement DSK map

**Timestamp:** `2026-07-14T14-39-54-04-00`

## Current ownership

```txt
Long Haul Delivery
  owns destination, depot checks and mutable runResult

Core Simulation
  owns run status, timer, distance, penalties, collisions, recovery and failure

Resource Pressure
  owns fuel, truck and cargo values

Hazard Field and Vehicle Dynamics
  emit collision and impact proposals

Browser host
  captures metrics, calls checkRegion, transitions scenes,
  renders results, writes localStorage and initiates retry
```

## Current phase path

```txt
browser before tick
  -> DeliveryRegionCheck with copied metrics

simulate
  -> delivery accepts destination
  -> buildRunResult
  -> DeliveryRegionChecked

resolve
  -> simulation marks completed
  -> later collision and impact handlers skip
  -> failure cannot replace completed
  -> timeout requires running

after tick
  -> host transitions to results
  -> DOM projects score
  -> localStorage may update best score
```

## Required domain

```txt
the-long-haul-delivery-terminal-result-settlement-authority-domain
```

## Planned coordinating surfaces

```txt
delivery-terminal-command-kit
run-step-identity-kit
terminal-proposal-identity-kit
delivery-proposal-kit
failure-proposal-kit
impact-proposal-kit
timeout-proposal-kit
terminal-conflict-classifier-kit
terminal-precedence-policy-kit
metric-finalization-kit
penalty-finalization-kit
resource-finalization-kit
score-policy-revision-kit
run-outcome-artifact-kit
result-fingerprint-kit
result-journal-kit
delivery-settlement-result-kit
best-score-document-kit
best-score-write-receipt-kit
retry-lineage-kit
terminal-ui-projection-kit
first-terminal-result-frame-kit
same-step-conflict-fixture-kit
source-pages-result-parity-kit
```

## Composition rule

Do not replace the existing Delivery, Simulation, Resource Pressure, Hazard or Vehicle kits. Insert one coordinator that receives their proposals and final receipts for a single RunId and StepId. Only that coordinator may publish terminal truth, authorize result persistence or permit retry.

## Admission contract

```txt
collect proposals
  -> validate identities and revisions
  -> finalize current-step effects
  -> classify conflicts
  -> apply versioned precedence
  -> build immutable outcome
  -> journal outcome
  -> authorize persistence and projection
  -> acknowledge visible frame
  -> permit successor retry
```

## Non-goals

```txt
no Nexus Engine restructure
no replacement of existing kits
no rendering rewrite
no score-design change without a policy revision
no new network or backend service
```