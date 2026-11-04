// NOTE: ported from fyredocs_app/src/lib/ai/parse.ts — keep in sync.
/**
 * AI response parsing (Phase 23). PURE. The server asks the model for plain
 * text in fixed conventions — `[p.N]` citations, markdown bullets, Q:/A:
 * flashcards — rather than JSON mode, because JSON/tool support varies
 * across the OpenAI-compatible providers the backend can be pointed at.
 * So every parser here is tolerant: it accepts the common variants and
 * never throws on model output.
 */

export type CitedSegment = { type: 'text'; text: string } | { type: 'cite'; pageIndex: number; label: string };

export interface CitedText {
  segments: CitedSegment[];
  /** Distinct cited pages, 0-based, ascending. */
  pageIndices: number[];
}

// [p.7] [p 7] [p7] [pp. 3-4] [p.3, p.5] [page 7] [pages 2–3]
const CITE_RE = /\[(?:pp?|pages?)\.?\s*(\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*(?:pp?\.?\s*)?\d+(?:\s*[-–]\s*\d+)?)*)\]/gi;

const MAX_RANGE = 50;

const pagesIn = (body: string): number[] => {
  const out: number[] = [];
  for (const part of body.split(',')) {
    const nums = part.replace(/pp?\.?/i, '').split(/[-–]/).map((n) => parseInt(n.trim(), 10));
    const [a, b = a] = nums;
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 1 || b < a || b - a > MAX_RANGE) continue;
    for (let p = a; p <= b; p++) out.push(p);
  }
  return out;
};

/** Split model text into text + citation segments. Page numbers in the text
 *  are 1-based (what the model was shown); `pageIndex` is 0-based. A
 *  citation beyond `pageCount` (when given) is kept as plain text — a
 *  hallucinated page must not become a chip that jumps nowhere. */
export const parseCitations = (text: string, pageCount?: number): CitedText => {
  const segments: CitedSegment[] = [];
  const seen = new Set<number>();
  let last = 0;
  for (const m of text.matchAll(CITE_RE)) {
    const pages = pagesIn(m[1]).filter((p) => pageCount === undefined || p <= pageCount);
    if (pages.length === 0) continue;
    const at = m.index ?? 0;
    if (at > last) segments.push({ type: 'text', text: text.slice(last, at) });
    for (const p of pages) {
      segments.push({ type: 'cite', pageIndex: p - 1, label: `p.${p}` });
      seen.add(p - 1);
    }
    last = at + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', text: text.slice(last) });
  return { segments, pageIndices: [...seen].sort((a, b) => a - b) };
};

const BULLET_RE = /^\s*(?:[-*•‣▪]|\d+[.)]|\[[ xX]?\])\s+(.*)$/;

/** Markdown-ish list → items. Continuation lines fold into the previous
 *  item; if the model ignored the format entirely, non-empty lines become
 *  items so the user still gets something, honestly. */
export const parseList = (text: string): string[] => {
  const lines = text.split(/\r?\n/);
  const items: string[] = [];
  let sawBullet = false;
  for (const raw of lines) {
    const m = BULLET_RE.exec(raw);
    if (m) {
      sawBullet = true;
      const item = m[1].trim();
      if (item) items.push(item);
    } else if (sawBullet && raw.trim() && /^\s{2,}/.test(raw) && items.length > 0) {
      items[items.length - 1] += ` ${raw.trim()}`;
    }
  }
  if (sawBullet) return items;
  return lines.map((l) => l.trim()).filter((l) => l && !/^#+\s/.test(l));
};

export interface Flashcard {
  front: string;
  back: string;
}

const stripFence = (text: string): string => text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

const fromJson = (text: string): Flashcard[] | null => {
  try {
    const data: unknown = JSON.parse(stripFence(text));
    const list = Array.isArray(data) ? data : (data as { cards?: unknown })?.cards;
    if (!Array.isArray(list)) return null;
    const cards: Flashcard[] = [];
    for (const item of list) {
      const o = item as Record<string, unknown>;
      const front = o.front ?? o.q ?? o.question;
      const back = o.back ?? o.a ?? o.answer;
      if (typeof front === 'string' && typeof back === 'string' && front.trim() && back.trim()) {
        cards.push({ front: front.trim(), back: back.trim() });
      }
    }
    return cards;
  } catch {
    return null;
  }
};

const Q_RE = /^\s*(?:[-*]\s*)?(?:\*\*)?(?:Q|Question|Front)\s*\d*\s*[:.]\s*(?:\*\*)?\s*(.*)$/i;
const A_RE = /^\s*(?:[-*]\s*)?(?:\*\*)?(?:A|Answer|Back)\s*\d*\s*[:.]\s*(?:\*\*)?\s*(.*)$/i;

/** Model text → cards. JSON first (some providers return it anyway), then
 *  Q:/A: blocks with multi-line answers. Incomplete pairs are dropped. */
export const parseFlashcards = (text: string): Flashcard[] => {
  const json = fromJson(text);
  if (json && json.length > 0) return json;

  const cards: Flashcard[] = [];
  let front: string | null = null;
  let back: string | null = null;
  const flush = () => {
    if (front?.trim() && back?.trim()) cards.push({ front: front.trim(), back: back.trim() });
    front = null;
    back = null;
  };
  for (const line of text.split(/\r?\n/)) {
    const q = Q_RE.exec(line);
    const a = q ? null : A_RE.exec(line);
    if (q) {
      flush();
      front = q[1];
    } else if (a && front !== null) {
      back = a[1];
    } else if (line.trim() && !line.startsWith('<!--') && !/^#+\s/.test(line)) {
      if (back !== null) back += `\n${line.trim()}`;
      else if (front !== null) front += ` ${line.trim()}`;
    }
  }
  flush();
  return cards;
};

/** Marker that makes a saved notes document reopenable in the review screen. */
export const FLASHCARDS_MARKER = '<!-- fyredocs:flashcards v1 -->';

export const flashcardsToMarkdown = (title: string, cards: Flashcard[]): string =>
  [
    FLASHCARDS_MARKER,
    `# Flashcards — ${title}`,
    '',
    ...cards.flatMap((c) => [`Q: ${c.front}`, `A: ${c.back.replace(/\n/g, '\n   ')}`, '']),
  ].join('\n');

export const isFlashcardsMarkdown = (text: string): boolean => text.trimStart().startsWith(FLASHCARDS_MARKER);
