import React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
  'Users drop off',
  'Hard to manage access',
  'Provider lock-in',
];
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const faqs = [
  {
    question: 'Is this a Composio replacement?',
    answer:
      'Not at launch. Agent Passport is the consent, profile, and routing layer above providers. Providers can still hold credentials and execute app actions.',
  },
  {
    question: 'Do tokens move between providers?',
    answer:
      'No. OAuth tokens are usually tied to the provider/app that created them. Agent Passport should promise portable app access, not magical token portability.',
  },
  {
    question: 'Who is this for first?',
    answer:
      'AI product builders whose users need to connect multiple work apps before the product becomes useful.',
  },
];

function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    track('agent_passport_page_viewed');
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus('loading');
    setMessage('');

    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus('error');
      setMessage('Waitlist storage is not configured in this environment yet.');
      track('agent_passport_form_failed', { reason: 'missing_supabase_env' });
      return;
    }

    const form = new FormData(formElement);
    const buildingPreset = String(form.get('buildingPreset') || '');
    const buildingDetail = String(form.get('buildingDetail') || '');
    const painPreset = String(form.get('painPreset') || '');
    const painDetail = String(form.get('painDetail') || '');
    const payload = {
      email: String(form.get('email') || ''),
      provider: String(form.get('provider') || ''),
      building: [buildingPreset, buildingDetail].filter(Boolean).join(' — '),
      pain: [painPreset, painDetail].filter(Boolean).join(' — '),
      call_opt_in: form.get('callOptIn') === 'on',
      source: 'agent-passport',
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/agent_passport_waitlist`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This email is already on the Agent Passport waitlist.');
        }

        throw new Error('The waitlist request could not be saved.');
      }

      formElement.reset();
      setStatus('success');
      setMessage('You are on the Agent Passport waitlist.');
      track('agent_passport_form_submitted', {
        provider: payload.provider,
        call_opt_in: payload.call_opt_in,
      });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
      track('agent_passport_form_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Primary">
          <div className="mark">Agent Passport</div>
          <a href="#waitlist">Join waitlist</a>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Portable app access for AI agents</p>
            <h1>Stop making users reconnect the same apps in every AI product.</h1>
            <p className="lede">
              Agent Passport is a validation-stage app access layer for AI
              product builders. Users bring approved access to Gmail, Slack,
              Notion, Calendar, GitHub, and more without repeating the whole
              setup every time.
            </p>
            <div className="actions">
              <a
                className="primary"
                href="#waitlist"
                onClick={() => track('agent_passport_primary_cta_clicked')}
              >
                Request beta access
              </a>
              <a
                className="secondary"
                href="#how"
                onClick={() => track('agent_passport_secondary_cta_clicked')}
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="productShot" aria-label="Agent Passport product preview">
            <div className="windowBar">
              <span />
              <span />
              <span />
            </div>
            <div className="passportCard">
              <div>
                <p className="smallLabel">Work profile</p>
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
                <p>Acme AI wants access to your Work profile.</p>
                <button type="button">Approve selected apps</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="sectionInner">
          <p className="eyebrow">The problem</p>
          <h2>AI app onboarding is becoming an OAuth wall.</h2>
          <div className="problemGrid">
            <article>
              <strong>For users</strong>
              <p>
                Every new AI product asks for Gmail, Slack, Notion, Calendar,
                and GitHub again. The user repeats setup before they get value.
              </p>
            </article>
            <article>
              <strong>For builders</strong>
              <p>
                Connection providers handle credentials, but founders still own
                the onboarding UX, consent language, status states, and drop-off.
              </p>
            </article>
            <article>
              <strong>For teams</strong>
              <p>
                It is hard to see which AI products have access, what they can
                do, and how to revoke that access later.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="sectionInner">
          <p className="eyebrow">How it works</p>
          <h2>Agent Passport owns consent and routing. Providers keep credentials.</h2>
          <div className="flow">
            <div>User connects apps</div>
            <div>Agent Passport maps approved access</div>
            <div>Provider holds tokens</div>
            <div>AI app calls approved tools</div>
          </div>
          <div className="providers">
            {providers.map((provider) => (
              <span key={provider}>{provider}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="darkBand">
        <div className="sectionInner storyGrid">
          <div>
            <p className="eyebrow inverse">End user flow</p>
            <h2>One profile, reused across supported AI products.</h2>
          </div>
          <div className="steps">
            <div>
              <span>01</span>
              <p>User connects Gmail, Slack, Notion, Calendar, GitHub, and Linear.</p>
            </div>
            <div>
              <span>02</span>
              <p>User groups those apps into a Work profile.</p>
            </div>
            <div>
              <span>03</span>
              <p>A new AI product asks to use that approved profile.</p>
            </div>
            <div>
              <span>04</span>
              <p>User can later see and revoke access from one control surface.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionInner builderGrid">
          <div>
            <p className="eyebrow">For builders</p>
            <h2>The wedge is onboarding, not ideology.</h2>
            <p>
              Most teams will pick one connection provider and move on. Agent
              Passport only matters if it makes the product flow better than
              direct provider integration.
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
      </section>

      <section className="band">
        <div className="sectionInner">
          <p className="eyebrow">Questions we are testing</p>
          <h2>This only deserves to exist if builders feel the pain.</h2>
          <div className="faqGrid">
            {faqs.map((item) => (
              <article key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="waitlist">
        <div className="sectionInner split">
          <div>
            <p className="eyebrow">Validation launch</p>
            <h2>We are looking for AI product builders with real app-access pain.</h2>
            <p>
              Join if your product needs users to connect work apps before your
              agent can be useful. The first step is discovery and design
              partners, not pretending the full platform is already finished.
            </p>
          </div>
          <form className="waitlistForm" onSubmit={handleSubmit}>
            <label>
              Work email
              <input required type="email" name="email" placeholder="you@company.com" />
            </label>

            <fieldset>
              <legend>Connection provider</legend>
              <div className="chipGrid providerChips">
                {providerOptions.map((option) => (
                  <label className="choiceChip" key={option}>
                    <input required type="radio" name="provider" value={option} />
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
              <legend>Biggest connection pain</legend>
              <div className="chipGrid">
                {painOptions.map((option) => (
                  <label className="choiceChip" key={option}>
                    <input required type="radio" name="painPreset" value={option} />
                    <span>{option}</span>
                  </label>
                ))}
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
      </section>
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
