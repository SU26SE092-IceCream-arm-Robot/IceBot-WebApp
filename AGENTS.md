# IceBot WebApp Contribution Guide

This repository implements the internal management WebApp. It is used by
scoped internal roles; it is not a SystemAdmin-only dashboard and it must not
use kiosk-customer, provider-webhook, or Edge transport APIs as management UI
surfaces.

## Contract Entry Point

Before creating or changing a feature, read the smallest applicable contract
set in the shared sibling repository `../IceBot-Product/`:

1. `delivery/playbooks/ROLE_IMPLEMENTATION_CONTRACT.md`
2. `delivery/targets/icebot-webapp/CONTRACT.yaml`
3. The requested `FLOW-*` entry in `delivery/catalogs/FLOW_CATALOG.yaml`
4. The linked product journey and backend flow
5. `delivery/catalogs/OPERATION_CATALOG.json` only for exact route/policy lookup
6. `delivery/changes/CONTRACT_CHANGES.yaml` and
   `delivery/targets/icebot-webapp/STATUS.yaml`
   for newly changed or unverified work

Use the packet command from `IceBot-Tools` when the task is not already
specific:

```powershell
python ..\IceBot-Tools\docs-ops\commands\prepare_implementation_packet.py `
  --target IceBot-WebApp
```

## Requests That Propose A Solution

When someone asks for a particular API, field, entity, event, or dashboard,
do not turn the request directly into WebApp work. First read
`../IceBot-Product/delivery/playbooks/REQUEST_TRIAGE.md` and
return the operating goal, actor, scope, current flow, and whether a real
contract gap exists. A missing route in a catalog is not proof that a new route
or UI feature should be created.

## Required Implementation Evidence

For every assigned `CAP-*`, inspect and report evidence for:

- correct actor and tenant scope;
- route/screen and read/mutation integration;
- lifecycle, loading, empty, permission-denied, and named failure states;
- current backend contract rather than a mock or guessed endpoint;
- test or manually reproducible acceptance evidence.

Do not mark a capability complete because a page, type, mock, or service exists.
Update shared status only with path/symbol/test evidence and precise remaining
work. Acknowledging a contract change means reviewed, not implemented.

## Local Rules

- Keep management reads scoped to the active authorized organization/store/kiosk.
- Do not flatten `SystemAdmin`, `OrgAdmin`, `Manager`, `Staff`, and `Technician`
  into one generic "admin" behavior.
- Do not introduce backend behavior, routes, or product decisions in this
  repository. Report missing contracts as blockers.
- Keep `.project-memory/` local; shared capability status lives in
  `IceBot-Product/delivery/targets/`.
