# Deploy audit: single-file runtime proof gate

**Timestamp:** `2026-07-14T09-03-47-04-00`

## Current deployment

```txt
push to main
  -> actions/checkout@v4
  -> actions/configure-pages@v5
  -> actions/upload-pages-artifact@v3 with path .
  -> actions/deploy-pages@v4
```

The repository publishes the entire root directly. There is no package manifest, source check, test command, build step, artifact allowlist, generated manifest, or browser smoke before deployment.

## Current proof boundary

```txt
pinned import map: present
Pages workflow: present
combined status records for implementation commit: none
syntax command: absent
unit tests: absent
headless deterministic generation tests: absent
browser startup test: absent
browser generation-failure test: absent
first admitted-frame test: absent
artifact inspection: absent
deployed route smoke: not run
```

## Required gate

```txt
source inspection
  -> parse index.html module
  -> verify pinned providers and expected exports
  -> deterministic same-seed course fixture
  -> five-branch/five-depot topology fixture
  -> valid-destination uniqueness fixture
  -> generation-unit failure injection
  -> rollback and candidate-disposal fixture
  -> real-browser startup and WebGL probe
  -> first admitted course-frame acknowledgement
  -> artifact allowlist inspection
  -> Pages route smoke
```

## Deployment policy

Do not treat successful static upload as gameplay readiness. Release evidence must bind the source revision, imported provider revisions, accepted course-generation contract, artifact fingerprint, deployed URL, and first playable frame.
