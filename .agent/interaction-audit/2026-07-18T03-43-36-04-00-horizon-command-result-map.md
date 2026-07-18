# Interaction audit: horizon command and result map

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Current implicit commands

| Trigger | Current action | Missing result |
|---|---|---|
| Course generation reaches Checking course | register horizon world and set initial focus | world admission result and generation identity |
| Truck crosses a 384-unit key | set focus and update Core World | focus revision and update settlement |
| Provider prepares or updates a cell | replace `horizonPatches[cell.id]` | patch revision, digest and stale classification |
| Reconciliation sees a missing host | realize geometry | explicit create result |
| Reconciliation sees an existing host | retain without comparison | replace/retain decision result |
| Active cell retires | remove host and dispose terrain geometry | retirement receipt |
| Course/world clears | remove world and release hosts | complete generation-retirement result |

## Proposed typed interaction map

```txt
HorizonWorldAdmissionCommand
  -> admitted | rejected-invalid | rejected-stale
  -> HorizonWorldAdmissionResult

HorizonFocusCommand
  -> focus revision
  -> HorizonFocusResult

HorizonPatchBuildCommand
  -> prepared | updated | rejected-stale | failed-optional
  -> HorizonPatchBuildResult

HorizonHostReconciliationCommand
  -> created | replaced | retained | retired | rejected-stale
  -> HorizonHostReconciliationResult

HorizonProjectionCommitCommand
  -> HorizonFrameDigest
  -> FirstHorizonGenerationBoundFrameAck
```

## Required identities

- course package ID and seed;
- horizon world generation;
- profile revision;
- LOD policy revision;
- focus revision;
- cell ID and cell revision;
- atlas sector IDs;
- patch revision and digest;
- host revision;
- frame sequence.

## Error classification

The horizon provider is optional. Failures should be classified without terminating the delivery run:

```txt
invalid-profile
invalid-policy
atlas-generation-failed
patch-build-failed
stale-focus
stale-cell
host-create-failed
host-replace-failed
resource-retirement-failed
frame-ack-timeout
```

## Boundary

This map describes proposed commands and results. No new UI control, gameplay input or runtime event was implemented.
