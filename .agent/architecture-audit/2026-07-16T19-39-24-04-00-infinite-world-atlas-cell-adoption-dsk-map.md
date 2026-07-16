# Architecture audit: infinite-world atlas/cell adoption DSK map

**Timestamp:** `2026-07-16T19-39-24-04-00`  
**Status:** `infinite-world-atlas-cell-content-adoption-authority-audited`

## Goal

Define the minimum semantic ownership needed to turn an infinite extent declaration into deterministic, content-bearing streamed cells.

## Existing ownership

```txt
Core Data
  owns course-envelope schema and verification

Long Haul World Profile
  owns infinite/bounded extent policy
  owns macro-sector and gameplay-cell sizes
  owns horizon and atlas configuration

Long Haul World Atlas
  owns deterministic macro-sector descriptors
  owns biome/density metadata, settlements and edge portals

Long Haul Course
  owns the finite five-branch route, depots and exploration

course-cell-descriptor-generator
  owns terrain and visible patch descriptors
  currently reads only the finite course object

patch-preparation controller
  owns desired/prefetch/cache/budget lifecycle

Core World provider
  owns accepted cell effects and release

Three.js adapter
  owns the visible cell frame
```

## Current break

```txt
profile says infinite
package says infinite
Core World can request arbitrary grid cells
macro-sector atlas can describe arbitrary sectors

but

cell descriptor <- finite course only
provider <- cell descriptor only
renderer <- provider result only
```

The atlas DSK is installed beside the playable world path rather than being an admitted input to it.

## Required parent domain

`the-long-haul-infinite-world-atlas-cell-content-adoption-authority-domain`

## Required DSK hierarchy

```txt
Infinite World Atlas/Cell Adoption
├── Extent Manifest
│   ├── profile/package agreement
│   ├── generator revision
│   └── bounded/infinite migration policy
├── Sector Admission
│   ├── demand identity
│   ├── deterministic sector generation
│   ├── sector digest
│   └── stale-result rejection
├── Cell Content Planning
│   ├── sector/cell addressing
│   ├── course-versus-atlas ownership
│   ├── road plan
│   ├── settlement plan
│   ├── portal plan
│   ├── vegetation/obstacle plan
│   └── horizon representation
├── Patch Commit
│   ├── patch-preparation generation
│   ├── Core World provider generation
│   ├── duplicate/late result policy
│   └── WorldCellContentResult
└── Presentation Proof
    ├── far-drive continuity
    ├── sector/cell seams
    ├── first atlas-bound frame
    └── source/artifact/Pages parity
```

## Service contract

```txt
InfiniteWorldSectorAdmissionCommand
  input:
    profileRevision
    packageDigest
    courseRevision
    atlasRevision
    sectorCoordinates
    cellCoordinates
    providerGeneration
    runGeneration

  result:
    accepted/rejected
    sectorId
    sectorDigest
    extent
    biome
    settlements
    portals
    ownershipRevision

InfiniteWorldCellContentPlanCommand
  input:
    accepted sector result
    finite course contribution
    horizon level
    exact gameplay-cell bounds

  result:
    terrain plan
    road plan
    settlement plan
    portal plan
    vegetation/obstacle plan
    content digest

InfiniteWorldCellCommitCommand
  input:
    content plan
    preparation generation
    provider generation

  result:
    committed/duplicate/stale/rejected
    patch revision
    provider receipt
    visible-frame expectation
```

## Boundary rules

- The course retains ownership of the authored five-branch delivery challenge near its route.
- The atlas owns repeatable ambient content beyond and around that challenge.
- Overlap resolution must be deterministic and explicit; neither owner may silently erase the other.
- Macro-sector identity must derive from the accepted world seed and coordinates.
- A cell may not combine profile, atlas, course or provider revisions from different generations.
- Horizon policy must be consumed or explicitly classified as proof-only.
- Presentation acknowledgement must reference the same content digest committed to Core World.

## Non-goals

This authority does not redesign truck physics, scoring, delivery contracts, camera behavior or the finite five-branch course. It only coordinates infinite-world semantic content into the existing streamed-world path.
