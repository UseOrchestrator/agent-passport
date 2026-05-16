import type { AccessGrant, PassportConnection } from '@agent-passport/sdk';
import { randomUUID } from 'node:crypto';

export interface PassportUser {
  id: string;
  email: string;
}

export interface ProviderConnection {
  app: string;
  provider: 'composio';
  connectedAccountId: string;
  status: 'ready' | 'needs_auth';
  scopes: string[];
}

const usersByEmail = new Map<string, PassportUser>();
const connectionsByUserId = new Map<string, ProviderConnection[]>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createDemoUserId(email: string): string {
  const normalized = normalizeEmail(email);
  const encoded = Buffer.from(normalized).toString('base64url');
  return `agent_passport_demo_${encoded}`;
}

export function getOrCreateUser(email: string): PassportUser {
  const normalized = normalizeEmail(email);
  const existing = usersByEmail.get(normalized);

  if (existing) {
    return existing;
  }

  const user = {
    id: createDemoUserId(normalized),
    email: normalized,
  };

  usersByEmail.set(normalized, user);
  return user;
}

export function saveConnection(userId: string, connection: ProviderConnection): void {
  const existingConnections = connectionsByUserId.get(userId) ?? [];
  const nextConnections = [
    ...existingConnections.filter(
      (existing) =>
        existing.provider !== connection.provider ||
        existing.app !== connection.app ||
        existing.connectedAccountId !== connection.connectedAccountId,
    ),
    connection,
  ];

  connectionsByUserId.set(userId, nextConnections);
}

export function getConnections(userId: string): ProviderConnection[] {
  return connectionsByUserId.get(userId) ?? [];
}

function toPassportConnection(connection: ProviderConnection): PassportConnection {
  return {
    app: connection.app,
    provider: connection.provider,
    scopes: connection.scopes,
    status: connection.status,
    handoff: {
      type: 'composio_connected_account',
      connectedAccountId: connection.connectedAccountId,
    },
  };
}

export function createAccessGrant(user: PassportUser, purpose: string, app?: string): AccessGrant {
  const providerConnections = app
    ? getConnections(user.id).filter((connection) => connection.app === app)
    : getConnections(user.id);
  const connections = providerConnections.map(toPassportConnection);

  return {
    id: `grant_${randomUUID()}`,
    accessRequestId: `request_${randomUUID()}`,
    status: connections.length > 0 ? 'approved' : 'pending',
    profile: {
      id: 'profile_work',
      name: 'Work',
    },
    connections,
  };
}
