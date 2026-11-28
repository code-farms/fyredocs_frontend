/**
 * Status text for a file waiting its turn. Uploads and batch jobs run one file
 * at a time, so a queued row says what it is waiting for. Split OCR parts
 * ("<name> (part 2 of 3).pdf") name the part; other files name the file ahead.
 */
const PART_RE = /\(part (\d+) of \d+\)\.[^.]+$/i;

export const waitingLabel = (previousName?: string): string => {
  if (!previousName) return 'Starting…';
  const part = previousName.match(PART_RE);
  return `Waiting — starts after ${part ? `part ${part[1]}` : previousName}`;
};

export const WAITING_ON_SERVER_LABEL = 'Waiting for your other file to finish…';

/** States in which a row is still ahead in the queue (waiting or running). */
const QUEUED = new Set(['idle', 'uploading', 'pending', 'processing']);

/**
 * Name of the closest earlier row that is still queued or running — the file
 * this row really waits for. Failed and finished rows are skipped, so the text
 * follows the queue as files complete or fail ("" when nothing is ahead).
 */
export const aheadInQueue = (rows: ReadonlyArray<{ name: string; state: string }>, index: number): string => {
  for (let i = index - 1; i >= 0; i--) {
    if (QUEUED.has(rows[i].state)) return rows[i].name;
  }
  return '';
};
