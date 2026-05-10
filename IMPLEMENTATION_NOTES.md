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

