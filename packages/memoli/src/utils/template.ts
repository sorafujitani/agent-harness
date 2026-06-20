import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { TEMP_DIR } from '../config.ts';
import { pathExists } from './fs.ts';

export const getTemplatePath = (name: string): string => join(TEMP_DIR, `${name}.md`);

export const loadTemplate = async (name: string): Promise<string> => {
  const path = getTemplatePath(name);
  if (await pathExists(path)) {
    return readFile(path, 'utf8');
  }

  throw new Error(`Template not found: ${path}`);
};
