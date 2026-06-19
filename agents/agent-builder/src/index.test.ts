import { describe, expect, it } from 'vitest';

import agent from './index';

describe('agent-builder', () => {
  it('exports a Flue agent definition', () => {
    expect(agent).toBeDefined();
  });
});
