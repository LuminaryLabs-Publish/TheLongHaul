# Architecture audit: product-intent implementation admission DSK map

## Current architecture

```txt
Git repository
  -> README.md
  -> .agent governance
```

There is no executable host, engine composition, runtime domain, adapter, or proof graph.

## Current DSK and domain breakdown

```txt
runtime domains: 0
source-backed DSKs: 0
source-backed kits: 0
source-backed adapters: 0
runtime services: 0
capability tokens: 0
```

Repository and audit governance are documentation concerns, not runtime Domain Service Kits.

## Required parent domain

```txt
the-long-haul-product-intent-implementation-admission-authority-domain
```

## Planned hierarchy

```txt
the-long-haul-product-intent-implementation-admission-authority-domain
  product-intent-manifest-kit
  intent-schema-validation-kit
  intent-revision-fingerprint-kit
  repository-revision-kit
  provider-identity-kit
  entry-point-manifest-kit
  domain-composition-manifest-kit
  kit-service-inventory-kit
  interaction-loop-contract-kit
  command-result-contract-kit
  validation-command-manifest-kit
  artifact-policy-kit
  deployment-policy-kit
  implementation-classification-kit
  implementation-admission-result-kit
```

## Planned service boundaries

| Surface | Service |
|---|---|
| `product-intent-manifest-kit` | Product status, route, loop, outcomes, platform, scope, and non-goals. |
| `intent-schema-validation-kit` | Required fields, types, compatibility, and rejection reasons. |
| `intent-revision-fingerprint-kit` | Immutable accepted intent identity. |
| `repository-revision-kit` | Source identity and stale-audit rejection. |
| `provider-identity-kit` | Immutable Nexus Engine identity and expected exports. |
| `entry-point-manifest-kit` | Executable routes, hosts, workers, and startup ownership. |
| `domain-composition-manifest-kit` | Domain hierarchy, state ownership, requires, and provides. |
| `kit-service-inventory-kit` | Complete source-backed kit, adapter, and service census. |
| `interaction-loop-contract-kit` | States, commands, results, outcomes, retry, and shutdown. |
| `command-result-contract-kit` | Typed admission and terminal results. |
| `validation-command-manifest-kit` | Source, headless, browser, build, and artifact proof commands. |
| `artifact-policy-kit` | Build root, immutable artifact identity, and source parity. |
| `deployment-policy-kit` | Branch, host, route, and release evidence. |
| `implementation-classification-kit` | DocumentationOnly, Incomplete, Implemented, Stale, or Rejected. |
| `implementation-admission-result-kit` | One terminal admission result and evidence manifest. |

## Admission rule

No planned surface is counted as implemented until concrete source, callable behavior, ownership, and validation evidence exist. The first runtime commit must cite an accepted product-intent revision rather than infer architecture from the repository name.