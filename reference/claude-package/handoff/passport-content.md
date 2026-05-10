# Agent Passport — Launch Content (ready to paste)

All copy below is final. Each section says which screenshot from the package to attach.

---

## Twitter — main launch tweet

**Schedule for 18:00 ET Sunday. Pin to profile.**

**Attach:** `demo-before-after.html` cropped to 1600 × 900 (the hero frame, no preview chrome — just the inner two-column comparison + center stamp + brand watermark).

---

> Apple Pay didn't make you re-enter your card.
>
> Sign in with Google didn't make you re-enter your password.
>
> Why is every AI agent still making your users reconnect Gmail?
>
> Agent Passport ships today. Free during beta.
>
> passport.orchestrator.so

---

## Twitter — reply thread (post these in sequence under the main tweet)

### Reply 1 — for builders

**Attach:** Cropped screenshot of the SDK code section from `passport-landing-v2.html` (the "server.ts" tab). Or capture just the code block alone at high DPI.

> 5 lines of code between your AI app and 9,000 user apps.
>
> ```ts
> const session = await passport.sessions.create({
>   userId: 'user_abc',
>   profile: 'work',
> });
> ```
>
> SDK is `@orchestrator/passport` on npm. Free during beta.

### Reply 2 — for users

**Attach:** Screenshot of the Approved AI Products view from `passport-product-v2.html`.

> What users see in their Passport: every AI product that has access to their apps, every action it took, one-click revoke.
>
> This isn't somewhere they visit weekly. It's where they go the second something feels off.

### Reply 3 — provider neutrality

**Attach:** Architecture diagram section from `passport-landing-v2.html` (section 03 "Architecture").

> Provider-neutral by design.
>
> Composio for one app. Pipedream for another. Nango for the long tail.
>
> If a provider raises prices, deprecates a connector, or goes down — we route around them. The tokens never move; the routing does.

### Reply 4 — pre-empt the cold-start objection

**No image needed.**

> "But nobody has an Agent Passport yet."
>
> Right. Apple Pay launched with zero users too.
>
> Apple Pay launched into checkout flows, not into App Stores. Users got it incidentally, then it became habit.
>
> Same playbook here. Agent Passport launches inside AI products that embed it.

### Reply 5 — soft DM ask

**No image needed.**

> If you're shipping an AI product right now that needs Gmail/Slack/Notion access, the SDK is open and free during beta.
>
> DM me what you're building. I'll personally help you wire it in.

---

## LinkedIn — post

**Post timing:** Same evening as Twitter, ~30 min later. LinkedIn rewards staggered drops over simultaneous ones.

**Attach:** Upload the `demo-carousel.html` slides as a 7-page PDF (LinkedIn's "Document" upload type currently outperforms images on reach by 2–3x).

---

> I spent the weekend building Agent Passport.
>
> The premise: every AI agent product I've used asks me to reconnect the same apps. Gmail. Slack. Notion. Calendar. GitHub. Linear. It's the new login tax — and it's killing activation curves at AI startups everywhere.
>
> So I built the wallet equivalent for AI: connect once, bring approved app access into every AI product you use.
>
> Three things I learned in the build:
>
> **1. The hardest decision wasn't technical. It was naming.**
>
> We started with "Sets" — a named bundle of connections. Felt accurate. Tested poorly with non-technical users. Switched to "Profiles" — Chrome already taught everyone what that means. Netflix already taught everyone what that means. Familiar terminology beats clever every single time.
>
> **2. Token portability between OAuth providers isn't real.**
>
> Spent two hours trying to figure out how to move a Gmail token from Composio's vault into Pipedream's. Spoiler: you can't. Provider projects are isolated by design. So we don't promise token portability — we promise app-access portability through live routing instead. Different problem, achievable solution.
>
> **3. The cold-start question answered itself.**
>
> "But nobody has an Agent Passport yet." Right. Apple Pay launched with zero users too. It launched into merchant checkout flows, not as a destination people sought out. Users got it incidentally, then it became habit.
>
> Same playbook. Agent Passport launches inside AI products that embed it. The first 1,000 users won't have one — they'll create it inside their first AI app. The next 100,000 will arrive with one already.
>
> If you're shipping an AI product right now that needs Gmail/Slack/Notion/Calendar access, the SDK is free during beta and the integration is 5 lines. Open to DMs from anyone building this quarter.
>
> passport.orchestrator.so

---

## Instagram — carousel post

**Attach:** Export the 7 slides from `demo-carousel.html` as 1080 × 1350 PNGs. Post as a single carousel.

### Caption (single block — Instagram allows ~2,200 chars):

> Apple Pay didn't make you re-enter your card every time.
>
> So why does every AI agent still make your users reconnect Gmail? 👇
>
> Building Agent Passport — portable app access for AI products. Connect once, bring approved access into every AI product you use.
>
> ✅ 5-line SDK
> ✅ 9,000+ apps
> ✅ MCP gateway built in
> ✅ Free during beta
>
> Built this weekend. Live now → passport.orchestrator.so (link in bio)
>
> Saving this for the founders shipping AI agent products right now. The OAuth wall isn't a feature — it's the activation killer.
>
> #AI #BuildInPublic #SaaS #StartupLife #DeveloperTools #OAuth #AIAgents

### First comment (post immediately after caption):

> If you're building an AI product that needs Gmail/Slack/Notion access, DM me — happy to help wire it in personally. SDK is `@orchestrator/passport` on npm.

### Stories (separate, post 2 hours after the carousel):

Slide 1: Screenshot of the carousel slide 1 (the Apple Pay hook) with sticker text "What we shipped this weekend" + countdown sticker for 24h after launch.
Slide 2: Screenshot of the carousel slide 5 (Agent Passport brand moment) with sticker "Tap for link" + link sticker to passport.orchestrator.so.
Slide 3: Screenshot of one DM from a user asking how it works — with their name covered — and your reply, captioned "first 24 hours."

---

## Hacker News — Show HN post

**Submit ~2 hours after Twitter goes out. Different audience, different stakes.**

**Title:**

> Show HN: Agent Passport – Apple Pay for AI agents (free during beta)

**Body:**

> Hi HN — I built Agent Passport this weekend.
>
> Premise: every AI agent product asks users to reconnect the same apps (Gmail, Slack, Notion, Calendar, GitHub). The OAuth wall is killing activation curves and most founders I've talked to are losing 30–50% of signups before reaching value.
>
> Agent Passport is a portable app-access layer. Users connect their apps once, group them into Profiles (Work, Engineering, Personal), and approve a Profile when an AI product asks for access. The provider that holds the actual OAuth token (Composio, Pipedream, Nango — provider-neutral by design) doesn't change; what changes is users don't reconnect every time.
>
> Architecturally it's a routing + consent control plane. Tokens stay with providers (we never hold them). We store the routing tuple `(passport, app, provider, account, scopes)` and proxy execution. We expose an MCP gateway URL per `(user, profile)` so any MCP-capable client (Claude Desktop, Cursor, agent SDKs) just works.
>
> The wallet analogy is the easiest way to grok it: Apple Pay didn't ask you to seek out a wallet — you met it at checkout. Same playbook here. Agent Passport launches inside AI products that embed it.
>
> Free during beta. SDK on npm: `@orchestrator/passport`. Source for the SDK and adapter interface is open; the hosted control plane is closed for now.
>
> https://passport.orchestrator.so
>
> Happy to answer questions.

**First-hour reply playbook:** Reply to every comment within 30 minutes. Don't be defensive. Don't argue with skeptics — answer their actual question. Especially watch for:

- "Why not just use Composio directly?" → Because you'd lock yourself in. We route across.
- "What about token portability?" → Not real, don't promise it, here's why.
- "Isn't this just an extra layer?" → Yes — and the wallet pattern proves layers compound when they save users repetition.

---

## Daily follow-up cadence — first 5 days post-launch

### Day 2 — early adopter highlight

**Attach:** Screenshot of an actual integration if you have one. Otherwise the dashboard with real activity.

> Day 2 update: [@user] integrated Agent Passport in 23 minutes.
>
> Their onboarding went from 4 OAuth screens to one Connect button. First sale was made before the user finished a coffee.
>
> Small sample. But the loop works.

### Day 3 — technical deep-dive thread

> The hardest design decision in Agent Passport: token portability.
>
> Spoiler: it's impossible across providers. Composio can't hand a Gmail token to Pipedream's vault. So we don't promise it.
>
> Here's the actual architecture and why it's not a directory →
>
> [thread continues with architecture details, attach the architecture diagram]

### Day 4 — the OAuth-vs-MCP explainer

**Attach:** The OAuth/MCP layer diagram from `passport-handoff.md` section 2.

> The most common question this week: "Wait, is Agent Passport managed OAuth, or is it MCP?"
>
> They're different layers. They stack.
>
> – Managed OAuth: how a user grants access to Gmail. (Composio, etc. handle this.)
> – MCP authentication: how an AI client proves it can use your tool server.
>
> Agent Passport sits between them. Here's the diagram →

### Day 5 — 48-hour metrics retro

> 48 hours after launching Agent Passport:
>
> ✅ [N] developer signups
> ✅ [N] Passports created
> ✅ [N] tools called via the gateway
> ✅ [N] GitHub stars
> ✅ [N] inbound DMs from builders
>
> What's next this week:
> – Pipedream adapter
> – Python SDK
> – Webhook signing
>
> Free during beta is staying free during beta. We'll tell you a month before that changes.

---

## Cross-post additions (only if launch goes well)

### Indie Hackers Show

Title: "Built Agent Passport in 48 hours — portable app access for AI products"
Body: Same as Show HN, slightly more personal. Mention this is your first product launch under Orchestrator.

### r/LocalLLaMA

Frame around agent autonomy. They care less about the OAuth wall, more about "how do I plug this into my existing agent loop." Lead with the MCP URL as the integration point.

### LangChain Discord

They're building this kind of thing themselves; post in #showcase rather than #general. Frame as a complement, not competitor.

### AI Engineer + Latent Space Discords

Drop a link in #show-and-tell with a one-line context. Don't oversell. Follow up with anyone who reacts.

---

## Brand voice notes — apply to every post

- Don't say "we're excited to announce" — ever
- Don't use "empowering," "seamless," "leverage"
- Don't use the word "solution" unless quoting someone else
- Use "ship," "build," "wire in," "drop in"
- Tweet like you're talking to one specific founder, not "the AI community"
- LinkedIn like you're explaining to a smart friend over coffee
- HN like you respect that the audience is going to find any inflated claim

The brand voice for Agent Passport is:
**Confident. Specific. Builder-to-builder. Slightly self-deprecating about the weekend timeline. Never marketing-coded.**
