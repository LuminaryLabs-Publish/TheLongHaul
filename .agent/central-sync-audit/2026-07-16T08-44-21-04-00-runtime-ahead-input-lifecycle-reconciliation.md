# Central sync audit: runtime-ahead input-lifecycle reconciliation

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** reconcile the central repository ledger with TheLongHaul's 44-commit modular rewrite and the new browser-focus input-retirement finding.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible central ledger entries and root `.agent` states.
- [x] Compare current repository heads with documented heads.
- [x] Select only TheLongHaul by runtime-ahead priority.
- [x] Compare documented head `f9cf4fa71c2a76cd23202787f63c5ff5b2d1f6be` with reviewed pre-audit head `d46394b3a848d769fac1228731e820990dbeb1f4`.
- [x] Inspect the 44-commit production rewrite and complete current composition.
- [x] Add the timestamped input-lifecycle audit family.
- [x] Prepare central ledger and change-log reconciliation targets.
- [ ] Implement and execute the planned lifecycle authority.

## Selection reconciliation

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 1

selected: LuminaryLabs-Publish/TheLongHaul
selection rule: runtime-ahead priority
previous documented head: f9cf4fa71c2a76cd23202787f63c5ff5b2d1f6be
reviewed pre-audit head: d46394b3a848d769fac1228731e820990dbeb1f4
ahead by: 44 commits
oldest fallback not used: LuminaryLabs-Publish/ZombieOrchard
oldest fallback timestamp: 2026-07-16T03-41-28-04-00
```

## Runtime reconciliation

The prior central record described a playable shell separate from an isolated promoted-Core proof. That description is no longer current after the modular rewrite.

The playable runtime now:

```txt
pins Nexus Engine b941c9b2995e3449c6987908657753e2cf2df242
imports createLongHaulCoreKits
installs Core Data, Simulation, Camera, Graphics and Transaction Ledger
installs five product DSKs
creates and verifies course envelopes
uses named Core Data random streams
uses Core Simulation resource meters
uses Core Camera smoothing descriptors
uses Core Graphics instance batches
uses Core Transaction Ledger apply-once operations
uses the world patch-preparation controller
runs Node smoke tests through npm test and GitHub Actions
```

The earlier Core-adoption audit remains historically valid for its reviewed revision, but current central status must describe the adopted modular composition.

## New source-backed finding

```txt
held key store: present
one-shot pressed store: present
keydown and keyup: present
ordinary frame clear: present
blur retirement: absent
hidden visibility retirement: absent
pagehide retirement: absent
freeze retirement: absent
route/run retirement: absent
neutral Core Input settlement: absent
neutral Truck Input settlement: absent
FirstNeutralInputFrameAck: absent
```

A lost `keyup` during focus transfer can leave throttle, brake, steering, or boost active when the page becomes usable again. Pending one-shot camera, map, pause, retry, or interaction evidence can also survive until an ordinary frame consumes it.

## Central records

Update:

```txt
repo-ledger/LuminaryLabs-Publish/TheLongHaul.md
```

Add:

```txt
internal-change-log/
  2026-07-16T08-44-21-04-00-
  the-long-haul-browser-focus-input-release.md
```

The central entries must record:

- runtime-ahead selection evidence;
- the 44-commit modular rewrite;
- current interaction loop, domains, kits and services;
- promoted-Core adoption in the playable runtime;
- the browser-focus input-retirement gap;
- all timestamped `.agent` outputs;
- documentation-only validation boundaries;
- final product and central `main` heads.

## Validation boundary

No runtime, test, workflow or deployment file was changed during this audit. No focus-safe input, lifecycle retirement, neutral-frame proof, test pass, artifact parity, Pages parity or production-readiness claim is made.