import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Options = {
  dryRun: boolean;
  runtimes: string[];
  updateCloudflareMigration: boolean;
  cloudflareMigrationTag?: string;
};

const rootDir = process.cwd();
const args = process.argv.slice(2);

function printUsage(exitCode = 0): never {
  console.log(`Usage: bun run agent:new <agent-name> [options]

Options:
  --runtime <name>                 Mount in one Flue runtime. Repeatable.
  --runtimes <a,b>                 Mount in comma-separated Flue runtimes.
  --all-runtimes                   Mount in every Flue runtime under runtimes/.
  --no-runtime                     Only create agents/<name>.
  --cloudflare-migration <tag>     Use a specific Cloudflare migration tag.
  --no-cloudflare-migration        Skip Cloudflare migration updates.
  --dry-run                        Print actions without writing files.

Examples:
  bun run agent:new research
  bun run agent:new research --runtime cloudflare
  bun run agent:new research --runtime cloudflare --cloudflare-migration v4
`);
  process.exit(exitCode);
}

function parseArgs(argv: string[]): { name: string; options: Options } {
  const positional: string[] = [];
  const runtimes: string[] = [];
  let dryRun = false;
  let allRuntimes = false;
  let noRuntime = false;
  let updateCloudflareMigration = true;
  let cloudflareMigrationTag: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      printUsage();
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--all-runtimes') {
      allRuntimes = true;
      continue;
    }

    if (arg === '--no-runtime') {
      noRuntime = true;
      continue;
    }

    if (arg === '--no-cloudflare-migration') {
      updateCloudflareMigration = false;
      continue;
    }

    if (arg === '--runtime') {
      const value = argv[index + 1];
      if (!value) printUsage(1);
      runtimes.push(value);
      index += 1;
      continue;
    }

    if (arg === '--runtimes') {
      const value = argv[index + 1];
      if (!value) printUsage(1);
      runtimes.push(...value.split(',').filter(Boolean));
      index += 1;
      continue;
    }

    if (arg === '--cloudflare-migration') {
      const value = argv[index + 1];
      if (!value) printUsage(1);
      cloudflareMigrationTag = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) printUsage(1);
    positional.push(arg);
  }

  if (positional.length !== 1) printUsage(1);
  if (noRuntime && (runtimes.length > 0 || allRuntimes)) printUsage(1);

  return {
    name: positional[0],
    options: {
      dryRun,
      runtimes: noRuntime || allRuntimes ? [] : unique(runtimes),
      updateCloudflareMigration,
      cloudflareMigrationTag,
    },
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validateAgentName(name: string): void {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error('Agent name must be kebab-case, for example: research-agent');
  }
}

function pascalCase(value: string): string {
  return value
    .split('-')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('');
}

function agentPackageName(name: string): string {
  return `@agent-harness/agent-${name}`;
}

function cloudflareDurableObjectClass(name: string): string {
  return `Flue${pascalCase(name)}Agent`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function availableFlueRuntimes(): Promise<string[]> {
  const runtimesDir = path.join(rootDir, 'runtimes');
  const entries = await readdir(runtimesDir, { withFileTypes: true });
  const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const flueRuntimes: string[] = [];

  for (const name of names) {
    if (await exists(path.join(runtimesDir, name, 'flue.config.ts'))) {
      flueRuntimes.push(name);
    }
  }

  return flueRuntimes.sort();
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function write(filePath: string, contents: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`[dry-run] write ${path.relative(rootDir, filePath)}`);
    return;
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

async function updatePackageJson(
  filePath: string,
  update: (pkg: Record<string, unknown>) => void,
  dryRun: boolean,
): Promise<void> {
  const pkg = await readJson(filePath);
  update(pkg);
  await write(filePath, stringifyJson(pkg), dryRun);
}

async function createAgentPackage(name: string, dryRun: boolean): Promise<void> {
  const agentDir = path.join(rootDir, 'agents', name);
  if (await exists(agentDir)) {
    throw new Error(`agents/${name} already exists`);
  }

  await write(
    path.join(agentDir, 'package.json'),
    stringifyJson({
      name: agentPackageName(name),
      version: '0.0.0',
      private: true,
      type: 'module',
      exports: {
        '.': './src/index.ts',
      },
      scripts: {
        build: 'tsgo -p tsconfig.json',
        check: 'tsgo -p tsconfig.json',
        test: 'vitest run',
      },
      dependencies: {
        '@flue/runtime': '1.0.0-beta.1',
      },
    }),
    dryRun,
  );

  await write(
    path.join(agentDir, 'tsconfig.json'),
    stringifyJson({
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        rootDir: './src',
        types: ['bun'],
      },
      include: ['src/**/*.ts'],
    }),
    dryRun,
  );

  await write(
    path.join(agentDir, 'src', 'index.ts'),
    `import { createAgent } from '@flue/runtime';

export default createAgent(() => ({
  model: 'anthropic/claude-sonnet-4-6',
  instructions: 'Write the operating instructions for the ${name} agent.',
}));
`,
    dryRun,
  );

  await write(
    path.join(agentDir, 'src', 'index.test.ts'),
    `import { describe, expect, it } from 'vitest';

import agent from './index';

describe('${name}', () => {
  it('exports a Flue agent definition', () => {
    expect(agent).toBeDefined();
  });
});
`,
    dryRun,
  );
}

async function mountRuntime(name: string, runtime: string, dryRun: boolean): Promise<void> {
  const runtimeDir = path.join(rootDir, 'runtimes', runtime);
  if (!(await exists(runtimeDir))) {
    throw new Error(`runtimes/${runtime} does not exist`);
  }
  if (!(await exists(path.join(runtimeDir, 'flue.config.ts')))) {
    throw new Error(`runtimes/${runtime} is not a Flue runtime`);
  }

  await write(
    path.join(runtimeDir, 'src', 'agents', `${name}.ts`),
    `export { default } from '${agentPackageName(name)}';
`,
    dryRun,
  );

  await updatePackageJson(
    path.join(runtimeDir, 'package.json'),
    (pkg) => {
      const dependencies = (pkg.dependencies ?? {}) as Record<string, string>;
      dependencies[agentPackageName(name)] = 'workspace:*';
      pkg.dependencies = sortObject(dependencies);
    },
    dryRun,
  );
}

function sortObject<T>(value: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function updateCloudflareMigration(name: string, options: Options): Promise<void> {
  if (!options.updateCloudflareMigration) return;

  const wranglerPath = path.join(rootDir, 'runtimes', 'cloudflare', 'wrangler.jsonc');
  if (!(await exists(wranglerPath))) return;

  const className = cloudflareDurableObjectClass(name);
  const content = await readFile(wranglerPath, 'utf8');
  if (content.includes(`"${className}"`)) return;

  const migrationsKeyIndex = content.indexOf('"migrations"');
  if (migrationsKeyIndex === -1) {
    throw new Error('runtimes/cloudflare/wrangler.jsonc must contain a migrations array');
  }

  const openIndex = content.indexOf('[', migrationsKeyIndex);
  const closeIndex = findMatchingBracket(content, openIndex);
  const tag = options.cloudflareMigrationTag ?? nextMigrationTag(content);
  const beforeClose = content.slice(0, closeIndex).replace(/\s*$/, '');
  const afterClose = content.slice(closeIndex);
  const needsComma = beforeClose.endsWith('}');
  const migrationBlock = `${needsComma ? ',' : ''}
    {
      "tag": "${tag}",
      "new_sqlite_classes": ["${className}"],
    },
`;

  await write(wranglerPath, `${beforeClose}${migrationBlock}${afterClose}`, options.dryRun);
}

function findMatchingBracket(content: string, openIndex: number): number {
  if (openIndex === -1 || content[openIndex] !== '[') {
    throw new Error('Could not find migrations array');
  }

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = openIndex; index < content.length; index += 1) {
    const char = content[index];

    if (inString) {
      escaping = char === '\\' && !escaping;
      if (char === '"' && !escaping) inString = false;
      if (char !== '\\') escaping = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth === 0) return index;
  }

  throw new Error('Could not find migrations array end');
}

function nextMigrationTag(content: string): string {
  const versions = [...content.matchAll(/"tag"\s*:\s*"v(\d+)"/g)].map((match) => Number(match[1]));
  const next = versions.length === 0 ? 1 : Math.max(...versions) + 1;
  return `v${next}`;
}

const { name, options } = parseArgs(args);
validateAgentName(name);

const runtimes = options.runtimes.length > 0 ? options.runtimes : await availableFlueRuntimes();

await createAgentPackage(name, options.dryRun);

for (const runtime of runtimes) {
  await mountRuntime(name, runtime, options.dryRun);
}

if (runtimes.includes('cloudflare')) {
  await updateCloudflareMigration(name, options);
}

console.log(`${options.dryRun ? '[dry-run] ' : ''}created agent ${agentPackageName(name)}`);
if (runtimes.length > 0) {
  console.log(`mounted runtimes: ${runtimes.join(', ')}`);
}
if (!options.dryRun) {
  console.log('next: bun install && bun run build');
}
