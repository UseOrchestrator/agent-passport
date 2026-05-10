# Agent Passport — Implementation Handoff for Codex

**Audience:** Codex (and any sub-agents Codex spawns)
**Window:** Saturday 09:00 → Sunday 22:00 ET (~37 working hours, with sleep)
**Goal:** A real, working Agent Passport with a deployed landing, working Connect UI, Composio adapter live, MCP gateway operational, TypeScript SDK published to npm, and a Twitter launch post going out Sunday evening.

---

## 0. What "done" looks like by Sunday 22:00 ET

A user can:
- Land on `passport.orchestrator.so`
- Click "Get started" → arrive at quickstart docs
- Run `npm install @orchestrator/passport`
- Paste the 5-line server example, get a working session token
- Drop the React component into a Next.js page, see a real Connect UI render
- Click through the Connect UI, complete the OAuth dance for Gmail (via Composio underneath)
- See their connection in the Agent Passport dashboard
- Get an MCP URL and paste it into Claude Desktop
- Have Claude actually call `gmail.send_email` through that URL successfully
- See the action logged in their dashboard activity feed
- Revoke access in one click

Everything else is gravy. This is the loop. If this loop works end-to-end with one user, one app (Gmail), and one provider (Composio), we ship.

---

## 1. Source materials — read these first

All in the same package as this doc:

| File | Purpose | When to consult |
|---|---|---|
| `passport-landing-v2.html` | Landing page — deploy as-is for v1 | Before doing any frontend work |
| `passport-product-v2.html` | User dashboard wireframe — implement in React | Before building the dashboard |
| `demo-connect-ui.html` | Connect UI modal wireframe — implement in React | Before building the @orchestrator/passport-react package |
| `passport-sdk-v2.md` | SDK API contract — match this exactly | Before designing the SDK surface |
| `passport-launch.md` | Twitter funnel + screenshots strategy | Sunday afternoon, when prepping launch |

**Critical instruction:** When the SDK doc and this handoff disagree, the SDK doc wins for API surface. This handoff wins for tech stack and execution.

---

## 2. Critical concept: Managed OAuth vs MCP authentication

This is the confusion that's been blocking thinking. They are **two different authentication problems** at two different boundaries. They stack; they don't compete.

### Managed OAuth — about USER → THIRD-PARTY APP

**Problem:** Alice wants Acme AI to read her Gmail. How does Acme AI prove to Google that Alice approved this?

**Solution:** A credential provider (Composio, Pipedream, Nango, Arcade) runs the OAuth dance with Google, Slack, Notion, etc. and stores Alice's access tokens in their vault. The provider gives us back a reference (`entity_id`, `connection_id`, `external_user_id`) that we can use to "act as Alice" without ever holding her token.

```
Alice clicks "Connect Gmail"
   ↓
Composio sends Alice to accounts.google.com
   ↓
Alice clicks Allow
   ↓
Google redirects back with auth code → Composio
   ↓
Composio exchanges code for token → stores in their vault
   ↓
Composio gives us back: connected_account_id = "ca_2x4f"
```

After that, when our system wants to call Gmail as Alice, we ask Composio:
```
POST /tools/execute
{
  entity_id: "alice_passport_id",
  tool: "gmail.send_email",
  input: {...}
}
```

Composio looks up Alice's token from its vault, calls Gmail with it, returns the result. We never see the token.

### MCP authentication — about AI CLIENT → TOOL SERVER

**Problem:** Claude Desktop wants to use Acme AI's tools. How does Claude Desktop prove it's allowed?

**Solution:** MCP (Model Context Protocol) is the wire format for AI client → tool server communication. The client authenticates to the server using whatever the server accepts: API key, OAuth, signed URL, mTLS. It's a connection-level concern, not a user-level concern.

```
Claude Desktop reads its config:
  mcp_servers: [{
    url: "https://mcp.passport.so/v1/u/pp_27a4_b9c1f/p/work?token=..."
  }]
   ↓
Claude Desktop opens connection to that URL
   ↓
Our MCP gateway verifies the signed token (this is MCP auth)
   ↓
Resolves to: Alice's Passport, Work profile
   ↓
Claude calls a tool — say gmail.send_email
   ↓
Our gateway calls Composio (MANAGED OAUTH IN ACTION HERE)
   ↓
Composio uses Alice's stored Gmail token
   ↓
Result flows back through gateway to Claude
```

### How they layer in our system

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: AI CLIENT ↔ TOOL SERVER                             │
│ Authenticator: MCP signed URL + JWT                         │
│ Concern: "Is this client allowed to use these tools?"       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: TOOL SERVER ↔ CREDENTIAL PROVIDER                   │
│ Authenticator: Provider API key (ours, server-side)         │
│ Concern: "Is Passport allowed to ask the provider to act?"  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: CREDENTIAL PROVIDER ↔ THIRD-PARTY APP               │
│ Authenticator: User's OAuth token (held by provider)        │
│ Concern: "Does the user actually allow this action?"        │
└─────────────────────────────────────────────────────────────┘
```

Layer 1 = MCP auth.
Layer 3 = Managed OAuth.
Layer 2 is just routing.

When you read provider docs and they say "we handle managed OAuth", they mean Layer 3. When they say "MCP-ready" they mean they expose Layer 1 too. When you read this differently in different places, this layering is what they're talking about.

---

## 3. Tech stack

These are opinionated weekend choices. Don't relitigate.

### Frontend + API
- **Framework:** Next.js 15 (App Router) with React 19
- **Styling:** Tailwind CSS 4 + the design tokens from `passport-landing-v2.html` (drop the CSS variables straight into `globals.css`)
- **UI primitives:** shadcn/ui where helpful, raw HTML/CSS where the wireframe is opinionated
- **Hosting:** Vercel (one click deploy from GitHub)
- **Domain:** `passport.orchestrator.so` (CNAME to Vercel)

### Backend / DB
- **Database:** Supabase (Postgres + Auth + Realtime + Edge Functions all in one)
- **Auth (for Passport users):** Supabase Auth (email + OAuth providers — Google, GitHub)
- **Auth (for AI startup developers):** Same Supabase Auth, separate `developers` table
- **Server logic:** Next.js API routes for v1. Move to dedicated Hono server only if perf requires.

### MCP Gateway
- **Framework:** Hono (Bun runtime)
- **Hosting:** Cloudflare Workers (low latency, scales to zero, perfect for an MCP server)
- **Subdomain:** `mcp.passport.so` (or `mcp.passport.orchestrator.so`)
- **MCP SDK:** `@modelcontextprotocol/sdk@latest`

### SDKs
- **TypeScript:** `@orchestrator/passport` (server) + `@orchestrator/passport-react` (frontend)
- **Build:** tsup → ESM + CJS + types
- **Publish:** npm public registry, scoped to `@orchestrator`

### Provider clients
- **Composio:** `composio-core` (npm) — the official TypeScript client
- Future adapters (Pipedream, Nango, Arcade) — defer past launch

### Billing infrastructure (set up, don't charge)
- **Stripe:** Customer + Subscription + Usage records, no prices charged during beta
- See § 11 for the exact Stripe schema

### Observability
- **Analytics:** PostHog (free cloud tier)
- **Error tracking:** Sentry (free tier)
- **Status:** Manual statuspage.io free, or just a `/status` route

### DX
- **Repo:** Single Turborepo monorepo
- **Package manager:** pnpm
- **Node version:** 20 LTS
- **Linting:** Biome (faster than ESLint+Prettier, one tool)
- **CI:** GitHub Actions for typecheck + lint + test on PR

### Communications
- **Email:** Resend (transactional — webhook signing receipts, security alerts)
- **Domain mail:** Cloudflare Email Routing forwarding to Gmail

---

## 4. Repo structure

Single repo. Codex creates this on Saturday morning, hour 0.

```
passport/
├── apps/
│   ├── web/                    # Next.js: landing + dashboard + API routes
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   └── page.tsx           # Landing — port from passport-landing-v2.html
│   │   │   ├── (app)/
│   │   │   │   ├── connections/page.tsx
│   │   │   │   ├── profiles/page.tsx
│   │   │   │   ├── products/page.tsx
│   │   │   │   └── activity/page.tsx
│   │   │   ├── connect/[token]/page.tsx   # The Connect UI route — port from demo-connect-ui.html
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── sessions/route.ts
│   │   │   │   │   ├── connections/route.ts
│   │   │   │   │   ├── profiles/route.ts
│   │   │   │   │   ├── execute/route.ts
│   │   │   │   │   ├── revoke/route.ts
│   │   │   │   │   └── webhooks/composio/route.ts
│   │   │   │   └── stripe/webhook/route.ts
│   │   └── styles/globals.css
│   │
│   └── mcp/                    # Hono: MCP gateway
│       ├── src/index.ts
│       └── wrangler.toml      # Cloudflare Workers config
│
├── packages/
│   ├── passport-sdk/           # @orchestrator/passport (server)
│   │   ├── src/
│   │   │   ├── index.ts        # Passport class
│   │   │   ├── sessions.ts
│   │   │   ├── connections.ts
│   │   │   ├── profiles.ts
│   │   │   ├── execute.ts
│   │   │   ├── mcp.ts
│   │   │   └── webhooks.ts
│   │   └── package.json
│   │
│   ├── passport-react/         # @orchestrator/passport-react
│   │   └── src/PassportConnect.tsx
│   │
│   ├── adapters/               # Provider adapters
│   │   ├── composio/
│   │   │   └── src/index.ts    # ComposioAdapter implementing AdapterInterface
│   │   └── interface/          # Shared adapter interface types
│   │
│   ├── db/                     # Supabase migrations + types
│   │   ├── migrations/
│   │   └── types.ts            # Generated from Supabase
│   │
│   └── shared/                 # Types shared across apps
│       └── src/types.ts
│
├── .env.example
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 5. Database schema

Run these migrations in order on Saturday morning, hour 1.

```sql
-- Passports — the user-side identity
create table passports (
  id text primary key default 'pp_' || replace(gen_random_uuid()::text, '-', ''),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index passports_user_id_idx on passports(user_id);

-- Developers — the AI startup side
create table developers (
  id text primary key default 'dev_' || replace(gen_random_uuid()::text, '-', ''),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  app_key text not null unique default 'pk_live_' || encode(gen_random_bytes(24), 'hex'),
  app_secret_hash text not null,           -- hashed, never plaintext
  webhook_url text,
  webhook_secret_hash text,
  stripe_customer_id text,
  created_at timestamptz default now()
);
create index developers_app_key_idx on developers(app_key);

-- Connections — one per (passport, app)
create table connections (
  id text primary key default 'conn_' || replace(gen_random_uuid()::text, '-', ''),
  passport_id text not null references passports(id) on delete cascade,
  app text not null,                       -- 'gmail', 'slack', 'notion', etc.
  account_label text,                      -- 'alice@company.com'
  provider text not null,                  -- 'composio', 'pipedream', 'nango'
  provider_ref text not null,              -- composio's connected_account_id, etc.
  scopes jsonb not null default '[]'::jsonb,
  status text not null default 'active',   -- active|expired|idle|revoked
  last_used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (passport_id, app, provider_ref)
);
create index connections_passport_id_idx on connections(passport_id);
create index connections_status_idx on connections(status);

-- Profiles — named groups of connections (replaces "Sets")
create table profiles (
  id text primary key default 'prof_' || replace(gen_random_uuid()::text, '-', ''),
  passport_id text not null references passports(id) on delete cascade,
  slug text not null,                      -- 'work', 'engineering' — used in URLs
  display_name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (passport_id, slug)
);
create index profiles_passport_id_idx on profiles(passport_id);

-- Profile members — which connections are in which profile
create table profile_members (
  profile_id text not null references profiles(id) on delete cascade,
  connection_id text not null references connections(id) on delete cascade,
  primary key (profile_id, connection_id)
);

-- Approvals — which developer apps can use which profile
create table approvals (
  id text primary key default 'app_' || replace(gen_random_uuid()::text, '-', ''),
  passport_id text not null references passports(id) on delete cascade,
  developer_id text not null references developers(id) on delete cascade,
  profile_id text references profiles(id) on delete cascade, -- nullable: can also use raw scopes
  raw_scopes jsonb,                        -- if approved without a profile
  status text not null default 'active',   -- active|revoked
  approved_at timestamptz default now(),
  revoked_at timestamptz,
  unique (passport_id, developer_id)       -- one approval per (user, app)
);

-- Sessions — short-lived tokens for the Connect flow
create table sessions (
  id text primary key default 'sess_' || replace(gen_random_uuid()::text, '-', ''),
  developer_id text not null references developers(id) on delete cascade,
  user_id_external text not null,          -- the developer's user ID (their database)
  passport_id text references passports(id), -- null until linked
  requested_profile_slug text,
  requested_scopes jsonb,
  redirect_url text,
  metadata jsonb,
  status text not null default 'pending',  -- pending|completed|abandoned|expired
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index sessions_developer_id_idx on sessions(developer_id);
create index sessions_status_idx on sessions(status);

-- Audit log — every action ever
create table audit_log (
  id bigserial primary key,
  passport_id text not null references passports(id) on delete cascade,
  developer_id text references developers(id),
  event_type text not null,                -- 'tool.executed', 'connection.created', 'approval.granted', etc.
  app text,                                -- when applicable
  tool text,                               -- when applicable
  result text,                             -- 'ok'|'failed'|'blocked'
  metadata jsonb,
  created_at timestamptz default now()
);
create index audit_log_passport_id_idx on audit_log(passport_id, created_at desc);
create index audit_log_developer_id_idx on audit_log(developer_id, created_at desc);
```

---

## 6. Critical API contracts

The SDK doc has the full surface. Here are the four endpoints that matter for v1 — nail these and you have a working product.

### POST /api/v1/sessions

```typescript
// Request
{
  userId: "user_abc",            // developer's user ID
  profile?: "work",              // optional: pre-request a profile by slug
  scopes?: string[],             // optional: pre-request raw scopes
  redirectUrl: string,           // where to send user after approval
  metadata?: object              // dev's free-form metadata
}
// Auth: Bearer {developer.app_secret} OR signed Authorization header

// Response 200
{
  token: "ses_2x4f...",          // pass to frontend
  expiresAt: "2026-05-09T...",
  connectUrl: "https://passport.orchestrator.so/connect/ses_2x4f..."
}
```

### POST /api/v1/connections

(Internal — called by the Connect UI after user finishes the OAuth flow.)

```typescript
{
  sessionId: "ses_2x4f...",
  passportId: "pp_27a4_b9c1f",   // existing or newly-created
  app: "gmail",
  accountLabel: "alice@company.com",
  providerRef: "ca_2x4f"         // Composio connected_account_id
}
```

### POST /api/v1/execute

```typescript
{
  userId: "user_abc",
  tool: "gmail.send_email",
  input: { to: "...", subject: "...", body: "..." }
}
// Auth: Bearer {developer.app_secret}

// Response 200
{
  ok: true,
  data: { messageId: "..." },
  toolCallId: "tc_2x4f...",
  provider: "composio"
}

// Response when consent missing
{
  ok: false,
  error: "consent_required",
  consent: {
    url: "https://passport.orchestrator.so/consent/...",
    scopesNeeded: ["gmail.send"]
  }
}
```

### MCP Gateway: GET /v1/u/:passportId/p/:profileSlug

(Hono server on Cloudflare Workers.)

- Verifies the JWT in `?token=` query param
- Returns an MCP server response (Streamable HTTP)
- `tools/list` returns tools available given the profile's connections
- `tools/call` proxies to the right adapter based on which connection backs the tool

---

## 7. Sub-agent plan

Codex spawns four parallel sub-agents for Saturday's first 12 hours. Each owns a slice. They merge to `main` continuously.

### Agent A — Backend & SDK (`@codex-backend`)
- Set up Turborepo + Supabase + migrations
- Scaffold `apps/web` with API routes
- Build `packages/passport-sdk` server SDK matching the SDK doc
- Build `packages/adapters/composio` to spec
- Implement POST /sessions, /connections, /execute, /revoke
- Set up developer auth (Supabase Auth + `developers` table + app_key/secret rotation)
- Write Vitest unit tests for adapter interface

### Agent B — Frontend dashboard (`@codex-frontend-app`)
- Port `passport-product-v2.html` → React in `apps/web/app/(app)`
- Wire it to the Supabase backend (RLS-protected reads)
- Build the four views: Connections, Profiles, Approved AI products, Activity
- Implement profile CRUD UI (create, edit, duplicate, delete)
- Implement revocation actions
- Realtime updates via Supabase Realtime when audit log writes happen

### Agent C — Connect UI + React SDK (`@codex-frontend-connect`)
- Port `demo-connect-ui.html` → React component inside `packages/passport-react`
- Build the multi-state flow (first-time, returning, success)
- Implement the Connect route at `apps/web/app/connect/[token]`
- Hand off to Composio for the actual OAuth dance
- Handle redirects back to the developer's app
- Test flow end-to-end with a real Gmail account

### Agent D — MCP gateway + Stripe + Marketing (`@codex-platform`)
- Set up `apps/mcp` with Hono on Cloudflare Workers
- Implement MCP signed URL JWT verify
- Implement tools/list and tools/call delegating to backend
- Set up Stripe Customer creation on developer signup
- Set up Stripe Webhook signing
- Deploy `passport-landing-v2.html` to Vercel as static page (or port to Next.js)
- Domain config: `passport.orchestrator.so` and `mcp.passport.orchestrator.so`
- Set up PostHog + Sentry

Each agent's branch is named `agent-a-backend`, etc. Merge to `main` four times daily during the build window.

---

## 8. Linear epic structure

Create one epic: **Agent Passport — Weekend Launch**

Sub-epics (one per agent, plus a launch epic):
- **Backend & SDK** (Agent A)
- **Dashboard** (Agent B)
- **Connect UI** (Agent C)
- **MCP Gateway & Platform** (Agent D)
- **Launch** (cross-cutting)

Each ticket has: title, acceptance criteria, estimate (in hours), and assigned agent.

### Saturday tickets (Hour 0–18)

#### Hour 0–2: Foundation (all agents)
- **PASS-1** Initialize monorepo with Turborepo, pnpm, Biome (Agent A) — 1h
- **PASS-2** Set up Supabase project + auth + run all migrations (Agent A) — 1h
- **PASS-3** Set up Vercel project + custom domain (Agent D) — 0.5h
- **PASS-4** Set up Cloudflare Workers project for MCP gateway (Agent D) — 0.5h
- **PASS-5** Set up Composio account + first auth config for Gmail (Agent A) — 0.5h
- **PASS-6** Set up Stripe account + first Customer (Agent D) — 0.5h
- **PASS-7** Set up PostHog + Sentry (Agent D) — 0.5h

#### Hour 2–6: First integration end-to-end
- **PASS-10** Build POST /sessions (Agent A) — 1.5h
- **PASS-11** Build POST /connections internal endpoint (Agent A) — 1h
- **PASS-12** Build Composio adapter — initiateConnection + executeTool (Agent A) — 2h
- **PASS-13** Build Connect UI route (Agent C) — 2h
- **PASS-14** Hand-off to Composio Connect Link from our Connect UI (Agent C) — 1.5h
- **PASS-15** Implement OAuth callback handling (Agent C) — 1h
- **PASS-16** Wire MCP gateway tools/list + tools/call basic (Agent D) — 2h

#### Hour 6–12: Dashboard + SDK
- **PASS-20** Port landing page to Next.js (Agent D) — 2h
- **PASS-21** Build dashboard shell + sidebar (Agent B) — 1.5h
- **PASS-22** Build Connections view + provider data hookup (Agent B) — 2h
- **PASS-23** Build Profiles view + CRUD (Agent B) — 2h
- **PASS-24** Build Approved Products view (Agent B) — 1h
- **PASS-25** Build Activity view (Agent B) — 1h
- **PASS-26** Server SDK class + sessions.create (Agent A) — 1h
- **PASS-27** Server SDK profiles + connections + execute methods (Agent A) — 2h
- **PASS-28** Server SDK mcp.url generator (Agent A) — 1h

#### Hour 12–18: Polish + first user
- **PASS-30** PassportConnect React component finalized (Agent C) — 2h
- **PASS-31** Audit log writing on every tool execution (Agent A) — 1h
- **PASS-32** Webhook delivery for connection.active and tool.executed (Agent A) — 1.5h
- **PASS-33** End-to-end test: real user, Gmail, Claude Desktop MCP (everyone) — 2h
- **PASS-34** Bug bash + first dogfood (everyone) — until done
- **PASS-35** Take all 5 launch screenshots (Agent D) — 1h

### Sunday tickets (Hour 18–37)

#### Hour 18–24: SDK publish + docs
- **PASS-40** Publish @orchestrator/passport to npm (Agent A) — 1h
- **PASS-41** Publish @orchestrator/passport-react to npm (Agent C) — 1h
- **PASS-42** Write quickstart docs (Agent A + D) — 2h
- **PASS-43** Write SDK reference docs (Agent A) — 2h
- **PASS-44** Set up status page (Agent D) — 1h
- **PASS-45** Stripe Customer auto-creation on developer signup (Agent D) — 1.5h

#### Hour 24–32: Launch prep
- **PASS-50** Pre-launch checklist run (everyone) — 2h
  - Landing renders correctly across browsers
  - Quickstart works in fresh environment
  - Connect UI renders on real OAuth (test with 3 different Gmail accounts)
  - MCP URL works in Claude Desktop, Cursor, ChatGPT
  - Webhooks deliver successfully
  - Audit log populates correctly
  - Revocation actually revokes on Composio side
- **PASS-51** Rate limiting on /execute (Agent A) — 1h
- **PASS-52** Error pages and friendly empty states (Agent B + C) — 1.5h
- **PASS-53** GitHub repo public, README finalized (Agent D) — 1h
- **PASS-54** Set up @passport_so or similar Twitter handle (Agent D) — 0.5h
- **PASS-55** Schedule the launch tweet for 18:00 ET (Agent D) — 0.5h

#### Hour 32–37: Launch + monitor
- **PASS-60** Post launch tweet at scheduled time (Agent D)
- **PASS-61** Post Show HN (Agent D)
- **PASS-62** Cross-post to dev Discords (Agent D)
- **PASS-63** Monitor Sentry, PostHog, Twitter replies for 4h (everyone)
- **PASS-64** First-day metrics report (Agent D)

---

## 9. Provider integration order

### v1 (this weekend) — Composio only

Composio is the default for v1 because:
- Largest base of well-documented OAuth integrations (1,000+ toolkits)
- White-labeling is supported (we can use our own OAuth client IDs)
- Their `entity_id` model maps cleanly to our `userId`
- Their TypeScript SDK is mature and stable
- Their support is responsive (reach out before launch)

For Saturday, scope down even further: only **Gmail, Calendar, Slack, Notion, Linear, GitHub** as supported apps. Six is plenty for the demo. We'll fan out from there.

### v1.1 (week 2) — Pipedream

Add Pipedream second for the long tail. Their `external_user_id` model is identical in spirit to Composio's entity_id, the adapter is mostly a different SDK call site. Their MCP server is best-in-class.

### v1.2 (week 3) — Nango

Add Nango for self-host-friendly customers. This unlocks enterprise conversations.

### v2.0 (later) — Arcade and Zapier

Arcade for in-chat-auth-flow products. Zapier for the absolute long tail (only when no other provider has the app).

### Adapter interface (build this on Saturday morning)

Every adapter implements the same interface, defined once:

```typescript
// packages/adapters/interface/src/index.ts
export interface ProviderAdapter {
  name: string;

  initiateConnection(params: {
    userId: string;
    app: string;
    scopes: string[];
    redirectUrl: string;
  }): Promise<{ url: string; connectionRef: string }>;

  pollConnectionStatus(connectionRef: string): Promise<{
    status: 'pending' | 'active' | 'failed' | 'expired';
    accountLabel?: string;
  }>;

  executeTool(params: {
    userId: string;
    app: string;
    tool: string;
    input: Record<string, any>;
  }): Promise<{ ok: boolean; data?: any; error?: string }>;

  revokeConnection(connectionRef: string): Promise<void>;

  capabilities(): Promise<{ apps: string[]; tools: ToolSchema[] }>;
}
```

Build this interface first. Composio adapter implements it. When Pipedream adapter lands, it's a drop-in replacement for any app where Pipedream is configured.

---

## 10. Stripe integration — set up the rails

Stripe is in the build even though billing is off. The reason: when we flip billing on (week 6 or whenever), we don't want a migration. Customer records exist from day one.

### What to set up Saturday

1. **Stripe account** in test mode for the weekend, then promote to live before launch
2. **Product:** `Agent Passport - Beta` (yes, in Stripe)
3. **Price:** $0 recurring (yes, $0 is a valid price)
4. **Webhook endpoint** at `/api/stripe/webhook` listening for:
   - `customer.created`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Customer Portal** configured (so devs can manage their own billing later)

### Developer signup flow

```
1. Developer creates account via Supabase Auth
2. Server creates Stripe Customer with their email + metadata.developer_id
3. Server creates Subscription with Price $0
4. Server stores stripe_customer_id on developers row
5. Done. They have an account, a stripe customer, a $0 sub, an app_key, an app_secret.
```

When we turn on billing in v2, the schema is already there. We change the Price, send an email, and let the existing Stripe machinery do its thing.

### Usage tracking (build it now, don't surface it)

Every tool execution writes to a `usage_records` table:
```sql
create table usage_records (
  id bigserial primary key,
  developer_id text not null,
  passport_id text not null,
  event_type text not null,        -- 'tool_call', 'session_created', etc.
  metric_value int not null default 1,
  created_at timestamptz default now()
);
create index usage_records_developer_idx on usage_records(developer_id, created_at desc);
```

When we flip billing on, we run a daily job that aggregates `usage_records` into Stripe usage records via `stripe.subscriptionItems.createUsageRecord`. We don't surface usage limits to users in v1 — but we have the data.

---

## 11. Things to NOT build this weekend

This list is non-negotiable. Anything here is v2+, no exceptions.

- ❌ Multi-provider routing (Composio only for v1)
- ❌ Self-hosting (hosted only)
- ❌ SSO / SCIM / SAML
- ❌ Team workspaces (single passport per user only)
- ❌ Per-action approval flows (profile-level approval only)
- ❌ Fine-grained scope editing in UI (use Composio defaults)
- ❌ Webhook replay UI
- ❌ Activity log filtering by app + product (single firehose only)
- ❌ Profile sharing between users
- ❌ Custom branded OAuth screens (use Composio's default screens)
- ❌ Mobile-native apps
- ❌ Python SDK (v1 is TypeScript only — Python in week 2)
- ❌ Rate limit tiers (single global limit during beta)
- ❌ Per-Passport billing (developer-side only)
- ❌ Connection migration between providers (impossible anyway)

If a sub-agent starts working on something in this list, intervene.

---

## 12. Outstanding research questions — answer before launch

These need answers before Sunday evening. None blocks the build, but each shapes positioning.

### Q1: Is `agentpassport.dev` available? Or just use `passport.orchestrator.so`?

Quick check at registrars. If `agentpassport.dev` is taken or expensive, use the subdomain. Don't burn 30 minutes on this — the subdomain is fine.

### Q2: What's our exact Composio rate limit?

Reach out to Composio support Saturday morning. Tell them we're launching this weekend. Ask for beta-tier rate limits. They've been responsive in the past.

### Q3: Tool naming — `gmail.send_email` or `Gmail.SendEmail`?

We've been using `gmail.send_email` (snake_case namespaced). Composio uses `GMAIL_SEND_EMAIL`. Arcade uses `Gmail.SendEmail`. Pipedream uses `gmail-send-email`.

**Decision for v1:** Use `gmail.send_email` (lowercase, dot-separated). The adapter translates to each provider's convention. This is what's in the SDK doc. Lock it in.

### Q4: How do we handle a user who signs up for Agent Passport directly, before any developer integrates?

For v1: they can. We let them connect apps and create profiles even with no approved products. The dashboard works. They just have no AI products using the Passport yet.

This is fine — actually good. They become the test users for the next wave of integrations.

### Q5: What happens when a developer's webhook URL is unreachable?

For v1: log to Sentry, retry 3 times with exponential backoff, then mark as failed. No replay UI yet. We'll add replay in v1.1.

### Q6: GDPR / data deletion on Passport delete?

Hard delete the passport row. Cascade deletes everything (RLS + foreign keys). For provider-held data: call each provider's delete endpoint for every connection on that passport. Composio supports `deleteConnectedAccount`. This needs to be tested before launch.

### Q7: Open-source the SDK and adapter interface, or keep it closed for now?

**Answer:** Open the SDK and adapter interface, keep the hosted control plane closed. This matches the strategy doc. Specifically:
- `@orchestrator/passport` — public on npm, source on GitHub
- `@orchestrator/passport-react` — public on npm, source on GitHub
- Adapter interface package — public on GitHub (lets others contribute new adapters)
- Hosted backend (Next.js apps in this repo) — closed source, deployed on Vercel under our own account

Make `apps/` private and `packages/` public via two separate npm workspaces with different access settings. Or just put `apps/` in a different private repo and link via path — depends on what's faster.

---

## 13. Daily standup — keep agents in sync

Every 4 hours during the build window, each agent posts a 4-line status to a shared Slack/Discord/whatever:

```
[Agent A — Backend]
Done: PASS-10, PASS-11, PASS-12
Blocked on: PASS-15 needs PASS-13 from Agent C
Next 4h: PASS-20, PASS-21
```

Codex (the orchestrator) reads these every 4 hours, intervenes if anyone's stuck for >1h, and reassigns scope if estimates are off.

---

## 14. Pre-launch final checklist (Sunday evening before tweet)

- [ ] Landing page live at `passport.orchestrator.so`
- [ ] Dashboard live at `passport.orchestrator.so/app`
- [ ] Connect UI live at `passport.orchestrator.so/connect/[token]`
- [ ] MCP gateway live at `mcp.passport.orchestrator.so`
- [ ] `npm install @orchestrator/passport` works in a fresh repo
- [ ] `npm install @orchestrator/passport-react` works
- [ ] Quickstart copy-paste produces a working session in < 5 minutes
- [ ] Connect a real Gmail account end-to-end — works
- [ ] Plug MCP URL into Claude Desktop — Claude can call `gmail.send_email`
- [ ] Activity log populates after the call
- [ ] Revoke the connection from dashboard — Composio also revokes
- [ ] Webhook delivers `connection.active` to a test endpoint
- [ ] Stripe Customer created on developer signup
- [ ] Sentry receives a deliberate test error
- [ ] PostHog receives a `connect.completed` event
- [ ] All 5 launch screenshots taken at high DPI
- [ ] Status page is live
- [ ] Twitter handle exists, profile is set up
- [ ] Launch tweet drafted, screenshots attached, scheduled for 18:00 ET
- [ ] Show HN draft ready in a separate doc

If all 18 are checked, ship it.

If 1-2 are not checked: ship anyway, fix afterwards.

If 5+ are not checked: delay the tweet by 24 hours. Don't launch broken.

---

## 15. After Sunday — what to expect

The launch tweet's first 4 hours are the most important window. Codex (or you, Obi, manually) needs to be available to:
- Reply to every Twitter mention
- Triage every GitHub issue within 1 hour
- Respond to every DM within 30 minutes
- Fix any showstopper bug within 2 hours

This is not "ship and walk away." This is the start of the real work — converting 100 curious devs into 10 committed integrators into 3 case studies into a real flywheel.

The product exists in code by Sunday night. The product exists in the world starting Monday morning when the first AI startup actually integrates it.

That's the milestone that matters.

---

## Appendix A — Environment variables Codex will need

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Composio
COMPOSIO_API_KEY=
COMPOSIO_BASE_URL=https://backend.composio.dev/api

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Hosting
VERCEL_URL=
NEXT_PUBLIC_PASSPORT_DOMAIN=passport.orchestrator.so
NEXT_PUBLIC_MCP_DOMAIN=mcp.passport.orchestrator.so

# JWT signing for MCP URLs
PASSPORT_JWT_SECRET=                # 32+ random bytes, hex-encoded

# Webhooks
RESEND_API_KEY=
WEBHOOK_SIGNING_SECRET=             # 32+ random bytes, hex-encoded

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# Errors
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

## Appendix B — Composio specifics worth knowing

These are the exact Composio API calls the adapter will make. They're current as of May 2026 — verify against the latest Composio docs since they iterate fast.

```typescript
import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Create a connection (initiateConnection equivalent)
const connection = await composio.connectedAccounts.initiate({
  entityId: passport.userId,             // OUR passport.user-side identifier
  authConfigId: "ac_gmail_xyz",          // configured per-toolkit, set up once
  redirectUrl: "https://passport.orchestrator.so/connect/callback",
});
// Returns: { redirectUrl, connectedAccountId }

// Wait for active
const active = await composio.connectedAccounts.waitUntilActive(connection.connectedAccountId);

// Execute a tool
const result = await composio.tools.execute({
  toolName: "GMAIL_SEND_EMAIL",          // Composio's naming
  entityId: passport.userId,
  arguments: { to: "...", subject: "...", body: "..." },
});

// Revoke
await composio.connectedAccounts.delete(connectedAccountId);
```

Map our tool names to theirs in `packages/adapters/composio/src/tool-map.ts`:

```typescript
export const COMPOSIO_TOOL_MAP = {
  "gmail.send_email": "GMAIL_SEND_EMAIL",
  "gmail.list_messages": "GMAIL_LIST_MESSAGES",
  "calendar.create_event": "GOOGLECALENDAR_CREATE_EVENT",
  // ... grow as we add tools
};
```

---

This is the spec. Codex: spawn the four sub-agents, run the Linear epic, ship by Sunday evening. Anything not in this doc, ask before assuming.
