# Next steps

## Plan ledger

**Goal:** move `TheLongHaul` from an empty named repository to the smallest truthful, testable Nexus Engine game skeleton without inventing broad systems before ownership is defined.

- [ ] Add `product.manifest.json` with title, product status, supported route, player-facing loop and explicit non-goals.
- [ ] Add an executable browser entry point and one startup failure surface.
- [ ] Pin Nexus Engine to an immutable commit or package version.
- [ ] Declare the installed domain and kit manifest before host code calls their services.
- [ ] Define one minimal state machine such as `Boot -> Menu -> Run -> Result`.
- [ ] Define command inputs and typed results for the first interaction.
- [ ] Keep Three.js, DOM, audio and storage as adapters around engine truth.
- [ ] Add deterministic headless validation for the state machine.
- [ ] Add a browser smoke proving one successful boot and one visible frame if rendering is introduced.
- [ ] Add a static build and deployment workflow only after source validation passes.
- [ ] Update `.agent/kit-registry.json` from zero only when source-backed kits actually exist.
- [ ] Add a new timestamped tracker for every implementation audit.

## Recommended first composition

Do not predeclare a large game architecture. Start with only the neutral capabilities required by the first executable loop:

```txt
Core Startup
Core Scene
Core Input
Core Simulation
Core Presentation only if a visual surface exists
one product run domain
one thin browser host
```

Every additional kit should have a named caller, owned state, command/result contract and validation fixture.
