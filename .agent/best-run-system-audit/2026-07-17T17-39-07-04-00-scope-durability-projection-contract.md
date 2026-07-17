# Best-run system audit: scope, durability and projection contract

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Current record

```json
{
  "adjustedTime": "number",
  "score": "string",
  "courseCode": "string"
}
```

Storage key:

```txt
the-long-haul-best-v2
```

This record is browser-global, reduced, unversioned inside the payload and not projected after restoration.

## Required canonical record

**Proposed, not implemented:**

```txt
schema
schemaVersion
recordId
recordRevision
scopeKind
scopeId
courseId
courseSeed or approved public course code
courseGeneratorVersion
scoringPolicyId
scoringPolicyRevision
rawTime
adjustedTime
versusPar
parTime
parDistance
penaltyTotal
cargoCondition
truckCondition
collisions
score
createdAt or deterministic sequence evidence
previousRecordRevision
recordDigest
```

The final schema should retain only data justified by the selected product policy. The list above is the evidence envelope required to make comparison and migration reviewable.

## Scope contract

The authority must name exactly one comparison class:

- `exact-course` — comparable only when canonical course identity matches.
- `seed-family` — comparable under an explicit generator and scoring revision.
- `scoring-revision` — comparable after a normalized score contract.
- `global` — comparable only when product policy explicitly treats all generated runs as one class.

Records outside the admitted class are `incomparable`, not automatically better or worse.

## Durability contract

A successful best-run commit requires:

```txt
candidate admitted
expected prior revision matches
serialization succeeds
adapter write succeeds
readback succeeds
readback schema validates
record digest matches
commit result publishes
```

A failed persistence attempt must not invalidate the completed gameplay result. It must return a classified storage result instead of disappearing into an empty catch block.

## Restore and migration contract

- Missing data returns `absent`.
- Invalid JSON returns `corrupt` without crashing boot.
- Unknown future schema returns `incompatible`.
- Known legacy schema may migrate through an explicit migration result.
- A migration must preserve source revision and produce a new digest.
- Reset/delete must be an explicit command with a settlement result.

## Projection contract

The visible record must identify its comparison context. A frame digest should bind:

```txt
recordRevision
recordDigest
scopeKind and scopeId
scoringPolicyRevision
route generation
projection generation
```

The first matching title/results frame publishes `FirstBestRunBoundFrameAck`.

## Boundary

This document defines proposed semantic ownership only. No storage schema, key, comparison or UI behavior changed.