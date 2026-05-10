# Passport SDK Specification

**Version**: 0.1 (proposal, pre-implementation)
**Date**: 2026-05-09
**Status**: Design grounded in live provider docs. Implementation pending.

---

## 1. What the SDK abstracts

Five credential providers — Composio, Arcade, Pipedream, Nango, Zapier — each have their own primitive vocabulary for the same fundamental operations. The SDK collapses them into one consistent surface.

| Operation | Composio | Arcade | Pipedream | Nango | Zapier | **Passport** |
|---|---|---|---|---|---|---|
| Identify the end user | `entity_id` | `user_id` | `external_user_id` | `connection_id` | (server URL = creds) | **`userId`** |
| Identify the app | `toolkit` | `tool_name` prefix | `app_slug` | `integration_id` | enabled action | **`app`** |
| Start auth flow | `initiate_connection` | `tools.authorize` | Connect Token | `nango.openConnectUI` | server enable | **`sessions.create`** |
| Execute an action | `execute` | `tools.execute` | proxy / MCP | proxy / action | MCP tool | **`execute`** |
| Get an MCP URL | `mcp.composio.dev/...` | engine.arcade.dev | `remote.mcp.pipedream.net` | MCP server | `mcp.zapier.com` | **`mcp.url(...)`** |
| Where credentials live | Composio project | Arcade engine | Pipedream project | Nango env | Zapier MCP server | **with the provider, never with us** |

The SDK does not hold tokens. It stores the routing tuple `(passport_id, app, provider, providerUserId, connectedAccountId, scopes)` and dispatches.

---

## 2. Mental model

```
┌─────────────────────────────────────────────────────────────┐
│                       Your AI App                            │
│  uses the SDK to: create sessions, request consent,          │
│  get MCP URLs, or execute tools directly                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Passport Control Plane                          │
│  • Passport identity (the end user's account)                │
│  • Connections (one per (passport, app))                     │
│  • Profiles (named groups of connections)                       │
│  • Approvals (which AI apps can use which profiles)              │
│  • Policy (per-action approval rules)                        │
│  • Audit (every tool call, every consent change)             │
│  • Routing (which provider holds each credential)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Provider Adapter Layer                            │
│   Composio · Arcade · Pipedream · Nango · Zapier            │
│   (each adapter speaks the provider's native API)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                Gmail · Slack · Notion · GitHub · …
```

Three rules the SDK enforces at every boundary:

1. **Raw tokens never cross into Passport.** The provider holds them. We hold the routing.
2. **Every action carries a `userId`, an `app`, and a `passportId`.** No anonymous calls.
3. **Every action is recorded.** The audit log is part of the contract, not a feature.

---

## 3. Server SDK — TypeScript / Node

### 3.1 Install & initialize

```bash
npm install @orchestrator/passport
```

```typescript
import { Passport } from '@orchestrator/passport';

const passport = new Passport({
  appKey: process.env.PASSPORT_APP_KEY!,         // your AI product's key
  // Optional: if you bring your own provider account
  providers: {
    composio: { apiKey: process.env.COMPOSIO_API_KEY },
    pipedream: {
      clientId: process.env.PIPEDREAM_CLIENT_ID,
      clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
      projectId: process.env.PIPEDREAM_PROJECT_ID,
    },
    // arcade, nango, zapier ...
  },
});
```

If you don't pass `providers`, Passport routes through its hosted provider accounts (Model 1 from the strategy doc). If you do, Passport routes through yours (Model 2). The SDK surface is identical either way.

---

### 3.2 Sessions — onboarding a new user

A session is a short-lived token that lets a frontend launch the Connect UI. It carries the request: which user, which Profile or scopes, where to redirect after.

```typescript
const session = await passport.sessions.create({
  userId: 'user_abc',                 // your DB id for the end user
  profile: 'work',               // request a named Profile
  // OR explicit scopes:
  // scopes: ['gmail.read', 'gmail.send', 'calendar.read'],
  redirectUrl: 'https://yourapp.com/onboarding/complete',
  metadata: {                          // optional, surfaces in webhooks/audit
    plan: 'pro',
    source: 'signup',
  },
});

// session.token       — pass to frontend
// session.expiresAt   — typically 30 minutes
// session.passportId  — null if user has no existing passport, set if linking
```

**Behavior on the user side:**

- If the user already has a Passport: they sign in, see "Allow Acme AI to use your Work profile?", click yes.
- If they don't: they create one in the same flow. Their connections, scopes, and the new approval all land at the end.

This mirrors Pipedream's `createConnectToken` and Composio's `session.authorize()` — both of which return a short-lived token + URL pair. We unify them.

---

### 3.3 Listing connections

```typescript
const connections = await passport.connections.list({
  userId: 'user_abc',
});

// Returns:
// [
//   {
//     id: 'conn_2x4f',
//     app: 'gmail',
//     account: 'alice@company.com',
//     status: 'active',           // active | expired | idle | revoked
//     scopes: ['gmail.read', 'gmail.send'],
//     provider: 'composio',       // which provider holds the token
//     connectedAt: '2026-04-12T14:22:00Z',
//     lastUsedAt: '2026-05-09T11:43:22Z',
//   },
//   ...
// ]
```

The `provider` field is informational only — your code never branches on it. Routing is internal.

---

### 3.4 Executing a tool action

The simplest path: ask Passport to execute a normalized action. Passport routes to whichever provider holds the credential.

```typescript
const result = await passport.execute({
  userId: 'user_abc',
  tool: 'gmail.send_email',
  input: {
    to: 'colleague@company.com',
    subject: 'Q2 deck draft',
    body: 'Sharing the latest cut — feedback by Friday.',
  },
});

// result.ok          — boolean
// result.data        — provider response, normalized
// result.toolCallId  — for audit trace
// result.provider    — which provider executed (informational)
```

Tool names are normalized: `gmail.send_email` works whether the underlying provider is Composio (`GMAIL_SEND_EMAIL`), Arcade (`Gmail.SendEmail`), Pipedream (`gmail-send-email`), or Nango (custom function). The SDK maintains a tool catalog mapping per adapter.

If a required scope is missing, the call returns:

```typescript
{
  ok: false,
  error: 'consent_required',
  consent: {
    url: 'https://passport.orchestrator.so/consent/...',
    scopesNeeded: ['gmail.send'],
  }
}
```

— mirroring how Arcade's `tools.authorize()` returns a URL when the user hasn't yet granted access.

---

### 3.5 MCP gateway

When you'd rather hand the model a list of tools and let it choose:

```typescript
const mcpUrl = passport.mcp.url({
  userId: 'user_abc',
  profile: 'work',           // or apps: ['gmail', 'calendar']
  ttl: 3600,                       // seconds; URL is signed, time-bounded
});

// e.g. https://mcp.passport.so/v1/u/pp_27a4_b9c1f/s/work?token=...
```

Plug it into any MCP client:

```typescript
// Anthropic
await anthropic.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 2048,
  mcp_servers: [{ url: mcpUrl, name: 'passport' }],
  messages: [{ role: 'user', content: 'Summarize today\'s meetings.' }],
});

// OpenAI
await openai.responses.create({
  model: 'gpt-4.1',
  tools: [{ type: 'mcp', server_label: 'passport', server_url: mcpUrl }],
  input: 'Summarize today\'s meetings.',
});

// Cursor / Claude Desktop / VS Code MCP — paste the URL into config
```

Internally, this URL hits Passport's MCP gateway, which:

1. Verifies the signed token, resolves `(passportId, profile)`.
2. Reads the Profile's connections + the current user's policy.
3. For each tool the Profile permits, picks the right provider adapter.
4. Translates incoming MCP tool calls into provider-native calls.
5. Logs every call to the audit stream.

This is the same pattern Pipedream uses with `x-pd-external-user-id` + `x-pd-app-slug` headers — we just hide the provider-specific headers behind one URL.

---

### 3.6 Profiles

```typescript
// Create
await passport.profiles.create({
  userId: 'user_abc',
  name: 'work',
  displayName: 'Work',
  description: 'My day-to-day tools.',
  apps: ['gmail', 'calendar', 'slack', 'notion', 'linear'],
});

// Update
await passport.profiles.update('work', {
  apps: ['gmail', 'calendar', 'slack', 'notion', 'linear', 'github'],
});

// Delete
await passport.profiles.delete('work');
```

A Profile is just a named pointer into the user's connections. It doesn't own credentials. Approving a Profile for an AI product is what creates the actual permission grant.

---

### 3.7 Revocation

```typescript
// Revoke one connection (cuts off all products that used it)
await passport.connections.revoke({ userId: 'user_abc', connectionId: 'conn_2x4f' });

// Revoke an AI product's access to your Passport
await passport.products.revoke({ userId: 'user_abc', productId: 'prod_orchestrator' });

// Nuclear: revoke everything
await passport.revokeAll({ userId: 'user_abc' });
```

Each call:
1. Calls the underlying provider's revoke (`composio.connections.delete`, `pipedream.deleteAccount`, etc).
2. Clears Passport's routing entry.
3. Emits `passport.revoked` webhook.
4. Records the revocation in audit.

---

### 3.8 Cached connection metadata

A common failure mode: a provider is slow or briefly down, the SDK hangs waiting for a connection lookup, the AI app's UI freezes. This is the wrong default.

```typescript
// Default: cached metadata, fast
const conns = await passport.connections.list({ userId: 'user_abc' });

// Force-refresh: hits the underlying provider
const conns = await passport.connections.list({ userId: 'user_abc', fresh: true });
```

The SDK caches `(connectionId, app, provider, account, scopes, status)` for every connection. Cache writes happen on connection lifecycle events (`active`, `expired`, `revoked`) and on every successful execution. Reads return cached state by default; UI flows can render immediately and reconcile in the background.

Important rule: **the SDK never silently pretends an action is available if execution is broken.** If a connection's last executed call failed with an auth error, the cached `status` flips to `degraded` and `passport.execute()` surfaces it before attempting. Better to fail loudly than fail silently.

---

### 3.9 Health & status surfacing

When something breaks, the question is always "where?" The SDK exposes a `health()` call that returns provider-, app-, and connection-level status — so your AI app can render an honest "Gmail is degraded right now" instead of a mystery error.

```typescript
const health = await passport.health({ userId: 'user_abc' });

// {
//   passport: 'ok',
//   providers: {
//     composio: { status: 'ok', latencyMs: 142 },
//     pipedream: { status: 'degraded', message: 'Slack execution failing' },
//     nango: { status: 'ok', latencyMs: 88 },
//   },
//   apps: {
//     gmail: { status: 'ok', via: 'composio' },
//     slack: { status: 'degraded', via: 'pipedream', since: '2026-05-09T13:42:00Z' },
//     notion: { status: 'ok', via: 'composio' },
//   }
// }
```

The status page surfaces this as well. Status assertions are first-class data — when an AI agent gets a degraded signal, it can either back off or warn the user, instead of looking confused.

---

### 3.10 Activation instrumentation

The strategy is "Passport improves your activation curve." That has to be measurable, not assumed. The SDK fires structured events into your analytics pipeline so you can prove it.

```typescript
passport.on('connect.started', ({ userId, sessionId }) => {
  analytics.track('passport_connect_started', { userId, sessionId });
});

passport.on('connect.completed', ({ userId, durationMs, appsConnected }) => {
  analytics.track('passport_connect_completed', { userId, durationMs, appsConnected });
});

passport.on('connect.abandoned', ({ userId, lastStep, durationMs }) => {
  analytics.track('passport_connect_abandoned', { userId, lastStep, durationMs });
});

passport.on('connect.reused', ({ userId, existingPassportId, appsAlreadyConnected }) => {
  // The wallet flywheel: this fires when a returning Passport user
  // skips connecting apps they'd already authorized in another product.
  analytics.track('passport_connect_reused', { userId, existingPassportId, appsAlreadyConnected });
});
```

Built-in events your dashboards should care about:

- **`connect.started`** — user clicked your Connect Passport button
- **`connect.completed`** — onboarding finished; carries `durationMs` and `appsConnected`
- **`connect.abandoned`** — user dropped off; carries `lastStep` so you can see where
- **`connect.reused`** — returning Passport user skipped at least one connection (the wallet flywheel firing)
- **`scope.escalated`** — user approved an additional scope mid-session
- **`execute.failed`** — tool call failed with reason

The case for Passport in your sales conversations is "look at the lift on `connect.completed.durationMs` and `connect.reused` over your first 90 days." Without instrumentation, the case stays abstract. Build it in.

---

## 4. Frontend SDK — React

```bash
npm install @orchestrator/passport-react
```

The single drop-in component:

```tsx
import { PassportConnect } from '@orchestrator/passport-react';

function Onboarding() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/passport/session', { method: 'POST' })
      .then(r => r.json())
      .then(d => setToken(d.token));
  }, []);

  if (!token) return <Spinner />;

  return (
    <PassportConnect
      sessionToken={token}
      theme="light"                     // light | dark | match-os
      brand={{
        name: 'Acme AI',
        logoUrl: '/logo.svg',
        accent: '#A03B2A',
      }}
      onSuccess={(passport) => {
        // passport.id, passport.userId, passport.connections
        router.push('/app');
      }}
      onError={(err) => console.error(err)}
    />
  );
}
```

The component renders inline or as a modal. It walks the user through:

1. **Sign in** to Passport (or create new).
2. **Select** which existing connections to use, or connect new ones.
3. **Confirm** the scopes the AI product is requesting.
4. **Approve** — the connection happens via the underlying provider's hosted OAuth.

White-label mode (default for paying customers) replaces the Passport brand throughout with the host product's brand. The OAuth consent screens with Google/Slack/etc. show your domain via the provider's white-labeling (Composio's "Custom Auth Configs", Nango's branded auth, Pipedream's approved client IDs).

---

## 5. MCP Gateway — URL contract

Pattern:

```
https://mcp.passport.so/v1/u/{passport_id}/s/{set_name}?token={signed_jwt}
```

Or for explicit scopes (no Profile):

```
https://mcp.passport.so/v1/u/{passport_id}/scopes?apps=gmail,calendar&token={signed_jwt}
```

The signed JWT carries:
- `aud`: which AI product can use this URL (locked to one)
- `pp`: passport id
- `profile` or `scopes`: what's permitted
- `exp`: expiry (default 1 hour, configurable up to 24h)
- `nonce`: for replay protection

**Streamable HTTP** transport per MCP spec. SSE supported as fallback. Tools dynamically loaded based on the Profile/scopes.

This URL is rotation-friendly: the Passport dashboard exposes a "Rotate" action that invalidates all outstanding JWTs for a `(passport, product)` pair without breaking the session.

---

## 6. Webhooks

Configure a webhook URL in your AI product's Passport settings. We POST signed JSON for these events:

| Event | When |
|---|---|
| `passport.created` | A new user finished onboarding from your app |
| `passport.linked` | An existing user linked their Passport to your app |
| `connection.active` | A new connection went live |
| `connection.expired` | Token refresh failed past retry budget |
| `connection.revoked` | User revoked a connection |
| `product.approved` | User approved your product for a Profile |
| `product.revoked` | User revoked your product |
| `tool.executed` | A tool fired (optional firehose; high volume) |
| `policy.violation` | Your product attempted a blocked action |

Payload shape:

```json
{
  "type": "connection.expired",
  "id": "evt_8f4c...",
  "createdAt": "2026-05-09T14:22:00Z",
  "passportId": "pp_27a4_b9c1f",
  "userId": "user_abc",
  "data": {
    "connectionId": "conn_2x4f",
    "app": "gmail",
    "reason": "refresh_token_expired",
    "lastSuccessfulRefresh": "2026-04-22T09:11:00Z"
  },
  "signature": "sha256=..."
}
```

Verify the `X-Passport-Signature` header against your webhook secret.

---

## 7. Provider Adapter interface (internal)

This is what makes provider-neutrality real. Each adapter implements:

```typescript
interface ProviderAdapter {
  name: 'composio' | 'arcade' | 'pipedream' | 'nango' | 'zapier';

  // Auth lifecycle
  initiateConnection(params: {
    userId: string;            // becomes entity_id / external_user_id / etc
    app: string;
    scopes: string[];
    redirectUrl: string;
  }): Promise<{ url: string; connectionRef: string }>;

  pollConnectionStatus(connectionRef: string): Promise<ConnectionStatus>;

  revokeConnection(connectionRef: string): Promise<void>;

  // Execution
  executeTool(params: {
    userId: string;
    app: string;
    tool: string;
    input: Record<string, any>;
  }): Promise<{ ok: boolean; data?: any; error?: string }>;

  // MCP
  mcpUrl?(params: {
    userId: string;
    apps: string[];
  }): Promise<string>;

  // Capabilities (which apps + tools this adapter can serve)
  capabilities(): Promise<{ apps: string[]; tools: ToolSchema[] }>;
}
```

The router picks an adapter per `(app, tool)` pair using:

1. **Pinned adapter** — if the connection was originally made via X, keep using X for that connection. We can't move the credential.
2. **Fallback chain** — for new connections, prefer the configured default (Composio, then Pipedream for niche apps, then Zapier for long-tail).
3. **Per-customer override** — enterprise customers can pin specific apps to specific providers (e.g. "always use Nango for Salesforce").

---

## 8. Provider mapping — concrete

What each adapter does under the hood, based on real provider docs:

### Composio adapter
- `initiateConnection`: `entity.initiate_connection({ app, redirect_url, scopes })` → returns Connect Link URL
- `pollConnectionStatus`: `toolset.get_connected_account({ id })`
- `executeTool`: `toolset.execute({ user_id: entity_id, tool, input })`
- `mcpUrl`: Composio's hosted MCP endpoint, scoped by API key + entity
- Map `userId` → `entity_id` (1:1)

### Arcade adapter
- `initiateConnection`: `client.tools.authorize({ tool_name, user_id })` → returns auth URL
- `pollConnectionStatus`: `client.auth.status({ id })`
- `executeTool`: `client.tools.execute({ tool_name, input, user_id })`
- `mcpUrl`: Arcade engine MCP server URL
- Map `userId` → `user_id` directly

### Pipedream adapter
- `initiateConnection`: `pd.createConnectToken({ external_user_id, allowed_origins })` → frontend embeds Pipedream Connect Link
- `pollConnectionStatus`: `pd.getAccount({ external_user_id, app_slug })`
- `executeTool`: `pd.actions.run({ external_user_id, app_slug, action, input })`
- `mcpUrl`: `https://remote.mcp.pipedream.net/v3` with `x-pd-external-user-id`, `x-pd-app-slug` headers wrapped
- Map `userId` → `external_user_id`

### Nango adapter
- `initiateConnection`: `nango.openConnectUI({ session_token })` → uses Nango Connect Token
- `pollConnectionStatus`: `nango.getConnection({ provider_config_key, connection_id })`
- `executeTool`: Nango proxy (`nango.proxy.post(...)`) with the right endpoint
- `mcpUrl`: Nango's MCP server (per environment)
- Map `userId` → `connection_id`

### Zapier adapter
- `initiateConnection`: redirect to `https://mcp.zapier.com/api/v1/connect` for OAuth
- `pollConnectionStatus`: validate by listing enabled actions on the user's MCP server
- `executeTool`: call the user's MCP server via SSE / Streamable HTTP
- `mcpUrl`: per-user Zapier MCP server URL
- Map `userId` → Zapier account binding

---

## 9. Python SDK — equivalent surface

```python
from passport import Passport

passport = Passport(app_key=os.environ["PASSPORT_APP_KEY"])

# Server-side
session = passport.sessions.create(
    user_id="user_abc",
    profile="work",
    redirect_url="https://yourapp.com/onboarding/complete",
)

# List
conns = passport.connections.list(user_id="user_abc")

# Execute
result = passport.execute(
    user_id="user_abc",
    tool="gmail.send_email",
    input={"to": "...", "subject": "...", "body": "..."},
)

# MCP URL
mcp_url = passport.mcp.url(user_id="user_abc", profile="work")
```

Same shape. Same names. Different language.

---

## 10. Security model — what the SDK guarantees

- **Tokens never enter Passport's process or storage.** Provider vaults hold them. Passport stores routing metadata + audit logs only.
- **Every SDK call is bound to a `userId`.** No tool execution without a user identity. No tool execution without a corresponding active connection + scope grant.
- **MCP URLs are signed, audience-locked, and time-bounded.** Stolen URLs can't be used by a different AI product, and they expire.
- **Scopes are enforced at the gateway, not at the model.** A model that hallucinates a tool call outside the granted scope gets a structured error, not silent denial.
- **Webhook payloads are HMAC-signed.** Verify before trusting.
- **Audit log is append-only and exportable.** Every consent change, every tool call, every revoke. Per-user, per-product, per-app slices.

---

## 11. What's NOT in v1

To stay honest about the first slice:

- **No first-party credential vault.** v1 routes through Composio only. Other adapters land in v2/v3.
- **No token transfer between providers.** Even in v3, this remains impossible — providers don't allow it. The architecture works around it instead.
- **No SSO / SCIM / SAML.** Enterprise auth is a v4+ concern.
- **No on-prem / self-hosted Passport.** v1 is hosted only.
- **No fine-grained per-row permissions.** Scopes are app-level. Row-level filtering is deferred.

---

## 12. Open spec — public schema

The Passport data model (Connection, Profile, Approval, AuditEntry, Policy) ships as an open JSON schema. Anyone can:

- Implement a Passport server (we run the canonical hosted one).
- Implement a Passport client SDK in any language.
- Implement a new provider adapter.

The hosted control plane is the business. The protocol is open. This is the same dynamic as MCP itself: protocol open, hosted gateways monetize.

---

## 13. The minimal pseudo-implementation

To prove the loop end-to-end with one provider, the v1 server is roughly:

```
POST /v1/sessions
  → create session row, return signed token + Connect URL

GET  /v1/connect?token=...
  → resolve session, render consent UI, on approve:
    → call composio.entity.initiate_connection(...)
    → on completion, write Connection row with {provider: 'composio', ...}
    → fire webhook: connection.active

POST /v1/execute
  → look up Connection row by (userId, app)
  → call adapter[provider].executeTool(...)
  → write AuditEntry, fire tool.executed webhook
  → return result

GET  /v1/mcp/:passportId/:setName?token=...
  → MCP server: list_tools from Profile's apps, route tool calls per Connection.provider
```

That's it. Five endpoints, one adapter, one Profile type, one consent UI. Everything else is layering on top of those primitives.

---

## Appendix — open questions worth a spec discussion

1. **Tool naming taxonomy.** `gmail.send_email` vs `email.send` vs `gmail.SendEmail`. Each provider has a different convention. We likely need a Passport-canonical tool ID with provider-specific aliases mapped underneath. Worth deciding before public SDK release.

2. **Per-action approval UX.** Some actions are read-only (low-risk), some are write (high-risk), some are destructive (delete). The Profile model gives access; the policy model (TBD) gates *which* actions inside that scope require an in-loop approval. Designing this before v1 prevents painful migration later.

3. **What an MCP "tool description" looks like.** Composio and Pipedream both inject rich tool descriptions for the LLM. We'll need to either pass through the underlying provider's descriptions or write our own canonical ones.

4. **Multi-account per app.** A user with two Gmail accounts (work + personal) needs both connectable, both nameable, both addressable in tool calls. Composio supports this via multiple `connected_account` rows under one entity. We mirror it.

5. **Connection migration.** If a user originally connected Gmail via Composio and we later want to migrate them to Nango (e.g. for self-hosting reasons), they have to re-authorize. The SDK should make that experience smooth — "Re-authorize Gmail" should not feel like starting over.

6. **The cold-start incentive for end users.** If a user creates a Passport for the first time inside Acme AI, what incentive do they have to keep using that Passport when they sign up for Beta AI later? Identity portability + audit centralization are the answer, but the UX has to surface this. Probably a "Connect your Passport from Acme" detection in Beta's onboarding.
