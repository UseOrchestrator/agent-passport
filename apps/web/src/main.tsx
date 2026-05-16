import React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import GitHubButton from 'react-github-btn';
import { motion, useReducedMotion } from 'motion/react';
import { track } from './analytics';
import './styles.css';

const apps = ['Gmail', 'Slack', 'Notion', 'Calendar', 'GitHub', 'Linear'];
const providers = ['Composio', 'Arcade', 'Nango', 'Pipedream'];
const providerOptions = [
  'Composio',
  'Arcade',
  'Nango',
  'Pipedream',
  'Custom OAuth',
  'Not sure yet',
];
const buildingOptions = [
  'Internal agent',
  'Customer-facing agent',
  'Vertical SaaS',
  'Developer tool',
];
const painOptions = [
  'Too many OAuth screens',
  'Provider lock-in',
  'Users drop off',
  'Hard to manage access',
];
const faqs = [
  {
    question: 'Do you replace Composio?',
    answer:
      'No. Use Composio, Arcade, Nango, Pipedream, or your own OAuth stack. Agent Passport is the user-facing access layer above that stack.',
  },
  {
    question: 'What is the product?',
    answer:
      'A connection passport. Users create purpose-specific profiles, then approve the right connection set for the right agent workflow.',
  },
  {
    question: 'Who should join now?',
    answer:
      'AI product builders whose users need Gmail, Slack, Calendar, Notion, GitHub, Linear, or other work apps connected before the product becomes useful.',
  },
];

type WaitlistPayload = {
  email: string;
  provider: string;
  building: string;
  pain: string;
  call_opt_in: boolean;
  source: string;
};

type WaitlistResponse = {
  status: 'joined' | 'already_joined';
  emailStatus?: 'sent' | 'skipped' | 'failed';
};

async function joinWaitlist(payload: WaitlistPayload): Promise<WaitlistResponse> {
  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as
    | WaitlistResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error('error' in body && body.error ? body.error : 'Could not save your email.');
  }

  return body as WaitlistResponse;
}

function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const [heroStatus, setHeroStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [heroMessage, setHeroMessage] = useState('');
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const fadeUp = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.48, ease: 'easeOut' as const },
      };

  useEffect(() => {
    track('agent_passport_page_viewed');
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus('loading');
    setMessage('');

    const form = new FormData(formElement);
    const buildingPreset = String(form.get('buildingPreset') || '');
    const buildingDetail = String(form.get('buildingDetail') || '');
    const selectedProviders = form
      .getAll('provider')
      .map(String)
      .filter(Boolean);
    const painDetail = String(form.get('painDetail') || '');

    if (selectedProviders.length === 0) {
      setStatus('error');
      setMessage('Choose at least one connection provider.');
      return;
    }

    if (selectedPains.length === 0) {
      setStatus('error');
      setMessage('Choose at least one connection pain.');
      return;
    }

    const payload = {
      email: String(form.get('email') || ''),
      provider: selectedProviders.join(', '),
      building: [buildingPreset, buildingDetail].filter(Boolean).join(' — '),
      pain: [
        selectedPains.map((pain, index) => `${index + 1}. ${pain}`).join('; '),
        painDetail,
      ]
        .filter(Boolean)
        .join(' — '),
      call_opt_in: form.get('callOptIn') === 'on',
      source: 'agent-passport',
    };

    try {
      const result = await joinWaitlist(payload);

      formElement.reset();
      setSelectedPains([]);
      setStatus('success');
      setMessage(
        result.status === 'already_joined'
          ? 'You are already on the Agent Passport waitlist.'
          : 'You are on the Agent Passport waitlist. Check your email for the repo and next steps.',
      );
      track('agent_passport_form_submitted', {
        provider: payload.provider,
        call_opt_in: payload.call_opt_in,
        email_status: result.emailStatus ?? 'unknown',
      });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
      track('agent_passport_form_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async function handleHeroSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setHeroStatus('loading');
    setHeroMessage('');

    const form = new FormData(formElement);
    const email = String(form.get('email') || '');
    const intent = String(form.get('intent') || 'Interested in Agent Passport');

    try {
      const result = await joinWaitlist({
        email,
        provider: 'Not specified',
        building: intent,
        pain: 'Hero signup',
        call_opt_in: false,
        source: 'agent-passport-hero',
      });

      formElement.reset();
      setHeroExpanded(false);
      setHeroStatus('success');
      setHeroMessage(
        result.status === 'already_joined'
          ? 'You are already on the Agent Passport list.'
          : 'You are on the Agent Passport list. Check your email for the repo and next steps.',
      );
      track('agent_passport_hero_email_submitted', {
        intent,
        email_status: result.emailStatus ?? 'unknown',
      });
    } catch (error) {
      setHeroStatus('error');
      setHeroMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  }

  function togglePain(option: string) {
    setSelectedPains((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      }

      if (current.length >= 2) {
        return [current[1], option];
      }

      return [...current, option];
    });
  }

  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Primary">
          <div className="mark">
            <span>Agent Passport</span>
            <small>
              by{' '}
              <a
                className="orchestratorLink"
                href="https://orchestrator.so"
                title="https://orchestrator.so"
              >
                Orchestrator
              </a>
            </small>
          </div>
          <div className="githubStar" aria-label="Star Agent Passport on GitHub">
            <GitHubButton
              href="https://github.com/UseOrchestrator/agent-passport"
              data-size="large"
              data-show-count="true"
              aria-label="Star UseOrchestrator/agent-passport on GitHub"
            >
              Star
            </GitHubButton>
          </div>
          <a className="navCta" href="#waitlist">Join the standard</a>
        </nav>

        <div className="heroGrid">
          <motion.div className="heroCopy" {...fadeUp}>
            <div className="signalRow" aria-label="Project signals">
              <span>Open source</span>
              <span>Connection passport standard</span>
            </div>
            <p className="eyebrow">For AI products that need user app access</p>
            <h1>The connection passport for AI apps.</h1>
            <p className="lede">
              Agent Passport lets users bring reusable sets of app connections
              into your product, so your agent starts with the right tools and
              permissions instead of another setup wall.
            </p>
            <form className="heroSignup" onSubmit={handleHeroSubmit}>
              <div className="heroSignupRow">
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Work email"
                  onFocus={() => setHeroExpanded(true)}
                />
                <button type="submit" disabled={heroStatus === 'loading'}>
                  {heroStatus === 'loading' ? 'Joining...' : 'Join'}
                </button>
              </div>
              {heroExpanded ? (
                <select name="intent" defaultValue="I want to integrate this">
                  <option>I want to integrate this</option>
                  <option>I want to contribute</option>
                  <option>I want to follow the standard</option>
                  <option>I am a provider / integration partner</option>
                </select>
              ) : null}
              {heroMessage ? (
                <p className={heroStatus === 'error' ? 'formError' : 'formSuccess'}>
                  {heroMessage}
                </p>
              ) : null}
            </form>
            <div className="actions">
              <a
                className="primary"
                href="#waitlist"
                onClick={() => track('agent_passport_primary_cta_clicked')}
              >
                Join the standard
              </a>
              <a
                className="secondary"
                href="#how"
                onClick={() => track('agent_passport_secondary_cta_clicked')}
              >
                How it works
              </a>
            </div>
          </motion.div>

          <motion.div
            className="productShot"
            aria-label="Agent Passport product preview"
            {...fadeUp}
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 0.52, delay: 0.08, ease: 'easeOut' as const }
            }
          >
            <div className="windowBar">
              <span />
              <span />
              <span />
            </div>
            <div className="passportCard">
              <div>
                <p className="smallLabel">Connection profile</p>
                <h2>6 connected apps</h2>
              </div>
              <div className="appGrid">
                {apps.map((app) => (
                  <div className="appPill" key={app}>
                    <span>{app.slice(0, 1)}</span>
                    {app}
                  </div>
                ))}
              </div>
              <div className="approval">
                <p>Acme AI wants access to your Sales Ops profile.</p>
                <button type="button">Approve selected apps</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section className="band" {...fadeUp}>
        <div className="sectionInner">
          <p className="eyebrow">The problem</p>
          <h2>Before your agent can help, the user has to provision the right connections.</h2>
          <div className="problemGrid">
            <article>
              <strong>The user hits a wall</strong>
              <p>
                They came to try the product. Instead, they have to choose apps,
                approve scopes, and rebuild context before anything useful happens.
              </p>
            </article>
            <article>
              <strong>The product waits for access</strong>
              <p>
                Until the right connection set is approved, the agent has no tools,
                no context, and no way to do the job.
              </p>
            </article>
            <article>
              <strong>The same work repeats</strong>
              <p>
                Each AI product builds its own connection flow, even when users
                need the same work apps arranged for different jobs.
              </p>
            </article>
          </div>
        </div>
      </motion.section>

      <motion.section className="section" id="how" {...fadeUp}>
        <div className="sectionInner">
          <p className="eyebrow">How it works</p>
          <h2>Agent Passport turns app access into reusable connection profiles.</h2>
          <div className="flow">
            <div>User has profiles like Work or Sales Ops</div>
            <div>Your app asks for the profile it needs</div>
            <div>User approves the connection set</div>
            <div>Your agent starts with scoped access</div>
          </div>
          <div className="providers">
            {providers.map((provider) => (
              <span key={provider}>{provider}</span>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="darkBand" {...fadeUp}>
        <div className="sectionInner storyGrid">
          <div>
            <p className="eyebrow inverse">The user promise</p>
            <h2>One passport. Multiple profiles. Scoped access for each workflow.</h2>
          </div>
          <div className="steps">
            <div>
              <span>01</span>
              <p>User connects the work apps they use every day.</p>
            </div>
            <div>
              <span>02</span>
              <p>They group those connections into profiles like Work, Sales, or Client A.</p>
            </div>
            <div>
              <span>03</span>
              <p>Your AI product requests the profile or connection set it needs.</p>
            </div>
            <div>
              <span>04</span>
              <p>The user can approve, review, and revoke scoped access from one place.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="section" {...fadeUp}>
        <div className="sectionInner builderGrid">
          <div>
            <p className="eyebrow">For builders</p>
            <h2>Why integrate it?</h2>
            <p>
              Because connection setup is becoming part of activation. Agent
              Passport gives your users a recognizable way to provision the right
              app set for your agent, while your product keeps its provider stack
              and gets cleaner permissioning, reuse, and access control. The goal
              is an open-source standard that every AI app can support.
            </p>
          </div>
          <div className="codePanel">
            <div className="codeTop">server.ts</div>
            <pre>{`const session = await passport.sessions.create({
  userId: 'user_abc',
  profile: 'work',
  redirectUrl: 'https://app.com/done',
});`}</pre>
          </div>
        </div>
      </motion.section>

      <motion.section className="band" {...fadeUp}>
        <div className="sectionInner">
          <p className="eyebrow">The product boundary</p>
          <h2>Bring the connection passport. Keep your provider stack.</h2>
          <div className="faqGrid">
            {faqs.map((item) => (
              <article key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="band" id="waitlist" {...fadeUp}>
        <div className="sectionInner split">
          <div>
            <p className="eyebrow">Join the standard</p>
            <h2>Building an agent that needs a user's work apps?</h2>
            <p>
              Join if your users need different sets of app connections for
              different agent workflows. We are looking for a small number of
              builders, users, and contributors to shape the open-source connection
              passport for AI apps.
            </p>
          </div>
          <form className="waitlistForm" onSubmit={handleSubmit}>
            <label>
              Work email
              <input required type="email" name="email" placeholder="you@company.com" />
            </label>

            <fieldset>
              <legend>Connection providers</legend>
              <div className="chipGrid providerChips">
                {providerOptions.map((option) => (
                  <label className="choiceChip" key={option}>
                    <input type="checkbox" name="provider" value={option} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>What are you building?</legend>
              <div className="chipGrid">
                {buildingOptions.map((option) => (
                  <label className="choiceChip" key={option}>
                    <input required type="radio" name="buildingPreset" value={option} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <input
                name="buildingDetail"
                placeholder="Optional: AI sales agent, legal copilot..."
              />
            </fieldset>

            <fieldset>
              <legend>Biggest connection pain <em>choose up to 2</em></legend>
              <div className="chipGrid">
                {painOptions.map((option) => {
                  const selectedIndex = selectedPains.indexOf(option);

                  return (
                  <label className="choiceChip" key={option}>
                    <input
                      checked={selectedIndex > -1}
                      name="painPreset"
                      type="checkbox"
                      value={option}
                      onChange={() => togglePain(option)}
                    />
                    <span>
                      {selectedIndex > -1 ? `${selectedIndex + 1}. ` : ''}
                      {option}
                    </span>
                  </label>
                  );
                })}
              </div>
              <input
                name="painDetail"
                placeholder="Optional: add a sentence if there is more context"
              />
            </fieldset>

            <label className="checkRow">
              <input type="checkbox" name="callOptIn" />
              <span>I am open to a 15-minute discovery call.</span>
            </label>
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Submitting...' : 'Join waitlist'}
            </button>
            {message ? (
              <p className={status === 'error' ? 'formError' : 'formSuccess'}>
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </motion.section>
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
