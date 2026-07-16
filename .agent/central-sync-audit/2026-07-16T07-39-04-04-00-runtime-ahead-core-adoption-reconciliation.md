# Central sync audit: runtime-ahead Core adoption reconciliation

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

The full Publish comparison found one priority case: TheLongHaul was three commits ahead of its central documented head. The new files add promoted Core capability proof but do not update the playable host, so this run documents adoption parity before applying the oldest-repository fallback.

## Plan ledger

**Goal:** record why TheLongHaul was selected and provide the exact central reconciliation payload.

- [x] Enumerate all 11 accessible Publish repositories.
- [x] Exclude `TheCavalryOfRome`.
- [x] Match ten eligible repositories to ten ledger files.
- [x] Confirm root `.agent` state for all ten through documented heads.
- [x] Compare each documented head with `main`.
- [x] Select TheLongHaul as the sole runtime-ahead repository.
- [x] Record the three new commits and files.
- [x] Produce a complete Core adoption audit.
- [ ] Update the central ledger with the final repo-local documentation head.
- [ ] Add the central internal change-log entry.

## Comparison result

```txt
IntoTheMeadow:    identical
TheLongHaul:      ahead by 3 commits — selected
HorrorCorridor:   identical
AetherVale:       identical
ZombieOrchard:    identical
TheUnmappedHouse: identical
MyCozyIsland:     identical
TheOpenAbove:     identical
PhantomCommand:   identical
PrehistoricRush:  identical
TheCavalryOfRome: excluded
```

## Runtime-ahead changes

```txt
848e180e18aa77f063df2dffaaffeccda3ec6de8
  Add Long Haul Core composition
  + src/long-haul-core.mjs

74c680504cf94cbcaa6816bf3f1fdd04aa1bec08
  Add Long Haul Core browser smoke
  + core-integration.html

5367c558a8e77164631c62747f9e7bd1e0aa9ca5
  Document Long Haul Core integration
  ~ README.md
```

## Central ledger payload

```txt
repository: LuminaryLabs-Publish/TheLongHaul
selection: runtime-ahead priority
status: core-capability-adoption-parity-authority-central-reconciled
technical status: core-capability-adoption-parity-authority-audited
reviewed pre-audit head: 5367c558a8e77164631c62747f9e7bd1e0aa9ca5
implemented source-backed surfaces: 27
planned adoption surfaces: 20
main finding: promoted Core services are smoke-only and parallel to playable owners
required authority: the-long-haul-core-capability-adoption-parity-authority-domain
```

## Central change-log payload

Record:

```txt
full inventory comparison
runtime-ahead selection reason
new Core module and smoke
provider revision divergence
playable/smoke ownership divergence
domains, kits, services, and counts
repo-local output paths
final repo-local documentation head
validation boundary
```

## Boundary

This run changes documentation only. Central reconciliation must not claim that the playable game adopted the new Core profile or that the smoke passed in this run.