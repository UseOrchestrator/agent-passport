# Contributing

Agent Passport is the connection passport for AI apps.

We want contributions that make it easier for AI products to request, approve, and use reusable connection profiles.

## Good First Contributions

- provider adapter sketches
- SDK examples
- docs clarifying provider behavior
- test cases for access-object normalization
- UI copy improvements
- demo app improvements
- issue reproduction cases

## Contribution Rules

- Keep the provider reality visible. Do not pretend OAuth tokens are portable.
- Keep the developer surface simple.
- Prefer small PRs.
- Include a short explanation of the user or builder problem being solved.
- Add tests when touching SDK behavior.
- Do not add provider secrets, OAuth credentials, or private tokens.

## Review Standard

PRs should answer:

- What connection passport behavior does this improve?
- Which user/developer workflow benefits?
- Does it preserve provider metadata?
- Does it avoid unsafe credential assumptions?
- Is the API still understandable?

## Local Setup

The standalone repo is not fully extracted yet. Current source lives under:

```text
agent-passport/
```

The validation page lives under:

```text
agent-passport/apps/web
```

Build the page:

```bash
cd agent-passport/apps/web
yarn install
yarn build
```
