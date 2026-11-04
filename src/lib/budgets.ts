// NOTE: ported from fyredocs_app/src/lib/budgets.ts — keep in sync.
/**
 * Page-count budgets per operation (Phase 17), surfaced BEFORE the user
 * waits. Each constant states what actually breaks past it — these are
 * memory/time cliffs, not product tiers.
 */

/** Annotate renders EVERY page up front and flattening writes one full-res
 *  JPEG per annotated page — past ~50 pages both the prepare loop and the
 *  save loop stop being interactive. The gate offers the Split tool. */
export const ANNOTATE_MAX_PAGES = 50;

/** Above this, text extraction runs as sequential page-range chunks
 *  (src/lib/textExtraction.ts) with a heads-up, instead of one
 *  whole-document job the user silently waits minutes on. */
export const EXTRACT_CHUNK_THRESHOLD = 40;

/** AI ops send at most this many pages per request (Phase 23). Mirrored by
 *  ai-service's ops.MaxPages, so both sides refuse the same work. Over it the
 *  AI tab disables whole-document scope: pick a range, or opt into the
 *  confirmed summarize-in-parts run — never a silent truncation. */
export const AI_MAX_PAGES = 50;
