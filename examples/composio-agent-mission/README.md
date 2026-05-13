# Composio Agent Mission

This example proves the first technical shape of Agent Passport:

1. Agent Passport creates an access request.
2. The user approves a profile of connected apps.
3. The app receives an access grant.
4. The app turns that grant into an agent-readable manifest.
5. Composio, not Agent Passport, owns the real OAuth tokens and tool execution.

Run the dry version:

```bash
yarn example:composio
```

Create a real Composio auth link:

```bash
COMPOSIO_API_KEY=... \
COMPOSIO_AUTH_CONFIG_ID=... \
yarn example:composio connect
```

List real connected accounts:

```bash
COMPOSIO_API_KEY=... \
COMPOSIO_USER_ID=agent-passport-demo-user \
yarn example:composio list-accounts
```

List tools for a provider toolkit:

```bash
COMPOSIO_API_KEY=... \
COMPOSIO_TOOLKIT=gmail \
yarn example:composio list-tools
```

Run one explicit Composio tool:

```bash
COMPOSIO_API_KEY=... \
COMPOSIO_TOOL_SLUG=GMAIL_FETCH_EMAILS \
COMPOSIO_TOOL_ARGS_JSON='{}' \
COMPOSIO_SKIP_VERSION_CHECK=true \
yarn example:composio
```

The example intentionally avoids storing raw OAuth tokens. It only passes provider handoff references, such as a Composio connected account id.
