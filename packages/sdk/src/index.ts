export type ProviderName =
  | 'composio'
  | 'nango'
  | 'arcade'
  | 'pipedream'
  | 'custom';

export type ConnectionStatus = 'ready' | 'needs_auth' | 'revoked' | 'error';

export interface PassportConnection {
  app: string;
  provider: ProviderName | string;
  providerConnectionId: string;
  scopes: string[];
  status: ConnectionStatus;
}

export interface PassportAccessObject {
  profile: string;
  connections: PassportConnection[];
}

export interface CreateSessionInput {
  userId: string;
  requestedProfile?: string;
  requiredApps?: string[];
  redirectUrl: string;
}

export interface PassportSession {
  id: string;
  url: string;
}

export interface AgentPassportOptions {
  apiKey?: string;
  baseUrl?: string;
}

export class AgentPassport {
  readonly apiKey?: string;
  readonly baseUrl: string;

  constructor(options: AgentPassportOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://passport.orchestrator.so';
  }

  sessions = {
    create: async (input: CreateSessionInput): Promise<PassportSession> => {
      const params = new URLSearchParams({
        userId: input.userId,
        redirectUrl: input.redirectUrl,
      });

      if (input.requestedProfile) {
        params.set('profile', input.requestedProfile);
      }

      for (const app of input.requiredApps ?? []) {
        params.append('app', app);
      }

      return {
        id: `session_${crypto.randomUUID()}`,
        url: `${this.baseUrl}/connect?${params.toString()}`,
      };
    },
  };

  access = {
    get: async (input: {
      userId: string;
      profileId: string;
    }): Promise<PassportAccessObject> => {
      return {
        profile: input.profileId,
        connections: [],
      };
    },
  };
}
