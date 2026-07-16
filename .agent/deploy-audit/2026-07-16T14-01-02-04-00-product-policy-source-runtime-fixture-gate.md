# Deploy audit: product-policy source/runtime fixture gate

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Current validation

The repository has Node smoke tests, static-shell/source checks, a main-branch smoke workflow, and static Pages publication. None proves that the five installed policy DSKs change the playable runtime.

## Required fixture matrix

| Fixture | Required proof |
|---|---|
| default policy | current intended course, truck, delivery, and frame behavior remains deterministic |
| world profile | cell size/active radius/world bounds or supported subset changes from admitted policy |
| road class | width/grip/grade/curvature/jump weighting affects generated road records |
| terrain policy | octave/flatten/jump values affect deterministic terrain/cell output |
| truck profile | speed/acceleration/braking/steering values affect simulation numerically |
| delivery contract | selected contract changes stops/time/cargo/road/destination requirements |
| mixed revision | stale course/cell/truck/delivery work is rejected |
| first run ack | run/course cite one policy generation and digest |
| first frame ack | world/truck/HUD/map cite the same generation and digest |
| source/artifact/Pages | all three produce matching receipts and outcomes |

## Release gate

```txt
npm test
  -> policy schema/reference tests
  -> deterministic consumer tests
  -> stale-generation tests
  -> browser smoke
  -> artifact smoke
  -> Pages smoke
  -> matching policy digest and acknowledgements
```

Source-pattern assertions alone are insufficient. The gate must execute the consumers.

## Current claim boundary

No product-policy adoption, modified-policy correctness, cache invalidation, artifact parity, Pages parity, or production readiness is claimed.