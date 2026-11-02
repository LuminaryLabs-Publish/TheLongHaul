# The Long Haul

A deterministic browser truck-delivery game built with NexusEngine and Three.js.

## Play

Choose **Campaign** for geographic highway deliveries or **Endless** for one continuous freight journey. Each run begins with a short, skippable camera introduction in the actual game world.

In Endless, start empty and drive through a marked loading gate. Take the wide left-hand route or the shorter, narrower express route for a qualified combo bonus. Bring the load through the blue receiver, collect payment and keep driving toward the next contract. A missed pickup moves ahead; a destroyed or expired load produces replacement freight without ending the journey. Truck destruction remains a terminal failure.

Standard, fragile, heavy, hazardous and unstable freight change the truck's actual mass, acceleration, braking, suspension and load behavior. The HUD shows the current load, mass, deadline, condition and next gate. Deliveries include modest fuel and repair service; roadside garages offer paid servicing and existing upgrades. **Resume haul** restores a saved continuous journey, with atomic payment receipts preventing duplicate payouts.

- **WASD / arrow keys:** drive; **S / Down** brakes, then reverses. **Shift:** drift. Brake into a turn, build a slide, then countersteer to redirect the truck. A full stop loses stored momentum.
- **Space:** held boost. Double-tap **W / Up** for a five-second rush with a three-second recharge. **X:** handbrake.
- **Q / E:** two distinct equipped abilities. Mini Trucks clear breakable obstacles; Road Shield absorbs impacts; Shockwave can be discovered through progression.
- **U:** skills and abilities. Driving maneuvers earn XP and skill points separately from cash. Choose among three rotating stat, modifier and ability upgrades; each tier remains independent. Skills, map and garage menus freeze simulation, including cargo deadlines and cooldowns.
- **F:** use a roadside garage or recover a rolled/stuck truck; Campaign retains its stopped delivery interaction. Endless loads and delivers while moving. Recovery costs time and cargo condition and has an eight-second cooldown.
- **M:** route map. **C:** camera. **Escape:** pause. **R:** retry.
- Qualified close passes, clean ramp landings and clean express routes build a combo up to **×5**. Four clean seconds bank it. Crashes lose pending points; banked points survive and add cash at **20 points per $1**. A missed pickup may offer one timed express-route chance to rescue an active multiplier.

Collect focus, boost, ability-power and repair pickups. Repairs restore 12 hull and straighten steering; they do not restore cargo. Impact damage can pull steering to one side. Countersteer, find a repair pickup, or stop and press **F** for a time-costing roadside repair. Tire, exhaust, suspension, bodywork and equipped-power geometry reflect your upgrades.

Traffic, optional ramps, breakable cargo, roadblocks and changing weather are paced along a deterministic rolling highway. Loading forks have protected approaches; heavier loads receive more warning and traffic spacing. Road geometry, live hosts and contact history are bounded as the journey advances. Touch controls appear on devices with a coarse pointer. Campaign, garage purchases, fleet upgrades and delivery progression remain available. Hawaii uses an explicit free ship transfer and a separate Maui road haul; shipping never awards delivery pay.

## Develop and validate

```sh
npm ci
npm run build
npm test
```

Serve this directory through a local HTTP server to play. The committed browser runtime is generated from `src/app`; run the build after changing those chunks. Browser validation and video capture require Chromium/Playwright plus `ffmpeg` and `ffprobe`:

```sh
npm run validate:gameplay
npm run validate:skills
npm run record:freight
npm run record:skills
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when Chromium is installed outside Playwright's normal cache. The freight capture harness drives the actual WebGL page with keyboard input and captures each rendered frame at a fixed simulation timestep. It produces an edited 60-second, 30-fps video with matching original game audio and a retained uninterrupted input/state trace. This is reproducible presentation evidence, not a native hardware frame-rate claim. `node tools/record-freight-gameplay.mjs --journey-only=true` runs the continuous journey gate without recording every output frame.

See [skills, drift and abilities](docs/skills-and-abilities.md), [skill-system validation](docs/skills-validation.md), the [continuous freight audit and outcomes](docs/continuous-freight.md), [continuous freight validation](docs/continuous-freight-validation.md), and the [preceding gameplay overhaul evidence](docs/gameplay-validation.md) for exact coverage and remaining human/hardware acceptance. The separate final-art initiative is LUM-000162.

## Runtime

- `index.html` — current playable game
- `src/long-haul-core.mjs` — Long Haul configuration for Core Data packages and random streams Core Simulation meters Core Camera smoothing Core Graphics instance batches Core Transaction Ledger and Core World patch preparation
- `core-integration.html` — browser smoke page for the promoted Core child capabilities

## Ownership

NexusEngine Core owns deterministic data simulation camera descriptors graphics descriptors world lifecycle and idempotency. The Long Haul owns course truck delivery scoring and Three.js host semantics.

The browser smoke pins NexusEngine commit `b941c9b2995e3449c6987908657753e2cf2df242`.
