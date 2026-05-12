# Agent Contributions

Agent Passport is built for agents, so contributions should be easy to make with agents.

The model is simple:

- humans bring ideas, bugs, examples, and product taste
- agents write the code
- humans or review agents review the PR
- useful changes should move quickly

This is inspired by Open Island, the open-source Vibe Island alternative. Their contribution style makes the important point clearly: if you have the will, you can turn an idea into code with an agent and get it used by others.

Agent Passport should work the same way.

## How To Contribute With An Agent

Paste this into Codex, Claude Code, Cursor, or another coding agent:

```text
I want to contribute to Agent Passport.

Repository: https://github.com/ObiTracks/agent-passport

Read README.md, CONTRIBUTING.md, AGENT_CONTRIBUTIONS.md, and ROADMAP.md.
Then help me make one focused contribution.

Before editing, tell me:
- what you plan to change
- which files you expect to touch
- how you will test it
- any obvious limitation or risk

After I approve, make the change, run the relevant check, and open a pull request.
```

## Good Agent Tasks

- add an SDK example
- add a provider adapter sketch
- improve README clarity
- add tests for profile/session behavior
- create a small demo
- add diagrams that explain provider handoff
- improve mobile UI/accessibility
- document Composio, Arcade, Nango, Pipedream, or custom OAuth behavior

## PR Shape

Agent PRs should be short and easy to review:

```text
What changed:

Why:

How tested:

Known limitations:
```

## Review Shape

Review should be fast. The first pass should be one of:

```text
MERGE

REQUEST CHANGES

ESCALATE
```

Escalate only when the PR touches sensitive areas like credentials, auth, provider behavior, licensing, governance, or major architecture.

## Bug Prompt

```text
I found a problem in Agent Passport.

Repository: https://github.com/ObiTracks/agent-passport

Help me file a concise GitHub issue. Ask only for details you need.
Include the problem, steps to reproduce if known, expected behavior, and actual behavior.
```

## Feature Prompt

```text
I want to request a feature for Agent Passport.

Repository: https://github.com/ObiTracks/agent-passport

Help me turn this into a concise GitHub issue. Ask only for details you need.
Include the idea, why it matters, and the smallest useful first version.
```
