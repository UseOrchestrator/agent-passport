# Agent Passport Implementation Notes

## Worktree

Path: `/Users/obiihej/dev/agent-passport`  
Branch: `main`

## Subdomain

Use:

```text
passport.orchestrator.so
```

Reason: it is shorter and more flexible than `agentpassport.orchestrator.so`, while still matching the Agent Passport brand.

## Claude Package Review

Source package:

```text
passport-package.zip
```

Extracted reference copy:

```text
agent-passport/reference/claude-package/
```

Useful assets:

- `wireframes/passport-landing-v2.html` — main visual source for the validation page
- `wireframes/demo-connect-ui.html` — useful for explaining the future embedded connect flow
- `wireframes/demo-before-after.html` — useful for hero/social imagery
- `wireframes/demo-carousel.html` — useful for launch/social concepts
- `handoff/passport-content.md` — useful copy, but too launch-complete for current validation
- `handoff/passport-launch.md` — useful channel thinking

Do not blindly implement:

- full SDK
- MCP gateway
- Composio adapter
- Stripe billing
- Supabase auth
- Cloudflare Workers
- npm packages

Those are future product surfaces. The current work should validate whether founders/developers care before we build live infrastructure.

## Implementation Decision

Build Agent Passport as its own standalone repo:

```text
/Users/obiihej/dev/agent-passport
```

This keeps the validation page and future backend separate from Orchestrator.

## Waitlist Persistence

Use Orchestrator's existing development/e2e Supabase database temporarily for the Agent Passport validation waitlist only.

Do not apply Agent Passport validation tables to the production Supabase project.

Do not add production Agent Passport auth, hosted accounts, OAuth/provider metadata, or app-access state to the existing Orchestrator Supabase project.

Before that stage, create a dedicated Agent Passport Supabase project or another isolated database.

This is an explicit temporary exception. Isolation must be strict:

- separate table prefix: `agent_passport_*`
- no Orchestrator user IDs
- no foreign keys to Orchestrator tables
- no shared auth
- no writes to existing Orchestrator tables
- documented migration/export path to a future dedicated database

Reason:

- Agent Passport is a separate product surface.
- It will likely need its own users, waitlist, passport profiles, provider references, audit logs, and future backend tables.
- Reusing Orchestrator's database would create clutter and accidental coupling.
- Shared identity can be revisited later if we intentionally want Orchestrator SSO or account linking.
- A third Supabase project would force paid infrastructure before validation.
- A generic form collector adds another vendor without buying much for this narrow use case.

Allowed temporary target:

```text
Orchestrator Backend (e2e)
Project ref: qkhtjdkferqrufofjslr
```

Disallowed:

```text
Orchestrator Backend (prod)
Project ref: wuzzwixhfixergcwzyyg
```

Temporary table:

```text
public.agent_passport_waitlist
```

Migration:

```text
agent-passport/supabase/migrations/20260510040000_agent_passport_waitlist.sql
```

The validation page posts directly to Supabase using the public anon key and an insert-only RLS policy.

Exit plan:

1. Export `public.agent_passport_waitlist`.
2. Create a dedicated Agent Passport database if the product moves forward.
3. Import the waitlist rows.
4. Drop `public.agent_passport_waitlist` from Orchestrator's Supabase project.

Current boundary:

```text
Agent Passport
  -> own Vercel project
  -> temporary isolated Supabase table in Orchestrator dev/e2e project
  -> own env vars
  -> passport.orchestrator.so
```

Shared:

```text
Orchestrator brand/domain
```

Not shared for validation:

```text
Orchestrator users
Orchestrator app tables
Orchestrator backend
Orchestrator marketing app
```
