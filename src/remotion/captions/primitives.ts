import type { CSSProperties } from "react";
import type { CaptionStyleConfig, CaptionToken } from "@/core";
import { resolveTextCase } from "@/core";

export interface TokenViewProps {
  token: CaptionToken;
  /** Absolute frame from the composition. */
  frame: number;
  fps: number;
  fromFrame: number;
  toFrame: number;
  config: CaptionStyleConfig;
  /**
   * Font/size/stroke rules, built once per page render by `baseTextStyle` and
   * passed down. Rebuilding it inside each word on each frame would churn a
   * fresh object per word per frame for a value that cannot change mid-page.
   */
  textStyle: CSSProperties;
  /** Index of this token inside its page (used for kinetic/splash typography). */
  index?: number;
  /** Total number of tokens on the current page. */
  totalTokens?: number;
  /**
   * Which token on this page is the hero, for the stacked engine.
   *
   * Passed down as a number rather than having each token work it out from its
   * siblings, for two reasons: a token renderer only ever sees its own token,
   * and handing every token the sibling array would defeat `memo` — a fresh
   * array identity per frame re-renders every word on the page whether or not
   * anything about it changed.
   */
  heroIndex?: number;
}

/**
 * The readability contract every style inherits.
 *
 * `-webkit-text-stroke` alone paints the stroke *over* the glyph, eating into
 * thin Devanagari matras until a word like छोड़ो loses its vowel marks.
 * `paint-order: stroke fill` flips the order so the fill lands on top and the
 * stroke only ever grows outward. Chromium honours this on HTML text, which is
 * what both the Player and the WebCodecs export path run on.
 */
export const strokeStyle = (
  widthPx: number,
  color: string,
): Pick<CSSProperties, "WebkitTextStroke" | "paintOrder"> => ({
  WebkitTextStroke: `${widthPx}px ${color}`,
  paintOrder: "stroke fill",
});

export const baseTextStyle = (
  config: CaptionStyleConfig,
  fontFamily: string,
): CSSProperties => ({
  fontFamily,
  fontWeight: config.fontWeight,
  fontSize: config.fontSizePx,
  lineHeight: config.lineHeight,
  letterSpacing: config.letterSpacingPx,
  // Devanagari is unicase, so this only ever affects the Latin half of a
  // Hinglish line — which is exactly the intent.
  //
  // Reads `resolveTextCase`, not the raw `uppercase` flag: the editor's Tt/T/t
  // control writes `textCase`, and honouring only the boolean made "lowercase"
  // a control that visibly did nothing.
  textTransform:
    resolveTextCase(config) === "upper"
      ? "uppercase"
      : resolveTextCase(config) === "lower"
        ? "lowercase"
        : "none",
  whiteSpace: "pre",
  ...strokeStyle(config.strokeWidthPx, config.strokeColor),
});

/**
 * Wrapper for a single word.
 *
 * `display: inline-flex` + `position: relative` gives styles an absolutely
 * positioned layer to paint boxes and glows into. That layer is deliberately
 * out of flow: painting a box as padding on the word itself would resize it
 * mid-animation and reflow every sibling on the line, which is precisely the
 * per-frame jitter this app is not allowed to have.
 */
export const tokenShellStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  // Promote to its own layer: word transforms then run on the compositor
  // instead of triggering paint on the whole caption block each frame.
  willChange: "transform",
};

/** Layer painted behind the glyphs. Never affects layout. */
export const tokenBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
};

export const tokenGlyphStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
};

/** Words carry a leading space by Remotion convention; the flex gap spaces them. */
export const displayText = (token: CaptionToken): string => token.text.trim();

/**
 * Small text as a fraction of the hero word, when a template does not say.
 *
 * The stacked look only works on a decisive size gap. Anything above roughly
 * 0.5 stops reading as "caption around a headline" and starts reading as
 * "two sizes of the same text", which is the failure mode that makes a
 * home-made template look home-made.
 */
export const HERO_SMALL_RATIO = 0.34;

/**
 * Which word on a page carries the headline, for the `hero` engine.
 *
 * The whole look rests on this choice: the hero is printed several times larger
 * than everything around it, so picking the wrong word makes a page read as
 * "the" in 110px with the actual point whispered above it.
 *
 * Numbers and money win outright — "₹50,000" or "10X" is always the line's
 * payload. Otherwise the longest word wins, which in Hindi and Hinglish speech
 * is a good proxy for the content word: particles and postpositions (को, है,
 * और, the, is) are short, and the noun or verb carrying the meaning is not.
 *
 * Ties resolve to the *later* word. A page is usually a phrase building to its
 * point, so when two words are equally plausible the second is the punchline.
 *
 * Pure and index-only so the DOM preview and the Canvas2D export cannot
 * disagree about which word got enlarged — a disagreement there would not be
 * subtle, it would be a different sentence emphasised in the file the user
 * downloads.
 */
export const heroWordIndex = (texts: readonly string[]): number => {
  if (texts.length === 0) return -1;

  let best = 0;
  let bestScore = -1;

  texts.forEach((raw, index) => {
    const text = raw.trim();
    // The offset has to exceed any realistic word length so a number always
    // outranks a longer plain word, rather than merely competing with it.
    const score = (/\d|[$€£¥%]/.test(text) ? 1000 : 0) + text.length;
    if (score >= bestScore) {
      bestScore = score;
      best = index;
    }
  });

  return best;
};

export type SplashWordRole = "accent" | "script" | "base";

/**
 * Determines the typographic role of a word in a Splash/Kinetic caption page.
 * Creates the trending viral contrast: headline bold -> elegant italic script -> oversized vibrant accent.
 */
export const getSplashWordRole = (
  rawText: string,
  index: number,
  totalTokens: number,
): SplashWordRole => {
  const text = rawText.trim();
  const hasDigitsOrSymbols = /\d|[$€£¥%]/.test(text);
  if (hasDigitsOrSymbols || (index === totalTokens - 1 && totalTokens > 1)) {
    return "accent";
  }
  if (index % 2 === 1 && totalTokens > 2) {
    return "script";
  }
  if (index === 1 && totalTokens === 2 && !hasDigitsOrSymbols) {
    return "script";
  }
  return "base";
};
