# @agent-passport/sdk

TypeScript SDK for Agent Passport.

Agent Passport is the connection passport for AI apps.

Agent Passport does not execute tools in the v0 model. It creates access requests, receives user approval, and returns provider-aware access grants.

```ts
import { AgentPassport } from "@agent-passport/sdk";

const passport = new AgentPassport({
  apiKey: process.env.AGENT_PASSPORT_API_KEY,
});

const request = await passport.accessRequests.create({
  externalUserId: "user_123",
  requestedApps: ["gmail", "calendar", "slack"],
  purpose: "Draft customer follow-up emails",
  redirectUrl: "https://app.example.com/passport/complete",
  providerPreference: "composio",
});

console.log(request.approvalUrl);

const grant = await passport.accessRequests.getGrant(request.id);

console.log(grant.connections);
```

The current implementation is mock-backed. The stable contract is:

```text
Access Request -> user approval -> Access Grant -> provider handoff
```

See [../../docs/technical-model.md](../../docs/technical-model.md).

The public/API naming is still under evaluation. `accessRequests` is a technical placeholder until the agent harness proves the right developer language.
