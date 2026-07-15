# Central sync audit: oldest-selection input action reconciliation

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** record why TheLongHaul was the only eligible repository selected and what must be synchronized centrally.

- [x] Enumerate 11 accessible Publish repositories.
- [x] Exclude `TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and root `.agent` states.
- [x] Compare all ten current heads with documented heads.
- [x] Confirm zero new, missing, undocumented or runtime-ahead repositories.
- [x] Select only TheLongHaul by oldest synchronized timestamp.
- [x] Prepare the new input-action authority record.
- [ ] Bind the final repo-local documentation head in the central ledger.

## Selection evidence

```txt
TheLongHaul prior timestamp: 2026-07-15T14-40-11-04-00
next oldest: MyCozyIsland at 2026-07-15T15-01-22-04-00
selection priority cases: none
selected projects: 1
branches created: 0
pull requests created: 0
```

## Reconciliation payload

```txt
status: input-action-contract-context-convergence-authority-audited
implemented surfaces: 20
planned authority surfaces: 20
main finding: Core Input descriptors and executable browser actions diverge
key contradiction: KeyR declared recovery, executed retry
central ledger: repo-ledger/LuminaryLabs-Publish/TheLongHaul.md
central change log: internal-change-log/2026-07-15T19-38-38-04-00-the-long-haul-input-action-contract-convergence.md
```

## Validation boundary

This record proves documentation selection and intended central reconciliation only. It does not prove runtime input correctness.