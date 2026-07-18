# Validation

**Audit timestamp:** `2026-07-18T03-43-36-04-00`

## Summary

All 11 Publish repositories were compared. Ten were eligible after excluding Cavalry of Rome. All ten had central ledgers and root `.agent` state. TheLongHaul, PrehistoricRush and HorrorCorridor were runtime-ahead; TheLongHaul was selected as the newest eligible runtime-ahead repository.

Source inspection proves that the new horizon world can prepare an updated patch for a cell while the renderer retains an existing host without comparing revisions. It also proves partial, rather than complete, adoption of the named Horizon LOD content modes. It does not prove a visible production defect without executable browser evidence.

## Checklist

- [x] Compare all accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and root `.agent` states.
- [x] Identify runtime-ahead eligible repositories.
- [x] Select only TheLongHaul by latest runtime update.
- [x] Compare prior documentation head with current runtime head.
- [x] Reconcile 14 runtime commits.
- [x] Inspect bootstrap, terrain, truck, camera, horizon, frame-loop and smoke paths.
- [x] Reconcile 20 installed kits and 36 source-backed surfaces.
- [x] Add the timestamped horizon audit family.
- [x] Change documentation only.
- [ ] Execute horizon domain, browser, artifact and Pages fixtures after implementation.

## Repository evidence

```txt
previous repo-local documentation head: 1ed59786aa8f8f26f643c9f1e8c4d0a4205181f6
reviewed runtime head: 753488e40e69fc13471df42959628ef3052e5992
runtime commits reconciled: 14
branch: main
selection class: newest runtime-ahead eligible repository
```

## Source observations

```txt
second Core World registered: yes
quadtree partition used: yes
curved-horizon surface used: yes
horizon provider prepareCell/updateCell: yes
patch map replacement by cell ID: yes
existing host revision comparison: no
existing host replacement on patch update: no
patch revision or digest: no
focus/profile/policy revision in patch: no
terrain resolution policy consumed: yes
road/settlement none gate consumed: yes
distinct road modes realized: no
distinct settlement modes realized: no
forest modes realized: no
HorizonFrameDigest: no
FirstHorizonGenerationBoundFrameAck: no
```

## Inventory

```txt
Core kits: 8
product DSKs: 12
engine-installed kits: 20
Core World effect providers: 2
controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
render surfaces: 3
proposed horizon-convergence surfaces: 20
project validation command: npm test
```

## Documentation changed

```txt
new tracker and turn ledger
new architecture audit
new render audit
new gameplay audit
new interaction audit
new horizon-system contract audit
new deployment fixture gate
new central-sync audit
START_HERE/current-audit/next-steps/known-gaps/validation refreshed
kit-registry.json refreshed
```

## Not changed

```txt
runtime JavaScript, HTML or CSS: no
world, truck, camera or horizon behavior: no
gameplay, input, scoring or storage: no
tests, packages or workflows: no
deployment: no
branch or pull request: no
```

## Not executed

```txt
npm test: not run
patch-replacement fixture: unavailable
stale-focus/cell fixture: unavailable
LOD mode fixture: unavailable
browser motion/refinement fixture: not run
artifact and Pages parity: not run
```

## Claims not made

No visible horizon defect, performance regression, memory amount, complete LOD policy adoption, duplicate-free atlas projection, matching-frame proof, artifact parity, Pages parity or production readiness is claimed.
