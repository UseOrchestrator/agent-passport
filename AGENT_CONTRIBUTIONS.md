# Agent-First Contributions

Agent Passport is built for agents, so the project should be easy for agents to contribute to.

The goal is not to remove human judgment. The goal is to make useful fixes, examples, adapters, and docs move faster.

## Model

- AI agents may open PRs.
- AI agents may perform first-pass review.
- Humans approve direction, safety, and merge decisions.
- Small fixes should be reviewed quickly.
- Provider adapters and examples should be easy to propose.

## Good Agent Tasks

- add an SDK example
- add a provider adapter stub
- normalize an access-object edge case
- improve README clarity
- add tests for profile/session behavior
- generate docs from accepted API types

## Guardrails

Agents must not:

- invent provider capabilities
- claim token portability
- add secrets
- bypass human review for security-sensitive code
- change license or governance rules
- make large rewrites without an issue/discussion

## PR Format

Agent-generated PRs should include:

```text
What changed:

Why:

How tested:

Provider/token assumptions:

Human review needed for:
```

## Principle

Fast contribution is valuable only if the standard stays trustworthy.
