# Deploy audit: context-loss browser fixture gate

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Summary

Static Pages deployment proves that the document can be delivered, not that WebGL context loss is recovered. Source, uploaded artifact and deployed origin need the same forced-loss and recovered-frame evidence.

## Plan ledger

**Goal:** block renderer-recovery readiness until reproducible browser evidence proves loss admission, bounded reconstruction, stale-generation rejection and one recovered presented frame.

- [x] Record the current static deployment boundary.
- [x] Define source, artifact and Pages fixture rows.
- [x] Define required evidence and failure cases.
- [ ] Implement and run the fixture matrix.

## Required fixture matrix

| Fixture | Source | Root artifact | Pages |
|---|---:|---:|---:|
| initial WebGL capability and first frame | required | required | required |
| forced `WEBGL_lose_context` loss | required | required | required |
| duplicate loss-event settlement | required | required | required |
| RAF submission suspension | required | required | required |
| held-input neutralization | required | required | required |
| simulation pause/continue policy | required | required | required |
| context restoration admission | required | required | required |
| shared-resource reconstruction | required | required | required |
| active-cell reconstruction | required | required | required |
| stale renderer callback rejection | required | required | required |
| first recovered frame acknowledgement | required | required | required |
| exhausted-retry fallback | required | required | required |

## Evidence packet

```txt
source revision
artifact revision and hash
deployed URL and fetch timestamp
browser and GPU adapter
initial renderer generation
loss event ID and timestamp
retired renderer generation
replacement renderer generation
resource manifest revision
per-resource reconstruction results
active Core World cell IDs
stale callback rejection count
simulation/input policy result
recovered frame revision and screenshot
fallback result when recovery is forced to fail
console errors and unhandled rejections
```

## Pass boundary

A run passes only when:

1. loss is accepted exactly once;
2. old-generation render submissions stop;
3. gameplay/input policy is explicit;
4. mandatory GPU resources reconstruct from accepted state;
5. stale callbacks cannot mutate the replacement scene;
6. one recovered frame is presented and acknowledged;
7. failure within the retry budget produces an actionable fallback;
8. source, artifact and Pages agree.

## Current status

```txt
forced-loss fixture: unavailable
restoration fixture: unavailable
resource rehydration fixture: unavailable
stale-generation fixture: unavailable
fallback fixture: unavailable
artifact parity: unverified
Pages parity: unverified
```

## Boundary

No workflow, artifact or deployed page was changed or executed.