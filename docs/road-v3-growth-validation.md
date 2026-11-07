# Road V3 seeded route growth — implementation evidence

State: **candidate service**, not the live Endless generator. V1/V2 compatibility retained.

## Targeted change

- Safe connector selection checks actual sampled curvature and grade; it does not blindly accept a 240 m tangent. The next *uncommitted* mountain can rotate deterministically if necessary to admit a safe connection; previously committed sections remain unchanged.
- Road V3 streaming retains a compact immutable section directory, generates bounded lookahead per request and materializes only a nearby section window. Revisiting an old progress region reconstructs the original geometry.
- NexusEngine Road V3 Domain Service Kit exposes `prepareStream()` and `ensureAhead()`; the normal game continues to use V2 because freight and rendering are not yet V3-authoritative.
- The environment-renderer test previously requested transparency from a seeded tile that contained **zero** road paint. Its seed/index is now one with road paint, making that regression's assertion meaningful. No renderer implementation change.

## Checks (local candidate sandbox)

| Check | Result |
|---|---|
| V3 30-seed, 16-mountain per seed streaming matrix | PASS |
| Maximum measured curvature | 0.0449933 (limit 0.05) |
| Maximum heading discontinuity across section seams | 0.00826 rad |
| Deterministic return/reconstruction | PASS |
| DSK stream prepare and ahead generation | PASS |
| 600 simulation-second real NexusEngine truck test | PASS; approximately 6.5 km, zero off-road ticks |
| Authored environment renderer fixture | PASS with genuine road-paint case |
| Entire existing Node regression suite | PASS (exit 0) |
| Pinned vendor reuse runtime build and shell smoke | PASS |
| True application/browser WebGL | BLOCKED by `net::ERR_BLOCKED_BY_ADMINISTRATOR` |

## Unfinished gates

- V3 is **not** yet connected to the host's freight/traffic/camera driving authority or deployed as the default. Those systems rely on `-position.z` and require an integrated change, not a version label.
- The 100 Drive GLBs have candidate manifest identity only in this app; their binary bytes, runtime loading and visual acceptance are not completed.
- The user-required real 600 s gameplay video and edited 60 s social video are not produced. The simulation test is not an authentic gameplay recording.
- Current targeted tests, existing Node regression suite and pinned runtime build pass in the recovered-source sandbox. The new road-growth regression also passes separately and is added to the future `npm test` command. The exact pushed commit still needs CI/deployed verification. This candidate cannot receive final V3 release approval until actual rendered gameplay, saved-game continuity, asset acceptance and hardware measurements are verified.

## Boundary

Do not change the default V2 Endless generator or report the overall Road V3 plan as complete until the remaining end-to-end user-visible acceptance gates pass.
