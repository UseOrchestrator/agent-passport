# Agent Passport

The connection passport for AI apps.

Website: https://passport.orchestrator.so  
Repository: https://github.com/UseOrchestrator/agent-passport

Agent Passport lets users create reusable sets of app connections, then bring the right set into the AI products and agent workflows that need them.

Users should not have to reconnect Gmail, Slack, Calendar, Notion, GitHub, Linear, and the same ten work apps every time they try a new AI product. Builders should not have to rebuild connection setup, scope management, provider handoff, and access revocation from scratch.

Agent Passport is the shared layer between those two needs.

## Technical Model

Agent Passport should start as the passport, consent, and provider-handoff layer.

It should not start as the service that executes every Gmail, Slack, Notion, or GitHub tool call.

The core flow is:

```text
Access Request -> user approval -> Access Grant -> provider handoff
```

Read the full model:

[docs/technical-model.md](docs/technical-model.md)

## Why This Exists

Useful AI apps need access to the user's work.

That usually means the user has to connect multiple apps before the product can do anything useful:

- Gmail
- Google Calendar
- Slack
- Notion
- GitHub
- Linear
- HubSpot
- Salesforce
- Drive
- whatever else the workflow needs

Today, every AI app asks the user to do this again.

That creates two problems.

For users:

- they reconnect the same apps repeatedly
- they lose track of which AI products can access what
- they cannot easily reuse a trusted setup
- they have no simple place to review and revoke access across AI apps

For builders:

- activation gets blocked by connection setup
- app access is tied too tightly to one provider flow
- each workflow needs different scopes, apps, and permissions
- teams have to build their own connection profile UX
- provider lock-in becomes part of the product surface

Agent Passport is meant to become the standard connection passport for AI apps.

## What It Is

Agent Passport is not "magic token portability."

OAuth tokens are usually tied to the OAuth client, app, or provider that created them. Agent Passport does not pretend raw credentials can freely move between systems.

Instead, Agent Passport gives users a portable connection layer:

- a user account
- connected apps
- provider-aware connection records
- reusable passport profiles
- scoped app/tool sets
- approval and revocation
- a developer-facing SDK/API

The user gets a reusable connection passport.

The developer gets a clean way to ask:

> What app access does this user want to grant to this agent workflow?

## Core Concepts

### Passport

A user's overall connection passport.

This is the top-level account that knows which apps the user has connected and which provider owns each connection.

Example:

```text
User: alex@company.com
Passport:
  Gmail via Composio
  Slack via Composio
  GitHub via Nango
  Linear via Arcade
  Notion via custom OAuth
```

### Connection

A provider-backed app connection.

Agent Passport should know:

- app name
- provider
- provider connection ID
- available scopes
- connection status
- last verified time

Agent Passport should not need to hold raw OAuth tokens in the provider-agnostic path.

### Profile

A reusable set of connections for a purpose.

Examples:

- Work
- Sales Ops
- Recruiting
- Client A
- Engineering
- Personal

Profiles are what make this more than "connect once."

A user may have one passport but many profiles.

### Connection Set

The actual set of apps and permissions inside a profile.

Example:

```text
Sales Ops profile:
  Gmail: read/send
  Google Calendar: read/create events
  Slack: read channels/send messages
  HubSpot: read/update contacts
```

### Provider

The credential/tool layer that actually owns a connection.

Examples:

- Composio
- Nango
- Arcade
- Pipedream
- Apideck
- Merge
- custom OAuth

Agent Passport should flatten the developer experience without erasing the provider reality.

Each connection still knows where it came from.

### Tool Or App Surface

Developers may think in apps.

Agents may think in tools.

Agent Passport should support both views:

- apps: Gmail, Slack, Notion
- tool sets: send email, read calendar, create ticket
- profiles: Sales Ops, Recruiting, Engineering

The first version should start with apps and profiles, then expose tool metadata where providers make it available.

## How It Works

```text
1. User creates an Agent Passport account
2. User connects apps through one or more providers
3. Agent Passport records which provider owns each connection
4. Agent Passport recommends or lets the user create profiles
5. An AI app requests access to a profile or connection set
6. User approves the request
7. Developer receives a flat, provider-aware access object
8. The agent can start with the right apps and tools
```

## What Developers Get

Agent Passport should make this simple:

```ts
const session = await passport.sessions.create({
  userId: "user_123",
  requestedProfile: "sales-ops",
  requiredApps: ["gmail", "calendar", "slack"],
  redirectUrl: "https://app.example.com/passport/complete",
});
```

Then after approval:

```ts
const access = await passport.access.get({
  userId: "user_123",
  profileId: "sales-ops",
});
```

The response should be flat enough to use:

```json
{
  "profile": "sales-ops",
  "connections": [
    {
      "app": "gmail",
      "provider": "composio",
      "providerConnectionId": "conn_abc",
      "scopes": ["email.read", "email.send"],
      "status": "ready"
    },
    {
      "app": "slack",
      "provider": "nango",
      "providerConnectionId": "conn_xyz",
      "scopes": ["channels.read", "messages.write"],
      "status": "ready"
    }
  ]
}
```

The developer should not have to care which provider created every connection unless they need to route execution.

## What Users Get

Users get one place to manage the app access they bring into AI products.

They can:

- connect apps once
- group connections into profiles
- approve the right profile for the right workflow
- see which AI apps have access
- revoke access later
- reuse trusted profiles across supported products

## Open Source Direction

Agent Passport should be open source if the market confirms that this problem matters.

The reason is simple:

This only works if it can become a standard.

AI products, provider platforms, and users all need to trust the connection passport layer. Open source makes the system easier to inspect, extend, and adopt.

The commercial path can still exist around:

- hosted passport accounts
- managed provider routing
- team controls
- audit logs
- enterprise policy
- hosted MCP/API gateway
- premium provider adapters

But the standard should be open enough that builders can adopt it without asking permission.

## Agent-First Contributions

Agent Passport should use an agent-first contribution model.

Bring the idea; let your coding agent make the PR.

Small fixes, examples, adapters, docs, and demos should move quickly.

This fits the project:

> Built for agents. Contributed to by agents.

See [AGENT_CONTRIBUTIONS.md](AGENT_CONTRIBUTIONS.md).

## First Prototype

The first real prototype should be small.

It should prove:

- a user can create a passport account
- a user can connect apps through at least one provider
- a user can create multiple profiles
- a developer can request a profile from their app
- the user can approve the request
- the developer receives a flat, provider-aware access object

Non-goals for the first prototype:

- full enterprise policy
- every provider
- every app
- full MCP gateway
- complex billing
- perfect provider failover

## Current Repository Shape

```text
agent-passport/
  apps/
    web/                  validation page and future app surface
  supabase/
    migrations/           temporary validation database schema
  reference/
    claude-package/       imported prototype/reference material
  IMPLEMENTATION_NOTES.md
  README.md
```

This folder is intentionally isolated from the existing Orchestrator `web`, `backend`, and `marketing` folders.

Agent Passport may be by Orchestrator, but it should not pollute the main Orchestrator app code.

## Current Status

Agent Passport is currently in validation mode.

Live page:

```text
https://passport.orchestrator.so
```

Current goal:

- explain the idea clearly
- collect interested builders, users, and contributors
- identify whether startups would actually support a connection passport
- find the first partner workflow worth prototyping

Current storage:

- waitlist submissions use a temporary isolated table in the existing Orchestrator dev/e2e Supabase project
- this is only for validation
- production Agent Passport auth, hosted accounts, provider metadata, and app-access state need a dedicated database/project later

## One-Line Pitch

Agent Passport is the connection passport for AI apps.

## Longer Pitch

Agent Passport lets users bring reusable sets of app connections into AI products, so agents can start with the right tools and permissions instead of forcing users through another connection setup wall.

Builders keep their provider stack. Users get portable connection profiles. AI apps get a cleaner access layer.
