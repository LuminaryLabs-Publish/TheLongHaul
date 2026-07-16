# Validation

**Audit timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

The full Publish inventory, central ledgers, documented heads, TheLongHaul runtime-ahead commits, new Core profile, isolated smoke, playable host, and retained `.agent` state were inspected. The audit proves that promoted Core capabilities exist in the repository but are not adopted by the playable game.

## Plan ledger

**Goal:** state exactly what the Core adoption audit proves and what remains unverified.

- [x] Compare all 11 accessible Publish repositories.
- [x] Exclude `TheCavalryOfRome`.
- [x] Account for ten eligible central ledgers and root `.agent` states.
- [x] Compare all ten documented heads with `main`.
- [x] Identify TheLongHaul as the only runtime-ahead repository.
- [x] Inspect all three runtime-ahead commits and changed files.
- [x] Inspect playable and smoke provider revisions and kit compositions.
- [x] Preserve the complete 27-surface source-backed inventory.
- [x] Change documentation only.
- [ ] Execute Core smoke and playable parity fixtures after implementation.

## Repository evidence

```txt
reviewed pre-audit head: 5367c558a8e77164631c62747f9e7bd1e0aa9ca5
central documented head: 609e8cc9cd933cd1678c22b913eb8cfe450b616b
runtime ahead by: 3 commits
playable entry: index.html
Core proof entry: core-integration.html
Core profile module: src/long-haul-core.mjs
branch: main
```

## Selection evidence

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledgers: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 1
selected: TheLongHaul
selection rule: runtime-ahead priority
oldest fallback not used: TheOpenAbove at 2026-07-16T03-03-22-04-00
other eligible documented heads versus main: identical
```

## Source inspection

```txt
README ownership claims inspected: yes
Core profile exports inspected: yes
Core Data schema/random/package configuration inspected: yes
Core Simulation meter configuration inspected: yes
Core Camera controller configuration inspected: yes
Core Graphics batch configuration inspected: yes
Core Transaction Ledger helper inspected: yes
Core World patch-preparation helper inspected: yes
browser smoke checks inspected: yes
playable import map inspected: yes
playable kit composition inspected: yes
playable RNG and generation ownership inspected: yes
playable run/resource state ownership inspected: yes
playable camera and instance ownership inspected: yes
playable provider and patch lifecycle inspected: yes
playable duplicate-operation ownership inspected: yes
```

## Source-backed observations

```txt
new Core profile exists: yes
browser Core smoke exists: yes
playable imports Core profile: no
playable and smoke provider revisions match: no
playable course envelope admission: no
playable named RNG adoption: no
playable Core meter adoption: no
playable Core Camera adoption: no
playable Core Graphics adoption: no
playable patch-preparation adoption: no
playable Core Transaction Ledger adoption: no
state migration result: no
duplicate truth-owner rejection: no
smoke/playable semantic parity result: no
FirstCoreBoundPlayableFrameAck: no
```

## Inventory evidence

```txt
playable engine kits: 10
Core World providers: 2
browser/product adapters: 7
isolated Core profile kits: 5
standalone Core controller: 1
browser proof adapters: 1
deployment adapters: 1
total source-backed surfaces: 27
product render surfaces: 3
proof surfaces: 1
planned adoption surfaces: 20
```

## Documentation changed

```txt
new timestamped tracker and turn ledger
new architecture audit
new render audit
new gameplay audit
new interaction audit
new Core adoption contract audit
new deployment parity gate
new central-sync audit
START_HERE.md refreshed
current-audit.md refreshed
next-steps.md refreshed
known-gaps.md refreshed
validation.md refreshed
kit-registry.json refreshed
```

## Not changed

```txt
runtime JavaScript: no
HTML or CSS: no
Nexus Engine pins: no
Core profile configuration: no
course schema: no
randomness behavior: no
meter values or IDs: no
gameplay or scoring: no
camera or rendering: no
world streaming: no
transaction behavior: no
audio or storage: no
workflow or deployment: no
branch created: no
pull request created: no
```

## Not executed

```txt
project test command: unavailable
core-integration browser smoke: not run
playable Core profile bootstrap fixture: unavailable
provider convergence fixture: unavailable
course envelope admission fixture: unavailable
named RNG same-seed fixture: unavailable
meter migration fixture: unavailable
camera descriptor adoption fixture: unavailable
instance-batch adoption fixture: unavailable
patch-provider bridge fixture: unavailable
transaction migration fixture: unavailable
full gameplay parity fixture: unavailable
FirstCoreBoundPlayableFrameAck fixture: unavailable
root artifact parity fixture: unavailable
Pages parity fixture: unavailable
```

## Claims not made

No Core capability adoption, provider convergence, gameplay-state migration, deterministic replay equivalence, camera or instance descriptor adoption, patch lifecycle adoption, transaction idempotency adoption, smoke/playable parity, artifact parity, Pages parity, or production readiness is claimed.