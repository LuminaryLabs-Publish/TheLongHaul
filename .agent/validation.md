# Validation

**Audit timestamp:** `2026-07-17T07-38-20-04-00`

## Summary

All 11 Publish repositories were compared. Ten were eligible after excluding Cavalry of Rome, and all ten had central ledgers, root `.agent` state and matching documented heads. TheLongHaul was selected as the oldest synchronized eligible repository.

Source inspection proves that map open remains inside the driving scene and does not replace held vehicle input, simulation, streaming or presentation policy. It does not prove that current live-driving behavior is defective; it proves that the policy, focus and settlement contract is absent.

## Checklist

- [x] Compare all accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and root `.agent` folders.
- [x] Compare all ten documented heads with `main`.
- [x] Select only TheLongHaul by oldest synchronized timestamp.
- [x] Inspect HTML, bootstrap, input, map toggle, gameplay, streaming, map projection and RAF paths.
- [x] Reconcile 20 installed kits and 35 source-backed surfaces.
- [x] Add the timestamped map-mode audit family.
- [x] Change documentation only.
- [ ] Execute map-mode source/browser/artifact/Pages fixtures after implementation.

## Repository evidence

```txt
reviewed pre-audit repository head: d868fdc0758934a9be4fd70cc5ba479deced6398
reviewed runtime source revision: 189a586877db2bf3e0b1a7c74ae072b552b6fe9a
branch: main
selection class: oldest synchronized documented timestamp
selected prior timestamp: 2026-07-17T01-01-09-04-00
```

## Source observations

```txt
map toggle in driving scene: yes
driving input submitted before M toggle: yes
truck/run/meter updates continue while open: yes
world streaming continues while open: yes
DOM class and aria-hidden projection: yes

explicit map gameplay policy: no
map-specific semantic input context: no
map session identity: no
focus target/result: no
announcement result: no
exact close settlement result: no
FirstMapModeBoundFrameAck: no
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
planned map-mode surfaces: 18
project validation command: npm test
```

## Documentation changed

```txt
new tracker and turn ledger
new architecture audit
new render audit
new gameplay audit
new interaction audit
new map-mode contract audit
new deployment fixture gate
new central-sync audit
START_HERE/current-audit/next-steps/known-gaps/validation refreshed
kit-registry.json refreshed
```

## Not changed

```txt
runtime JavaScript, HTML or CSS: no
gameplay, input, focus or ARIA: no
Canvas2D or WebGL: no
tests, packages or workflows: no
deployment: no
branch or pull request: no
```

## Not executed

```txt
npm test: not run
map-mode policy fixtures: unavailable
held-control browser fixtures: unavailable
focus/announcement fixtures: unavailable
FirstMapModeBoundFrameAck fixture: unavailable
artifact and Pages parity: not run
```

## Claims not made

No preferred map policy, runtime fix, input-context correctness, simulation-policy correctness, focus restoration, matching-frame proof, artifact parity, Pages parity or production readiness is claimed.