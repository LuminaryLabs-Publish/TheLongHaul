# Deploy audit: input-lifecycle browser fixture gate

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** block release claims until focus-loss input retirement behaves identically in source, CI artifact, and deployed Pages.

- [x] Inspect current Node smoke and workflow coverage.
- [x] Identify browser-only lifecycle evidence.
- [x] Define the release fixture matrix.
- [ ] Implement the browser gate.

## Current validation

```txt
package command: npm test
playability smoke: present
static-shell smoke: present
main/pull-request smoke workflow: present
real-browser harness: absent
focus lifecycle fixture: absent
Pages lifecycle fixture: absent
```

Node source checks can prove syntax and source patterns. They cannot prove browser focus, visibility, bfcache, page freeze, lost keyup, or rendered neutral-frame ordering.

## Required fixture matrix

| Fixture | Required result |
|---|---|
| Hold W, blur, omit keyup, refocus | No new acceleration until fresh keydown |
| Hold A, hide tab, restore | No stale steering |
| Hold Shift+W, pagehide/pageshow | No stale boost or fuel spend |
| Queue E, retire route | No depot check or recovery |
| Queue R, retire run | No retry from stale generation |
| Queue M/C/Escape, blur | No stale map/camera/pause command |
| Blur and route exit race | One retirement result |
| Late keyup after restore | Classified stale; new generation unchanged |
| Fresh keydown after restore | Accepted normally |
| Frame error before pressed clear | One-shot state retired |

## Required environments

```txt
Chromium desktop
Firefox desktop
WebKit desktop
source dev server
CI-built/static artifact
public GitHub Pages origin
```

Mobile browsers do not use this keyboard path as their primary control surface, but pagehide/visibility behavior should still be checked if keyboard accessories are supported.

## Evidence bundle

Each fixture should persist:

```txt
release commit SHA
origin URL
browser and version
document/route/run/input generations
lifecycle event sequence
HeldInputRetirementResult
Core Input revision
Truck Input revision
simulation revision
FirstNeutralInputFrameAck
screen capture or frame hash
console and network errors
```

## Release rule

Fail the gate if:

- any held action survives retirement;
- any one-shot action fires after retirement;
- neutral Core Input and Truck Input revisions differ;
- restoration accepts new evidence before neutral settlement;
- source, artifact, and Pages results differ;
- no matching neutral frame is acknowledged within the deadline.

## Current claim boundary

The existing smoke workflow does not prove browser lifecycle correctness. No deployment readiness or Pages parity claim is made.