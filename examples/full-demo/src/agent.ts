import type { AccessGrant } from '@agent-passport/sdk';
import type { ComposioAdapter } from './composio-adapter.js';

interface AgentManifestTool {
  app: string;
  provider: string;
  status: string;
  handoffRef: Record<string, unknown>;
}

export interface AgentRunResult {
  mission: string;
  executedToolSlug: string;
  manifest: {
    profile: string;
    tools: AgentManifestTool[];
  };
  decision: string;
  rawTokenLeaked: boolean;
  providerResult: unknown;
}

function createManifest(grant: AccessGrant): AgentRunResult['manifest'] {
  return {
    profile: grant.profile.name,
    tools: grant.connections.map((connection) => ({
      app: connection.app,
      provider: connection.provider,
      status: connection.status,
      handoffRef: {
        type: connection.handoff.type,
        connectedAccountId: connection.handoff.connectedAccountId,
      },
    })),
  };
}

function containsRawTokenShape(value: unknown): boolean {
  const serialized = JSON.stringify(value).toLowerCase();
  return ['access_token', 'refresh_token', 'client_secret', 'api_key'].some((tokenKey) =>
    serialized.includes(tokenKey),
  );
}

export async function runGmailAgentMission(
  composio: ComposioAdapter,
  userId: string,
  grant: AccessGrant,
  app = 'gmail',
): Promise<AgentRunResult> {
  const mission = `Use the user-approved Work profile to run one read-only ${app} check.`;
  const manifest = createManifest(grant);
  const connection = manifest.tools.find(
    (tool) => tool.app === app && tool.provider === 'composio' && tool.status === 'ready',
  );

  if (!connection) {
    throw new Error(`The grant does not include a ready ${app} connection.`);
  }

  const connectedAccountId = connection.handoffRef.connectedAccountId;

  if (typeof connectedAccountId !== 'string') {
    throw new Error(`The ${app} handoff is missing a Composio connected account id.`);
  }

  const providerResult = await composio.executeReadOnlyTool(userId, app, connectedAccountId);

  return {
    mission,
    executedToolSlug: providerResult.toolSlug,
    manifest,
    decision: `Use the ${app} handoff reference with Composio. Do not touch raw OAuth tokens.`,
    rawTokenLeaked: containsRawTokenShape({ grant, manifest }),
    providerResult: providerResult.result,
  };
}
