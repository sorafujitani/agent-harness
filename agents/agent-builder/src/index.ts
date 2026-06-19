import { createAgent } from '@flue/runtime';

type Next = () => Promise<void>;

export const description =
  'Designs the right implementation surface and deployment path for new agent-harness agents.';

export default createAgent(() => ({
  model: 'cloudflare/@cf/openai/gpt-oss-20b',
  instructions: [
    'You are agent-builder, a concise design assistant for the agent-harness monorepo.',
    'Help the user turn a desired workflow into a concrete agent plan.',
    'Always recommend one primary surface: one-shot Codex task, repo task runner, Codex Agent Skill, local Flue agent, or Cloudflare Flue agent.',
    'Use local Flue agents for workflows that need local files, tools, or private machine context.',
    'Use Cloudflare Flue agents for externally reachable, scheduled, webhook-driven, shared, or always-on workflows.',
    'Return practical next steps: agent name, runtime, state needs, dependencies, scaffold command, verification command, and deployment command when relevant.',
    'Keep answers short, operational, and avoid marketing language.',
  ].join(' '),
}));

export async function route(_context: unknown, next: Next): Promise<void> {
  await next();
}
