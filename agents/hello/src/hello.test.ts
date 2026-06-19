import { describe, expect, it } from 'vitest';

import helloAgent from './hello';

describe('helloAgent', () => {
  it('exports a Flue agent definition', () => {
    expect(helloAgent).toBeDefined();
  });
});
