export const STYLE_IDS = [
  "bold-yellow",
  "pop",
  "box",
  "glow",
  "clean",
  "splash",
  "dual",
] as const;

export type StyleId = (typeof STYLE_IDS)[number];

export const FONT_IDS = [
  "montserrat",
  "anton",
  "bebas",
  "poppins",
  "playfair",
  "caveat",
  "devanagari",
] as const;

export type FontId = (typeof FONT_IDS)[number];

export interface FontOption {
  readonly id: FontId;
  readonly label: string;
  /** True when the face itself carries Devanagari glyphs rather than falling
   *  back to Noto. Surfaced in the editor so Hindi users can pick knowingly. */
  readonly nativeDevanagari: boolean;
  readonly defaultWeight: number;
}

export const FONTS: readonly FontOption[] = [
  { id: "montserrat", label: "Montserrat", nativeDevanagari: false, defaultWeight: 800 },
  { id: "anton", label: "Anton", nativeDevanagari: false, defaultWeight: 400 },
  { id: "bebas", label: "Bebas Neue", nativeDevanagari: false, defaultWeight: 400 },
  { id: "poppins", label: "Poppins", nativeDevanagari: true, defaultWeight: 800 },
  { id: "playfair", label: "Playfair Display", nativeDevanagari: false, defaultWeight: 700 },
  { id: "caveat", label: "Caveat Script", nativeDevanagari: false, defaultWeight: 700 },
  { id: "devanagari", label: "Noto Sans Devanagari", nativeDevanagari: true, defaultWeight: 700 },
];

export type CaptionPlacement = "top" | "center" | "bottom-third" | "bottom";

export const TEXT_CASES = ["none", "upper", "lower"] as const;
export type TextCase = (typeof TEXT_CASES)[number];

export const TEXT_ALIGNS = ["left", "center", "right"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

/**
 * Resolves the effective case, honouring the older `uppercase` flag.
 *
 * Templates written before `textCase` existed still set `uppercase: true`, and
 * silently ignoring them would change how half the catalogue renders.
 */
export const resolveTextCase = (config: {
  textCase?: TextCase;
  uppercase?: boolean;
}): TextCase =>
  config.textCase ?? (config.uppercase === true ? "upper" : "none");

export const applyTextCase = (text: string, textCase: TextCase): string =>
  textCase === "upper"
    ? text.toUpperCase()
    : textCase === "lower"
      ? text.toLowerCase()
      : text;

/**
 * Everything that defines how captions look. Serialisable by construction —
 * this object is what gets written to `projects/{id}.styleConfig`, so it must
 * never hold functions, class instances or React nodes.
 *
 * All pixel values are composition pixels against a 1080x1920 canvas.
 */
export interface CaptionStyleConfig {
  styleId: StyleId;
  fontId: FontId;
  fontWeight: number;
  fontSizePx: number;
  /** Space between words, composition px. */
  wordGapPx: number;
  lineHeight: number;
  letterSpacingPx: number;
  /** Legacy shorthand for `textCase === "upper"`. Kept for existing templates. */
  uppercase: boolean;
  /** Tt / T / t in the editor. Devanagari is unicase, so this only affects Latin. */
  textCase: TextCase;
  textAlign: TextAlign;

  /**
   * Multiplier applied to the spoken word's scale, on presets that scale.
   * 1 = the preset's own behaviour; higher exaggerates it.
   */
  emphasisScale: number;

  /** Soft shadow under the whole caption block, for extra separation. */
  dropShadow: boolean;
  /** Solid plate behind the whole caption block. */
  backgroundEnabled: boolean;
  backgroundColor: string;
  /** 0–1. */
  backgroundOpacity: number;

  placement: CaptionPlacement;
  /** Nudge up (-) or down (+) as a percentage of canvas height. */
  verticalOffsetPct: number;
  /**
   * Nudge left (-) or right (+) as a percentage of canvas width.
   *
   * Stored as a percentage rather than pixels so a caption dragged on a preview
   * lands in the same relative spot at every export resolution, and on every
   * aspect ratio.
   */
  horizontalOffsetPct: number;
  /** Horizontal padding so text never touches the safe-area edge. */
  horizontalPaddingPx: number;
  /** Widest a caption line may run, as a percentage of canvas width. */
  maxLineWidthPct: number;

  /** Colour of words that are not currently being spoken. */
  baseColor: string;
  /** Colour of the word being spoken. */
  activeColor: string;
  /** Box fill / glow colour, depending on style. */
  accentColor: string;
  /** Opacity of words not yet spoken, 0–1. */
  upcomingOpacity: number;

  /**
   * Mandatory readability stroke, as an absolute floor in reference px.
   * 0 disables it — the UI does not allow that.
   */
  strokeWidthPx: number;
  /**
   * Stroke width as a fraction of font size. The effective stroke is
   * `max(strokeWidthPx, fontSizePx * strokeRatio)`.
   *
   * A fixed px stroke cannot hold the readability guarantee: 3px reads as a
   * confident outline at 40px type and as a hairline at 92px, and measured
   * against busy footage the 92px case is illegible. Tying it to font size
   * means the outline stays proportionally correct when the user drags the
   * size slider, which a fixed value silently fails to do.
   */
  strokeRatio: number;
  strokeColor: string;

  maxWordsPerPage: number;
  /** Words closer together than this share a page. */
  combineWithinMs: number;
  /** How long a page lingers after its last word, so captions don't blink. */
  holdMs: number;

  /**
   * Dual-layer engine only.
   * The "annotation" is the small thin text that overlays the large bold word.
   * annotationSizeRatio: annotation font size as a fraction of fontSizePx (e.g. 0.32 = 32%).
   */
  annotationSizeRatio: number;
  /** Dual-layer engine: font weight of the annotation layer (thin, e.g. 300). */
  annotationWeight: number;
  /** Dual-layer engine: color of the annotation text. */
  annotationColor: string;
}

export interface CaptionStyleDefinition {
  readonly id: StyleId;
  readonly label: string;
  readonly description: string;
  readonly defaults: CaptionStyleConfig;
}
