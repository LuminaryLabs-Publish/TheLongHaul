# The Long Haul

A deterministic browser truck-delivery game built with NexusEngine and Three.js.

## Play

Choose **Campaign** for geographic highway deliveries or **Endless** for procedural freight contracts. Each run begins with a short, skippable camera introduction in the actual game world.

- **WASD / arrow keys:** drive; **S / Down** brakes, then reverses. **Space:** handbrake.
- **Shift:** held boost. Double-tap **W / Up** for a five-second rush with a three-second recharge.
- **E:** deliver, use a roadside garage, or recover a rolled/stuck truck. Recovery costs time and cargo condition and has an eight-second cooldown.
- **M:** route map. **C:** camera. **Escape:** pause. **R:** retry.
- Qualified close passes and clean ramp landings build a combo up to **×5**. Four clean seconds bank it. Crashes lose pending points; banked points survive and add delivery/run cash at **20 points per $1**.

Traffic, optional ramps, breakable cargo, roadblocks and changing weather are spaced along the existing road network. Touch controls appear on devices with a coarse pointer. Campaign, garage purchases, fleet upgrades and delivery progression remain available.

## Develop and validate

```sh
npm ci
npm run build
npm test
```

Serve this directory through a local HTTP server to play. The committed browser runtime is generated from `src/app`; run the build after changing those chunks. Browser validation and video capture require Chromium/Playwright plus `ffmpeg` and `ffprobe`:

```sh
npm run validate:gameplay
npm run record:gameplay
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when Chromium is installed outside Playwright's normal cache. The capture harness uses the actual WebGL page, keyboard input and game audio. See the [source audit and execution outcomes](docs/gameplay-overhaul.md) and [validated outcomes and evidence](docs/gameplay-validation.md) for exact coverage, reproducibility and remaining human/hardware acceptance.

## Runtime

- `index.html` — current playable game
- `src/long-haul-core.mjs` — Long Haul configuration for Core Data packages and random streams Core Simulation meters Core Camera smoothing Core Graphics instance batches Core Transaction Ledger and Core World patch preparation
- `core-integration.html` — browser smoke page for the promoted Core child capabilities

## Ownership

NexusEngine Core owns deterministic data simulation camera descriptors graphics descriptors world lifecycle and idempotency. The Long Haul owns course truck delivery scoring and Three.js host semantics.

The browser smoke pins NexusEngine commit `b941c9b2995e3449c6987908657753e2cf2df242`.
