# Central sync audit: oldest-selection best-run reconciliation

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Inventory comparison

```txt
accessible LuminaryLabs-Publish repositories: 11
excluded: LuminaryLabs-Publish/TheCavalryOfRome
eligible repositories: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0
all eligible heads matched documented repo-local heads: yes
```

## Selection

```txt
selected: LuminaryLabs-Publish/TheLongHaul
rule: oldest synchronized central timestamp
selected prior timestamp: 2026-07-17T07-38-20-04-00
projects modified in Publish org: 1
```

## Reconciliation finding

TheLongHaul's implemented kit and adapter inventory remains unchanged: 20 engine-installed kits, one world provider, one patch-preparation controller, nine browser/product adapters and four proof/deployment adapters.

The new documentation isolates one source-backed gap: a detailed terminal `RunResult` is reduced into one global local-storage record, compared only by adjusted time, silently written without a typed durability result and never restored into a visible presentation.

## Repo-local reconciliation

Added the `2026-07-17T17-39-07-04-00` tracker, turn ledger and focused audit family. Refreshed required root `.agent` routing, gaps, next steps, validation and machine-readable kit registry.

## Central reconciliation

The matching `LuminaryLabs-Dev/LuminaryLabs` ledger entry must:

- advance TheLongHaul's last-updated timestamp;
- bind the final repo-local documentation head;
- preserve prior map-mode and retained statuses;
- record the proposed best-run authority without claiming implementation;
- add one timestamped internal change log.

## Write policy

Both repositories are updated only on `main`. No branch or pull request is created.