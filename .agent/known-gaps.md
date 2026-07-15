# Known gaps

## Motion preference semantics

- `settings.motion` is an unversioned browser boolean.
- The UI promise `Camera movement` / `Road shake and body motion` has no authoritative effect registry.
- Full, Reduced, and Static profiles are not defined.
- No system `prefers-reduced-motion` adapter exists.
- No migration or rejection result exists for malformed persisted values.

## Partial effect adoption

- Rough-road suspension oscillation reads `settings.motion`.
- Rough-road camera bob reads `settings.motion`.
- Steering-driven truck roll does not read it.
- Throttle and brake suspension pitch do not read it.
- Cargo-crate sway does not read it.
- Speed-driven camera FOV does not read it.
- Camera transform interpolation does not cite a motion profile.

## Persistence and results

- Storage writes silently ignore failure.
- No settings-document revision exists.
- No `MotionPreferenceResult` distinguishes accepted, partial, rejected, or failed adoption.
- No participant receipts identify which effects adopted the preference.
- No restore result proves the profile was accepted before first frame.

## Presentation coherence

- Frames do not cite a motion-preference revision.
- No per-effect execution receipt exists.
- No `FirstMotionPreferenceFrameAck` exists.
- No browser transform or pixel fixture covers full versus reduced motion.
- No source-to-Pages motion parity proof exists.

## Validation

- No package manifest or executable test command exists.
- No browser settings fixture exists.
- No reload-persistence fixture exists.
- No malformed-document fixture exists.
- No motion-effect matrix fixture exists.
- No built artifact or Pages fixture exists.

## Retained gaps

The earlier pause-suspension, delivery terminal-settlement, and course-generation admission gaps remain valid in their timestamped audit families.