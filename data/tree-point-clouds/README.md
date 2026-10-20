# Tree point-cloud profiles

Runtime templates are derived from two public scans in the LSU Cloud Forest Library:

- White Oak (*Quercus alba*), terrestrial laser scan: https://xyz.cct.lsu.edu/quercus-alba-01/
- Japanese Cedar (*Cryptomeria japonica*), NeRF reconstruction: https://xyz.cct.lsu.edu/cryptomeria-japonica-01/
- Library and license: https://xyz.cct.lsu.edu/cloud-forest/ (the library states the tree point clouds are CC0).

The compact output in `src/game/tree-point-profiles.mjs` stores measured normalized surface points and linearized RGB values, not the source scans. To regenerate, run `python3 tools/build_tree_point_profiles.py`; it downloads the two source PLYs and writes the module. You may also pass local scan paths with `--oak` and `--cedar`. Runtime generation is deterministic and offline.
