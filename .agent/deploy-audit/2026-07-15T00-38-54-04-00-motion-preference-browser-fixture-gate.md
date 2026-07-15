# Deploy audit: motion preference browser fixture gate

**Timestamp:** `2026-07-15T00-38-54-04-00`

## Summary

The repository has no package manifest, executable test command, or browser fixture for preference adoption. Pages deploys the repository root, so source behavior and deployed behavior are not currently tied through an audited motion-preference result.

## Required fixture matrix

| Fixture | Required proof |
|---|---|
| Title toggle | switch updates one accepted revision and persisted document |
| Paused toggle | predecessor pause state is preserved and successor motion revision is adopted |
| Reload restore | persisted setting is validated before first driving frame |
| Rough-road truck shake | reduced profile disables or reduces the declared effect |
| Rough-road camera bob | reduced profile disables or reduces the declared effect |
| Steering roll | behavior matches the versioned profile |
| Throttle/brake pitch | behavior matches the versioned profile |
| Cargo sway | behavior matches the versioned profile |
| Dynamic FOV | behavior matches the versioned profile |
| Camera convergence | stable follow remains within declared bounds |
| Persistence failure | failure is surfaced and predecessor profile remains authoritative |
| Stale command | stale settings revision is rejected |
| First matching frame | visible frame cites the accepted preference revision |
| Pages parity | deployed source and frame fingerprint match the reviewed artifact |

## Evidence packet

```txt
product commit SHA
provider revisions
index.html hash
settings document before and after
MotionPreferenceCommand
MotionPreferenceResult
participant receipts
MotionFrameResult
FirstMotionPreferenceFrameAck
browser transform samples or screenshots
Pages URL and artifact identity
```

## Current proof boundary

```txt
source inspection: complete
runtime implementation: unchanged
browser fixture: unavailable
build fixture: unavailable
artifact hash: unavailable
Pages motion fixture: unavailable
```

No deployed preference-adoption or visual-equivalence claim is made.