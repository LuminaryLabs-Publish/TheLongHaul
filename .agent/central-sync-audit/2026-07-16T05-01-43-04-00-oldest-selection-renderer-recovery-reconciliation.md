# Central sync audit: oldest selection and renderer recovery reconciliation

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Summary

The complete current Publish installation contained 11 repositories. After excluding `TheCavalryOfRome`, all ten eligible repositories had central ledger entries and current heads matching the documented repo-local heads. TheLongHaul had the oldest central timestamp and was the only selected repository.

## Plan ledger

**Goal:** record the selection proof and the exact central changes required after the repo-local audit is committed.

- [x] Enumerate the current Publish installation.
- [x] Match ten eligible repositories to central ledger paths.
- [x] Compare current heads to documented heads.
- [x] Confirm no new, missing, undocumented or runtime-ahead eligible repository.
- [x] Select only TheLongHaul by oldest synchronized timestamp.
- [x] Add the WebGL recovery audit family under root `.agent`.
- [ ] Bind the final repo-local documentation head in the central ledger.
- [ ] Add the matching central internal change-log entry.

## Current comparison

```txt
TheLongHaul       2026-07-16T00-38-29-04-00  48ba7e8938c7edb4a62a0748e60b69ba53820c45  selected
MyCozyIsland      2026-07-16T00-59-16-04-00  75a1941e1305780b06276b15a3d9d8834f6a3530
IntoTheMeadow     2026-07-16T01-38-56-04-00  b534655cd0714d73ee80d4aa75eed26b12026dd6
PrehistoricRush   2026-07-16T02-03-42-04-00  5a4d179c09ee9fad4e11a44f42671606a4a6254d
HorrorCorridor    2026-07-16T02-40-29-04-00  404eeedafba8d6793d0ddc660d3d8b1399fb7469
TheOpenAbove      2026-07-16T03-03-22-04-00  d1d48c49ff687d2a6aa10c1ffd152eb6a771b3ff
ZombieOrchard     2026-07-16T03-41-28-04-00  df7acca6d6d4d61b2004288801727842169894dc
TheUnmappedHouse  2026-07-16T04-02-40-04-00  a90e7e4fa7da0ecfe0863236608d0a397a9dad7d
PhantomCommand    2026-07-16T04-27-44-04-00  10cd797325f0b20652e7dff780b5046c2909c71b
AetherVale        2026-07-16T04-40-16-04-00  bcc0528e07ce3096d52aa5e708db62a192ba9acf
TheCavalryOfRome  excluded
```

## Central changes

```txt
update:
  repo-ledger/LuminaryLabs-Publish/TheLongHaul.md

add:
  internal-change-log/2026-07-16T05-01-43-04-00-the-long-haul-webgl-context-resource-recovery.md
```

## Central status target

```txt
webgl-context-resource-recovery-authority-central-reconciled
```

## Boundary

No other Publish repository is selected or modified by this run.