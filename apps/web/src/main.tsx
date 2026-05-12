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
  'Provider lock-in',
  'Users drop off',
  'Hard to manage access',
];
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const faqs = [
  {
    question: 'Do you replace Composio?',
    answer:
      'No. The first version is designed to sit above connection providers. They can still hold tokens and run tool calls. Agent Passport focuses on the user-facing access profile, consent, and handoff.',
  },
  {
    question: 'Do users move tokens between apps?',
    answer:
      'No. OAuth tokens are usually tied to the app or provider that created them. The useful product is portable approved access, not pretending raw tokens can magically move everywhere.',
  },
  {
    question: 'Who should join now?',
    answer:
      'AI product builders whose users need Gmail, Slack, Calendar, Notion, GitHub, Linear, or other work apps connected before the product becomes useful.',
  },
];

function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const [selectedPains, setSelectedPains] = useState<string[]>([]);

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
      setSelectedPains([]);
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
            <small>by Orchestrator</small>
          </div>
          <a href="#waitlist">Join waitlist</a>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Agent Passport by Orchestrator</p>
            <h1>Let users bring their connected apps into your AI product.</h1>
            <p className="lede">
              AI products become useful after users connect Gmail, Slack,
              Calendar, Notion, GitHub, Linear, and the rest of their work stack.
              Agent Passport is a shared access layer so that setup can become
              reusable instead of starting from zero in every product.
            </p>
            <div className="actions">
              <a
                className="primary"
                href="#waitlist"
                onClick={() => track('agent_passport_primary_cta_clicked')}
              >
                Request design partner access
              </a>
              <a
                className="secondary"
                href="#how"
                onClick={() => track('agent_passport_secondary_cta_clicked')}
              >
                How it works
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
          <h2>The first session in an AI app is turning into app-connection setup.</h2>
          <div className="problemGrid">
            <article>
              <strong>Users repeat the same setup</strong>
              <p>
                Every new AI product asks for Gmail, Slack, Notion, Calendar,
                GitHub, and Linear again. The user is forced to rebuild the same
                work context before the agent can help.
              </p>
            </article>
            <article>
              <strong>Builders lose activation</strong>
              <p>
                Connection providers solve credential plumbing, but product teams
                still own the onboarding wall, consent UX, app status, and drop-off
                before the first useful action.
              </p>
            </article>
            <article>
              <strong>Access gets fragmented</strong>
              <p>
                As people try more AI products, access lives in more places.
                Users and teams need a clearer way to see what is connected and
                revoke it later.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="sectionInner">
          <p className="eyebrow">How it works</p>
          <h2>A reusable app-access profile for the AI products users trust.</h2>
          <div className="flow">
            <div>User creates an app-access profile</div>
            <div>Your product requests the apps it needs</div>
            <div>User approves the access</div>
            <div>Your agent starts with context ready</div>
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
            <p className="eyebrow inverse">The user promise</p>
            <h2>Connect your work stack once. Reuse it wherever Agent Passport is supported.</h2>
          </div>
          <div className="steps">
            <div>
              <span>01</span>
              <p>User connects the work apps their agents need.</p>
            </div>
            <div>
              <span>02</span>
              <p>User keeps those approvals in a reusable Work profile.</p>
            </div>
            <div>
              <span>03</span>
              <p>A supported AI product asks for the specific access it needs.</p>
            </div>
            <div>
              <span>04</span>
              <p>User can later review and revoke access from one place.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionInner builderGrid">
          <div>
            <p className="eyebrow">For builders</p>
            <h2>Ship the first useful action sooner.</h2>
            <p>
              Agent Passport is only worth integrating if it helps users reach value
              faster than a direct provider flow. The goal is fewer repeated
              connection screens, clearer consent, and a reusable access pattern
              users can recognize across AI products.
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
          <p className="eyebrow">The product boundary</p>
          <h2>We are not selling magic token portability.</h2>
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
            <p className="eyebrow">Design partners</p>
            <h2>Building an AI product where app setup blocks activation?</h2>
            <p>
              Join the early list if your users need to connect multiple work apps
              before your agent becomes useful. We are looking for a small number
              of builders to shape the first partner flow.
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
      </section>
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
