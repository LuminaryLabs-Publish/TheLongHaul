# Central-sync audit: oldest synchronized selection and streaming audit

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Inventory comparison

| Repository | Current `main` head | Recorded documentation head | Prior central timestamp | Result |
|---|---|---|---|---|
| `LuminaryLabs-Publish/HorrorCorridor` | `036d96ab9e470fedf15209d325bcc2d131cbf000` | same | `2026-07-18T04-41-15-04-00` | synchronized |
| `LuminaryLabs-Publish/AetherVale` | `9a360984f9b923c211ab5c237488f799621f9153` | same | `2026-07-18T11-39-41-04-00` | synchronized |
| `LuminaryLabs-Publish/TheOpenAbove` | `5dc86bc5838a6e4ab8d6431a833b6c88e44ff190` | same | `2026-07-18T12-38-04-04-00` | synchronized |
| `LuminaryLabs-Publish/PhantomCommand` | `dae02ae15f394a0a6ba86d201a6e2eb980889437` | same | `2026-07-18T10-38-06-04-00` | synchronized |
| `LuminaryLabs-Publish/PrehistoricRush` | `9b038c1454ea850f8de58fc6fc25af234a4adbd7` | same | `2026-07-18T14-40-12-04-00` | synchronized |
| `LuminaryLabs-Publish/ZombieOrchard` | `8e7212f0ec9961c3289b6a58316cde7a9e7df417` | same | `2026-07-18T08-39-41-04-00` | synchronized |
| `LuminaryLabs-Publish/IntoTheMeadow` | `2e6745509c9e7771fc7448402da170c2b541c21b` | same | `2026-07-18T07-40-23-04-00` | synchronized |
| `LuminaryLabs-Publish/MyCozyIsland` | `75bc72594ff0eb3b225663bbbd3a63c6e58e5b45` | same | `2026-07-18T06-40-59-04-00` | synchronized |
| `LuminaryLabs-Publish/TheUnmappedHouse` | `7255e27f8867ff39167d3883d071251f99a9bb81` | same | `2026-07-18T09-40-39-04-00` | synchronized |
| `LuminaryLabs-Publish/TheLongHaul` | `2c21dbcd06f823633b2bad3d9977ab1ebe6bcbdd` | same | `2026-07-18T03-43-36-04-00` | selected oldest |

`LuminaryLabs-Publish/TheCavalryOfRome` was excluded and not inspected for selection.

## Selection result

```txt
Publish repositories: 11
eligible repositories: 10
new repositories: 0
missing central ledgers: 0
missing root .agent states: 0
undocumented repositories: 0
runtime-ahead repositories: 0
selected: LuminaryLabs-Publish/TheLongHaul
selection rule: oldest synchronized eligible repository
projects changed: 1
```

## Repo-local update

The new `.agent` run documents:

- the complete interaction loop;
- every active domain;
- all 20 engine-installed kits and offered services;
- both Core World providers;
- the patch-preparation controller;
- all nine browser/product adapters;
- all four proof/deployment adapters;
- the per-driving-frame near-world desired-set, prefetch and pump cadence;
- a conservative 56 caller-owned object/array construction floor per driving frame;
- 20 proposed streaming-cadence authority surfaces;
- required browser, artifact and Pages evidence.

## Central update required

After the repository-local documentation commits settle, update:

```txt
LuminaryLabs-Dev/LuminaryLabs
  repo-ledger/LuminaryLabs-Publish/TheLongHaul.md
  internal-change-log/2026-07-18T15-38-25-04-00-the-long-haul-near-world-streaming-cadence-budget.md
```

The central ledger must record the final repo-local documentation head, preserve every prior status, and classify the runtime as unchanged by this audit.

## Validation boundary

This comparison used the current accessible GitHub repository inventory, current `main` heads, central ledger records and root `.agent` state. It did not execute project tests, browser fixtures, artifacts or Pages smoke.