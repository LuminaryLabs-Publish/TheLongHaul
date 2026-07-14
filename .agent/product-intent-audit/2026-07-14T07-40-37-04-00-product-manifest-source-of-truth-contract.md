# Product-intent audit: product manifest source-of-truth contract

## Finding

`TheLongHaul` has a product name but no checked-in product contract. External prompts, discussions, and plans may describe a driving or delivery game, but none of that is repository truth until source-controlled.

## Required manifest

Recommended file:

```txt
product.manifest.json
```

Required fields:

```txt
schemaVersion
productId
title
status
supportedRoutes
supportedPlatforms
playerFacingLoop
stateMachine
commands
terminalOutcomes
completionCondition
explicitNonGoals
nexusEngineRevision
expectedProviderExports
intendedDomains
entryPoints
validationCommands
artifactPolicy
deploymentPolicy
```

## Admission contract

```txt
ProductIntentAdmissionCommand
  -> read the manifest from the reviewed repository revision
  -> validate schema and required fields
  -> reject mutable provider references
  -> reject undeclared routes or entry points
  -> fingerprint the normalized manifest
  -> publish AcceptedIntentRevision or a typed rejection
```

## Implementation binding

Every runtime-bearing audit should record:

```txt
RepositoryRevision
AcceptedIntentRevision
ProviderRevision
DomainManifestFingerprint
KitServiceInventoryFingerprint
InteractionContractFingerprint
ValidationManifestFingerprint
```

## Drift classifications

```txt
IntentAheadOfImplementation
ImplementationAheadOfIntent
IntentAndImplementationAligned
DocumentationOnly
StaleAudit
```

## Guardrail

The manifest should remain small. It is an admission boundary, not a speculative design encyclopedia. Planned systems must not appear in the implemented kit census until callable source and proof exist.