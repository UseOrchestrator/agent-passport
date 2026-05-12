# Contributing

Agent Passport is the connection passport for AI apps.

We want contributions that make it easier for AI products to request, approve, and use reusable connection profiles.

Agent Passport is agent-first open source. Bring the idea; let your coding agent make the PR.

## Good First Contributions

- provider adapter sketches
- SDK examples
- docs clarifying provider behavior
- test cases for access-object normalization
- UI copy improvements
- demo app improvements
- issue reproduction cases

## Start With Your Agent

Paste this into Codex, Claude Code, Cursor, or another coding agent:

```text
I want to contribute to Agent Passport.

Repository: https://github.com/UseOrchestrator/agent-passport

Read README.md, CONTRIBUTING.md, AGENT_CONTRIBUTIONS.md, and ROADMAP.md.
Find one small contribution that improves the project.
Explain the plan before editing.
Then implement it, run the relevant check, and open a pull request.
```

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

Review should be fast. Small, correct improvements should not wait for days.

Review agents should return one of:

```text
MERGE
REQUEST CHANGES
ESCALATE
```

## Local Setup

Public repo:

https://github.com/UseOrchestrator/agent-passport

The validation page lives under:

```text
apps/web
```

Build the page:

```bash
cd apps/web
yarn install
yarn build
```

When working from the Orchestrator monorepo worktree, the same app lives under:

```text
agent-passport/apps/web
```
