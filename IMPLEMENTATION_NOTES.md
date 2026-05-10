# Agent Passport Implementation Notes

## Worktree

Path: `/Users/obiihej/dev/orchestrator-agent-passport`  
Branch: `feature/agent-passport-validation`

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

Build Agent Passport as its own product folder:

```text
agent-passport/apps/web
```

This keeps the validation page and future backend separate from Orchestrator.

## Waitlist Persistence

Do not use Orchestrator's existing database for Agent Passport validation.

The first validation launch should use a disposable form collector endpoint instead of a database.

Recommended temporary options:

- Formspree
- Tally
- Basin
- Typeform
- Google Forms if speed matters more than polish

The frontend should post to:

```text
VITE_WAITLIST_ENDPOINT
```

This gives us:

- no Orchestrator DB pollution
- no extra Supabase project cost
- no schema coupling
- easy export to CSV later
- easy replacement with a dedicated Agent Passport DB when the idea proves real

Do not use the existing Orchestrator Supabase project unless we make an explicit temporary exception.

If we ever do temporarily use the existing database, isolation must be strict:

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

Current boundary:

```text
Agent Passport
  -> own Vercel project
  -> own Supabase project
  -> own env vars
  -> own tables
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
