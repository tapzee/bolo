import type {
  CaptionStyleConfig,
  CaptionStyleDefinition,
  StyleId,
} from "./types";
import { STYLE_IDS } from "./types";

/**
 * Shared baseline. Individual styles override only what makes them distinct,
 * which keeps the five presets visibly related rather than five unrelated
 * designs — and means a global readability fix lands everywhere at once.
 */
const BASE: CaptionStyleConfig = {
  styleId: "bold-yellow",
  fontId: "montserrat",
  fontWeight: 800,
  fontSizePx: 76,
  /**
   * Word gaps are sized for the *animated* width of a word, not its resting
   * width. The active word scales up and CSS transforms do not reflow, so a gap
   * tuned to static text lets a highlighted word visually collide with its
   * neighbours ("INCOMEकैसे"). Each style widens this to cover its own peak
   * overhang — scale for Pop, box padding for Box, bloom radius for Glow.
   */
  wordGapPx: 26,
  lineHeight: 1.18,
  letterSpacingPx: 0,
  uppercase: false,
  textCase: "none",
  textAlign: "center",

  emphasisScale: 1,
  dropShadow: false,
  backgroundEnabled: false,
  backgroundColor: "#000000",
  backgroundOpacity: 0.45,

  placement: "bottom-third",
  verticalOffsetPct: 0,
  horizontalOffsetPct: 0,
  horizontalPaddingPx: 96,
  maxLineWidthPct: 92,

  baseColor: "#ffffff",
  activeColor: "#ffd60a",
  accentColor: "#ffd60a",
  upcomingOpacity: 1,

  strokeWidthPx: 3,
  // ~8.5% of font size. Measured against the `busy` backdrop, which is the
  // worst realistic case: below roughly 7% white text on white detail stops
  // separating from the background.
  strokeRatio: 0.085,
  strokeColor: "#000000",

  maxWordsPerPage: 4,
  combineWithinMs: 1200,
  holdMs: 220,

  // Dual-layer engine defaults — zero-value so no existing engine is affected.
  annotationSizeRatio: 0,
  annotationWeight: 300,
  annotationColor: "#ffffff",
};

const define = (
  id: StyleId,
  label: string,
  description: string,
  overrides: Partial<CaptionStyleConfig>,
): CaptionStyleDefinition => ({
  id,
  label,
  description,
  defaults: { ...BASE, ...overrides, styleId: id },
});

export const CAPTION_STYLES: Readonly<
  Record<StyleId, CaptionStyleDefinition>
> = {
  "bold-yellow": define(
    "bold-yellow",
    "Bold Yellow",
    "White text, spoken word snaps to yellow. The reliable one.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 78,
      uppercase: true,
      letterSpacingPx: -1,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ffd60a",
      maxWordsPerPage: 4,
    },
  ),

  pop: define(
    "pop",
    "Pop",
    "Each word springs in with an overshoot. High energy, high retention.",
    {
      fontId: "anton",
      fontWeight: 400,
      fontSizePx: 84,
      uppercase: true,
      letterSpacingPx: 1,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff5a2c",
      strokeWidthPx: 4,
      // Peaks at 1.3x scale, so a ~250px word overhangs ~37px per side.
      wordGapPx: 44,
      maxWordsPerPage: 3,
      combineWithinMs: 900,
    },
  ),

  box: define(
    "box",
    "Box",
    "A rounded block slides in behind the spoken word. Reads on any footage.",
    {
      fontId: "poppins",
      fontWeight: 800,
      fontSizePx: 68,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#0a0a0b",
      accentColor: "#00e5a0",
      strokeWidthPx: 3,
      // The block extends fontSize * 0.24 (~16px) past the word on each side,
      // so anything under ~34px lets it overlap the previous word.
      wordGapPx: 40,
      maxWordsPerPage: 4,
    },
  ),

  glow: define(
    "glow",
    "Glow",
    "Neon bloom on the spoken word. Built for night footage and gaming clips.",
    {
      fontId: "bebas",
      fontWeight: 400,
      fontSizePx: 92,
      uppercase: true,
      letterSpacingPx: 2,
      baseColor: "#e8e8f0",
      activeColor: "#ffffff",
      accentColor: "#4cc9ff",
      strokeWidthPx: 3,
      wordGapPx: 32,
      maxWordsPerPage: 4,
    },
  ),

  clean: define(
    "clean",
    "Clean",
    "Minimal white on the bottom third. For talking-head and brand work.",
    {
      fontId: "poppins",
      fontWeight: 600,
      fontSizePx: 60,
      uppercase: false,
      placement: "bottom",
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffffff",
      upcomingOpacity: 0.45,
      strokeWidthPx: 3,
      // No scale on this preset, so it only needs a normal word space.
      wordGapPx: 20,
      maxWordsPerPage: 6,
      combineWithinMs: 1500,
      holdMs: 400,
    },
  ),

  splash: define(
    "splash",
    "Splash",
    "Trending viral style mixing uppercase bold text with elegant italic accents and energetic zoom snaps.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 82,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ffd60a",
      strokeWidthPx: 4,
      wordGapPx: 36,
      maxWordsPerPage: 3,
      combineWithinMs: 900,
      upcomingOpacity: 0.45,
    },
  ),

  dual: define(
    "dual",
    "Dual Layer",
    "Gen-Z kinetic: one big bold impact word with a small thin annotation layered above it. TikTok/Reels native feel.",
    {
      fontId: "anton",
      fontWeight: 400,
      fontSizePx: 110,
      uppercase: true,
      letterSpacingPx: 1,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 5,
      wordGapPx: 48,
      maxWordsPerPage: 3,
      combineWithinMs: 900,
      upcomingOpacity: 0.3,
      dropShadow: true,
      // Annotation: small Poppins 300 text layered above the big word
      annotationSizeRatio: 0.32,
      annotationWeight: 300,
      annotationColor: "#ffffff",
    },
  ),

  hero: define(
    "hero",
    "Hero Stack",
    "One oversized headline word with the rest of the line set small above and below it. The editorial look every caption app leans on.",
    {
      fontId: "anton",
      fontWeight: 400,
      // Large on purpose: the hero is the only word at this size, and the
      // supporting text sits at a third of it, so the block is no taller than a
      // conventional two-line caption despite the headline being enormous.
      fontSizePx: 124,
      uppercase: true,
      letterSpacingPx: -1,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff2d2d",
      strokeWidthPx: 5,
      wordGapPx: 18,
      // Five gives the hero enough context to sit inside — three leaves it
      // stranded with a single word above it, which reads as a mistake.
      maxWordsPerPage: 5,
      combineWithinMs: 1100,
      upcomingOpacity: 0.55,
      dropShadow: true,
      // Row gap is `lineHeight * 0.28 * fontSizePx`, so this is what keeps the
      // supporting text off the headline's descenders and Devanagari matras.
      lineHeight: 1.12,
      annotationSizeRatio: 0.34,
      annotationWeight: 600,
      annotationColor: "#ffffff",
    },
  ),
};

export const CAPTION_STYLE_LIST: readonly CaptionStyleDefinition[] =
  STYLE_IDS.map((id) => CAPTION_STYLES[id]);

export const DEFAULT_STYLE_ID: StyleId = "bold-yellow";

export const getStyleDefaults = (id: StyleId): CaptionStyleConfig => ({
  ...CAPTION_STYLES[id].defaults,
});

export const isStyleId = (value: string): value is StyleId =>
  (STYLE_IDS as readonly string[]).includes(value);
