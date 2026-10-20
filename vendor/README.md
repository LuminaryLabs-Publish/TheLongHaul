# Local game runtime

Run `npm ci` then `npm run build` from the repository root after changing `src/app/`. Commit the generated files with the source. The static game needs no build tool at runtime.

- `nexusengine.mjs`: bundled selected exports from LuminaryLabs-Dev/NexusEngine at revision `b941c9b2995e3449c6987908657753e2cf2df242`. The upstream source is downloaded into ignored `.cache/build/`; no upstream files are edited.
- `three.module.js`: Three.js 0.165.0 from its published package, with `THREE-LICENSE.txt`.
- `app-runtime.js`: the existing classic host scripts concatenated in their established order. Edit `src/app/`, not this generated file.
- `manifest.json`: pinned versions, exported APIs and SHA-256 output hashes.

The build needs network access on a fresh checkout. Gameplay dependencies are local afterward. First-time Campaign routing still requires OSRM; successful geometry is cached for seven days, at most eight routes. Campaign map boundary data and hosted fonts remain optional external presentation resources. Deployment configuration is unchanged.
