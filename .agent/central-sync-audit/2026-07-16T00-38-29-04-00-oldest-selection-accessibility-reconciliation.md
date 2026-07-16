# Central-sync audit: oldest-selection accessibility reconciliation

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

The full current Publish inventory contains 11 repositories. After excluding TheCavalryOfRome, all ten eligible repositories were represented in the central ledger and root `.agent` audit state. No eligible repository was new, missing, undocumented or runtime-ahead. TheLongHaul had the oldest synchronized timestamp and was the only project selected.

## Plan ledger

**Goal:** preserve a source-backed selection record and prepare an exact central ledger/change-log reconciliation.

- [x] Enumerate the 11 accessible Publish repositories.
- [x] Exclude TheCavalryOfRome.
- [x] Compare the ten eligible repositories with central tracking.
- [x] Confirm no priority new/missing/undocumented case.
- [x] Apply the oldest synchronized timestamp rule.
- [x] Select only `LuminaryLabs-Publish/TheLongHaul`.
- [x] Record the accessible HUD, route and announcement audit locally.
- [ ] Bind the final repo-local documentation head into `LuminaryLabs-Dev/LuminaryLabs`.

## Comparison

```txt
TheLongHaul       2026-07-15T19-38-38-04-00 selected
MyCozyIsland      2026-07-15T19-58-42-04-00
IntoTheMeadow     2026-07-15T20-38-13-04-00
PrehistoricRush   2026-07-15T20-59-46-04-00
HorrorCorridor    2026-07-15T21-39-15-04-00
TheOpenAbove      2026-07-15T22-00-36-04-00
ZombieOrchard     2026-07-15T22-40-29-04-00
TheUnmappedHouse  2026-07-15T23-00-03-04-00
PhantomCommand    2026-07-16T00-00-40-04-00
AetherVale        2026-07-16T00-26-16-04-00
TheCavalryOfRome  excluded
```

## Local finding to reconcile

The driving HUD is a single polite live region whose descendants are rewritten every frame. Route changes only toggle presentation classes and have no explicit focus, inactive-screen, announcement or semantic-frame result. Generation, toasts, terminal outcomes and canvas/map alternatives likewise lack one revision-bound accessibility projection authority.

## Central target

```txt
repo-ledger/LuminaryLabs-Publish/TheLongHaul.md
internal-change-log/2026-07-16T00-38-29-04-00-the-long-haul-accessible-hud-route-announcement.md
```

## Validation boundary

This record proves the selection and documentation scope only. Runtime accessibility behavior, browser fixtures, artifact parity and Pages parity were not changed or executed.