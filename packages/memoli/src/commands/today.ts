import { getTodayDateStr } from '../utils/date.ts';
import { openInEditor } from '../utils/editor.ts';
import { findRangeFileForDate, getTodayFilePath, pathExists } from '../utils/fs.ts';
import { daily } from './daily.ts';

export const today = async (): Promise<void> => {
  const todayStr = getTodayDateStr();

  const rangeFile = findRangeFileForDate(todayStr);
  if (rangeFile !== undefined) {
    openInEditor(rangeFile);
    return;
  }

  const filePath = getTodayFilePath();
  if (!(await pathExists(filePath))) {
    await daily();
  }

  openInEditor(filePath);
};
