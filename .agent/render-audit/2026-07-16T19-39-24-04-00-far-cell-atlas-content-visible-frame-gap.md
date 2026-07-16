# Render audit: far-cell atlas content visible-frame gap

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Make the first rendered distant cell prove that the exact accepted macro-sector content plan reached the Three.js frame.

## Current render path

```txt
Core World desired cell
  -> patch-preparation request
  -> createCourseCellDescriptor(course, cell)
  -> course provider effect
  -> cell host and Core Graphics instance batches
  -> terrain/roads/depots/signs/trees/grass/rocks
  -> Three.js render
```

## Source-backed mismatch

The descriptor always creates deterministic terrain, vegetation and grass from cell coordinates and the course seed. Roads, depots and signs are filtered only from the finite course object. At sufficiently distant coordinates those finite-course arrays contribute nothing.

The installed macro-sector atlas can independently generate sector biome, density, settlement and edge-portal descriptors, but the visible patch path has no accepted atlas-sector input, atlas content digest or atlas-frame acknowledgement.

## Visible consequence class

```txt
near finite-course cells
  terrain + course roads + signs + candidate depots + vegetation

far infinite cells
  deterministic terrain + vegetation + grass
  usually no route network, settlement or portal continuity

atlas state
  may contain distant settlement/portal descriptors
  not proven in the visible frame
```

This does not claim a reproduced rendering defect. It identifies that `extent: infinite` is visually proven only as continuing terrain, not as a continuously populated world.

## Missing render contract

- No `WorldCellContentDigest` reaches the cell host.
- No `MacroSectorRevision` reaches road, settlement or portal meshes.
- No explicit course/atlas overlap resolution is visible.
- No horizon LOD level is bound to terrain construction.
- No `FirstAtlasBoundWorldFrameAck` exists.
- The Canvas2D map cannot prove atlas roads or settlements either.

## Required frame proof

```txt
accepted macro sector
  -> exact cell content plan
  -> exact provider receipt
  -> exact terrain/road/settlement instance set
  -> render frame ID
  -> FirstAtlasBoundWorldFrameAck {
       sectorId,
       sectorDigest,
       cellId,
       contentDigest,
       providerGeneration,
       frameId
     }
```

## Fixture matrix

- Origin sector with finite-course overlap.
- Sector immediately beyond the finite course bounds.
- Distant positive/negative coordinate sectors.
- Adjacent cells across one gameplay-cell seam.
- Adjacent macro sectors across each portal edge.
- Camera movement from course roads into atlas roads.
- Source, built artifact and deployed Pages comparison.

## Completion boundary

Do not claim a populated infinite world until distant road, settlement and portal content is committed from one accepted atlas result and acknowledged in the matching WebGL and map frames.
