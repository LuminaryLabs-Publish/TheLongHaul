# Continuous freight implementation

Authority: LUM-000154. Repository: LuminaryLabs-Publish/TheLongHaul. Baseline: `c1b1f195b6b506b8e63ef3a0f3e80da96052b892`.

This implements the approved Remaining Implementation Master Plan. The existing project tracker remains authoritative; no new task IDs are created. LUM-000162 remains a separate asset dependency. The preceding five-decision overhaul remains the foundation.

## Source findings and boundaries

The terrain already streams, but the generated road graph has a finite endpoint. The host completes a run on delivery and fails it on cargo loss. The truck profile's mass is not applied to dynamics. The score ledger and encounter planner assume a finite run. Campaign uses independently supplied geographic courses and settlement receipts. Those working systems are retained.

NexusEngine continues to own simulation time, resources, scene lifecycle, streaming and its transaction ledger. New road, cargo and freight rules are product modules in this repository. The host connects them to actual truck inputs, rendered roads, contacts, meters, audio and saves. No engine repository changes are included.

## Dependency-ready outcomes

| Outcome / existing tasks | Included result and boundary | Completion and evidence |
| --- | --- | --- |
| 1. Endless highway — TLH-001/002/006 | Deterministic bounded road window, continuous elevation and surface sampling, advance before arrival; geographic Campaign remains separate. | Multiple generated sections, joint/collision checks and stable retained counts. |
| 2. Continuous freight — TLH-006 | One session with assigned/pickup/onboard/transit/delivered/lost/replacement states; atomic cumulative payment and resumable checkpoint. | Several natural deliveries and a cargo loss without results/restart, replay and adverse-storage checks. |
| 3. Cargo handling — TLH-004/006 | Standard, fragile, heavy, hazardous and unstable loads affect actual forces, inertia, suspension and damage; loading preserves velocity. | Deterministic load comparisons plus actual loaded driving. |
| 4. Drive-through choices — TLH-002/005/006 | Readable safe route and narrower shorter express route; swept pickup gates and protected station approaches. | Both routes driven, high-speed and duplicate/reverse rejection. |
| 5. Recovery and reward — TLH-005/006 | Qualified risky-route completion awards; missed pickups move ahead; one skill-based combo rescue per contract. | Adversarial miss/reverse/repeat/crash checks and actual recovery route. |
| 6. Pacing — TLH-001/005 | Distance/contract difficulty stages, capability-aware warning and traffic limits, station exclusions and quiet intervals. | Seeded clearance/pacing checks and long-run traces. |
| 7. Guidance — TLH-003/007 | Freight status, mass/handling, gate distances, route choice and recovery guidance in the existing HUD; preserve Campaign navigation. | Desktop/touch/reduced-motion and Campaign edge-state walkthroughs. |
| 8. Compatibility — TLH-001–008 | Existing geometry, collision, garage/save behavior, available browser coverage and runtime resources. | Consolidated tests/browser matrix; hardware and human checks identified honestly. |
| 9. Delivered release — TLH-009 | Exact build, continuous journey evidence, smooth edited 60-second recording, normal main update and project synchronization. | Source hashes, frame/simulation timing, inspected footage, CI/readback and handoff. |

Order: road foundation → contract lifecycle → cargo integration → loading/reward/pacing/UI → consolidated playable validation → publication. Independent module work uses explicit APIs; integration remains one authoritative loop.

## Settled gameplay contracts

- Endless starts empty and assigns a pickup ahead. Drive through either marked gate; no confirmation or stop is required. The express path requires a clean forward approach and adequate clearance to award a route bonus.
- Delivery uses a downstream drive-through receiver and settles once while the vehicle keeps moving. The next pickup is ahead. Delivery includes modest fuel and repair service, allowing a sustained journey; garage service remains available for cash.
- Cargo loss or an onboard deadline expiry forfeits that contract, removes its mass and schedules replacement freight. Empty travel has no delivery deadline. Pause freezes simulation; the map/garage retain the existing active delivery clock behavior.
- Truck destruction still ends the journey. Fuel exhaustion retains roadside recovery behavior and can end a run after recovery. Cargo failure never independently opens a loss/results screen. Hazardous cargo failure can damage the truck; unstable cargo shifts in response to actual lateral acceleration.
- Payments and the resumable checkpoint share one save record. Repeated delivery/cash settlement does not pay twice. Invalid, unavailable or conflicting storage produces clear feedback and never silently overwrites another journey.
- Score rewards require new forward progress, qualified route evidence and stable event identity. A missed pickup produces no points. A clean replacement shortcut may restore a stored multiplier once, with a finite opportunity window; crashes cancel that opportunity.
- World, route, visual, traffic, contact and scoring history remain bounded during a continuous session. Existing Campaign rewards and geographic route behavior are preserved.

## Final validation protocol

Complete the application changes first. Build and run meaningful deterministic regressions, then validate the actual local application and repair concrete failures. Retain an uninterrupted natural-input journey covering pickup, delivery, cargo loss and replacement. Separately produce an edited 60-second video from individually rendered simulation frames at a fixed timestep, with source/frame/cut provenance and matching game audio. Frame capture may run more slowly than playback; encoded FPS is not a hardware performance claim.

Reconcile remote main, inspect the complete diff, push normally, verify published bytes and CI, then update only the existing project tracker and TheLongHaul Drive evidence/handoff folders. Human enjoyment, unavailable physical-device measurements and final production assets remain explicitly open.

## Governing guides

- [Luminary End-to-End Workflow](https://docs.google.com/document/d/1IHJwrSx_gIjRYud32EloATFkfj-mK8pZTR3lR02xEmI/edit)
- [Outcome-Based Tasking](https://docs.google.com/document/d/16UYFNdNdXuLNpPXB9eXg7tb0lpXY9Z3eQooc2csde8o/edit)
- [Recursive Contextual Decomposition](https://docs.google.com/document/d/1XUD-PBFQByp6Ly7CS0ZW3us615YDM8KR-o9IvD_oFF8/edit)
- [Game Development Guide](https://docs.google.com/document/d/1GhhV72ZWU8s4b3G6ggbgVMhI7I7KKxlzQXyhOScuyOM/edit)
- [Existing task tracker](https://docs.google.com/spreadsheets/d/1U5wawNNkQGWvWflfM919RLSzPVvXV4kDzV0akZq6-JA/edit)
