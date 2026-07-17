# Validation

**Audit timestamp:** `2026-07-17T17-39-07-04-00`

## Summary

All 11 Publish repositories were compared. Ten were eligible after excluding Cavalry of Rome. Every eligible repository had a central ledger, root `.agent` state and a `main` head matching its documented repo-local head. TheLongHaul was selected as the oldest synchronized eligible repository.

Source inspection proves that a rich terminal result is reduced into one global, unprojected local-storage record. It does not prove that the global policy is defective or that a storage failure has occurred; it proves that scope, durability, migration and projection contracts are absent.

## Checklist

- [x] Compare all accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and root `.agent` folders.
- [x] Compare all ten documented heads with `main`.
- [x] Select only TheLongHaul by oldest synchronized timestamp.
- [x] Inspect bootstrap, scoring, result projection, storage, route and frame-loop paths.
- [x] Reconcile 20 installed kits and 35 source-backed surfaces.
- [x] Add the timestamped best-run audit family.
- [x] Change documentation only.
- [ ] Execute best-run domain, browser, artifact and Pages fixtures after implementation.

## Repository evidence

```txt
reviewed pre-audit repository head: 3fb11448580405aaa864b106af5dd73e8f06283a
reviewed runtime source revision: 189a586877db2bf3e0b1a7c74ae072b552b6fe9a
branch: main
selection class: oldest synchronized documented timestamp
selected prior timestamp: 2026-07-17T07-38-20-04-00
```

## Source observations

```txt
rich RunResult construction: yes
current result DOM projection: yes
single local-storage best key: yes
replacement comparison by adjustedTime: yes
reduced stored record: yes
empty storage catch: yes
restored best-record projection: no

explicit comparison scope result: no
record schema/revision/digest: no
durable commit/readback result: no
migration/reset result: no
BestRunFrameDigest: no
FirstBestRunBoundFrameAck: no
```

## Inventory

```txt
Core kits installed: 8
product DSKs installed: 12
engine-installed kits: 20
Core World effect providers: 1
controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 35
render surfaces: 3
proposed best-run surfaces: 18
project validation command: npm test
```

## Documentation changed

```txt
new tracker and turn ledger
new architecture audit
new render audit
new gameplay audit
new interaction audit
new best-run-system contract audit
new deployment fixture gate
new central-sync audit
START_HERE/current-audit/next-steps/known-gaps/validation refreshed
kit-registry.json refreshed
```

## Not changed

```txt
runtime JavaScript, HTML or CSS: no
scoring or best-record behavior: no
local-storage keys or payloads: no
gameplay, input or rendering: no
tests, packages or workflows: no
deployment: no
branch or pull request: no
```

## Not executed

```txt
npm test: not run
comparison and schema fixtures: unavailable
storage failure/readback fixtures: unavailable
migration and reset fixtures: unavailable
reload/projection browser fixtures: unavailable
FirstBestRunBoundFrameAck fixture: unavailable
artifact and Pages parity: not run
```

## Claims not made

No data-loss incident, preferred comparison scope, fair cross-course comparison, durable commit, migration correctness, visible best-record support, matching-frame proof, artifact parity, Pages parity or production readiness is claimed.