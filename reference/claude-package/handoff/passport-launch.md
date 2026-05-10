# Agent Passport — Launch Playbook

**Launch window:** Sunday evening (~18:00–22:00 ET — peak dev Twitter)
**Goal:** 100 developer signups / 50 GitHub stars / 10 inbound conversations in 72h
**Channel mix:** Twitter primary, HN secondary, dev Discords tertiary

---

## 1. Target audience — exactly who we're after

We are NOT marketing to end users in week one. They will arrive later, through products that embed us. The first wave is **AI startup founders and developers** who are already building products that need user app access.

### The persona

**Who:** Solo founder or small founding team building an AI product that needs to read/write Gmail, Slack, Notion, Calendar, GitHub, etc. on user's behalf.

**Pain they have right now:**
- Onboarding wall is killing their activation curve
- Already integrated one OAuth provider and regretting the lock-in
- Their MCP server works for them but users have to authenticate to ten apps before it feels useful
- They've considered building this layer themselves but it's a side quest

**Where they hang out:**
- AI Twitter (specifically the "I'm building X with Claude/Cursor" crowd)
- Hacker News (Show HN)
- Indie Hackers
- AI Engineer Discord, Latent Space, OpenAI dev community
- r/LocalLLaMA, r/MachineLearning (less so — they're more research-y)
- YC Bookface (if you have access via network)

**What they'll do if convinced:**
- Try the SDK in a side project first
- Ship it into their main product within 1–2 weeks if it works
- Tell two friends if it actually saves them time

### The disqualified

Don't waste energy on:
- Enterprise IT buyers (week 12, not week 1)
- End users (they arrive via your customers)
- AI agent influencers / general AI Twitter (they retweet, they don't build)
- Anti-AI Twitter (won't convert, will spike negative engagement)

---

## 2. The launch funnel

```
TWITTER POST  →  LANDING PAGE  →  QUICKSTART  →  "Connect" demo  →  GITHUB / npm
   (hook)       (educate)        (try in 5 min)    (feel the magic)    (install)
```

Every step has a dropoff. We optimize each:

| Stage | Goal | Optimization |
|---|---|---|
| **Twitter post** | Stop the scroll | Strong visual + 1-line hook + screenshot |
| **Landing page** | Convince in 30s | Wallet analogy + Sarah walkthrough + code sample |
| **Quickstart** | First success in 5 min | One copy-paste block, working in localhost |
| **Connect demo** | "Holy shit moment" | Live Connect UI flow with real Gmail OAuth |
| **GitHub / npm** | Persistence | Clear roadmap, easy contribution path |

The hardest dropoff is Twitter → Landing. We over-invest in the tweet hook and the hero screenshot.

---

## 3. The launch tweets — ready to post

Pick 1 main launch tweet + 2-3 follow-up reply tweets in a thread. Stagger additional posts across the week.

### A. Main launch (the one to schedule for prime time)

**Hook variant 1 — wallet analogy (recommended):**

> Apple Pay, Link, Shop Pay — you connect once, you bring it everywhere.
>
> Why does every AI agent app still ask you to reconnect Gmail, Slack, Notion, and Calendar from scratch?
>
> Building Agent Passport. Portable app access for AI products. Free during beta.
>
> 🔗 passport.orchestrator.so
>
> [hero screenshot — Connect UI]

**Hook variant 2 — pain framing:**

> OAuth onboarding is the new login tax for AI apps.
>
> We're shipping Agent Passport this weekend: connect your apps once, bring approved access into every AI product.
>
> 9,000+ apps via Composio + others. SDK + MCP gateway. Free for now.
>
> [code sample screenshot]

**Hook variant 3 — three-line code:**

> Three lines of code between your AI app and 9,000 apps.
>
> ```
> const session = await passport.sessions.create({
>   userId: 'user_abc',
>   profile: 'work',
> });
> ```
>
> Agent Passport. Free during beta. Built this weekend.
>
> passport.orchestrator.so

### B. Reply / follow-up tweets (in the thread under the main tweet)

**Reply 1 — show the dashboard:**

> What users see after they create their Agent Passport: every connected app, every approved AI product, every action logged.
>
> Revoke anything in one click.
>
> [dashboard screenshot]

**Reply 2 — the architecture flex:**

> Agent Passport is provider-neutral by design.
>
> Composio holds your Gmail token. Pipedream holds your Slack. Nango holds your Salesforce.
>
> Passport stores the routing — never the tokens — and exposes one MCP URL.
>
> If a provider raises prices or goes down, we route around them.

**Reply 3 — for builders specifically:**

> If you're building an AI product right now: the SDK is open and free during beta.
>
> npm install @orchestrator/passport
>
> 5-minute quickstart → [link]
>
> DM me what you're building. I'll personally help you wire it in.

**Reply 4 — for the cold-start question (preempt the skeptic):**

> "But nobody has a Passport yet."
>
> Neither did anyone have Apple Pay on day one. Apple Pay launched into checkout flows, not into App Stores.
>
> Same playbook here. Agent Passport launches inside AI products that embed it.

### C. Standalone follow-up posts (next 5 days)

**Day 2 — share an early adopter:**

> Day 2 update: [Acme AI / first user] integrated Agent Passport in 23 minutes.
>
> They went from a 4-app OAuth wall to one Connect button.
>
> [screenshot of their before/after onboarding]

**Day 3 — technical deep-dive:**

> The hardest design decision in Agent Passport: token portability.
>
> Spoiler: it's impossible across providers. Composio can't hand a Gmail token to Pipedream's vault.
>
> So we don't promise it. We promise app-access portability through routing instead. Here's how:
>
> [thread]

**Day 5 — what we shipped this weekend:**

> 48-hour build retro:
>
> ✅ Landing + dashboard
> ✅ Composio adapter live
> ✅ MCP gateway working
> ✅ TypeScript SDK published
> ✅ React Connect UI
> ✅ 50 first beta users
>
> What's next this week:
> – Pipedream adapter
> – Python SDK
> – Webhook signing

---

## 4. Demo screenshots strategy

For the launch tweet and landing page hero, pre-rendered screenshots from the existing wireframes. **No video needed for v1** — devs are skeptical of polish anyway. Crisp screenshots beat over-produced demos.

### The five screenshots that matter

1. **`screenshot-connect.png`** — The Connect UI modal in its hero state.
   - Source: `demo-connect-ui.html` (top frame, the big one)
   - Use: main launch tweet, hero of landing
   - Caption when posted: "What users see when they click 'Connect Agent Passport'"

2. **`screenshot-code.png`** — Three lines of code that get an AI app to 9,000 apps.
   - Source: `passport-landing-v2.html` SDK section, "server.ts" tab
   - Use: code-tweet variant, developer audiences
   - Caption: "Three lines between your AI app and 9,000 apps"

3. **`screenshot-dashboard.png`** — User dashboard showing approved AI products + activity.
   - Source: `passport-product-v2.html` (Approved AI products view)
   - Use: reply tweet, "what users see after"
   - Caption: "What users see in their Agent Passport — every product, every action, one-click revoke"

4. **`screenshot-architecture.png`** — Provider-neutral routing diagram.
   - Source: `passport-landing-v2.html` architecture section
   - Use: technical credibility, reply tweet
   - Caption: "Provider-neutral. Composio for one app, Pipedream for another, Nango for the long tail. One SDK, swap underneath."

5. **`screenshot-mcp.png`** — Code snippet showing MCP URL going into Claude/ChatGPT.
   - Source: `passport-landing-v2.html` SDK section, "mcp.ts" tab
   - Use: MCP-specific audiences (Anthropic, OpenAI dev communities)
   - Caption: "MCP-native. One URL, scoped to one user, scoped to one profile."

### How to capture each

For each HTML file:
```bash
# Use Playwright or Puppeteer headless screenshots
# Or just open in Chrome at 1.5x device pixel ratio + screenshot the section
```

Recommended dimensions for Twitter: **1600×900** (16:9), **1200×675** (Twitter card ratio), or **1080×1350** (4:5 for mobile-first feeds).

For the **hero screenshot of the Connect UI**, capture only the top frame of `demo-connect-ui.html` at high DPI. Crop tight — modal + a bit of dark gradient background.

### The screenshot copywriting

Every screenshot gets posted with a single caption line. **No corporate tone.** Direct, specific, builder-to-builder:

- ✅ "What users see when they click 'Connect Agent Passport'"
- ❌ "Agent Passport empowers developers to provide a seamless onboarding experience"

---

## 5. Free tier messaging — be explicit

Devs don't trust pricing pages with a "Contact us" button. We say what's free, what isn't, when that changes.

### What to say in the launch

> **Free during beta. We'll tell you a month before that changes.**
>
> No credit card required. No usage caps until v1.0.
> When we turn on billing, the free tier stays for solo developers and side projects.

### Where to say it

- Pricing card on landing (if we add one — not mandatory for launch)
- Twitter launch tweet — once explicitly
- Quickstart docs — top of page, one sentence
- npm package readme — top
- GitHub repo description

### What NOT to say

Avoid these — they kill trust:
- "Currently in beta" (sounds like vaporware)
- "Free for early users" (implies trap)
- "Pricing TBD" (looks unprepared)
- "Generous free tier" (every closed-source startup says this)

---

## 6. Quickstart link — what they click after the tweet

The tweet drives them to the landing page. The landing page must have a single dominant CTA that reads "Quickstart" or "5-minute setup" — not "Sign up" or "Get started." Devs want to read code before they create an account.

### The quickstart page itself

URL: `passport.orchestrator.so/quickstart` (or `/docs/quickstart`)

Content order:
1. **One paragraph** — what Agent Passport does (assume they came from Twitter)
2. **Install line** — `npm install @orchestrator/passport`
3. **Create an account link** — gets them an API key in 30 seconds (Clerk or Supabase Auth)
4. **First request** — copy-paste server code that creates a session
5. **Embed the React component** — copy-paste frontend code
6. **Test it** — link to the live Connect UI demo
7. **What's next** — link to full SDK docs

The whole page should be readable in 90 seconds. Working integration in 5 minutes.

---

## 7. First 48 hours — followup playbook

### Hour 0 — launch tweet posted
- Pin to profile
- Post in 1-2 dev Discords (don't spam)
- DM 5 specific founders who'd care

### Hour 0–4 — engage every reply
- Don't just like. Reply with substance.
- If someone asks a question, answer it on-thread (it educates the next reader)
- If someone says "this looks cool", ask what they're building

### Hour 4–12 — Show HN post
- Title: "Show HN: Agent Passport – Portable app access for AI products"
- Body: A short paragraph + the wallet analogy + free for now + GitHub link
- Reply to every comment for the first 4 hours

### Hour 12–24 — niche cross-posts
- Indie Hackers Show
- r/LocalLLaMA (if framed right — emphasize agent autonomy)
- LangChain Discord (relevant — they have a feature like this)
- Latent Space Discord
- AI Engineer Discord

### Hour 24–48 — the followup tweet
- Quote-tweet the original with first metrics ("X people have created their Agent Passport in 24h")
- Post screenshot of usage if you can
- Address the most-asked question publicly

### Hour 48 — iterate
- What feature did people ask for most? Build that next.
- Who tried it and got stuck? Reach out personally.
- What's the most retweeted thing? Make it the new landing hero.

---

## 8. Metrics to track during launch

Set up before launch — Plausible/PostHog free tier is fine.

| Metric | Target by EOD Sunday | How |
|---|---|---|
| Tweet impressions | 50K+ | Twitter Analytics |
| Landing page visits | 2K+ | PostHog |
| Quickstart completions | 100+ | PostHog event `connect.completed` |
| Account creations | 50+ | Supabase user count |
| API keys issued | 50+ | DB count |
| First successful tool call | 20+ | Audit log count |
| GitHub stars | 100+ | GitHub Insights |
| Inbound DMs | 10+ | Twitter, manually counted |

The lead indicator that matters most: **`connect.completed` events** — that's the wallet flywheel firing. If we hit 100 of those by Monday morning, we have product-market fit signal.

---

## 9. Things that will go wrong — pre-mortem

**A. Landing page goes down under traffic.**
Vercel scales fine for static. The API routes are the risk. Cache aggressively, set sensible rate limits, have a status page ready.

**B. Composio rate-limits us.**
Have their support contact ready. Reach out before launching. Ask for a beta-friendly tier.

**C. Someone tries to use it for spam.**
Rate-limit per Passport. Don't allow more than 100 actions/hour during beta. Manual review for high-volume accounts.

**D. A skeptic posts a "this is just X" hot take.**
Don't argue. Reply once with the wallet analogy. Move on. The skeptic isn't your customer; the lurker reading their tweet might be.

**E. Composio or another provider tweets something unfriendly.**
Stay above it. Reply with: "We love what they've built — that's why we route to them. Provider-neutral means our users win regardless of which provider stays competitive."

**F. The Connect flow breaks for a real user during launch.**
Have a Loom recorded RIGHT NOW showing the working flow. If live breaks, post the Loom in reply: "Working hard on this one — here's what it looks like when working. DM me if you hit it."

---

## 10. The post-launch follow-through

This launch isn't a one-shot. The Twitter post is the trailhead. The actual work is the next two weeks of converting attention into early users into committed integrators.

Daily for 14 days post-launch:
- One Twitter post (technical learning, user story, or roadmap update)
- One DM to a specific potential user
- One PR review or issue triage on GitHub
- One blocker removed for an existing integrator

That's the real loop. The launch gets attention. The follow-through gets adoption.

---

## Appendix A — copy snippets ready to paste

### npm package readme — first 5 lines

> # @orchestrator/passport
>
> Portable app access for AI products. Connect your users' Gmail, Slack, Notion, Calendar, GitHub once — bring approved access into every AI product they touch.
>
> Free during beta. Open spec. Provider-neutral.
>
> ```bash
> npm install @orchestrator/passport
> ```

### GitHub repo description

> Portable app-access layer for AI products. Connect once, use everywhere. Free during beta.

### Footer / about section everywhere

> Agent Passport is built by Orchestrator. We don't store your tokens — credential providers do. We route, govern, and audit.

### One-line elevator

> Agent Passport is Apple Pay for AI agents — your users connect Gmail, Slack, and Notion once, then bring approved access into every AI product they touch.
