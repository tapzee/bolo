export const STYLE_IDS = [
  "bold-yellow",
  "pop",
  "box",
  "glow",
  "clean",
  "splash",
  "dual",
  "hero",
  "dynamic",
  "heroMixed",
  "designWalla",
  "designWallaPro",
  "dynamicHighlight",
  "editorialOverlay",
  "kinetic",
  "underlinePunch",
  "highlightMarker",
  "mixedWeight",
  "kineticSplit",
  "centerPunch",
  "verticalImpact",
  "editorialStack",
  "magazineCut",
  "minimalLuxury",
  "layeredDepth",
  // 15 Premium Templates
  "popScale",
  "slideIn",
  "blurFocus",
  "typewriter",
  "rotateReveal",
  "wipeUp",
  "strokeFill",
  "bounceWord",
  "glitch",
  "highlightWord",
  "zoomFocus",
  "gradientFlow",
  "maskReveal",
  "drawOn",
  "depth3d",
  // Editorial Kinetic family (2 variants, one design system)
  "editorialKinetic",
  "editorialKineticPop",
  // Motion Systems family — the genuinely-new subset of the 20-template
  // brief (the other 10 already had a same-concept engine and were skipped).
  // Batch A:
  "dynamicSlideStack",
  "glassHighlight",
  "splitText",
  "liquidFlow",
  "lightSweep",
  // Batch B:
  "paperCut",
  "flipCard",
  "ribbonSlide",
  "spiralReveal",
  "floatingBubble",
  "dynamicTypography",
  // Editorial Stack Hero — 4-tier stacked hero poster (support/primary/
  // main/secondary), one word per row, restrained yellow hero accent.
  "editorialStackHero",
  // The two premium templates — a minimal centred karaoke block and a strict
  // three-row editorial poster. See the header block in
  // `remotion/captions/primitives.ts` for the rules both are built on.
  "stack",
  "focus",
  "popWord",
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
  "dynapuff",
  "limelight",
  "tangerine",
  "grandHotel",
  "archivoBlack",
  "oswald",
  "inter",
  "cormorantGaramond",
  "bodoniModa",
  "notoSerifDevanagari",
  "ibmPlexMono",
  "openSans",
  "instrumentSans",
  "rubik",
  "luckiestGuy",
  "instrumentSerif",
  "lobsterTwo",
  "kaushanScript",
  "greatVibes",
  "bungee",
  "outfit",
  "syncopate",
  "jost",
  "bangers",
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
  { id: "dynapuff", label: "DynaPuff", nativeDevanagari: false, defaultWeight: 400 },
  { id: "limelight", label: "Limelight", nativeDevanagari: false, defaultWeight: 400 },
  { id: "tangerine", label: "Tangerine", nativeDevanagari: false, defaultWeight: 700 },
  { id: "grandHotel", label: "Grand Hotel", nativeDevanagari: false, defaultWeight: 400 },
  { id: "archivoBlack", label: "Archivo Black", nativeDevanagari: false, defaultWeight: 400 },
  { id: "oswald", label: "Oswald", nativeDevanagari: false, defaultWeight: 500 },
  { id: "inter", label: "Inter", nativeDevanagari: false, defaultWeight: 400 },
  { id: "cormorantGaramond", label: "Cormorant Garamond", nativeDevanagari: false, defaultWeight: 500 },
  { id: "bodoniModa", label: "Bodoni Moda", nativeDevanagari: false, defaultWeight: 500 },
  { id: "notoSerifDevanagari", label: "Noto Serif Devanagari", nativeDevanagari: true, defaultWeight: 600 },
  { id: "ibmPlexMono", label: "IBM Plex Mono", nativeDevanagari: false, defaultWeight: 500 },
  { id: "openSans", label: "Open Sans", nativeDevanagari: false, defaultWeight: 400 },
  { id: "instrumentSans", label: "Instrument Sans", nativeDevanagari: false, defaultWeight: 400 },
  { id: "rubik", label: "Rubik Black", nativeDevanagari: false, defaultWeight: 900 },
  { id: "luckiestGuy", label: "LUCKIEST GUY", nativeDevanagari: false, defaultWeight: 400 },
  { id: "instrumentSerif", label: "Instrument Serif (italic)", nativeDevanagari: false, defaultWeight: 400 },
  { id: "lobsterTwo", label: "Lobster Two (italic)", nativeDevanagari: false, defaultWeight: 700 },
  { id: "kaushanScript", label: "Kaushan (brush script)", nativeDevanagari: false, defaultWeight: 400 },
  { id: "greatVibes", label: "Great Vibes (roundhand)", nativeDevanagari: false, defaultWeight: 400 },
  { id: "bungee", label: "THE BOLD FONT", nativeDevanagari: false, defaultWeight: 400 },
  { id: "outfit", label: "Clash Display", nativeDevanagari: false, defaultWeight: 700 },
  { id: "syncopate", label: "Druk Wide", nativeDevanagari: false, defaultWeight: 700 },
  { id: "jost", label: "Futura", nativeDevanagari: false, defaultWeight: 500 },
  { id: "bangers", label: "KOMIKA AXIS", nativeDevanagari: false, defaultWeight: 400 },
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
 *
 * `uppercase` is checked *first*, not as a `??` fallback: `CaptionStyleConfig`
 * is built from `BASE`, which always sets a concrete `textCase: "none"` — so
 * `config.textCase` is never actually `undefined` at the point this runs, and
 * a `config.textCase ?? ...` fallback can never trigger. That silently broke
 * every style/template that sets `uppercase: true` without also repeating
 * `textCase: "upper"` (most of the catalogue) — discovered via `/dev/frames`
 * visual QA, where "bold-yellow" rendered "income" in lower case despite
 * `uppercase: true`. Safe to invert: the editor's Tt/T/t control always
 * writes both fields together in sync (see `TextPanel.tsx`), so this only
 * changes the previously-broken default-config path, never an explicit
 * user choice.
 */
export const resolveTextCase = (config: {
  textCase?: TextCase;
  uppercase?: boolean;
}): TextCase =>
  config.uppercase === true ? "upper" : (config.textCase ?? "none");

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
  /** Used by Dynamic Highlight for supporting text */
  secondaryFontId?: FontId;
  /** Used by Dynamic Highlight for special text */
  specialFontId?: FontId;
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
  /**
   * Tallest a caption block (all wrapped lines of one page) may run, as a
   * percentage of canvas height. This is the fixed "box" page-building fits
   * word groups into — `buildCaptionPages` estimates rendered block height as
   * it grows a page and closes it before this budget would be exceeded,
   * rather than letting the box grow to whatever a flat word-count produced.
   */
  maxBlockHeightPct: number;

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
  /**
   * Hard cap on how many wrapped rows a page may use, `0` meaning "no cap —
   * let `maxBlockHeightPct`/`maxWordsPerPage` decide" as they always have.
   * Layered on top of those as an *additional* constraint (whichever limit
   * is hit first closes the page), not a replacement for them — a page that
   * already fits the height budget in 2 rows can still be forced to close
   * earlier by a `linesPerPage: 1` cap, but a 6-line box budget can't be
   * used to squeeze more than `linesPerPage` rows out of it either.
   */
  linesPerPage: number;
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
