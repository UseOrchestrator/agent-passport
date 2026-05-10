# Agent Passport — Build Package

Everything Codex needs to build and launch Agent Passport this weekend.

## Where to start

1. Read `handoff/passport-handoff.md` first. Top-to-bottom. It's the implementation spec.
2. Then `handoff/passport-sdk-v2.md` — the SDK API contract.
3. Then `handoff/passport-launch.md` and `handoff/passport-content.md` for the Sunday launch.
4. Open the files in `wireframes/` in a browser as you build the corresponding components.

## Folder structure

- **handoff/** — markdown specs Codex executes against
  - `passport-handoff.md` — implementation plan, tech stack, sub-agent split, Linear-ready tickets, hour-by-hour
  - `passport-sdk-v2.md` — SDK API surface (server, React, MCP gateway, webhooks)
  - `passport-launch.md` — Twitter funnel, target audience, screenshots strategy
  - `passport-content.md` — every post copy (Twitter, LinkedIn, Instagram, HN), ready to paste

- **wireframes/** — HTML files that double as visual references and screenshot sources
  - `passport-landing-v2.html` — landing page (deploy as the v1 site)
  - `passport-product-v2.html` — user dashboard (port to React)
  - `demo-connect-ui.html` — Connect Agent Passport modal (port to React in the SDK)
  - `demo-before-after.html` — hero Twitter image (1600×900 region)
  - `demo-carousel.html` — 7-slide carousel for IG / LinkedIn doc / Twitter image set

- **reference/** — v1 versions kept for diff context only. Codex should use the v2 files in handoff/ and wireframes/.

## Open question not yet in the docs

The developer-side admin surface (app allowlist, scope defaults, profile templates, brand config) isn't wireframed yet. v1 ships without it — devs configure via API only. v1.1 needs a wireframe equivalent in shape to the user dashboard.

Also: revisit the Plaid analogy in marketing post-launch. Apple Pay describes the user experience accurately but the adoption story is closer to Plaid (devs adopt for DX wins; users meet the wallet through products that embed it).
