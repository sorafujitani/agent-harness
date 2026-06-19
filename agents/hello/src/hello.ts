import { createAgent } from '@flue/runtime';

const helloAgent = createAgent(() => ({
  model: 'anthropic/claude-sonnet-4-6',
  instructions:
    'You are the starter agent for agent-harness. Keep responses concise and operational.',
}));

export default helloAgent;
