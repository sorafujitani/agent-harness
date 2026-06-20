import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { MEMO_DIR } from '../config.ts';
import { openInEditor } from '../utils/editor.ts';
import { ensureDir, pathExists } from '../utils/fs.ts';

const EXIT_FAILURE = 1;

const ensureMemoFile = async (filePath: string, name: string): Promise<void> => {
  if (!(await pathExists(filePath))) {
    const content = `# ${name}\n\n`;
    await writeFile(filePath, content);
    console.log(`Created: ${filePath}`);
  }
};

export const memo = async (name: string): Promise<void> => {
  if (name === '') {
    console.error('Usage: memoli memo <name>');
    process.exit(EXIT_FAILURE);
  }

  await ensureDir(MEMO_DIR);

  const filePath = join(MEMO_DIR, `${name}.md`);
  await ensureMemoFile(filePath, name);

  openInEditor(filePath);
};
