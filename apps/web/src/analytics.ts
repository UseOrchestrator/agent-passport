type AnalyticsEvent =
  | 'agent_passport_page_viewed'
  | 'agent_passport_primary_cta_clicked'
  | 'agent_passport_secondary_cta_clicked'
  | 'agent_passport_form_started'
  | 'agent_passport_form_submitted'
  | 'agent_passport_form_failed'
  | 'agent_passport_hero_email_submitted';

type AnalyticsProperties = Record<string, string | number | boolean | null>;

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com';

export function track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (!posthogKey || typeof navigator === 'undefined') {
    return;
  }

  const body = JSON.stringify({
    api_key: posthogKey,
    event,
    properties: {
      distinct_id: getDistinctId(),
      product: 'agent-passport',
      ...properties,
    },
  });

  navigator.sendBeacon(`${posthogHost}/capture/`, body);
}

function getDistinctId() {
  const key = 'agent-passport-visitor-id';
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}
