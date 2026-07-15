# Architecture audit: browser audio lifecycle DSK map

**Timestamp:** `2026-07-15T09-40-51-04-00`

## Plan ledger

**Goal:** separate semantic audio intent from browser resource ownership and make lifecycle transitions explicit, versioned and independently testable.

- [x] Preserve gameplay, scene, simulation and presentation ownership.
- [x] Preserve the existing WebAudio adapter as a browser host surface.
- [x] Identify missing command, policy, generation, settlement and retirement services.
- [ ] Implement the authority below.

## Existing ownership

```txt
Core Scene / Core Simulation
  -> determine driving, paused and terminal state

host event handlers
  -> unlock audio
  -> toggle sound preference
  -> request pause on blur

RAF host
  -> calculate driving activity
  -> schedule engine and wind gains

WebAudio adapter
  -> own AudioContext, master gain, engine oscillator, wind source and transient cue nodes
```

## Gap

The browser adapter owns long-lived audio resources, but no domain binds those resources to document visibility, route identity, run identity, preference revision or retirement. Host-local calls provide no typed lifecycle result or exactly-once disposal receipt.

## Proposed parent domain

```txt
the-long-haul-browser-audio-lifecycle-suspension-retirement-authority-domain
```

## Planned surfaces

```txt
audio-session-command-kit
audio-context-generation-kit
audio-unlock-admission-kit
audio-route-policy-kit
audio-visibility-lifecycle-kit
audio-loop-ownership-kit
audio-cue-admission-kit
audio-gain-settlement-kit
audio-suspension-result-kit
audio-resume-result-kit
audio-retirement-kit
audio-source-disposal-receipt-kit
audio-preference-adoption-kit
first-silent-audio-ack-kit
first-resumed-audible-frame-ack-kit
browser-audio-lifecycle-fixture-kit
source-pages-audio-parity-kit
audio-diagnostics-adapter-kit
```

## Contract boundary

Nexus Engine domains publish semantic run, route, pause and cue results. The browser adapter alone creates WebAudio nodes. The proposed authority coordinates admission and lifecycle without making WebAudio a core engine dependency.