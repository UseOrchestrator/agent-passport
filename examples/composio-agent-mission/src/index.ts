import { Composio } from '@composio/core';
import {
  AgentPassport,
  type AccessGrant,
  type PassportConnection,
} from '@agent-passport/sdk';

type Command = 'run' | 'connect' | 'list-accounts' | 'list-tools';

interface AgentToolManifestItem {
  app: string;
  provider: string;
  status: string;
  scopes: string[];
  handoffRef: Record<string, unknown>;
  suggestedTools: string[];
}

interface AgentToolManifest {
  profile: string;
  purpose: string;
  tools: AgentToolManifestItem[];
}

const command = (process.argv[2] ?? 'run') as Command;
const userId =
  process.env.COMPOSIO_USER_ID ?? process.env.AGENT_PASSPORT_USER_ID ?? 'agent-passport-demo-user';
const mission =
  process.env.AGENT_MISSION ??
  'Find which connected apps are available, then choose the safest read-only tool path.';

function createComposioClient(): Composio | null {
  const apiKey = process.env.COMPOSIO_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Composio({ apiKey });
}

function parseJsonEnv(name: string): Record<string, unknown> {
  const raw = process.env[name];

  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

function getObjectStringValue(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const output = (value as Record<string, unknown>)[key];
  return typeof output === 'string' ? output : undefined;
}

function connectionHandoffRef(connection: PassportConnection): Record<string, unknown> {
  return {
    type: connection.handoff.type,
    provider: connection.provider,
    app: connection.app,
    connectedAccountId: connection.handoff.connectedAccountId,
    entityId: connection.handoff.entityId,
  };
}

function suggestedToolsForApp(app: string): string[] {
  if (app === 'gmail') {
    return ['gmail.search', 'gmail.readLatest'];
  }

  if (app === 'slack') {
    return ['slack.lookupChannel', 'slack.readRecentMessages'];
  }

  return [`${app}.read`];
}

function createAgentToolManifest(grant: AccessGrant, purpose: string): AgentToolManifest {
  return {
    profile: grant.profile.name,
    purpose,
    tools: grant.connections.map((connection) => ({
      app: connection.app,
      provider: connection.provider,
      status: connection.status,
      scopes: connection.scopes,
      handoffRef: connectionHandoffRef(connection),
      suggestedTools: suggestedToolsForApp(connection.app),
    })),
  };
}

function hasRawSecretShape(value: unknown): boolean {
  const serialized = JSON.stringify(value).toLowerCase();

  return ['access_token', 'refresh_token', 'client_secret', 'api_key'].some((secretKey) =>
    serialized.includes(secretKey),
  );
}

function chooseAgentAction(manifest: AgentToolManifest): string {
  const readyTools = manifest.tools.filter((tool) => tool.status === 'ready');
  const gmail = readyTools.find((tool) => tool.app === 'gmail');

  if (gmail) {
    return `Use ${gmail.suggestedTools[0]} through ${gmail.provider}; do not handle raw OAuth tokens.`;
  }

  const firstReadyTool = readyTools[0];

  if (firstReadyTool) {
    return `Use ${firstReadyTool.suggestedTools[0]} through ${firstReadyTool.provider}; do not handle raw OAuth tokens.`;
  }

  return 'Ask the user to connect one required app before the agent runs.';
}

async function createDemoGrant(): Promise<AccessGrant> {
  const passport = new AgentPassport({
    baseUrl: process.env.AGENT_PASSPORT_BASE_URL ?? 'https://passport.orchestrator.so',
  });

  const request = await passport.accessRequests.create({
    externalUserId: userId,
    requestedApps: ['gmail', 'slack'],
    purpose: mission,
    providerPreference: 'composio',
  });

  const grant = await passport.accessRequests.getGrant(request.id);
  const connectedAccountId = process.env.COMPOSIO_CONNECTED_ACCOUNT_ID;

  if (connectedAccountId) {
    grant.connections = grant.connections.map((connection) =>
      connection.provider === 'composio'
        ? {
            ...connection,
            handoff: {
              ...connection.handoff,
              connectedAccountId,
              entityId: userId,
            },
          }
        : connection,
    );
  }

  return grant;
}

function printJson(label: string, value: unknown): void {
  console.log(`\n${label}`);
  console.log(JSON.stringify(value, null, 2));
}

async function connect(): Promise<void> {
  const composio = createComposioClient();
  const authConfigId = process.env.COMPOSIO_AUTH_CONFIG_ID;

  if (!composio || !authConfigId) {
    console.log('To create a real Composio auth link, set COMPOSIO_API_KEY and COMPOSIO_AUTH_CONFIG_ID.');
    console.log('Then run: yarn example:composio connect');
    return;
  }

  const connectionRequest = await composio.connectedAccounts.link(userId, authConfigId, {
    callbackUrl: process.env.COMPOSIO_CALLBACK_URL,
  });

  console.log('Composio connection request created.');
  console.log(`User id: ${userId}`);
  console.log(`Request id: ${getObjectStringValue(connectionRequest, 'id') ?? '(not returned)'}`);
  console.log(
    `Open this URL to authenticate: ${getObjectStringValue(connectionRequest, 'redirectUrl') ?? '(not returned)'}`,
  );
}

async function listAccounts(): Promise<void> {
  const composio = createComposioClient();

  if (!composio) {
    console.log('Set COMPOSIO_API_KEY to list real Composio connected accounts.');
    return;
  }

  const accounts = await composio.connectedAccounts.list({
    userIds: [userId],
  });

  printJson('Composio connected accounts', accounts);
}

async function listTools(): Promise<void> {
  const composio = createComposioClient();

  if (!composio) {
    console.log('Set COMPOSIO_API_KEY to list real Composio tools.');
    return;
  }

  const toolkit = process.env.COMPOSIO_TOOLKIT ?? 'gmail';
  const tools = await composio.tools.get(userId, {
    toolkits: [toolkit],
    limit: 10,
  });

  printJson(`Composio tools for ${toolkit}`, tools);
}

async function maybeExecuteConfiguredTool(): Promise<void> {
  const composio = createComposioClient();
  const toolSlug = process.env.COMPOSIO_TOOL_SLUG;

  if (!composio || !toolSlug) {
    console.log('\nNo real Composio tool executed.');
    console.log('Set COMPOSIO_API_KEY, COMPOSIO_TOOL_SLUG, and optionally COMPOSIO_TOOL_ARGS_JSON to run one.');
    return;
  }

  const result = await composio.tools.execute(toolSlug, {
    userId,
    connectedAccountId: process.env.COMPOSIO_CONNECTED_ACCOUNT_ID,
    arguments: parseJsonEnv('COMPOSIO_TOOL_ARGS_JSON'),
    dangerouslySkipVersionCheck: process.env.COMPOSIO_SKIP_VERSION_CHECK === 'true',
  });

  printJson(`Composio execution result for ${toolSlug}`, result);
}

async function run(): Promise<void> {
  const grant = await createDemoGrant();
  const manifest = createAgentToolManifest(grant, mission);
  const agentDecision = chooseAgentAction(manifest);

  printJson('Agent Passport access grant', grant);
  printJson('Agent-readable tool manifest', manifest);
  console.log(`\nAgent mission: ${mission}`);
  console.log(`Agent decision: ${agentDecision}`);
  console.log(`Raw token leaked into manifest: ${hasRawSecretShape(manifest) ? 'yes' : 'no'}`);

  await maybeExecuteConfiguredTool();
}

async function main(): Promise<void> {
  if (command === 'connect') {
    await connect();
    return;
  }

  if (command === 'list-accounts') {
    await listAccounts();
    return;
  }

  if (command === 'list-tools') {
    await listTools();
    return;
  }

  await run();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
