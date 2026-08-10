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
      fontWeight: 500,
      fontSizePx: 84,
      uppercase: false,
      baseColor: "#ffffff",
      accentColor: "#c83232",
      strokeWidthPx: 0,
      maxWordsPerPage: 6,
      dropShadow: false,
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
      maxWordsPerPage: 5,
      combineWithinMs: 1200,
      wordGapPx: 36,
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
    }
  ),

  typewriter: define(
    "typewriter",
    "Typewriter",
    "Clean monospace caption revealing character-by-character.",
    {
      fontId: "inter", // Or use a mono if available in the future
      fontWeight: 500,
      fontSizePx: 64,
      uppercase: false,
      baseColor: "#ffffff",
      activeColor: "#ffffff",
      accentColor: "#ffd60a",
      strokeWidthPx: 3,
      maxWordsPerPage: 6,
      placement: "bottom",
      upcomingOpacity: 0,
    }
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
    }
  ),

  maskReveal: define(
    "maskReveal",
    "Mask Reveal",
    "Large keyword contains the video visually inside the letters.",
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
