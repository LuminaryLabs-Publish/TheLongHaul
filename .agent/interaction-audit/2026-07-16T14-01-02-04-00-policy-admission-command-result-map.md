# Interaction audit: product-policy command/result map

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Current API pattern

```txt
configure/register call
  -> emit event
  -> return current resource immediately
  -> resolve phase later mutates resource
```

The caller receives no request ID, accepted revision, rejection reason, duplicate classification, or completion receipt.

## Required command map

```txt
ConfigureWorldProfileCommand
RegisterRoadClassCommand
ConfigureTerrainPolicyCommand
ConfigureTruckDynamicsCommand
RegisterDeliveryContractCommand
  -> PolicyMutationResult
     accepted | rejected | duplicate | stale
     requestId
     priorRevision
     acceptedRevision
     findings

AdmitProductPolicyCommand
  -> ProductPolicyAdmissionResult
     generation
     digest
     normalized snapshot
     source revisions

StartRunCommand
  expectedPolicyGeneration
  -> StartRunResult
     runId
     coursePackageId
     policy generation/digest

PresentPolicyBoundFrameCommand
  expected run/world/policy revisions
  -> FirstPolicyBoundFrameAck
```

## Rejection rules

- Empty or duplicate IDs.
- Invalid numeric ranges.
- Unknown road-class references in contracts or generated roads.
- Unsupported jump profile IDs.
- Missing required default records.
- Mutation while an immutable run generation is active unless explicitly staged for the next run.
- Stale expected revisions.
- Derived course/cell/cache work from a retired digest.

## Player-facing boundary

Policy and revision language belongs in diagnostics and audit receipts, not the normal player HUD. Player UI should expose only game meaning such as contract type, road surface, cargo state, route, and delivery rules.

## Boundary

No API behavior changed during this audit.