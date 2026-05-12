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
      'No. Use Composio, Arcade, Nango, Pipedream, or your own OAuth stack. Agent Passport is the user-facing access layer above that stack.',
  },
  {
    question: 'What is the product?',
    answer:
      'A reusable work-app profile. Users approve the apps your agent needs, and your product receives a cleaner way to start with the right access.',
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
            <p className="eyebrow">For AI products that need user app access</p>
            <h1>Replace setup screens with one reusable app-access profile.</h1>
            <p className="lede">
              Agent Passport lets users approve Gmail, Slack, Calendar, Notion,
              GitHub, Linear, and other work apps through a profile they can reuse
              across supported AI products. Your agent gets to the first useful
              action faster.
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
          <h2>Before your agent can help, the user has to rebuild their work context.</h2>
          <div className="problemGrid">
            <article>
              <strong>The user hits a wall</strong>
              <p>
                They came to try the product. Instead, they have to connect Gmail,
                Slack, Calendar, Notion, GitHub, and whatever else the agent needs.
              </p>
            </article>
            <article>
              <strong>The product waits for access</strong>
              <p>
                Until those apps are approved, the agent has no context and cannot
                do the thing the user signed up for.
              </p>
            </article>
            <article>
              <strong>The same work repeats</strong>
              <p>
                Each AI product rebuilds its own connection flow, even when the
                user is approving the same work apps again.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="sectionInner">
          <p className="eyebrow">How it works</p>
          <h2>Agent Passport is the access step between your user and your agent.</h2>
          <div className="flow">
            <div>User has a Work profile</div>
            <div>Your app asks for the tools it needs</div>
            <div>User approves once</div>
            <div>Your agent starts with access ready</div>
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
            <h2>A familiar access button for the AI products people try next.</h2>
          </div>
          <div className="steps">
            <div>
              <span>01</span>
              <p>User connects the work apps they use every day.</p>
            </div>
            <div>
              <span>02</span>
              <p>Those apps become a reusable Passport profile.</p>
            </div>
            <div>
              <span>03</span>
              <p>Your AI product asks for the specific apps it needs.</p>
            </div>
            <div>
              <span>04</span>
              <p>The user can approve, review, and revoke from one place.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionInner builderGrid">
          <div>
            <p className="eyebrow">For builders</p>
            <h2>Why integrate it?</h2>
            <p>
              Because your product does not win when users are stuck connecting
              apps. Agent Passport gives you a clearer access step, a reusable
              profile users can recognize, and a path away from tying the whole
              user experience to one provider's connection flow.
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
          <h2>Bring the access experience. Keep your provider stack.</h2>
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
            <h2>Building an agent that needs a user's work apps?</h2>
            <p>
              Join if your users need to approve multiple apps before your product
              becomes useful. We are looking for a small number of builders to
              shape the first partner flow.
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
