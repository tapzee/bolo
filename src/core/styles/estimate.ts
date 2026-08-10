import { lineGapPx } from "./layout";
import { REFERENCE_HEIGHT, REFERENCE_WIDTH } from "../video/constants";

/**
 * The subset of `CaptionStyleConfig` box-fit estimation actually needs.
 *
 * Kept as its own narrow interface (rather than importing `CaptionStyleConfig`
 * directly) so `PageLayoutOptions` (`remotion/captions/build-pages.ts`) can
 * satisfy it structurally without needing every other style field — that's
 * what lets page-building keep memoising on a narrow options object instead
 * of the full config, same as it always has.
 */
export interface CaptionBoxFitConfig {
  fontSizePx: number;
  letterSpacingPx: number;
  wordGapPx: number;
  lineHeight: number;
  maxLineWidthPct: number;
  maxBlockHeightPct: number;
  annotationSizeRatio: number;
}

/**
 * Pure size estimation for box-fit page building.
 *
 * `buildCaptionPages` needs to know, while it is still deciding which words
 * belong on a page, roughly how tall that page will render — so the page can
 * be capped by a fixed box instead of the box growing to fit whatever a flat
 * word-count produced. This is deliberately a character-count *estimate*, not
 * real `ctx.measureText()` pixel measurement: real measurement is DOM-only and
 * needs fonts loaded first (async), which would turn page-building from a
 * pure/sync function into an async, font-load-dependent one, and would add a
 * third place (alongside the DOM renderer and `draw-captions.ts`) where
 * per-style sizing logic could drift. Being a little wrong here is low-stakes
 * — worst case a page has a bit more or less room than ideal, never broken
 * rendering — so an estimate is the right trade-off.
 *
 * Both ratios below are picked conservatively high: overestimating word width
 * means pages break a little earlier than strictly necessary, which is a far
 * safer failure mode than underestimating and letting a page overflow its box.
 */

/** Average glyph width as a fraction of font size, for common caption faces. */
const LATIN_GLYPH_WIDTH_RATIO = 0.58;
/** Devanagari runs wider on average — conjuncts and matras add real width. */
const DEVANAGARI_GLYPH_WIDTH_RATIO = 0.68;

export const estimateWordWidthPx = (
  text: string,
  fontSizePx: number,
  letterSpacingPx: number,
  isDevanagariWord: boolean,
): number => {
  const chars = Array.from(text.trim()).length;
  if (chars === 0) return 0;
  const ratio = isDevanagariWord ? DEVANAGARI_GLYPH_WIDTH_RATIO : LATIN_GLYPH_WIDTH_RATIO;
  return chars * fontSizePx * ratio + Math.max(0, chars - 1) * letterSpacingPx;
};

/**
 * Estimated line-wrap width, in reference-canvas px (1080-wide).
 *
 * Page-building runs once per project, before any particular export
 * resolution or aspect ratio is in play (the same pages are reused across
 * reel/square/landscape), so this always works in the fixed 1080x1920
 * reference space rather than a real render size. The landscape cap that
 * `captionMaxWidthPx` (core/video/constants.ts) applies for real rendering is
 * folded in unconditionally here — using the narrower of the two bounds makes
 * this estimate at least as conservative as whatever the real aspect turns
 * out to be, which keeps it safely biased toward breaking early rather than
 * risking underestimating for a landscape export.
 */
const LANDSCAPE_MAX_LINE_WIDTH_PCT = 75;

export const estimateMaxLineWidthPx = (config: CaptionBoxFitConfig): number =>
  REFERENCE_WIDTH * (Math.min(config.maxLineWidthPct, LANDSCAPE_MAX_LINE_WIDTH_PCT) / 100);

/** The fixed vertical budget one page's block may use, in reference-canvas px. */
export const estimateMaxBlockHeightPx = (config: CaptionBoxFitConfig): number =>
  REFERENCE_HEIGHT * (config.maxBlockHeightPct / 100);

/** One token's estimated on-screen footprint, resolved per style by the caller. */
export interface EstimatedTokenBox {
  width: number;
  height: number;
}

/**
 * Simulates greedy line-wrapping to estimate total block height.
 *
 * Mirrors `draw-captions.ts`'s `layoutLines`/`rowHeight` shape (a row's height
 * is the tallest item on it, rows stack with `lineGapPx` between them) so the
 * two can never structurally disagree — only the per-word width/height inputs
 * differ (estimated here, measured there).
 */
export const estimateBlockHeightPx = (
  boxes: readonly EstimatedTokenBox[],
  config: CaptionBoxFitConfig,
): number => {
  if (boxes.length === 0) return 0;
  const maxWidth = estimateMaxLineWidthPx(config);

  const rowHeights: number[] = [];
  let currentWidth = 0;
  let currentTallest = 0;
  let currentCount = 0;

  const flushRow = (): void => {
    if (currentCount === 0) return;
    rowHeights.push(currentTallest);
    currentWidth = 0;
    currentTallest = 0;
    currentCount = 0;
  };

  for (const box of boxes) {
    const withGap = currentCount === 0 ? box.width : currentWidth + config.wordGapPx + box.width;
    if (currentCount > 0 && withGap > maxWidth) {
      flushRow();
    }
    currentWidth = currentCount === 0 ? box.width : currentWidth + config.wordGapPx + box.width;
    currentTallest = Math.max(currentTallest, box.height);
    currentCount += 1;
  }
  flushRow();

  const gap = lineGapPx(config.lineHeight, config.fontSizePx);
  return (
    rowHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, rowHeights.length - 1) * gap
  );
};
