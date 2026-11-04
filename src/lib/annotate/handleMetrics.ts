// NOTE: ported from fyredocs_app/src/lib/annotate/handleMetrics.ts — keep in sync.
/**
 * Selection-handle sizes, in SCREEN PIXELS (Phase 7). PURE.
 *
 * Handles are authored in px and converted to normalized units at use time —
 * both directions matter. Authoring in normalized units would make a fixed
 * 0.015 mean ~6pt on a phone and ~20pt on a tablet; comparing in raw px would
 * be wrong too, because x and y normalize against different page dimensions.
 * So: px here, `/ (dispW * zoom)` at the call site, and `handleAt` scales the
 * y delta by the page aspect so the hit disc is round ON SCREEN.
 *
 * Dividing by the zoom scale is what keeps a handle the same physical size
 * and the same touch target at every zoom level — and it is why pinch-zoom is
 * the real escape hatch for annotations too small to grab at 1×.
 *
 * Shared by the canvas (drawing) and the editor (hit-testing) so the thing
 * you see and the thing you can grab can never drift apart.
 */

/** Half-extent of a drawn handle. */
export const HANDLE_DRAW_PX = 5;
/** Touch radius — comfortably above the drawn size, per the a11y baseline. */
export const HANDLE_HIT_PX = 22;
/** Gap between the artwork and its handles. */
export const HANDLE_GAP_PX = 8;
/** Below this separation, handles are dropped rather than drawn overlapping. */
export const HANDLE_MIN_SEP_PX = 44;
