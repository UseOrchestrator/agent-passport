# Roadmap

## Phase 0: Validation

- landing page
- waitlist
- positioning
- open-source README
- launch assets
- GitHub repo
- mobile polish

## Phase 1: Spec And SDK

- define Passport, Profile, Connection, Provider, Approval, Session, AccessObject
- publish `@agent-passport/sdk`
- support session creation
- support mock access approval
- return flat provider-aware access objects
- ship Next.js/Vite examples

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
