# Gameplay audit: infinite-drive content continuity loop

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Ensure driving beyond the original course remains a coherent world experience rather than terrain-only continuation.

## Current loop

```txt
start one five-branch delivery course
  -> explore roads and five candidate depots
  -> drive within the course graph
  -> stream cells around the truck
  -> continue beyond former disk boundary
  -> terrain remains generated
  -> outside-course recovery is no longer automatic
  -> finite route/depot/sign content eventually ends
  -> no atlas route or settlement interaction replaces it
```

## Gameplay ownership gap

The new commit deliberately permits continued travel. The Truck and Run domains can keep simulating at arbitrary coordinates, and cell generation remains finite and deterministic. The delivery objective, exploration state, nearest-road query, surface classification, minimap and interaction still use the finite course.

Consequently, an infinite drive can enter a region where:

- `nearestRoad(course, position)` returns no course road;
- surface policy becomes off-road;
- exploration has no new course edge to accept;
- no new depot is available to inspect;
- macro-sector settlements and portals exist only in atlas state;
- map and WebGL presentation have no shared atlas content result.

## Required gameplay contract

```txt
truck enters demanded sector
  -> admit exact macro-sector result
  -> create deterministic atlas road/settlement content
  -> merge with finite course ownership
  -> expose road queries and surface policy
  -> expose discoverable settlement/portal semantics
  -> bind streamed patch and map projection
  -> acknowledge first atlas-bound frame
```

## Policy questions that must be explicit

- Is the infinite world free-roam after the delivery course, or may the active contract extend into atlas settlements?
- Do atlas roads affect surface grip and safe recovery pose?
- Can atlas settlements become recovery, fuel or future contract locations?
- Does exploration score include atlas roads?
- When does the map reveal atlas sectors?
- How are course roads connected to sector-edge portals?
- What happens when a generated settlement conflicts with a course depot?

## Non-goals

This audit does not require adding new contracts, economy, fuel stations or missions. The minimum requirement is coherent road/surface/presentation continuity for the world extent already declared by the runtime.

## Completion boundary

Do not claim complete infinite-drive gameplay until the truck, surface query, map, provider and renderer consume the same accepted atlas-backed cell plan beyond the finite course.
