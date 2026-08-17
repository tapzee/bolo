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
  maxBlockHeightPct: 30,

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
  // 0 = auto (no explicit row cap) — every existing style keeps its current
  // behaviour until a user or template opts into a specific line count.
  linesPerPage: 0,
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
      // The template's whole identity is exactly 3 rows — small supporting
      // words above, the oversized headline, small supporting words below —
      // so that shape is now the explicit default rather than an incidental
      // result of word count and wrap width.
      linesPerPage: 3,
      combineWithinMs: 1100,
      upcomingOpacity: 0.55,
      dropShadow: true,
      // Tightened from 1.12 — row gap is `lineHeight * 0.28 * fontSizePx`, so
      // this is what keeps the small/BIG/small stack reading as one tight
      // composition instead of three evenly-spaced lines.
      lineHeight: 1.0,
      annotationSizeRatio: 0.34,
      annotationWeight: 600,
      annotationColor: "#ffffff",
    },
  ),

  dynamic: define(
    "dynamic",
    "Dynamic Multi-Font",
    "Spoken word rotates and scales up. Alternate fonts assigned by word.",
    {
      fontId: "anton",
      fontSizePx: 84,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ff00d4",
      maxWordsPerPage: 3,
      emphasisScale: 1.2,
      strokeWidthPx: 3,
      dropShadow: true,
    },
  ),

  heroMixed: define(
    "heroMixed",
    "Hero Mixed",
    "Mixed fonts and sizes, highlighting the focal word.",
    {
      fontId: "montserrat",
      // Raised from 92: at that size the headline barely read larger than its
      // supporting text, so the page never landed the "hero" contrast the
      // engine is named for.
      fontSizePx: 108,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ff00d4",
      // Dropped from 7: with the hero forced onto its own row, anything above
      // ~5 stacked a wall of small text on both sides of it — the layout every
      // other hero-family engine avoids by capping at 5.
      maxWordsPerPage: 5,
      // BASE's 300 is legible at the hero engine's smaller-still supporting
      // size but goes thin here; 500 keeps it readable against busy footage.
      annotationWeight: 500,
      emphasisScale: 1.0,
      strokeWidthPx: 4,
      dropShadow: true,
      letterSpacingPx: -2,
    },
  ),

  designWalla: define(
    "designWalla",
    "Design Walla",
    "One hero word per page — bold yellow caps or an italic script flourish — sandwiched by small supporting text above and below, sliding in from a random vertical direction.",
    {
      fontId: "inter",
      // The script hero's face. Playfair (this template's old default) is a
      // serif, not a true cursive — it read as "a smaller Playfair" rather
      // than the reference's joined handwriting script, the same problem
      // `dynamicHighlight` already hit and fixed the same way.
      specialFontId: "grandHotel",
      fontWeight: 600,
      fontSizePx: 95,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffe600",
      strokeWidthPx: 3,
      dropShadow: true,
      maxWordsPerPage: 5,
      // The template's identity is exactly 3 rows — small supporting words,
      // the oversized hero, small supporting words — same reasoning as
      // `hero`'s own `linesPerPage: 3`.
      linesPerPage: 3,
      annotationSizeRatio: 0.36,
      annotationWeight: 500,
      annotationColor: "#ffffff",
    },
  ),

  designWallaPro: define(
    "designWallaPro",
    "Design Walla Pro",
    "Three-line bi-directional layout matching the premium reference exactly.",
    {
      fontId: "inter",
      secondaryFontId: "poppins",
      fontWeight: 900,
      fontSizePx: 95,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffe600",
      strokeWidthPx: 3,
      dropShadow: true,
      maxWordsPerPage: 5,
      linesPerPage: 3,
      lineHeight: 0.9,
      annotationSizeRatio: 0.70,
      annotationWeight: 800,
      annotationColor: "#ffffff",
      combineWithinMs: 900,
    }
  ),

  designWallaProPink: define(
    "designWallaProPink",
    "Design Walla Pro (Pink)",
    "Three-line bi-directional layout matching the premium reference exactly (Pink).",
    {
      fontId: "inter",
      secondaryFontId: "poppins",
      fontWeight: 900,
      fontSizePx: 95,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff1493",
      strokeWidthPx: 3,
      dropShadow: true,
      maxWordsPerPage: 5,
      linesPerPage: 3,
      lineHeight: 0.9,
      annotationSizeRatio: 0.70,
      annotationWeight: 800,
      annotationColor: "#ffffff",
      combineWithinMs: 900,
    }
  ),

  designWallaProBlue: define(
    "designWallaProBlue",
    "Design Walla Pro (Blue)",
    "Three-line bi-directional layout matching the premium reference exactly (Blue).",
    {
      fontId: "inter",
      secondaryFontId: "poppins",
      fontWeight: 900,
      fontSizePx: 95,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#00e5ff",
      strokeWidthPx: 3,
      dropShadow: true,
      maxWordsPerPage: 5,
      linesPerPage: 3,
      lineHeight: 0.9,
      annotationSizeRatio: 0.70,
      annotationWeight: 800,
      annotationColor: "#ffffff",
      combineWithinMs: 900,
    }
  ),

  designWallaProGreen: define(
    "designWallaProGreen",
    "Design Walla Pro (Green)",
    "Three-line bi-directional layout matching the premium reference exactly (Green).",
    {
      fontId: "inter",
      secondaryFontId: "poppins",
      fontWeight: 900,
      fontSizePx: 95,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#39ff14",
      strokeWidthPx: 3,
      dropShadow: true,
      maxWordsPerPage: 5,
      linesPerPage: 3,
      lineHeight: 0.9,
      annotationSizeRatio: 0.70,
      annotationWeight: 800,
      annotationColor: "#ffffff",
      combineWithinMs: 900,
    }
  ),

  designWallaProOrange: define(
    "designWallaProOrange",
    "Design Walla Pro (Orange)",
    "Three-line bi-directional layout matching the premium reference exactly (Orange).",
    {
      fontId: "inter",
      secondaryFontId: "poppins",
      fontWeight: 900,
      fontSizePx: 95,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff6f00",
      strokeWidthPx: 3,
      dropShadow: true,
      maxWordsPerPage: 5,
      linesPerPage: 3,
      lineHeight: 0.9,
      annotationSizeRatio: 0.70,
      annotationWeight: 800,
      annotationColor: "#ffffff",
      combineWithinMs: 900,
    }
  ),

  dynamicHighlight: define(
    "dynamicHighlight",
    "Dynamic Highlight",
    "Semantic visual hierarchy driven by word emphasis.",
    {
      fontId: "montserrat",
      secondaryFontId: "poppins",
      // A connected script reads as a deliberate flourish against the bold
      // caps everywhere else on the page; Playfair (a serif) just looked
      // like a smaller, quieter version of the same typeface family.
      specialFontId: "grandHotel",
      fontSizePx: 84,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ff00d4",
      maxWordsPerPage: 7,
      emphasisScale: 1.0,
      strokeWidthPx: 4,
      dropShadow: true,
      letterSpacingPx: -1,
    },
  ),

  editorialOverlay: define(
    "editorialOverlay",
    "Editorial Overlay",
    "Cinematic editorial-style overlay where a huge serif display word dominates as a visual backdrop, with small spoken words overlaid.",
    {
      fontId: "playfair",
      secondaryFontId: "poppins",
      fontSizePx: 80,
      uppercase: false, // Hero is forced uppercase in engine
      baseColor: "#ffffff",
      activeColor: "#C83232", // Crimson Red
      accentColor: "#C83232",
      maxWordsPerPage: 5,
      emphasisScale: 1.0,
      strokeWidthPx: 0,
      dropShadow: true,
      letterSpacingPx: -2,
    },
  ),

  kinetic: define(
    "kinetic",
    "Kinetic Random",
    "Each word slides, drops or blurs in from a different direction — deterministically randomised — with a moving light streak on the accent words.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      uppercase: true,
      fontSizePx: 92,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff6a00",
      strokeWidthPx: 5,
      // Peak swing is a full-size slide-in, so words need real breathing room
      // or the incoming word visibly clips its settled neighbour mid-slide.
      wordGapPx: 40,
      maxWordsPerPage: 3,
      combineWithinMs: 900,
      upcomingOpacity: 0.4,
      dropShadow: true,
    },
  ),

  underlinePunch: define(
    "underlinePunch",
    "Underline Punch",
    "A bold keyword with a clean animated underline draw. Premium editorial annotation, not a marker effect.",
    {
      fontId: "anton",
      secondaryFontId: "poppins",
      fontWeight: 800,
      fontSizePx: 88,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 3,
      maxWordsPerPage: 6,
      dropShadow: false,
    },
  ),

  highlightMarker: define(
    "highlightMarker",
    "Highlight Marker",
    "A moving highlight block reveals behind the keyword. Sophisticated annotation, default yellow.",
    {
      fontId: "montserrat",
      secondaryFontId: "poppins",
      fontWeight: 800,
      fontSizePx: 82,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      maxWordsPerPage: 7,
      dropShadow: false,
    },
  ),

  mixedWeight: define(
    "mixedWeight",
    "Mixed Weight",
    "Extreme contrast between ultra-light supporting text and an ultra-bold keyword that punches in.",
    {
      fontId: "archivoBlack",
      secondaryFontId: "inter",
      fontWeight: 900,
      fontSizePx: 90,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: true,
    },
  ),

  kineticSplit: define(
    "kineticSplit",
    "Kinetic Split",
    "Words enter from opposite screen edges and converge toward centre. Energetic, synchronised to speech order.",
    {
      fontId: "oswald",
      fontWeight: 600,
      fontSizePx: 88,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 3,
      wordGapPx: 34,
      maxWordsPerPage: 4,
      combineWithinMs: 900,
    },
  ),

  centerPunch: define(
    "centerPunch",
    "Center Punch",
    "Small buildup words, then the sentence's one critical word takes over the screen before settling.",
    {
      fontId: "anton",
      fontWeight: 400,
      fontSizePx: 96,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 5,
      wordGapPx: 20,
      maxWordsPerPage: 5,
      combineWithinMs: 1000,
      dropShadow: true,
      // The critical word can punch up to ~1.6x fontSizePx — needs more
      // vertical room than the 30% default before the box caps the page.
      maxBlockHeightPct: 44,
    },
  ),

  verticalImpact: define(
    "verticalImpact",
    "Vertical Impact",
    "An English keyword builds letter-by-letter down a vertical column while Hindi dominates horizontally.",
    {
      fontId: "bebas",
      fontWeight: 400,
      // Smaller than most templates on purpose: a 6+ letter word stacked one
      // character per row gets tall fast (verticalImpactColumnHeight), and
      // the default "bottom-third" placement leaves too little room below
      // the anchor for that column before it clips the canvas edge.
      fontSizePx: 72,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 4,
      maxWordsPerPage: 4,
      dropShadow: true,
      // Centered, not bottom-third — the stacked column needs equal room
      // above and below its anchor, not just what's left under it.
      placement: "center",
      // A tall letter-stacked word needs much more vertical room than a
      // normal wrapped line before the box caps the page.
      maxBlockHeightPct: 55,
    },
  ),

  editorialStack: define(
    "editorialStack",
    "Editorial Stack",
    "Large serif keyword, tiny sans context, large serif Hindi emphasis. Magazine/fashion-editorial typography.",
    {
      fontId: "bodoniModa",
      secondaryFontId: "inter",
      fontWeight: 700,
      fontSizePx: 84,
      uppercase: false,
      baseColor: "#ffffff",
      // Brightened from #c83232 — the darker crimson read as dull/low-contrast
      // against dark video backdrops, and every Devanagari word used to carry
      // it unconditionally so the whole line looked uniformly tinted instead
      // of having one clear highlight (now restricted to the critical word).
      accentColor: "#ff3b3b",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: true,
    },
  ),

  magazineCut: define(
    "magazineCut",
    "Magazine Cut",
    "Oversized magazine-headline keyword that wipes in and drifts slowly. Bold, cropped, editorial.",
    {
      fontId: "bebas",
      secondaryFontId: "inter",
      fontWeight: 800,
      fontSizePx: 88,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#c83232",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: true,
    },
  ),

  minimalLuxury: define(
    "minimalLuxury",
    "Minimal Luxury",
    "Quiet, sophisticated typography with generous negative space. Fashion-campaign, high-end documentary feel.",
    {
      fontId: "cormorantGaramond",
      secondaryFontId: "inter",
      fontWeight: 500,
      fontSizePx: 78,
      uppercase: false,
      baseColor: "#f5f5f0",
      accentColor: "#d4af37",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: false,
    },
  ),

  // ==========================================================================
  // PREMIUM ENGINES (15 STYLES)
  // ==========================================================================

  popScale: define(
    "popScale",
    "Pop Scale",
    "Large keyword hierarchy with dynamic punch-in and overshoot.",
    {
      fontId: "anton",
      fontSizePx: 100,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd60a", // Yellow keyword
      strokeWidthPx: 4,
      maxWordsPerPage: 4,
      dropShadow: true,
      emphasisScale: 1.15,
      lineHeight: 0.9,
    }
  ),

  slideIn: define(
    "slideIn",
    "Slide In",
    "Words slide from different directions with a configurable highlight pill.",
    {
      fontId: "montserrat", // Condensed bold feel
      fontWeight: 900,
      fontSizePx: 84,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#0a0a0b",
      accentColor: "#00e676", // Green pill
      strokeWidthPx: 3,
      maxWordsPerPage: 4,
      combineWithinMs: 1200,
      wordGapPx: 36,
      lineHeight: 0.9,
    }
  ),

  blurFocus: define(
    "blurFocus",
    "Blur Focus",
    "Cinematic reveal from heavy blur into perfect sharpness.",
    {
      fontId: "anton",
      fontSizePx: 96,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#00e5ff", // Blue keyword
      strokeWidthPx: 4,
      maxWordsPerPage: 4,
      dropShadow: true,
      lineHeight: 0.9,
    }
  ),

  typewriter: define(
    "typewriter",
    "Typewriter",
    "Clean monospace caption revealing character-by-character, synced to word timing.",
    {
      fontId: "ibmPlexMono",
      fontWeight: 500,
      fontSizePx: 64,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 3,
      maxWordsPerPage: 4,
      placement: "bottom",
      upcomingOpacity: 0,
      lineHeight: 0.9,
    }
  ),

  dynamicTypography: define(
    "dynamicTypography",
    "Dynamic Typography",
    "Inspired by short-form video caption styles, mixing heavy and cursive fonts.",
    {
      fontId: "montserrat",
      secondaryFontId: "playfair",
      fontSizePx: 90,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      maxWordsPerPage: 4,
      dropShadow: true,
      wordGapPx: 20,
    }
  ),

  // ==========================================================================
  // EDITORIAL STACK HERO — 4-tier stacked poster, one word per row
  // ==========================================================================

  editorialStackHero: define(
    "editorialStackHero",
    "Editorial Stack Hero",
    "Stacked poster typography: tiny sans connectors, bold condensed anchor words, one oversized yellow hero word, and an elegant italic accent — one word per line.",
    {
      fontId: "anton",
      secondaryFontId: "inter",
      specialFontId: "playfair",
      fontWeight: 400,
      fontSizePx: 88,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#f1d400",
      strokeWidthPx: 0,
      wordGapPx: 26,
      maxWordsPerPage: 5,
      combineWithinMs: 1000,
      dropShadow: true,
      placement: "center",
      // One word per line (see EditorialStackHero.tsx) stacks up to 4 tiers
      // tall, and the hero word alone can render up to 1.2x fontSizePx.
      maxBlockHeightPct: 55,
      // Tight leading is what produces the controlled overlap between
      // stacked lines instead of evenly-spaced subtitle rows.
      lineHeight: 0.98,
    },
  ),

  stack: define(
    "stack",
    "Stack",
    "Editorial poster typography: a tiny sans support word, an italic serif accent and one oversized headline word — exactly three rows, alternating alignment, a single accent colour.",
    {
      fontId: "anton",
      secondaryFontId: "inter",
      specialFontId: "playfair",
      fontWeight: 400,
      // Large on purpose: only one word per page renders at this size, and the
      // other two rows sit at roughly half and a third of it, so the whole
      // block is no taller than a conventional two-line caption.
      fontSizePx: 116,
      uppercase: false,
      textCase: "none",
      letterSpacingPx: -1,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd400",
      // No conventional outline — at this size a real stroke reads as a cheap
      // sticker. Separation comes from the two-layer halo each word paints
      // (`PREMIUM_HALO`) plus a hairline sized off each tier
      // (`premiumStrokePx`). The block-level drop shadow is off because it
      // would stack a third shadow in the preview that the export never draws.
      strokeWidthPx: 0,
      strokeRatio: 0.025,
      dropShadow: false,
      wordGapPx: 24,
      // Three words, one per row, three rows. Both caps are set because they
      // guard different failure modes: the word cap keeps the *pace* right for
      // speech, the line cap keeps the *shape* right no matter how the words
      // wrap.
      maxWordsPerPage: 3,
      linesPerPage: 3,
      // Wide enough that ordinary speech fills all three rows. At the 900ms
      // this started on, natural pauses closed pages after one or two words
      // and a template whose whole identity is a three-row poster spent much
      // of its time showing a single word stranded mid-screen.
      combineWithinMs: 1500,
      holdMs: 260,
      // Upper third, as asked — high enough to sit clear of a Reels caption
      // and the action rail, low enough not to crowd the status bar.
      placement: "top",
      verticalOffsetPct: 12,
      maxLineWidthPct: 88,
      maxBlockHeightPct: 45,
      // Tight leading is what makes the three rows read as one composition
      // rather than three subtitle lines. Set through `lineHeight` (which both
      // renderers derive row height and row gap from) rather than as a DOM
      // negative margin — a margin the Canvas2D export has no equivalent for
      // is exactly how a preview and an export drift apart.
      lineHeight: 0.86,
    },
  ),

  focus: define(
    "focus",
    "Focus",
    "Premium top caption: small context, one oversized headline word, and a script accent with smooth lift-and-settle karaoke motion.",
    {
      fontId: "anton",
      // The only second face on the page — carried by one word per page at
      // most. See `isFocusAccent`.
      secondaryFontId: "poppins",
      specialFontId: "caveat",
      fontWeight: 400,
      fontSizePx: 122,
      uppercase: false,
      textCase: "none",
      letterSpacingPx: -1,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd400",
      /**
       * The dim the whole read rests on: unspoken words sit here, the spoken
       * word rises to 1, spoken words settle at `FOCUS_SPOKEN_OPACITY`.
       *
       * Not lower, however good a deep dim looks on dark footage. Opacity
       * fades a word's halo along with the word, so on the `bright` backdrop
       * (checked on `/dev/export-frames`) anything near 0.35 left the
       * not-yet-spoken half of the line effectively invisible — and those
       * words are the ones the viewer reads ahead into.
       */
      upcomingOpacity: 0.55,
      // Same reasoning as `stack` above: no outline, no block shadow, a
      // per-word `PREMIUM_HALO` plus a `premiumStrokePx` hairline instead.
      strokeWidthPx: 0,
      strokeRatio: 0.025,
      dropShadow: false,
      wordGapPx: 18,
      maxWordsPerPage: 5,
      // Three rows is the shape this template is tuned for; most pages land on
      // two and the cap keeps the tall ones from becoming a paragraph.
      linesPerPage: 3,
      combineWithinMs: 1500,
      holdMs: 280,
      placement: "top",
      verticalOffsetPct: 8,
      maxLineWidthPct: 86,
      maxBlockHeightPct: 42,
      lineHeight: 0.9,
    },
  ),

  rotateReveal: define(
    "rotateReveal",
    "Rotate Reveal",
    "Text slightly rotates and swings into place with spring easing.",
    {
      fontId: "bebas",
      fontSizePx: 104,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff00d4",
      strokeWidthPx: 5,
      maxWordsPerPage: 3,
      dropShadow: true,
      lineHeight: 0.9,
    }
  ),

  wipeUp: define(
    "wipeUp",
    "Wipe Up",
    "Text reveals upward through a mask with a highlight block.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 86,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#0a0a0b",
      accentColor: "#ffd60a",
      strokeWidthPx: 4,
      maxWordsPerPage: 4,
      lineHeight: 0.9,
    }
  ),

  strokeFill: define(
    "strokeFill",
    "Stroke Fill",
    "Shows outlined typography then fills with solid color.",
    {
      fontId: "anton",
      fontSizePx: 120,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ffd60a",
      strokeWidthPx: 5, // Actually the outline width
      maxWordsPerPage: 3,
      combineWithinMs: 1000,
      lineHeight: 0.9,
    }
  ),

  bounceWord: define(
    "bounceWord",
    "Bounce Word",
    "Words appear one-by-one with energetic emphasis.",
    {
      fontId: "poppins",
      fontWeight: 800,
      fontSizePx: 84,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#b388ff", // Purple pill
      strokeWidthPx: 0,
      maxWordsPerPage: 4,
      lineHeight: 0.9,
    }
  ),

  glitch: define(
    "glitch",
    "Glitch Effect",
    "Quick RGB glitch bursts on the active word.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 92,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff0033", // Glitch tint
      strokeWidthPx: 4,
      maxWordsPerPage: 3,
      dropShadow: true,
      lineHeight: 0.9,
    }
  ),

  highlightWord: define(
    "highlightWord",
    "Highlight Word",
    "Highlight slides underneath the active word.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 86,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#000000",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      maxWordsPerPage: 4,
      lineHeight: 0.9,
    }
  ),

  zoomFocus: define(
    "zoomFocus",
    "Zoom Focus",
    "Starts small, rapid zoom in, then zooms out with camera motion.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 96,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ff007f", // Pink/red
      strokeWidthPx: 5,
      maxWordsPerPage: 3,
      dropShadow: true,
      emphasisScale: 1.3, // Overshoot
      lineHeight: 0.9,
    }
  ),

  gradientFlow: define(
    "gradientFlow",
    "Gradient Flow",
    "Premium animated gradient applied to important text.",
    {
      fontId: "montserrat",
      fontWeight: 900,
      fontSizePx: 90,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff", // Will be gradient
      accentColor: "#0057ff",
      strokeWidthPx: 4,
      maxWordsPerPage: 3,
      dropShadow: true,
      lineHeight: 0.9,
    }
  ),

  maskReveal: define(
    "maskReveal",
    "Mask Reveal",
    "Oversized keyword blended into the footage via an overlay blend, so the video's own tone shows through the letterforms.",
    {
      fontId: "anton",
      fontSizePx: 140,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffffff",
      strokeWidthPx: 4,
      maxWordsPerPage: 4,
      dropShadow: true, // Inner/outer shadow
      // The hero word draws at up to 1.4x fontSizePx and the reference
      // treatment leans on very large single words — the 30% default box
      // clips it too early.
      maxBlockHeightPct: 38,
      lineHeight: 0.9,
    }
  ),

  drawOn: define(
    "drawOn",
    "Draw On",
    "Elegant script typography with a hand-drawn animated underline.",
    {
      fontId: "caveat", // Script font
      secondaryFontId: "playfair",
      fontWeight: 700,
      fontSizePx: 110,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffd60a",
      accentColor: "#ffd60a",
      strokeWidthPx: 2,
      maxWordsPerPage: 4,
      dropShadow: true,
      lineHeight: 0.9,
    }
  ),

  depth3d: define(
    "depth3d",
    "3D Depth",
    "Extruded layered text creating a solid 3D depth effect.",
    {
      fontId: "anton",
      fontSizePx: 120,
      uppercase: true,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd60a", // Shadow/depth color
      strokeWidthPx: 0,
      maxWordsPerPage: 3,
      dropShadow: false,
      lineHeight: 0.9,
    }
  ),



  layeredDepth: define(
    "layeredDepth",
    "Layered Depth",
    "A huge low-opacity backdrop word drifts behind readable foreground text. Depth from opacity and scale, no fake 3D.",
    {
      fontId: "bodoniModa",
      secondaryFontId: "inter",
      fontWeight: 700,
      fontSizePx: 80,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: false,
    },
  ),

  // ==========================================================================
  // EDITORIAL KINETIC FAMILY (2 variants, one typographic design system)
  // ==========================================================================

  editorialKinetic: define(
    "editorialKinetic",
    "Editorial Kinetic",
    "Premium editorial typography: bold condensed anchor words, an elegant italic accent, tiny sans connectors — stacked one word per line with controlled overlap. Classic Flow motion.",
    {
      fontId: "anton",
      secondaryFontId: "inter",
      specialFontId: "playfair",
      fontWeight: 400,
      fontSizePx: 90,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#f1d400",
      strokeWidthPx: 0,
      wordGapPx: 26,
      maxWordsPerPage: 5,
      combineWithinMs: 1000,
      dropShadow: true,
      placement: "center",
      // One word per line (see EditorialKinetic.tsx) stacks tall fast, and
      // the critical word alone can render up to 1.15x fontSizePx.
      maxBlockHeightPct: 48,
      // Tight leading is what produces the reference's controlled overlap
      // between stacked lines instead of evenly-spaced subtitle rows.
      lineHeight: 0.98,
    },
  ),

  editorialKineticPop: define(
    "editorialKineticPop",
    "Editorial Kinetic Pop",
    "Same Editorial Kinetic typography system with punchier Pop Editorial motion: display words overshoot in with a controlled bounce instead of a smooth slide.",
    {
      fontId: "anton",
      secondaryFontId: "inter",
      specialFontId: "playfair",
      fontWeight: 400,
      fontSizePx: 90,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#f1d400",
      strokeWidthPx: 0,
      wordGapPx: 26,
      maxWordsPerPage: 5,
      combineWithinMs: 1000,
      dropShadow: true,
      placement: "center",
      // Slightly taller than the Classic variant's box: the overshoot peaks
      // a touch larger than fontSizePx * 1.15 mid-bounce.
      maxBlockHeightPct: 50,
      lineHeight: 0.98,
    },
  ),

  // ==========================================================================
  // MOTION SYSTEMS FAMILY — genuinely-new subset of the 20-template brief
  // ==========================================================================

  dynamicSlideStack: define(
    "dynamicSlideStack",
    "Dynamic Slide Stack",
    "Words stack one per line at different sizes, each sliding in from a different edge; the sentence's one keyword dominates with a bounce overshoot.",
    {
      fontId: "archivoBlack",
      fontWeight: 400,
      fontSizePx: 88,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 4,
      wordGapPx: 20,
      maxWordsPerPage: 5,
      combineWithinMs: 1000,
      dropShadow: true,
      placement: "center",
      // One word per row stacks tall fast, and the hero can reach 1.3x.
      maxBlockHeightPct: 52,
      lineHeight: 0.98,
    },
  ),

  glassHighlight: define(
    "glassHighlight",
    "Glass Highlight",
    "A translucent glassmorphism panel scales in behind the keyword — soft blur, subtle border, gentle shadow. Reads on any footage.",
    {
      fontId: "inter",
      fontWeight: 700,
      fontSizePx: 78,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#5ce6c8",
      strokeWidthPx: 0,
      wordGapPx: 30,
      maxWordsPerPage: 6,
      dropShadow: false,
    },
  ),

  splitText: define(
    "splitText",
    "Split Text",
    "The keyword splits into two clipped halves that slide apart then converge, seamed by a thin diagonal accent line.",
    {
      fontId: "oswald",
      fontWeight: 600,
      fontSizePx: 90,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ff5a2c",
      strokeWidthPx: 4,
      maxWordsPerPage: 5,
      dropShadow: true,
    },
  ),

  liquidFlow: define(
    "liquidFlow",
    "Liquid Flow",
    "A flowing curved ribbon drifts behind the keyword as it rises out of a soft blur. Premium motion-graphics curve, not a splash.",
    {
      fontId: "bebas",
      fontWeight: 400,
      fontSizePx: 96,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#29b6f6",
      strokeWidthPx: 3,
      maxWordsPerPage: 4,
      dropShadow: true,
    },
  ),

  lightSweep: define(
    "lightSweep",
    "Light Sweep",
    "The keyword starts dim; a bright diagonal light sweeps across it once, then it settles fully lit. Cinematic, restrained.",
    {
      fontId: "anton",
      fontWeight: 400,
      fontSizePx: 92,
      uppercase: true,
      baseColor: "#7a7a82",
      accentColor: "#ffe9a8",
      strokeWidthPx: 3,
      maxWordsPerPage: 4,
      dropShadow: true,
    },
  ),

  paperCut: define(
    "paperCut",
    "Paper Cut",
    "The keyword sits on a torn-edge yellow paper strip, supporting words on plain white — layered, premium paper typography.",
    {
      fontId: "montserrat",
      secondaryFontId: "inter",
      fontWeight: 900,
      fontSizePx: 84,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      wordGapPx: 30,
      maxWordsPerPage: 6,
      dropShadow: false,
    },
  ),

  flipCard: define(
    "flipCard",
    "Flip Card",
    "The keyword flips up on a white 3D card, supporting words on a green card behind it — layered, tactile depth.",
    {
      fontId: "poppins",
      secondaryFontId: "inter",
      fontWeight: 800,
      fontSizePx: 82,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#00e676",
      strokeWidthPx: 0,
      wordGapPx: 28,
      maxWordsPerPage: 5,
      dropShadow: false,
    },
  ),

  ribbonSlide: define(
    "ribbonSlide",
    "Ribbon Slide",
    "The keyword sits on a pointed banner ribbon that slides in from alternating edges, purple and accent alternating.",
    {
      fontId: "rubik",
      fontWeight: 900,
      fontSizePx: 80,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 3,
      wordGapPx: 34,
      maxWordsPerPage: 5,
      dropShadow: true,
    },
  ),

  spiralReveal: define(
    "spiralReveal",
    "Spiral Reveal",
    "The sentence's one keyword curves along an arc while supporting words stay small and centred inside it. Quiet, premium.",
    {
      fontId: "outfit",
      fontWeight: 700,
      fontSizePx: 76,
      uppercase: true,
      baseColor: "#e8e8f0",
      accentColor: "#d4af37",
      strokeWidthPx: 0,
      maxWordsPerPage: 5,
      dropShadow: true,
      placement: "center",
      // The curving hero word owns a square-ish arc box taller than a flat line.
      maxBlockHeightPct: 46,
    },
  ),

  floatingBubble: define(
    "floatingBubble",
    "Floating Bubble",
    "Each word floats inside a soft glass pill with gentle ambient drift and a bounce-settle entrance. Premium motion-design objects, not chat bubbles.",
    {
      fontId: "dynapuff",
      fontWeight: 600,
      fontSizePx: 70,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#7c4dff",
      strokeWidthPx: 0,
      wordGapPx: 34,
      maxWordsPerPage: 6,
      dropShadow: false,
    },
  ),

  popWord: define(
    "popWord",
    "Pop Word",
    "Bouncy word-by-word reveal with role-based outlines and glowing highlights.",
    {
      fontId: "inter",
      fontWeight: 900,
      fontSizePx: 100,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#f97316",
      strokeWidthPx: 0,
      maxWordsPerPage: 5,
      dropShadow: false,
    },
  ),

  dualLine: define(
    "dualLine",
    "Dual Line Pro",
    "Two-line layout with Sans Serif uppercase top and elegant Cursive script bottom.",
    {
      fontId: "anton",
      specialFontId: "rougeScript",
      fontWeight: 800,
      fontSizePx: 90,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 0,
      maxWordsPerPage: 8,
      dropShadow: true,
      lineHeight: 0.9,
    },
  ),

  grandCaption: define(
    "grandCaption",
    "GRAND caption",
    "Alternating up and down entry for words.",
    {
      fontId: "poppins",
      fontWeight: 900,
      fontSizePx: 110,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#ffffff",
      strokeWidthPx: 0,
      maxWordsPerPage: 5,
      dropShadow: true,
      linesPerPage: 1,
      textCase: "lower"
    }
  ),

  bigGrand: define(
    "bigGrand",
    "Big Grand",
    "Three-row layout with an oversized electric textured hero word, scaled top lead-in and wide-tracked bottom punchline.",
    {
      fontId: "montserrat",
      specialFontId: "montserrat",
      fontWeight: 800,
      fontSizePx: 125,
      uppercase: true,
      baseColor: "#ffffff",
      accentColor: "#38bdf8",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: true,
      linesPerPage: 3,
      textCase: "upper"
    }
  ),
};

export const CAPTION_STYLE_LIST: readonly CaptionStyleDefinition[] =
  STYLE_IDS.map((id) => CAPTION_STYLES[id]);

export const DEFAULT_STYLE_ID: StyleId = "bold-yellow";

export const getStyleDefaults = (id: StyleId): CaptionStyleConfig => {
  if (!CAPTION_STYLES[id]) {
    console.error("Missing style in CAPTION_STYLES for id:", id);
    throw new Error(`getStyleDefaults: Invalid style ID '${id}'`);
  }
  return {
    ...CAPTION_STYLES[id].defaults,
  };
};

export const isStyleId = (value: string): value is StyleId =>
  (STYLE_IDS as readonly string[]).includes(value);
