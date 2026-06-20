import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parse as parseJsonc } from 'jsonc-parser';

export type RuntimeMount = {
  name: string;
  directory: string;
  packageName?: string;
};

export type AgentCatalogEntry = {
  name: string;
  directory: string;
  packageName?: string;
  runtimes: RuntimeMount[];
  hasTests: boolean;
};

export type CloudflareCatalog = {
  aiBinding?: string;
  durableObjectClasses: string[];
  migrations: Array<{
    tag?: string;
    classes: string[];
  }>;
};

export type AgentCatalog = {
  rootDir: string;
  agents: AgentCatalogEntry[];
  runtimes: RuntimeMount[];
  cloudflare?: CloudflareCatalog;
};

export type SurfaceRecommendationInput = {
  goal: string;
  needsLocalFiles?: boolean;
  needsExternalAccess?: boolean;
  needsAlwaysOn?: boolean;
  reusableByOtherClients?: boolean;
  deterministicScaffold?: boolean;
};

export type SurfaceRecommendation = {
  surface:
    | 'one-shot-codex'
    | 'task-runner'
    | 'agent-skill'
    | 'local-flue-agent'
    | 'cloudflare-flue-agent'
    | 'mcp-server';
  reason: string;
  nextStep: string;
};

type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
};

export async function findWorkspaceRoot(startDir = process.cwd()): Promise<string> {
  let current = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(current, 'package.json');
    if (await exists(packageJsonPath)) {
      const packageJson = await readPackageJson(packageJsonPath);
      if (packageJson.name === 'agent-harness') return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Could not find workspace root from ${startDir}`);
    }

    current = parent;
  }
}

export async function getAgentCatalog(rootDir?: string): Promise<AgentCatalog> {
  const workspaceRoot = rootDir ? path.resolve(rootDir) : await findWorkspaceRoot();
  const runtimes = await listRuntimes(workspaceRoot);
  const runtimeMounts = await listRuntimeMounts(workspaceRoot, runtimes);
  const agents = await listAgents(workspaceRoot, runtimeMounts);
  const cloudflare = await readCloudflareCatalog(workspaceRoot);

  return {
    rootDir: workspaceRoot,
    agents,
    runtimes,
    cloudflare,
  };
}

export function formatAgentCatalogMarkdown(catalog: AgentCatalog): string {
  const lines = ['# Agent Harness Catalog', '', `Root: ${catalog.rootDir}`, '', '## Agents', ''];

  for (const agent of catalog.agents) {
    const runtimes =
      agent.runtimes.length === 0
        ? 'none'
        : agent.runtimes.map((runtime) => runtime.name).join(', ');
    lines.push(`- ${agent.name}`);
    lines.push(`  - package: ${agent.packageName ?? 'unknown'}`);
    lines.push(`  - runtimes: ${runtimes}`);
    lines.push(`  - tests: ${agent.hasTests ? 'yes' : 'no'}`);
  }

  lines.push('', '## Runtimes', '');
  for (const runtime of catalog.runtimes) {
    lines.push(`- ${runtime.name}`);
    lines.push(`  - package: ${runtime.packageName ?? 'unknown'}`);
  }

  if (catalog.cloudflare) {
    lines.push('', '## Cloudflare', '');
    lines.push(`- AI binding: ${catalog.cloudflare.aiBinding ?? 'none'}`);
    lines.push(
      `- Durable Object classes: ${
        catalog.cloudflare.durableObjectClasses.length === 0
          ? 'none'
          : catalog.cloudflare.durableObjectClasses.join(', ')
      }`,
    );
  }

  return `${lines.join('\n')}\n`;
}

export function recommendSurface(input: SurfaceRecommendationInput): SurfaceRecommendation {
  if (input.deterministicScaffold) {
    return {
      surface: 'task-runner',
      reason: 'Deterministic file generation should stay outside an LLM agent.',
      nextStep: 'Add or extend a script under scripts/ and expose it through package.json.',
    };
  }

  if (input.reusableByOtherClients) {
    return {
      surface: 'mcp-server',
      reason:
        'Reusable tools and resources should be exposed through a protocol clients can share.',
      nextStep:
        'Add a tool or resource under mcps/agent-catalog and keep shared logic in packages/.',
    };
  }

  if (input.needsLocalFiles) {
    return {
      surface: 'local-flue-agent',
      reason: 'Local files and local CLI tools require a runtime on the developer machine.',
      nextStep: 'Create an agent under agents/ and mount it in runtimes/node.',
    };
  }

  if (input.needsExternalAccess || input.needsAlwaysOn) {
    return {
      surface: 'cloudflare-flue-agent',
      reason:
        'External, scheduled, shared, or always-on workflows belong in the Cloudflare runtime.',
      nextStep: 'Create an agent under agents/ and mount it in runtimes/cloudflare.',
    };
  }

  return {
    surface: 'one-shot-codex',
    reason: 'A one-off task does not need durable repo surface area yet.',
    nextStep:
      'Use Codex directly, then promote repeated behavior into a skill, script, MCP tool, or agent.',
  };
}

async function listAgents(
  rootDir: string,
  runtimeMounts: Map<string, RuntimeMount[]>,
): Promise<AgentCatalogEntry[]> {
  const agentsDir = path.join(rootDir, 'agents');
  const names = await listDirectoryNames(agentsDir);

  return Promise.all(
    names.map(async (name) => {
      const directory = path.join(agentsDir, name);
      const packageJson = await readPackageJson(path.join(directory, 'package.json'));

      return {
        name,
        directory: path.relative(rootDir, directory),
        packageName: packageJson.name,
        runtimes: runtimeMounts.get(name) ?? [],
        hasTests: await hasTestFile(path.join(directory, 'src')),
      };
    }),
  );
}

async function listRuntimes(rootDir: string): Promise<RuntimeMount[]> {
  const runtimesDir = path.join(rootDir, 'runtimes');
  const names = await listDirectoryNames(runtimesDir);

  return Promise.all(
    names.map(async (name) => {
      const directory = path.join(runtimesDir, name);
      const packageJson = await readPackageJson(path.join(directory, 'package.json'));

      return {
        name,
        directory: path.relative(rootDir, directory),
        packageName: packageJson.name,
      };
    }),
  );
}

async function listRuntimeMounts(
  rootDir: string,
  runtimes: RuntimeMount[],
): Promise<Map<string, RuntimeMount[]>> {
  const mounts = new Map<string, RuntimeMount[]>();

  for (const runtime of runtimes) {
    const agentsDir = path.join(rootDir, runtime.directory, 'src', 'agents');
    const files = await listFiles(agentsDir);

    for (const file of files) {
      if (!file.endsWith('.ts')) continue;
      const agentName = file.slice(0, -'.ts'.length);
      const current = mounts.get(agentName) ?? [];
      current.push(runtime);
      mounts.set(agentName, current);
    }
  }

  return mounts;
}

async function readCloudflareCatalog(rootDir: string): Promise<CloudflareCatalog | undefined> {
  const configPath = path.join(rootDir, 'runtimes', 'cloudflare', 'wrangler.jsonc');
  if (!(await exists(configPath))) return undefined;

  const config = parseJsonc(await readFile(configPath, 'utf8')) as {
    ai?: { binding?: string };
    migrations?: Array<{
      tag?: string;
      new_classes?: string[];
      new_sqlite_classes?: string[];
    }>;
  };
  const migrations =
    config.migrations?.map((migration) => ({
      tag: migration.tag,
      classes: [...(migration.new_classes ?? []), ...(migration.new_sqlite_classes ?? [])],
    })) ?? [];

  return {
    aiBinding: config.ai?.binding,
    durableObjectClasses: [...new Set(migrations.flatMap((migration) => migration.classes))],
    migrations,
  };
}

async function readPackageJson(filePath: string): Promise<PackageJson> {
  return JSON.parse(await readFile(filePath, 'utf8')) as PackageJson;
}

async function listDirectoryNames(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}

async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}

async function hasTestFile(directory: string): Promise<boolean> {
  return (await listFiles(directory)).some(
    (file) => file.endsWith('.test.ts') || file.endsWith('.spec.ts'),
  );
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
