# Agent Passport

Agent Passport is a separate product surface from Orchestrator.

This folder is intentionally isolated from the existing Orchestrator `web`, `backend`, and `marketing` folders. The validation launch, future API, and future provider/backend work should live here unless there is an explicit reason to share code.

## Current Goal

Launch a validation page for:

> Agent Passport: portable app access for AI agents.

The first build is not the full credential platform. It is a market test for founder/developer demand.

## Planned Shape

```text
agent-passport/
  apps/
    web/          validation page, waitlist form, future dashboard/API
  reference/
    claude-package/   original package assets used as source material
```

## Product Boundary

Do not place Agent Passport implementation code in:

- `web/`
- `backend/`
- `marketing/`

Those are Orchestrator surfaces. Agent Passport may share the company brand, but it is not the same product codebase.

