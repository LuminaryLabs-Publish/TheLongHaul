# Interaction audit: motion preference command/result map

**Timestamp:** `2026-07-15T00-38-54-04-00`

## Current path

```txt
button click
  -> toggleSetting("motion")
  -> invert mutable boolean
  -> update button class and aria-pressed
  -> save localStorage document
  -> play click cue
```

The caller receives no typed result. The setting surface cannot distinguish complete adoption, partial adoption, persistence failure, stale request, unsupported profile, or frame failure.

## Required commands

```txt
MotionPreferenceCommand
MotionPreferenceRestoreCommand
MotionFrameAdmissionCommand
MotionPreferenceRetirementCommand
```

## Required results

```txt
MotionPreferenceResult
  commandId
  settingsDocumentRevision
  motionPreferenceRevision
  requestedProfile
  acceptedProfile
  participantReceipts
  persistenceReceipt
  status
  rejectionReason

MotionPreferenceRestoreResult
  sourceDocumentRevision
  acceptedProfile
  migrationStatus
  malformedFields
  status

MotionFrameResult
  frameId
  motionPreferenceRevision
  cameraRevision
  vehicleRevision
  effectReceipts
  rendererGeneration
  status

FirstMotionPreferenceFrameAck
  frameId
  motionPreferenceRevision
  visibleEffectFingerprint
```

## Participant result matrix

| Participant | Required receipt |
|---|---|
| settings UI | requested and projected profile |
| storage | durable write or explicit failure |
| rough-road suspension | enabled, reduced, or disabled |
| steering roll | enabled, reduced, or disabled |
| throttle/brake pitch | enabled, reduced, or disabled |
| cargo sway | enabled, reduced, or disabled |
| rough-road camera bob | enabled, reduced, or disabled |
| dynamic FOV | enabled, reduced, or disabled |
| camera interpolation | admitted convergence policy |
| renderer | matching submitted frame |

## Admission rules

```txt
reject stale SettingsDocumentRevision
reject unsupported profile
reject retired RunId or renderer generation
preserve predecessor profile if any mandatory participant fails
publish persistence failure instead of silently swallowing it
acknowledge visibility only after the matching frame is submitted
```

## Accessibility boundary

The current source does not expose a system `prefers-reduced-motion` adapter. Supporting it is optional product policy, but any adapter must feed the same authority rather than bypassing it.