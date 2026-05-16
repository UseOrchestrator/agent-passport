type WaitlistPayload = {
  email?: string;
  provider?: string;
  building?: string;
  pain?: string;
  call_opt_in?: boolean;
  source?: string;
};

type JsonResponse = {
  status?: 'joined' | 'already_joined';
  emailStatus?: 'sent' | 'skipped' | 'failed';
  error?: string;
};

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: JsonResponse) => void;
  setHeader: (key: string, value: string) => void;
};

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom =
  process.env.AGENT_PASSPORT_EMAIL_FROM ?? 'Agent Passport <passport@orchestrator.so>';

function normalizePayload(body: unknown): Required<WaitlistPayload> {
  const payload = body && typeof body === 'object' ? (body as WaitlistPayload) : {};
  const email = String(payload.email ?? '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    throw new Error('Enter a valid email address.');
  }

  return {
    email,
    provider: String(payload.provider ?? 'Not specified'),
    building: String(payload.building ?? 'Not specified'),
    pain: String(payload.pain ?? 'Not specified'),
    call_opt_in: Boolean(payload.call_opt_in),
    source: String(payload.source ?? 'agent-passport'),
  };
}

async function saveWaitlist(payload: Required<WaitlistPayload>): Promise<'joined' | 'already_joined'> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Waitlist storage is not configured.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/agent_passport_waitlist`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    return 'already_joined';
  }

  if (!response.ok) {
    throw new Error('The waitlist request could not be saved.');
  }

  return 'joined';
}

function textEmail(): string {
  return `You are on the Agent Passport list.

Agent Passport is the connection passport for AI apps: a way for users to bring reusable app access into agent products without reconnecting the same tools every time.

The repo is open source:
https://github.com/UseOrchestrator/agent-passport

Good next steps:
- Star or fork the repo
- Try the demo
- Open an issue for the integration flow your app needs
- Send an agent-authored PR

We are building this agent-first: small fixes, adapters, docs, and demos should be easy to contribute and fast to review.

Agent Passport
by Orchestrator
https://passport.orchestrator.so`;
}

function htmlEmail(): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#171717">
      <h1 style="font-size:24px;margin:0 0 12px">You joined Agent Passport</h1>
      <p>Agent Passport is the connection passport for AI apps: a way for users to bring reusable app access into agent products without reconnecting the same tools every time.</p>
      <p><a href="https://github.com/UseOrchestrator/agent-passport">Star or fork the repo</a>, try the demo, open an issue for the integration flow your app needs, or send an agent-authored PR.</p>
      <p>We are building this agent-first: small fixes, adapters, docs, and demos should be easy to contribute and fast to review.</p>
      <p style="margin-top:24px">Agent Passport<br />by Orchestrator<br /><a href="https://passport.orchestrator.so">passport.orchestrator.so</a></p>
    </div>
  `;
}

async function sendWelcomeEmail(email: string): Promise<'sent' | 'skipped' | 'failed'> {
  if (!resendApiKey) {
    return 'skipped';
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: 'You joined Agent Passport',
      text: textEmail(),
      html: htmlEmail(),
    }),
  });

  return response.ok ? 'sent' : 'failed';
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const payload = normalizePayload(request.body);
    const status = await saveWaitlist(payload);
    const emailStatus = status === 'joined' ? await sendWelcomeEmail(payload.email) : 'skipped';

    response.status(200).json({ status, emailStatus });
  } catch (error) {
    response.status(400).json({
      error: error instanceof Error ? error.message : 'Something went wrong.',
    });
  }
}
