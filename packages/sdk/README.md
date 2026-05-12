# @agent-passport/sdk

TypeScript SDK for Agent Passport.

Agent Passport is the connection passport for AI apps.

This package is currently a scaffold. The intended API is:

```ts
import { AgentPassport } from "@agent-passport/sdk";

const passport = new AgentPassport({
  apiKey: process.env.AGENT_PASSPORT_API_KEY,
});

const session = await passport.sessions.create({
  userId: "user_123",
  requestedProfile: "sales-ops",
  requiredApps: ["gmail", "calendar", "slack"],
  redirectUrl: "https://app.example.com/passport/complete",
});
```

The first implementation should support mock sessions and flat provider-aware access objects before real provider adapters.
