export type ProviderName =
  | 'composio'
  | 'nango'
  | 'arcade'
  | 'pipedream'
  | 'custom';

export type ConnectionStatus = 'ready' | 'needs_auth' | 'revoked' | 'error';
export type AccessGrantStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface ProviderHandoff {
  type: string;
  [key: string]: unknown;
}

export interface PassportConnection {
  app: string;
  provider: ProviderName | string;
  scopes: string[];
  status: ConnectionStatus;
  handoff: ProviderHandoff;
}

export interface PassportProfile {
  id: string;
  name: string;
}

export interface AccessGrant {
  id: string;
  accessRequestId: string;
  status: AccessGrantStatus;
  profile: PassportProfile;
  connections: PassportConnection[];
}

export interface CreateAccessRequestInput {
  externalUserId: string;
  requestedApps: string[];
  purpose: string;
  redirectUrl?: string;
  requestedProfile?: string;
  providerPreference?: ProviderName | string;
}

export interface AccessRequest {
  id: string;
  approvalUrl: string;
  status: AccessGrantStatus;
}

export interface AgentPassportOptions {
  apiKey?: string;
  baseUrl?: string;
}

function createId(prefix: string): string {
  const random =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

function createApprovalUrl(
  baseUrl: string,
  requestId: string,
  input: CreateAccessRequestInput,
): string {
  const params = new URLSearchParams({
    requestId,
    externalUserId: input.externalUserId,
    purpose: input.purpose,
  });

  if (input.redirectUrl) {
    params.set('redirectUrl', input.redirectUrl);
  }

  if (input.requestedProfile) {
    params.set('profile', input.requestedProfile);
  }

  if (input.providerPreference) {
    params.set('provider', input.providerPreference);
  }

  for (const app of input.requestedApps) {
    params.append('app', app);
  }

  return `${baseUrl}/connect?${params.toString()}`;
}

function createMockGrant(accessRequestId: string): AccessGrant {
  return {
    id: createId('grant'),
    accessRequestId,
    status: 'approved',
    profile: {
      id: 'profile_work',
      name: 'Work',
    },
    connections: [
      {
        app: 'gmail',
        provider: 'composio',
        scopes: ['gmail.readonly'],
        status: 'ready',
        handoff: {
          type: 'composio_connected_account',
          entityId: 'entity_demo',
          connectedAccountId: 'ca_gmail_demo',
        },
      },
      {
        app: 'slack',
        provider: 'composio',
        scopes: ['channels:read', 'chat:write'],
        status: 'ready',
        handoff: {
          type: 'composio_connected_account',
          entityId: 'entity_demo',
          connectedAccountId: 'ca_slack_demo',
        },
      },
    ],
  };
}

export class AgentPassport {
  readonly apiKey?: string;
  readonly baseUrl: string;

  constructor(options: AgentPassportOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://passport.orchestrator.so';
  }

  accessRequests = {
    create: async (input: CreateAccessRequestInput): Promise<AccessRequest> => {
      const id = createId('req');

      return {
        id,
        approvalUrl: createApprovalUrl(this.baseUrl, id, input),
        status: 'pending',
      };
    },

    getGrant: async (accessRequestId: string): Promise<AccessGrant> => {
      return createMockGrant(accessRequestId);
    },
  };

  /**
   * Backwards-compatible alias while the public API moves from "sessions" to
   * "access requests".
   */
  sessions = {
    create: this.accessRequests.create,
    getGrant: this.accessRequests.getGrant,
  };
}
