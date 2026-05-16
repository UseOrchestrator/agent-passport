# Full Local Demo

This demo proves the desired outcome:

```text
A developer app can ask Agent Passport for a user's connected Gmail access,
then run a real read-only agent task through Composio without Agent Passport
owning the OAuth token.
```

## Run

Create `examples/full-demo/.env.local`:

```bash
COMPOSIO_API_KEY=...
```

Optional overrides:

```bash
COMPOSIO_GMAIL_AUTH_CONFIG_ID=...
COMPOSIO_DEMO_TOOL_SLUG=GMAIL_GET_PROFILE
AGENT_PASSPORT_DEMO_PORT=8787
```

Start the demo:

```bash
yarn demo:full
```

Open:

```text
http://localhost:8787
```

## Acceptance Criteria

1. The page loads.
2. The user enters an email.
3. The page creates a Composio Gmail OAuth link.
4. The user authenticates Gmail.
5. The page detects the active Gmail connected account.
6. Agent Passport creates a grant with only provider handoff metadata.
7. The demo agent receives that grant.
8. The demo agent calls Composio with the handoff reference.
9. The page shows the read-only Gmail result.
10. No raw OAuth token appears in the grant or agent manifest.

## What This Proves

Agent Passport does not need to become the Gmail execution layer in v0.

It can own:

- the user-facing passport/profile idea
- the developer access request
- the approval record
- the flat provider-aware grant

Composio still owns:

- OAuth
- token storage
- tool schema
- tool execution

That is the lowest-liability version of the product.
