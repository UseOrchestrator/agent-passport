# Roadmap

## Phase 0: Validation

- [x] landing page
- [x] waitlist
- [x] positioning
- [x] open-source README
- [x] launch assets
- [x] GitHub repo
- [ ] mobile polish

## Phase 1: Spec And SDK

- [x] document Access Request -> Access Grant -> provider handoff model
- [ ] choose final public/API term for request/session/connect flow
- [x] define Passport, Profile, Connection, Provider, Approval, Access Grant, Provider Handoff
- [ ] build runnable agent harness that consumes a grant and feeds an agent tool manifest
- [ ] publish `@agent-passport/sdk`
- [x] support mock access approval
- [x] return provider-aware access grants
- [ ] ship Next.js/Vite examples

## Phase 2: First Provider Adapter

- choose first real provider, likely Composio
- map provider connection IDs
- preserve provider scopes/status
- expose app-level access
- document what Agent Passport does and does not own

## Phase 3: Hosted Passport App

- user login
- connection overview
- profile creation
- approval flow
- revocation view
- provider-aware connection status

## Phase 4: Multi-Provider Profiles

- support multiple provider-backed connections
- show duplicate app access across providers
- help users choose preferred provider/app source
- normalize app/tool metadata

## Phase 5: MCP And Tool Surfaces

- expose selected profiles to MCP clients
- map apps to provider tools where available
- support profile-scoped tool catalogs

## Phase 6: Teams And Trust

- team-owned passports
- audit log
- policy controls
- app approval history
- enterprise revocation workflows
