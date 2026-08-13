import type { CSSProperties } from "react";
import type { CaptionStyleConfig, CaptionToken, FontId, TextCase, WordRole } from "@/core";
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
  /**
   * Which word (if any) carries DynamicHighlight's script flourish this page.
   * See `specialWordIndex` — computed once per page, same reason `heroIndex`
   * is: every word needs to agree, and only the page's full token list can
   * answer it.
   */
  specialIndex?: number;
  /**
   * Deterministic hash of the page's own id, for engines that vary their
   * whole-page treatment (not just a per-word roll) from scene to scene —
   * `heroMixed` picks its layout with it, so every word on the same page
   * agrees, and the choice is stable across re-renders of the same page.
   */
  pageSeed?: number;
  /**
   * Frame the current *page* (not this word) started on. Combined with
   * `pageDurationFrames`, lets a template compute page-relative progress for
   * `frameProgress`/`pickFrameState` — the 10-template family's frame-state
   * system runs off how far through the whole page it is, not just this one
   * word's own speaking window.
   */
  pageStartFrame?: number;
  /** How many frames the current page lasts, start to end. */
  pageDurationFrames?: number;
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
 * Per-word case for the ~25 role-aware engines (10-template and 15-template
 * families), matching the pattern the older `hero`/`heroMixed`/`splash`/
 * `dynamicHighlight` engines already hand-rolled: the highlighted word(s)
 * force uppercase, the de-emphasised word(s) force lowercase, so the size
 * contrast reads as deliberate typography rather than one shouted line.
 *
 * Falls back to the template's own configured case for every role in
 * between (`emphasis`, `question`, `number`, `cta`, `special`) — those
 * aren't clearly "the big word" or "the small word", so forcing either
 * would be a guess this function isn't in a position to make.
 *
 * Shared by both renderers: the DOM applies the result as a CSS
 * `text-transform` (`roleCaseTransform`, below), Canvas2D has no such
 * concept and mutates the string itself (`applyTextCase` in
 * `draw-captions.ts`'s `getRenderText`) — both read this one function so
 * they can never disagree about which word is upper/lower.
 */
export const roleTextCase = (
  role: WordRole,
  config: Pick<CaptionStyleConfig, "textCase" | "uppercase">,
): TextCase => {
  if (role === "critical" || role === "keyword") return "upper";
  if (role === "connector" || role === "supporting") return "lower";
  return resolveTextCase(config);
};

/** DOM-side wrapper of `roleTextCase` — see its doc comment. */
export const roleCaseTransform = (
  role: WordRole,
  config: Pick<CaptionStyleConfig, "textCase" | "uppercase">,
): CSSProperties["textTransform"] => {
  const textCase = roleTextCase(role, config);
  return textCase === "upper" ? "uppercase" : textCase === "lower" ? "lowercase" : "none";
};

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

/**
 * Which word on a page (if any) carries DynamicHighlight's script flourish,
 * independent of the header word.
 *
 * Before this existed, "special" and "important" were both decided from the
 * *same* index (`heroIndex % 3`), so a page could only ever get a bold header
 * OR a script flourish, never both — which is why reference captions built on
 * this look (a bold header word plus a separate cursive word, e.g. "PURCHASE"
 * + "kiya") never matched what this engine actually produced. Picking a
 * second, distinct word fixes that.
 *
 * Longest-remaining-word, same as `heroWordIndex`, but scored over the words
 * `heroWordIndex` didn't pick — a short page with nothing left worth
 * flourishing returns -1, and every word just falls through to normal/
 * supporting sizing instead of a script word forced onto whatever's closest.
 *
 * Pure and index-only for the same reason `heroWordIndex` is: the DOM preview
 * and the Canvas2D export must pick the identical word.
 */
export const specialWordIndex = (
  texts: readonly string[],
  heroIndex: number,
): number => {
  if (texts.length < 3) return -1;

  let best = -1;
  let bestScore = -1;

  texts.forEach((raw, index) => {
    if (index === heroIndex) return;
    const text = raw.trim();
    // Too short to read as a flourish rather than a stray connecting word.
    if (text.length <= 3) return;
    if (text.length > bestScore) {
      bestScore = text.length;
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

/**
 * Deterministic pseudo-random based on the string itself so it doesn't flicker.
 */
export const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

/**
 * Kinetic engine — per-word entrance direction.
 *
 * Chosen from the word's own text plus its position on the page rather than
 * a random number, so the DOM preview and the Canvas2D export land on the
 * identical variant for the identical word, and so replaying the same page
 * twice (e.g. scrubbing) never flickers a different animation.
 */
export const KINETIC_VARIANTS = [
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "blurPop",
  "blurOut",
] as const;

export type KineticVariant = (typeof KINETIC_VARIANTS)[number];

export const kineticVariant = (text: string, index: number): KineticVariant =>
  KINETIC_VARIANTS[
    getHash(`${text.toLowerCase()}-${index}`) % KINETIC_VARIANTS.length
  ]!;

/**
 * Roughly 1 in 3 words render in the accent colour with a moving light-streak
 * sweeping across them once, instead of the plain karaoke highlight every
 * other word gets. Hashed off the word alone (not its index) so the same
 * word reads the same way wherever it recurs on the page — matching how
 * `isCursiveHero` in HeroMixed.tsx picks its own "special" words.
 */
export const isKineticAccentWord = (text: string): boolean =>
  getHash(text.toLowerCase()) % 3 === 0;

/**
 * Lightens a `#rrggbb` (or `#rgb`) hex colour toward white by `amount` (0–1).
 *
 * Shared by the DOM and Canvas2D kinetic renderers so the light end of the
 * accent-word gloss gradient is derived from the template's own `accentColor`
 * rather than a hand-picked highlight that would need updating every time a
 * template's palette changes.
 */
export const lightenHex = (hex: string, amount: number): string => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (channel: number) => mix(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * HeroMixed engine — which display face the hero word borrows for this page.
 *
 * Chosen from the word's own text (not its index or the page), so a hero word
 * always dresses the same way wherever it recurs, and the DOM preview and the
 * Canvas2D export never disagree about which face a given hero word gets.
 * "primary" keeps the template's own font untouched; the other three borrow a
 * face from elsewhere in the catalogue for a page of visible variety.
 */
export const HERO_FONT_STYLES = ["primary", "impact", "cursive", "serif"] as const;

export type HeroFontStyle = (typeof HERO_FONT_STYLES)[number];

export const heroFontStyle = (text: string): HeroFontStyle =>
  HERO_FONT_STYLES[getHash(text.toLowerCase()) % HERO_FONT_STYLES.length]!;

/**
 * HeroMixed engine — which face a small annotation word borrows.
 *
 * Restricted to two condensed-but-legible sans faces (not the wider kinetic
 * roster) because this text renders as small as ~20px on a phone: a display
 * or script face at that size is the readability failure this whole change
 * exists to fix, not a look worth adding.
 */
export const ANNOTATION_FONTS = ["montserrat", "poppins"] as const satisfies readonly FontId[];

export const annotationFontId = (text: string): FontId =>
  ANNOTATION_FONTS[getHash(text.toLowerCase()) % ANNOTATION_FONTS.length]!;

export type ChaosWordRole = "hero" | "sub" | "base";

export const getChaosWordRole = (
  rawText: string,
  index: number,
  totalTokens: number,
  heroIndex: number,
): ChaosWordRole => {
  if (index === heroIndex) return "hero";
  
  // Try to pick a sub-hero: ideally a long word that isn't the hero
  // For simplicity here, just pick the next longest word, or index 0 if hero is 1
  if (totalTokens > 1) {
    if (index === (heroIndex === 0 ? 1 : 0)) return "sub";
  }
  return "base";
};

/**
 * Page-relative progress, 0–1, clamped.
 *
 * The 10-template family's frame states are driven by how far through the
 * *whole page* playback is, not by any single word's own speaking window —
 * `pageStartFrame`/`pageDurationFrames` on `TokenViewProps` carry that,
 * computed once per page by `CaptionOverlay` the same way `heroIndex` is.
 */
export const frameProgress = (
  frame: number,
  pageStartFrame: number,
  pageDurationFrames: number,
): number => {
  if (pageDurationFrames <= 0) return 1;
  const raw = (frame - pageStartFrame) / pageDurationFrames;
  return raw < 0 ? 0 : raw > 1 ? 1 : raw;
};

/** One named point in a template's frame-state sequence. */
export interface FrameStateBreakpoint<TState extends string> {
  readonly state: TState;
  /** Page progress (0–1) at which this state becomes active. */
  readonly at: number;
}

/**
 * Resolves which named frame state is active at a given page progress.
 *
 * `breakpoints` must be sorted ascending by `at` — this walks them once and
 * returns the last one whose threshold has been crossed, so e.g. Editorial
 * Stack's `[{state:"supporting-in",at:0},{state:"keyword-enter",at:0.15},
 * {state:"hindi-emphasis",at:0.45},{state:"settle",at:0.7}]` reports
 * "keyword-enter" for any progress in `[0.15, 0.45)`.
 */
/**
 * Shared word-role → visual-treatment lookups for the 10-template family.
 *
 * Deliberately living here rather than inline in each `.tsx`/`draw-captions.ts`
 * branch: the DOM renderer and the Canvas2D export must compute the *exact*
 * same font-size ratio and accent/keyword boolean for the same role, or a
 * word that measures one size while wrapping the export's lines and draws at
 * another size breaks line-wrap parity — the project's worst class of bug.
 */

/** Underline Punch: which roles get the keyword treatment + underline. */
export const isUnderlinePunchAccent = (role: WordRole): boolean =>
  role === "keyword" || role === "critical" || role === "emphasis";

export const underlinePunchFontScale = (role: WordRole): number =>
  role === "critical" ? 1.08 : role === "keyword" ? 1 : role === "connector" ? 0.55 : 0.75;

/** Highlight Marker: which roles get the highlight block. */
export const isHighlightMarkerAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const highlightMarkerFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.7;

/** Mixed Weight: which roles get the ultra-bold keyword treatment. */
export const isMixedWeightKeyword = (role: WordRole): boolean =>
  role === "critical" || role === "keyword" || role === "number";

export const mixedWeightFontScale = (role: WordRole): number =>
  role === "critical" || role === "keyword" || role === "number"
    ? 1.15
    : role === "connector"
      ? 0.55
      : 0.65;

/** Kinetic Split: alternates which screen edge a word enters from. */
export const kineticSplitSide = (index: number): "left" | "right" =>
  index % 2 === 0 ? "left" : "right";

export const isKineticSplitAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword" || role === "number";

export const kineticSplitFontScale = (role: WordRole): number =>
  role === "critical" ? 1.1 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.65;

/**
 * Center Punch's frame-state sequence: build tension with small words, then
 * let the page's critical word take over the screen, then hold at a calmer
 * rest size. `at` values are page progress (0–1) — see `pickFrameState`.
 */
export const CENTER_PUNCH_STATES = [
  { state: "buildup", at: 0 },
  { state: "punch", at: 0.4 },
  { state: "settle", at: 0.75 },
] as const;

export type CenterPunchState = (typeof CENTER_PUNCH_STATES)[number]["state"];

export const centerPunchFontScale = (
  role: WordRole,
  state: CenterPunchState,
): number => {
  const isCritical = role === "critical";
  if (state === "buildup") return isCritical ? 0.55 : 0.5;
  if (state === "punch") return isCritical ? 1.6 : 0.62;
  return isCritical ? 1.15 : 0.62; // settle
};

/**
 * Vertical Impact's stacked-column keyword sizing, shared by the DOM
 * renderer, the Canvas2D line-wrap measurement pass and the Canvas2D draw
 * pass — three places that must agree on exactly how tall a column of `n`
 * characters is, or the DOM preview and the export disagree about how much
 * vertical room the word needs.
 */
export const VERTICAL_IMPACT_CHAR_RATIO = 0.82;
const VERTICAL_IMPACT_LINE_HEIGHT = 0.94;
const VERTICAL_IMPACT_GAP_PX = 2;

export const verticalImpactCharFontSize = (fontSizePx: number): number =>
  fontSizePx * VERTICAL_IMPACT_CHAR_RATIO;

export const verticalImpactColumnHeight = (text: string, fontSizePx: number): number => {
  const charFontSize = verticalImpactCharFontSize(fontSizePx);
  const chars = Array.from(text).length;
  return chars * charFontSize * VERTICAL_IMPACT_LINE_HEIGHT + Math.max(0, chars - 1) * VERTICAL_IMPACT_GAP_PX;
};

/** Editorial Stack: which roles get the huge serif keyword treatment. */
export const isEditorialStackKeyword = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

/**
 * Editorial Stack font scale. Devanagari words get their own large-serif
 * emphasis tier regardless of role — Hindi is meant to visually punctuate the
 * line, not just inherit whatever role English content-word scoring gave it.
 */
export const editorialStackFontScale = (role: WordRole, isDevanagariWord: boolean): number => {
  if (isDevanagariWord) return role === "critical" ? 1.3 : 0.85;
  if (isEditorialStackKeyword(role)) return role === "critical" ? 1.3 : 0.85;
  return role === "connector" ? 0.28 : 0.34;
};

/** Magazine Cut: which roles get the oversized, cropped headline treatment. */
export const isMagazineCutKeyword = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const magazineCutFontScale = (role: WordRole, isDevanagariWord: boolean): number => {
  if (isMagazineCutKeyword(role)) return role === "critical" ? 1.55 : 1.2;
  if (isDevanagariWord) return 0.85;
  return role === "connector" ? 0.35 : 0.45;
};

/** Minimal Luxury: font scale per role/script — quiet by default, only the keyword is large. */
export const minimalLuxuryFontScale = (role: WordRole, isDevanagariWord: boolean): number => {
  if (isDevanagariWord) return 0.75;
  if (role === "critical") return 1.3;
  if (role === "keyword") return 1.05;
  if (role === "number") return 0.32;
  return 0.4;
};

/**
 * Minimal Luxury: static resting tracking (letter-spacing) per role, as a
 * fraction of font size. Deliberately not time-varying — see
 * `MinimalLuxuryToken`'s doc comment on why animating letter-spacing on
 * layout-participating text is unsafe here.
 */
export const minimalLuxuryTrackingRatio = (role: WordRole): number =>
  role === "critical" || role === "keyword" ? 0.15 : role === "number" ? 0.25 : 0.08;

/** Layered Depth: foreground (non-backdrop) font scale per role. */
export const layeredDepthForegroundScale = (role: WordRole): number => {
  if (role === "critical") return 0.95;
  if (role === "keyword") return 1.05;
  if (role === "connector") return 0.5;
  return 0.65;
};

/**
 * Shared word-role → visual-treatment lookups for the 15-template premium
 * family. Same rationale as the 10-template block above: the DOM renderer,
 * `draw-captions.ts` and `page-fit.ts` must agree on exactly which role gets
 * the "hero"/"accent" treatment and how large it draws, or the page-fit
 * estimate and the real render disagree about how much room a page needs.
 */

/** Pop Scale: only the page's one critical word gets the hero punch-in. */
export const isPopScaleHero = (role: WordRole): boolean => role === "critical";

export const popScaleFontScale = (role: WordRole): number =>
  role === "critical" ? 1 : role === "connector" ? 0.5 : 0.66;

/** Slide In: which roles get the coloured pill + heavier slide-in weight. */
export const isSlideInAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const slideInFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.55 : 0.75;

/** Slide In: alternates entry edge so consecutive words don't all slide the same way; the critical word always rises from below. */
export const slideInDirection = (
  role: WordRole,
  index: number,
): "left" | "right" | "up" =>
  role === "critical" ? "up" : index % 2 === 0 ? "left" : "right";

/** Blur Focus: which roles hold the heavy cinematic blur-to-sharp reveal. */
export const isBlurFocusAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const blurFocusFontScale = (role: WordRole): number =>
  role === "critical" ? 1.08 : role === "keyword" ? 0.95 : role === "connector" ? 0.42 : 0.55;

/** Typewriter: which roles hold the accent colour once typed. Size stays flat — a monospace caption's whole identity is the uniform grid. */
export const isTypewriterAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword" || role === "number";

/** Rotate Reveal: which roles get the swing-in rotation + arrow flourish. */
export const isRotateRevealAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const rotateRevealFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.92 : role === "connector" ? 0.5 : 0.68;

/** Wipe Up: which roles get the upward mask reveal + solid highlight block. */
export const isWipeUpAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const wipeUpFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.7;

/** Stroke Fill: which roles fill solid; everything else stays outline-only. */
export const isStrokeFillAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const strokeFillFontScale = (role: WordRole): number =>
  role === "critical" ? 1.1 : role === "keyword" ? 1 : role === "connector" ? 0.55 : 0.75;

/** Bounce Word: which roles get the pill highlight + bigger bounce. */
export const isBounceWordAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const bounceWordFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.72;

/** Glitch: which roles are eligible for the brief RGB/slice burst. Size stays flat — the reference keeps every word the same cap-height, distinguished only by the burst treatment. */
export const isGlitchAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

/** Highlight Word: which roles get the sliding highlight marker. */
export const isHighlightWordAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const highlightWordFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.55 : 0.78;

/** Zoom Focus: only the critical word gets the camera punch + corner brackets. */
export const isZoomFocusAccent = (role: WordRole): boolean => role === "critical";

export const zoomFocusFontScale = (role: WordRole): number =>
  role === "critical" ? 1 : role === "connector" ? 0.45 : 0.6;

/** Gradient Flow: which roles carry the animated blue→purple gradient fill. */
export const isGradientFlowAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const gradientFlowFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.72;

/** Mask Reveal: only the critical word becomes the oversized glass cutout. */
export const isMaskRevealHero = (role: WordRole): boolean => role === "critical";

export const maskRevealFontScale = (role: WordRole): number =>
  role === "critical" ? 1 : role === "connector" ? 0.4 : 0.5;

/** Draw On: which roles borrow the script face + hand-drawn underline. */
export const isDrawOnScript = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const drawOnFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.6 : 0.8;

/** 3D Depth: which roles get the extruded layered-shadow treatment. */
export const isDepth3dAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const depth3dFontScale = (role: WordRole): number =>
  role === "critical" ? 1.08 : role === "keyword" ? 0.95 : role === "connector" ? 0.45 : 0.62;

/**
 * Editorial Kinetic — the three-tier typographic role every word on a page is
 * sorted into: a tiny sans "support" word (ki/se/and/log), a bold condensed
 * "display" word (the headline anchor), and an elegant italic "editorial"
 * word that supplies contrast. Shared by both StyleId variants
 * (`editorialKinetic`/`editorialKineticPop` — same typography, different
 * animation choreography) and by `draw-captions.ts`/`page-fit.ts`, so all
 * three agree on exactly which word gets which treatment.
 *
 * Built on top of the existing `WordRole` taxonomy rather than a bespoke
 * classifier: closed-class connectors/short words already map to "support",
 * the page's one salient word ("critical") and numbers anchor "display", and
 * Hindi intensifiers ("emphasis"/"special") are a natural fit for the italic
 * "editorial" accent. The remaining open-class "keyword" words are split by a
 * hash of the word itself — deterministic, so the DOM preview and the
 * Canvas2D export (and re-renders of the same word) never disagree — biased
 * roughly 2:1 toward "display", matching the reference's shape of several
 * bold anchor words per one italic accent.
 */
export type EditorialKineticRole = "support" | "display" | "editorial";

export const editorialKineticRole = (
  role: WordRole,
  text: string,
): EditorialKineticRole => {
  if (role === "critical" || role === "number") return "display";
  if (role === "emphasis" || role === "special") return "editorial";
  if (
    role === "connector" ||
    role === "supporting" ||
    role === "question" ||
    role === "cta"
  ) {
    return "support";
  }
  if (role === "keyword") {
    return getHash(text.toLowerCase()) % 3 === 0 ? "editorial" : "display";
  }
  return "support";
};

/**
 * Font-size scale relative to `config.fontSizePx`, per the spec's stated
 * ranges (support ~25-35%, editorial ~50-80%, display ~65-100%). The page's
 * `critical` word (the single visual anchor) gets the top of the display
 * range; other display words sit a little smaller so the anchor still reads
 * as the biggest thing on screen.
 */
export const editorialKineticFontScale = (
  role: WordRole,
  ekRole: EditorialKineticRole,
): number => {
  if (ekRole === "display") return role === "critical" ? 1.15 : 0.92;
  if (ekRole === "editorial") return 0.62;
  return 0.3;
};

/** Only the page's single critical word carries the restrained yellow accent — see the spec's "do not make everything yellow" rule. */
export const isEditorialKineticAccent = (role: WordRole): boolean =>
  role === "critical";

/**
 * Editorial Stack Hero — a 4-tier stacked poster layout, one word per row
 * (same `flexBasis: 100%` trick as Editorial Kinetic, see
 * `EditorialStackHero.tsx`). Splits Editorial Kinetic's "display" tier in
 * two: a single hero word ("main") gets the huge yellow pop treatment, the
 * rest of the anchor words ("primary") stay large and bold but never yellow,
 * an italic "secondary" accent supplies contrast, and tiny "support"
 * connectors round out the read-along line. Shared by the DOM renderer,
 * `draw-captions.ts` and `page-fit.ts` so all three agree on which word gets
 * which treatment.
 */
export type EditorialStackHeroRole = "support" | "primary" | "main" | "secondary";

export const editorialStackHeroRole = (
  role: WordRole,
  text: string,
): EditorialStackHeroRole => {
  if (role === "critical" || role === "number") return "main";
  if (role === "emphasis" || role === "special") return "secondary";
  if (
    role === "connector" ||
    role === "supporting" ||
    role === "question" ||
    role === "cta"
  ) {
    return "support";
  }
  if (role === "keyword") {
    return getHash(text.toLowerCase()) % 3 === 0 ? "secondary" : "primary";
  }
  return "support";
};

/**
 * Font-size scale relative to `config.fontSizePx`. The page's `critical`
 * word gets the top of the "main" range so it still reads as the single
 * biggest thing on screen even next to a `number` sharing its tier.
 */
export const editorialStackHeroFontScale = (
  role: WordRole,
  tier: EditorialStackHeroRole,
): number => {
  if (tier === "main") return role === "critical" ? 1.2 : 1;
  if (tier === "primary") return 0.78;
  if (tier === "secondary") return 0.75;
  return 0.55;
};

/** Only the page's single critical word carries the restrained yellow accent — same rule as Editorial Kinetic. */
export const isEditorialStackHeroAccent = (role: WordRole): boolean =>
  role === "critical";

export const pickFrameState = <TState extends string>(
  progress: number,
  breakpoints: readonly FrameStateBreakpoint<TState>[],
): TState => {
  let current = breakpoints[0]?.state;
  for (const breakpoint of breakpoints) {
    if (progress < breakpoint.at) break;
    current = breakpoint.state;
  }
  if (current === undefined) {
    throw new Error("pickFrameState: breakpoints must not be empty");
  }
  return current;
};

/**
 * Shared word-role → visual-treatment lookups for the "motion systems"
 * family — the genuinely-new subset of the 20-template brief (the other 10
 * of the 20 already have a same-concept engine in the catalogue and were
 * deliberately skipped, see the plan). Same rationale as the two blocks
 * above: the DOM renderer, `draw-captions.ts` and `page-fit.ts` must agree
 * exactly on which role gets the accent treatment and how large it draws.
 */

/** Dynamic Slide Stack: only the page's one critical word gets the oversized stacked treatment. */
export const isDynamicSlideStackHero = (role: WordRole): boolean => role === "critical";

export const dynamicSlideStackFontScale = (role: WordRole): number =>
  role === "critical" ? 1.3 : role === "keyword" ? 0.85 : role === "connector" ? 0.4 : 0.55;

/**
 * Alternating slide-in direction per word, hashed from the word's own text
 * plus its index (same pattern as `kineticVariant`) so the DOM preview and
 * the Canvas2D export always agree, and the same word entering twice always
 * slides the same way.
 */
/** Design Walla: supporting-text size, as a fraction of the hero's `fontSizePx`. */
export const DESIGN_WALLA_SMALL_RATIO = 0.36;

/**
 * Design Walla: which page-level hero treatment this page's single hero word
 * gets — bold yellow caps or an italic script flourish. Seeded from the page
 * (not the word) so the whole page commits to one identity, matching the
 * reference video: every page shows exactly one hero style, never both mixed
 * on the same page.
 */
export const designWallaHeroIsScript = (pageSeed: number): boolean =>
  pageSeed % 4 >= 2;

/**
 * Design Walla: which way the hero word slides in — up from below or down
 * from above. Also page-seeded (a different bit than the style choice above)
 * so a page's hero commits to one direction rather than reading as arbitrary
 * per-word jitter.
 */
export const designWallaHeroDirection = (pageSeed: number): "up" | "down" =>
  pageSeed % 2 === 0 ? "up" : "down";

/**
 * Design Walla Pro: exactly three lines. Words before hero go to top, hero goes to middle, words after go to bottom.
 */
export type DesignWallaProRole = "top" | "middle" | "bottom";

export const designWallaProRole = (
  index: number,
  heroIndex: number,
): DesignWallaProRole => {
  if (index === heroIndex) return "middle";
  if (index < heroIndex) return "top";
  return "bottom";
};

export const designWallaProFontScale = (role: DesignWallaProRole): number =>
  role === "middle" ? 1.15 : 0.60;

/**
 * Design Walla Pro: Alternates slide-in direction based on pageSeed so the bi-directional layout is consistent on the page.
 */
export const designWallaProDirection = (pageSeed: number): "left" | "right" =>
  pageSeed % 2 === 0 ? "left" : "right";

export const designWallaProHeroIsSerif = (pageSeed: number): boolean =>
  (pageSeed % 4) < 2;

export const SLIDE_STACK_DIRECTIONS = ["left", "right", "up", "down"] as const;
export type SlideStackDirection = (typeof SLIDE_STACK_DIRECTIONS)[number];
export const dynamicSlideStackDirection = (text: string, index: number): SlideStackDirection =>
  SLIDE_STACK_DIRECTIONS[
    getHash(`${text.toLowerCase()}-${index}`) % SLIDE_STACK_DIRECTIONS.length
  ]!;

/** Glass Highlight: which roles sit inside the translucent glass panel. */
export const isGlassHighlightAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const glassHighlightFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.55 : 0.75;

/** Split Text: only the page's critical word gets the two-layer split treatment. */
export const isSplitTextHero = (role: WordRole): boolean => role === "critical";

export const splitTextFontScale = (role: WordRole): number =>
  role === "critical" ? 1.15 : role === "keyword" ? 0.85 : role === "connector" ? 0.45 : 0.6;

/** Liquid Flow: which roles get the flowing-ribbon backdrop + accent colour. */
export const isLiquidFlowAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const liquidFlowFontScale = (role: WordRole): number =>
  role === "critical" ? 1.1 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.68;

export interface LiquidRibbonPoints {
  start: readonly [number, number];
  cp1: readonly [number, number];
  cp2: readonly [number, number];
  end: readonly [number, number];
}

/**
 * Bezier control points for Liquid Flow's ribbon, relative to a `width` x
 * `height` box. The DOM turns these into an SVG `<path d="...">`, Canvas2D
 * calls `bezierCurveTo` with the same numbers — shared so preview and export
 * trace the identical curve. `phase` (any real number, the caller's own
 * clock in seconds/period) drifts the curve horizontally for the "flowing"
 * read; this stays a pure function of that input, never frame-stored state.
 */
export const liquidRibbonControlPoints = (
  width: number,
  height: number,
  phase: number,
): LiquidRibbonPoints => {
  const wave = Math.sin(phase * Math.PI * 2) * height * 0.28;
  const midY = height * 0.5;
  return {
    start: [0, midY + wave * 0.4],
    cp1: [width * 0.32, midY - wave],
    cp2: [width * 0.68, midY + wave],
    end: [width, midY - wave * 0.4],
  };
};

/** Light Sweep: which roles get the dim → illuminated sweep. */
export const isLightSweepAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const lightSweepFontScale = (role: WordRole): number =>
  role === "critical" ? 1.08 : role === "keyword" ? 0.95 : role === "connector" ? 0.45 : 0.62;

/** Paper Cut: which roles sit on the accent (yellow) paper strip vs the plain white strip. */
export const isPaperCutAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const paperCutFontScale = (role: WordRole): number =>
  role === "critical" ? 1.1 : role === "keyword" ? 0.9 : role === "connector" ? 0.5 : 0.65;

export interface PaperCutPoint {
  x: number;
  y: number;
}

/**
 * Deterministic torn-edge polygon for Paper Cut's strips, as fractions
 * (0-1) of the strip's own width/height, hashed from a `seed` (the word's
 * own text hash). Shared so the DOM `clip-path: polygon(...)` and the
 * Canvas2D manual `lineTo` path trace the identical jagged edge for the
 * same word — a different polygon per side would make the preview and the
 * export visibly different shapes for the same word.
 */
export const paperStripClipPath = (seed: number): readonly PaperCutPoint[] => {
  const jag = (i: number, base: number, amplitude: number): number => {
    const h = getHash(`${seed}-${i}`);
    return base + (((h % 100) / 100) - 0.5) * 2 * amplitude;
  };
  const steps = 6;
  const top: PaperCutPoint[] = [];
  const bottom: PaperCutPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    top.push({ x, y: jag(i, 0, 0.1) });
    bottom.push({ x, y: jag(i + 100, 1, 0.1) });
  }
  return [...top, ...bottom.reverse()];
};

/** Flip Card: which roles get the 3D card treatment vs plain support text. */
export const isFlipCardAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const flipCardFontScale = (role: WordRole): number =>
  role === "critical" ? 1.1 : role === "keyword" ? 0.95 : role === "connector" ? 0.5 : 0.68;

/** Ribbon Slide: which roles get a ribbon banner (vs plain text). */
export const isRibbonSlideAccent = (role: WordRole): boolean =>
  role === "critical" || role === "keyword" || role === "number";

export const ribbonSlideFontScale = (role: WordRole): number =>
  role === "critical"
    ? 1.08
    : role === "keyword" || role === "number"
      ? 0.95
      : role === "connector"
        ? 0.48
        : 0.62;

/** Alternates which edge a ribbon slides in from. */
export const ribbonSlideSide = (index: number): "left" | "right" =>
  index % 2 === 0 ? "left" : "right";

/**
 * Fixed banner-notch polygon for Ribbon Slide, as fractions of the
 * ribbon's own width/height — a pointed chevron cut into both ends. Shared
 * for the same DOM-clip-path / Canvas2D-manual-path reason as
 * `paperStripClipPath`.
 */
export const ribbonClipPath = (): readonly PaperCutPoint[] => [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0.96, y: 0.5 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: 0.04, y: 0.5 },
];

/** Spiral Reveal: only the page's one critical/keyword word curves around the circle. */
export const isSpiralRevealHero = (role: WordRole): boolean =>
  role === "critical" || role === "keyword";

export const spiralRevealFontScale = (role: WordRole): number =>
  isSpiralRevealHero(role) ? 0.62 : role === "connector" ? 0.3 : 0.4;

/**
 * Per-character angle (degrees) around Spiral Reveal's circle, shared by
 * the Canvas2D export's manual per-character placement. The DOM renders the
 * curving word via native SVG `<textPath>`, which needs no manual math —
 * see `SpiralReveal.tsx`'s doc comment for why the two are not
 * pixel-identical (documented deviation). `charCount` words fan across a
 * capped span so a long word never wraps more than a full circle.
 */
export const spiralCharAngleDeg = (
  charIndex: number,
  charCount: number,
  anglePerChar = 18,
): number => {
  const span = Math.min(340, charCount * anglePerChar);
  const start = -span / 2;
  return charCount <= 1 ? 0 : start + (span * charIndex) / (charCount - 1);
};

/** Floating Bubble: font scale per role — the bubble itself grows/shrinks with it. */
export const floatingBubbleFontScale = (role: WordRole): number =>
  role === "critical" ? 1.05 : role === "keyword" ? 0.95 : role === "connector" ? 0.55 : 0.75;

/**
 * Small ambient x/y drift (px) per bubble, hashed from the word's own text
 * plus its page index so neighbouring bubbles don't float in lockstep. Pure
 * transform — doesn't affect the layout box, so `page-fit.ts` only needs
 * `floatingBubbleFontScale`, not this.
 */
export const floatingBubbleOffset = (
  text: string,
  index: number,
  frame: number,
  fps: number,
): { x: number; y: number } => {
  const seed = getHash(`${text.toLowerCase()}-${index}`);
  const phaseX = (seed % 100) / 100;
  const phaseY = ((seed >> 4) % 100) / 100;
  const t = frame / fps;
  return {
    x: Math.sin((t / 3.2 + phaseX) * Math.PI * 2) * 8,
    y: Math.cos((t / 2.6 + phaseY) * Math.PI * 2) * 10,
  };
};

/** A curated glass tint per bubble, hashed from the word's own text. */
export const FLOATING_BUBBLE_TINTS = ["#7c4dff", "#00b8d4", "#ff6ec7", "#ffb74d"] as const;
export const floatingBubbleTint = (text: string): string =>
  FLOATING_BUBBLE_TINTS[getHash(text.toLowerCase()) % FLOATING_BUBBLE_TINTS.length]!;

/**
 * ===========================================================================
 * THE TWO PREMIUM TEMPLATES — `focus` and `stack`
 * ===========================================================================
 *
 * Both are built on the same three rules, which are what separate a template
 * that reads as After Effects work from one that reads as a caption plugin:
 *
 * 1. **Nothing random.** Every size, colour, font and alignment decision below
 *    is a pure function of the word's *role* (or its row index), never of a
 *    hash roll or a per-frame clock. The composition is designed, so the same
 *    sentence always lands the same way and the eye reads a deliberate layout
 *    rather than scattered text.
 * 2. **Only transforms move.** Nothing that animates is allowed to change a
 *    word's layout box — scale, translate, opacity and blur only. A word can
 *    therefore never shove its neighbours mid-animation, which is the jitter
 *    that makes home-made captions look home-made.
 * 3. **Every motion settles.** Each word plays exactly one entrance and then
 *    holds. No continuous pan, no ambient drift, no second wobble.
 */

/**
 * The readability guarantee for the two premium templates, in place of a
 * stroke.
 *
 * Both templates set `strokeWidthPx: 0` — at 74–116px an outline reads as a
 * sticker, not as typography, and it is the first thing that makes a caption
 * look cheap. But white text still has to survive white footage: measured on
 * `/dev/export-frames?backdrop=bright`, unhaloed white words on the bright
 * backdrop were close to invisible.
 *
 * So separation comes from two stacked shadows instead: a tight dark halo that
 * hugs the letterforms and does the actual contrast work, and a wider, softer
 * drop that gives the block depth. Ratios of font size, not fixed pixels, so
 * they hold at every size the user can drag to and at every export resolution.
 *
 * The DOM renders these as a two-layer `text-shadow`; `draw-captions.ts` paints
 * one `fillText` pass per layer and then a crisp pass on top. Same layers, same
 * order, so the two renderers separate text from footage identically.
 */
export interface CaptionHaloLayer {
  /** Blur radius, as a fraction of the word's own font size. */
  blurRatio: number;
  /** Downward offset, as a fraction of font size. */
  offsetYRatio: number;
  color: string;
}

export const PREMIUM_HALO: readonly CaptionHaloLayer[] = [
  { blurRatio: 0.14, offsetYRatio: 0, color: "rgba(0,0,0,0.65)" },
  { blurRatio: 0.3, offsetYRatio: 0.07, color: "rgba(0,0,0,0.45)" },
];

/**
 * The hairline that backs the halo up on genuinely hostile footage.
 *
 * The halo alone carries most backdrops, but the `busy` backdrop — hard
 * black-and-white diagonals, the worst case this repo tests against — still
 * ate the dimmed half of a Focus line, and a caption a viewer cannot read
 * ahead into is a broken caption however good it looks on a gradient.
 *
 * Taken as a fraction of *each word's own* size rather than a flat pixel
 * value, via the `strokeRatio` field the repo already uses for exactly this:
 * at `0.025` that is ~1.2px behind Stack's small support words and ~2.9px
 * behind its headline, which reads as edge definition. The 8.5% the stroked
 * templates use would read as an outline, which is the look these two exist
 * to avoid.
 *
 * `strokeWidthPx` still wins when larger, so a user who wants a real outline
 * can still dial one in from the editor.
 */
export const premiumStrokePx = (
  fontSizePx: number,
  config: Pick<CaptionStyleConfig, "strokeWidthPx" | "strokeRatio">,
): number => Math.max(config.strokeWidthPx, fontSizePx * config.strokeRatio);

export const haloTextShadow = (fontSizePx: number): string =>
  PREMIUM_HALO.map(
    (layer) =>
      `0 ${layer.offsetYRatio * fontSizePx}px ${layer.blurRatio * fontSizePx}px ${layer.color}`,
  ).join(", ");

/**
 * Focus — the minimal one. One clean centred block, uniform size and weight,
 * up to three wrapped rows. The spoken word lifts and brightens while the rest
 * of the page sits dimmed, and the sentence's single most salient word carries
 * an italic serif accent so the page still has a focal point before it is
 * spoken. Two faces, one accent colour, nothing else.
 *
 * Deliberately *not* size-varying: uniform sizing is what lets the page-fit
 * estimator (`page-fit.ts`'s default branch) be exact rather than approximate,
 * and it is the whole reason this template reads as calm.
 */
export type FocusTier = "support" | "body" | "hero" | "script";

export const focusTier = (role: WordRole): FocusTier => {
  if (role === "critical" || role === "number") return "hero";
  if (role === "emphasis" || role === "special" || role === "question") return "script";
  if (role === "keyword" || role === "cta") return "body";
  return "support";
};

export const isFocusAccent = (role: WordRole): boolean =>
  focusTier(role) === "hero";

export const isFocusScript = (role: WordRole): boolean =>
  focusTier(role) === "script";

export const focusFontScale = (tier: FocusTier): number =>
  tier === "hero" ? 1 : tier === "script" ? 0.62 : tier === "body" ? 0.5 : 0.38;

export const focusTierIsUpper = (tier: FocusTier): boolean => tier === "hero";

export const focusFontWeight = (
  tier: FocusTier,
  config: Pick<CaptionStyleConfig, "fontWeight">,
): number =>
  tier === "hero" ? config.fontWeight : tier === "body" ? 800 : tier === "script" ? 700 : 650;

/** Opacity a word falls back to once it has been spoken — still readable, clearly past. */
export const FOCUS_SPOKEN_OPACITY = 0.72;

/** How much the spoken word grows. Pure transform, so it never reflows the row. */
export const FOCUS_ACTIVE_SCALE = 0.07;

/** How far the spoken word lifts, as a fraction of its own font size. */
export const FOCUS_ACTIVE_LIFT_RATIO = 0.035;

/**
 * Upcoming → active → spoken, as one continuous curve.
 *
 * `started` and `ended` are the two spring envelopes (see `focusEnvelope` in
 * `animation.ts`); this maps them onto opacity so a word ramps from
 * `upcomingOpacity` up to 1 as it is spoken and settles back to
 * `FOCUS_SPOKEN_OPACITY` after. Shared by both renderers so the karaoke read
 * is frame-identical in the preview and the exported file.
 */
export const focusWordOpacity = (
  started: number,
  ended: number,
  upcomingOpacity: number,
): number =>
  upcomingOpacity +
  started * (1 - upcomingOpacity) -
  ended * (1 - FOCUS_SPOKEN_OPACITY);

export const focusWordScale = (started: number, ended: number): number =>
  1 + (started - ended) * FOCUS_ACTIVE_SCALE;

/**
 * Stack — the editorial one. Three rows, one word per row, four typographic
 * tiers: a tiny sans support word, a bold condensed anchor, one oversized
 * headline word in the accent colour, and an italic serif accent for contrast.
 *
 * Same role taxonomy as Editorial Stack Hero, under its own names and its own
 * scale/alignment rules — this template is tuned as a strict three-row poster
 * (`linesPerPage: 3`, `maxWordsPerPage: 3`), not a stack of however many words
 * a page happens to hold.
 */
export type StackTier = "support" | "primary" | "hero" | "accent";

export const stackTier = (role: WordRole, text: string): StackTier => {
  if (role === "critical" || role === "number") return "hero";
  if (role === "emphasis" || role === "special") return "accent";
  if (
    role === "connector" ||
    role === "supporting" ||
    role === "question" ||
    role === "cta"
  ) {
    return "support";
  }
  // Open-class words split roughly 2:1 toward the bold anchor tier, so a page
  // reads as several anchors around one italic accent rather than alternating.
  // Hashed off the word itself (not its position) so a word always dresses the
  // same way wherever it recurs, and preview and export never disagree.
  if (role === "keyword") {
    return getHash(text.toLowerCase()) % 3 === 0 ? "accent" : "primary";
  }
  return "support";
};

/**
 * Font size per tier, relative to `fontSizePx`.
 *
 * The gap between the headline and everything else is the entire look. At a
 * 116px headline this puts support text at ~44px — decisive enough that the
 * page reads as "a poster with a caption in it" rather than "text in two
 * sizes", which is the failure mode of every mediocre stacked template.
 */
export const stackFontScale = (tier: StackTier): number =>
  tier === "hero" ? 1 : tier === "primary" ? 0.58 : tier === "accent" ? 0.5 : 0.42;

/**
 * Which way a row is tucked off the page's centre line.
 *
 * The headline always centres — it is the anchor the composition hangs off —
 * and the smaller rows alternate left and right of it, which is what produces
 * the offset, magazine-page rhythm. Keyed on the row's index rather than a
 * hash so the alternation is designed rather than noise, and so both renderers
 * place a given row identically.
 */
export const stackRowAlign = (
  tier: StackTier,
  index: number,
): "left" | "center" | "right" =>
  tier === "hero" ? "center" : index % 2 === 0 ? "left" : "right";

/**
 * How far a tucked row sits from centre, as a fraction of the page's headline
 * size.
 *
 * Deliberately derived from `fontSizePx` — a number both renderers already
 * hold — rather than from the block's own width.
 *
 * The width route is the obvious one and it does not survive contact with the
 * two renderers: the DOM's caption block is shrink-to-fit, so "align to the
 * block's edge" means the width of whatever the browser laid out, while
 * `draw-captions.ts` would have to guess that same number from its measured
 * lines. They disagree the moment a page's words sum wider than one row.
 * Offsetting by a shared constant instead is exact on both sides, and being a
 * transform it also cannot affect line wrapping.
 */
export const STACK_ROW_TUCK_RATIO = 0.8;

export const stackRowOffsetPx = (
  tier: StackTier,
  index: number,
  fontSizePx: number,
): number => {
  const align = stackRowAlign(tier, index);
  if (align === "center") return 0;
  return (align === "left" ? -1 : 1) * fontSizePx * STACK_ROW_TUCK_RATIO;
};

/** Only the page's one headline word carries the accent colour. */
export const isStackAccentColour = (tier: StackTier): boolean => tier === "hero";

/** Caps shout, small text whispers — the case contrast is part of the tier system. */
export const stackTierIsUpper = (tier: StackTier): boolean =>
  tier === "hero" || tier === "primary";
