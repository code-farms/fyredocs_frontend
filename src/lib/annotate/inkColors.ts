// NOTE: ported from fyredocs_app/src/lib/annotate/inkColors.ts — keep in sync.
/**
 * Annotation ink palette. These are CONTENT, not theme tokens: ink gets baked
 * into exported page pixels and must stay identical across scheme changes —
 * like tag colors and the watermark ink, this file is on the hex-guardrail
 * allowlist (see fyredocs_app/DESIGN.md). Hues chosen to read on white pages.
 */
export const INK_COLORS = [
  '#111111', // near-black
  '#d43c3c', // red
  '#2f6fd4', // blue
  '#2f9e57', // green
  '#f2c53d', // marker yellow (highlight default)
] as const;

export type InkColor = (typeof INK_COLORS)[number];

export const DEFAULT_INK: InkColor = INK_COLORS[0];
export const HIGHLIGHT_INK: InkColor = INK_COLORS[4];
/** Sticky-note card fill — classic post-it yellow, always. */
export const NOTE_FILL = '#fff3ad';
/** Redaction fill — pure black, baked over the pixels. */
export const REDACT_FILL = '#000000';
