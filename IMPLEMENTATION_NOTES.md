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

Use a new Supabase project for Agent Passport.

Do not use Orchestrator's existing Supabase project for the validation launch.

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

Use a dedicated table for discovery submissions:

```text
public.agent_passport_waitlist
```

Migration:

```text
agent-passport/supabase/migrations/20260510_agent_passport_waitlist.sql
```

The validation page posts directly to Supabase using the public anon key and an insert-only RLS policy. This keeps the first validation surface simple while preserving the option to add a backend/API later.
