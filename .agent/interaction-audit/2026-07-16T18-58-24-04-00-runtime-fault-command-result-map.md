# Interaction audit: runtime-fault command/result map

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Current interaction path

```txt
keyboard/pointer-independent button evidence
  -> direct DOM handler or per-frame key consumption
  -> gameplay request
  -> no fault-generation binding
```

The failure overlay exposes Reload, but no typed result distinguishes a safe clean retry from a required page reload.

## Proposed map

```txt
RuntimeFrameFaultCommand
  input:
    schedulerGeneration
    frameId
    phaseId
    sceneRevision
    runRevision
    errorClassification
    partialMutationEvidence

  result:
    RuntimeFrameFaultResult
    retirementPolicy
    restartPolicy
    diagnosticId
    faultGeneration

RuntimeRestartAdmissionCommand
  input:
    faultGeneration
    requestedMode: reload | clean-run-restart

  result:
    accepted | rejected
    newSchedulerGeneration
    newRunGeneration
```

## Interaction settlement

- Clear held and one-shot input before exposing restart.
- Move focus to the terminal fault panel.
- Announce the fault once.
- Disable duplicate restart actions after admission.
- Reject all old-generation keyboard evidence and callbacks.
