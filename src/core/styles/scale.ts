import type { CaptionStyleConfig } from "./types";

/**
 * Converts a style authored against the 1080x1920 reference canvas into real
 * pixels for the canvas actually being rendered.
 *
 * Only length-valued fields are scaled. Ratios (`lineHeight`), counts
 * (`maxWordsPerPage`), durations (`combineWithinMs`, `holdMs`), percentages and
 * colours are resolution-independent and must be left alone — scaling
 * `lineHeight` would compound with the font size and blow the line spacing out.
 */
export const scaleStyleConfig = (
  config: CaptionStyleConfig,
  scale: number,
): CaptionStyleConfig => {
  // Resolve the proportional stroke against the *authored* font size before
  // scaling, so both terms are in the same coordinate space.
  const authoredStroke = Math.max(
    config.strokeWidthPx,
    config.fontSizePx * config.strokeRatio,
  );

  return {
    ...config,
    fontSizePx: config.fontSizePx * scale,
    wordGapPx: config.wordGapPx * scale,
    letterSpacingPx: config.letterSpacingPx * scale,
    horizontalPaddingPx: config.horizontalPaddingPx * scale,
    // Floored: below ~1.5px the outline stops separating glyph from background,
    // so a 720p export would silently lose the readability guarantee that every
    // style is required to provide.
    strokeWidthPx: config.strokeWidthPx === 0 ? 0 : Math.max(1.5, authoredStroke * scale),
  };
};
