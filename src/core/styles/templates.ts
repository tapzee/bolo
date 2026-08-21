import type { CaptionStyleConfig, StyleId } from "./types";
import { getStyleDefaults } from "./registry";

/**
 * Caption template catalogue.
 *
 * BE CLEAR ABOUT WHAT THIS IS: a template is a preset over one of the eight
 * render engines (`bold-yellow`, `pop`, `box`, `glow`, `clean`, `splash`,
 * `dual`, `hero`), not a ninth kind of animation. Sixty-odd templates therefore
 * give sixty distinct *looks* — font, colour, casing, size, placement,
 * grouping — driven by eight motion behaviours. That is how CapCut and Captik
 * are built too, and it is the only way to keep the export renderer in parity:
 * every template goes through code paths that are already tested.
 *
 * Adding a template is pure data and needs no renderer change. Adding a genuine
 * ninth *motion* means a new engine in `remotion/styles` AND a matching branch
 * in `lib/export/draw-captions.ts`, or preview and export will disagree.
 */

export type TemplateTag = "Popular" | "Viral" | "Trending" | "New" | "Hot";

export type TemplateCategory =
  | "premium"
  | "trending"
  | "bold"
  | "clean"
  | "neon"
  | "highlight"
  | "festive";

export interface CaptionTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: TemplateCategory;
  readonly engine: StyleId;
  readonly overrides: Partial<CaptionStyleConfig>;
  readonly tag?: TemplateTag;
  readonly groupId?: string;
}

export const TEMPLATE_CATEGORIES: readonly {
  id: TemplateCategory;
  label: string;
}[] = [
  { id: "premium", label: "Premium" },
  { id: "trending", label: "Trending" },
  { id: "bold", label: "Bold" },
  { id: "highlight", label: "Highlight" },
  { id: "neon", label: "Neon" },
  { id: "clean", label: "Clean" },
  { id: "festive", label: "Festive" },
];

const t = (
  id: string,
  name: string,
  category: TemplateCategory,
  engine: StyleId,
  overrides: Partial<CaptionStyleConfig>,
  tag?: TemplateTag,
  groupId?: string,
): CaptionTemplate => ({ id, name, category, engine, overrides, ...(tag ? { tag } : {}), ...(groupId ? { groupId } : {}) });

/**
 * Colours are chosen to survive the mandatory black stroke on real footage —
 * mid-to-high chroma, never pastel. Anything lighter reads as grey once the
 * outline is applied.
 */
export const CAPTION_TEMPLATES: readonly CaptionTemplate[] = [
  // ---- Premium -----------------------------------------------------------
  // The two templates the catalogue is meant to open on. Both carry no
  // overrides on purpose: their engine defaults in `registry.ts` *are* the
  // design, tuned as a whole (size, leading, placement, pace and colour
  // together), so a template-level override here would quietly detune them.
  t("focus", "Focus", "premium", "focus", {}, "New"),
  t("stack", "Stack", "premium", "stack", {}, "New"),
  t("pop-word", "Pop Word", "premium", "popWord", {
    fontId: "montserrat", fontSizePx: 96, fontWeight: 900,
    baseColor: "#ffffff", activeColor: "#ff5e00", accentColor: "#ff5e00",
    letterSpacingPx: -1, lineHeight: 0.92, textCase: "upper",
    dropShadow: true, glowEnabled: true, maxWordsPerPage: 4,
  }, "Hot"),

  t("design-walla-pro", "Design Walla Pro", "premium", "designWallaPro", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffe600",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot", "design-walla"),
  t("design-walla-editorial", "Design Walla Editorial", "premium", "designWallaEditorial", {
    fontId: "anton", fontSizePx: 100, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffe600",
    strokeWidthPx: 3, dropShadow: true,
    specialFontId: "playfair", secondaryFontId: "inter",
    lineHeight: 0.88, annotationSizeRatio: 0.48, annotationWeight: 600,
  }, "Hot", "design-walla"),
  t("dual-line-pro", "Dual Line Pro", "premium", "dualLine", {
    fontId: "anton",
    specialFontId: "kaushanScript",
    uppercase: true,
    fontSizePx: 84,
    maxWordsPerPage: 4,
    linesPerPage: 2,
    baseColor: "#ffffff",
    activeColor: "#ffffff",
    accentColor: "#FF2A2A",
    glowColor: "#C41212",
    glowIntensity: 0.5,
    glowEnabled: true,
    dropShadow: false,
    strokeWidthPx: 0,
    strokeRatio: 0,
    lineHeight: 0.75,
  }, "New"),
  t("baba-red-impact", "Baba Red Impact", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 96,
    baseColor: "#ffffff", activeColor: "#ff0033", accentColor: "#ff0033",
    strokeWidthPx: 4, dropShadow: true,
  }, "New"),
  t("baba-elegant", "Baba Elegant", "trending", "splash", {
    fontId: "playfair", fontWeight: 700, fontSizePx: 82,
    baseColor: "#e0e0e0", activeColor: "#e53935", accentColor: "#e53935",
    strokeWidthPx: 2, dropShadow: true,
  }, "Hot"),
  t("reels-fire-kinetic", "Reels Fire", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 94,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff3d00",
    strokeWidthPx: 5, maxWordsPerPage: 2,
  }, "Hot"),
  t("split-text-pro", "Split Text", "bold", "splitText", {}, "New"),
  t("paper-cut-pro", "Paper Cut", "highlight", "paperCut", {}, "New"),
  t("ribbon-slide-pro", "Ribbon Slide", "festive", "ribbonSlide", {}, "New"),

  t("grand-caption", "GRAND caption", "premium", "grandCaption", {
    fontId: "poppins", fontSizePx: 110, fontWeight: 900,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffffff",
    strokeWidthPx: 0, dropShadow: true, linesPerPage: 1, textCase: "lower"
  }, "New"),

  t("big-grand", "Big Grand", "premium", "bigGrand", {
    fontId: "montserrat", fontSizePx: 125, fontWeight: 800, textCase: "upper",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#38bdf8",
    specialFontId: "montserrat", strokeWidthPx: 0, dropShadow: true, linesPerPage: 3,
    maxWordsPerPage: 6
  }, "New"),

  t("design-walla-pro-green", "Design Walla Elite (Green)", "premium", "designWallaProGreen", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#39ff14",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot", "design-walla"),

  t("design-walla-editorial-yellow", "Design Walla Editorial (Yellow)", "premium", "designWallaEditorialYellow", {
    fontId: "anton", fontSizePx: 100, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffe600", accentColor: "#ffe600",
    strokeWidthPx: 3, dropShadow: true,
    specialFontId: "playfair", secondaryFontId: "inter",
    lineHeight: 0.88, annotationSizeRatio: 0.48, annotationWeight: 600,
  }, "New", "design-walla"),

  t("design-walla", "Design Walla", "premium", "designWalla", {
    fontId: "inter", fontSizePx: 95, fontWeight: 600, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffe600",
    strokeWidthPx: 3, dropShadow: true,
    specialFontId: "caveat", secondaryFontId: "montserrat"
  }, "Hot", "design-walla"),

  // ---- Trending ----------------------------------------------------------
  t("hero-mixed-pro", "Hero Mixed Pro", "trending", "heroMixed", {
    fontId: "montserrat", fontSizePx: 118, textCase: "upper",
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ff00d4",
    strokeWidthPx: 4, dropShadow: true,
  }, "New"),
  t("dynamic-highlight-pro", "Dynamic Highlight", "trending", "dynamicHighlight", {
    fontId: "anton", fontSizePx: 140, baseColor: "#ffffff",
    activeColor: "#ffd60a", accentColor: "#ffffff",
    secondaryFontId: "poppins", specialFontId: "grandHotel",
    glowEnabled: true, glowIntensity: 0.5, glowRadius: 75,
  }, "New"),

  t("captik-cyan-glow", "Captik Cyan Glow", "trending", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#06b6d4", baseColor: "#e0f8ff", activeColor: "#ffffff",
    upcomingOpacity: 0.35, strokeWidthPx: 4,
  }, "Popular"),
  t("hormozi-gold-pro", "Hormozi Gold Pro", "trending", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 86,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    strokeWidthPx: 5, maxWordsPerPage: 3,
  }, "Popular"),

  t("hormozi-splash", "Hormozi Splash", "trending", "splash", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 84,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    maxWordsPerPage: 3,
  }, "Trending"),
  t("mrbeast-hyper", "MrBeast Hyper", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 98,
    baseColor: "#ffffff", accentColor: "#ffd60a", strokeWidthPx: 5,
    maxWordsPerPage: 2,
  }, "Popular"),
  t("storyteller", "Storyteller", "trending", "splash", {
    fontId: "caveat", fontWeight: 700, fontSizePx: 82,
    baseColor: "#ffffff", activeColor: "#00e676", accentColor: "#00e676",
    maxWordsPerPage: 4,
  }),

  t("viral-mint", "Viral Mint", "trending", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 70,
    accentColor: "#00e5a0", activeColor: "#07131a",
  }),
  t("creator-white", "Creator White", "trending", "clean", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 62, upcomingOpacity: 0.4,
  }),

  // ---- Bold --------------------------------------------------------------
  t("bollywood-blockbuster", "Blockbuster", "bold", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 88,
    activeColor: "#ff9500", strokeWidthPx: 5, letterSpacingPx: -1,
  }, "Popular"),
  t("anton-white", "Anton White", "bold", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 92,
    baseColor: "#ffffff", accentColor: "#ffffff", maxWordsPerPage: 3,
  }),
  t("power-orange", "Power Orange", "bold", "bold-yellow", {
    fontId: "anton", uppercase: true, fontSizePx: 90, activeColor: "#ff5a2c",
  }),

  // ---- Neon --------------------------------------------------------------
  t("gaming-cyber-rgb", "Cyber RGB", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 96,
    accentColor: "#ff007f", activeColor: "#00e5ff", baseColor: "#f3e5f5",
  }, "New", "neon-glow"),
  t("neon-matrix", "Neon Matrix", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#00ff66", activeColor: "#ffffff", baseColor: "#e8f5e9",
  }, "Trending", "neon-glow"),
  t("electric-indigo", "Electric Indigo", "neon", "glow", {
    fontId: "poppins", fontWeight: 800, uppercase: true, fontSizePx: 84,
    accentColor: "#651fff", activeColor: "#ffffff",
  }, "New", "neon-glow"),
  t("sunset-vibes", "Sunset Vibes", "neon", "glow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 84,
    accentColor: "#ff6e40", activeColor: "#ffff00",
  }, "Hot", "neon-glow"),
  t("laser-fuchsita", "Laser Fuchsia", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96,
    accentColor: "#d500f9", activeColor: "#ffffff",
  }, "Popular", "neon-glow"),
  t("neon-plasma", "Neon Plasma", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#00ffcc", activeColor: "#ffffff", baseColor: "#e0f2f1",
  }, undefined, "neon-glow"),
  t("neon-cyan", "Neon Cyan", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96, accentColor: "#18ffff",
  }, undefined, "neon-glow"),
  t("neon-pink", "Neon Pink", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96, accentColor: "#ff4081",
  }, undefined, "neon-glow"),
  t("neon-lime", "Neon Lime", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 90, accentColor: "#76ff03",
  }, undefined, "neon-glow"),
  t("neon-violet", "Neon Violet", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96, accentColor: "#b388ff",
  }, undefined, "neon-glow"),
  t("gaming-green", "Gaming Green", "neon", "glow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 78,
    accentColor: "#00e676",
  }, undefined, "neon-glow"),
  t("cyber-orange", "Cyber Orange", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 92, accentColor: "#ff6d00",
  }, undefined, "neon-glow"),
  t("midnight-blue", "Midnight Blue", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 94, accentColor: "#448aff",
  }, undefined, "neon-glow"),
  t("ember", "Ember", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 88, accentColor: "#ff3d00",
  }, undefined, "neon-glow"),
  t("ice", "Ice", "neon", "glow", {
    fontId: "montserrat", fontWeight: 800, uppercase: true, fontSizePx: 76,
    accentColor: "#80d8ff", baseColor: "#ffffff",
  }, undefined, "neon-glow"),

  // ---- Clean -------------------------------------------------------------
  t("baba-clean-pill", "Baba Clean Pill", "clean", "clean", {
    fontId: "poppins", fontWeight: 500, fontSizePx: 64,
    baseColor: "#ffffff", activeColor: "#ffffff",
    backgroundEnabled: true, backgroundColor: "#000000", backgroundOpacity: 0.4,
    upcomingOpacity: 0.8, maxWordsPerPage: 5,
  }, "Popular"),
  t("typewriter-minimal", "Typewriter Minimal", "clean", "clean", {
    fontId: "poppins", fontWeight: 500, fontSizePx: 64,
    baseColor: "#ffffff", activeColor: "#ff7043", upcomingOpacity: 0.2,
  }, "New"),
  t("subtle-yellow", "Subtle Yellow", "clean", "bold-yellow", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 60, uppercase: false,
    activeColor: "#ffd60a", maxWordsPerPage: 5,
  }),

  // ---- Dynamic Mix -------------------------------------------------------
  t("dynamic-robot", "Dynamic Robot", "trending", "dynamic", {
    fontId: "anton", // Base font, but dynamic engine mixes Bebas, Montserrat
    fontSizePx: 96,
    baseColor: "#ffffff", activeColor: "#00e5ff", accentColor: "#ff007f",
    strokeWidthPx: 5, maxWordsPerPage: 3, upcomingOpacity: 0.3, dropShadow: true,
  }, "New"),

  t("dynamic-stylish", "Dynamic Stylish", "trending", "dynamic", {
    fontId: "playfair", // Base font, mixes Caveat, Montserrat
    fontWeight: 700, fontSizePx: 92, textCase: "none",
    baseColor: "#fbf8f3", activeColor: "#d4af37", accentColor: "#ff9500",
    strokeWidthPx: 3, maxWordsPerPage: 3, upcomingOpacity: 0.4, dropShadow: true,
  }, "Hot"),

  // ---- Kinetic Random -----------------------------------------------------
  // Every word rolls its own entrance (slide up/down/left/right or a blur
  // pop/out) off the `kinetic` engine, so the mix of directions on a page
  // never repeats. What separates these templates is palette and weight, not
  // the motion — that's the randomised part.

  t("kinetic-fire", "Kinetic Fire", "trending", "kinetic", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 96,
    // Same palette as Luxury Serif — white body text, champagne-gold accent.
    baseColor: "#ffffff", activeColor: "#e6c687", accentColor: "#e6c687",
    strokeWidthPx: 5, maxWordsPerPage: 3, upcomingOpacity: 0.4,
  }, "New", "kinetic"),

  t("kinetic-punch", "Kinetic Punch", "bold", "kinetic", {
    fontId: "anton", uppercase: true, fontSizePx: 100,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff2d55",
    strokeWidthPx: 6, maxWordsPerPage: 3, upcomingOpacity: 0.35,
  }, "Hot", "kinetic"),

  t("kinetic-electric", "Kinetic Electric", "neon", "kinetic", {
    fontId: "bebas", uppercase: true, fontSizePx: 100,
    baseColor: "#eaf6ff", activeColor: "#ffffff", accentColor: "#00e5ff",
    strokeWidthPx: 5, maxWordsPerPage: 3, upcomingOpacity: 0.35,
  }, "Trending", "kinetic"),

  t("kinetic-gold", "Kinetic Gold", "highlight", "kinetic", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 90,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffd60a",
    strokeWidthPx: 5, maxWordsPerPage: 3, upcomingOpacity: 0.4,
  }, "Popular", "kinetic"),

  t("kinetic-hinglish", "Kinetic Hinglish", "trending", "kinetic", {
    fontId: "devanagari", fontWeight: 700, fontSizePx: 88, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff9933",
    strokeWidthPx: 4, maxWordsPerPage: 3, upcomingOpacity: 0.4,
  }, "Viral", "kinetic"),

  // ---- 10-template family ------------------------------------------------
  t("underline-punch-classic", "Underline Punch", "clean", "underlinePunch", {
    fontId: "anton", fontSizePx: 90, baseColor: "#ffffff", accentColor: "#ffd60a",
  }, "New"),
  t("highlight-marker-yellow", "Highlight Marker", "highlight", "highlightMarker", {
    fontId: "montserrat", fontSizePx: 82, baseColor: "#ffffff", accentColor: "#ffd60a",
  }, "New"),
  t("mixed-weight-mono", "Mixed Weight", "bold", "mixedWeight", {
    fontId: "archivoBlack", secondaryFontId: "inter", fontSizePx: 92, baseColor: "#ffffff",
  }, "New"),
  t("kinetic-split-classic", "Kinetic Split", "trending", "kineticSplit", {
    fontId: "oswald", fontSizePx: 88, baseColor: "#ffffff", accentColor: "#ffd60a",
  }, "New"),
  t("center-punch-classic", "Center Punch", "bold", "centerPunch", {
    fontId: "anton", fontSizePx: 96, baseColor: "#ffffff", accentColor: "#ffd60a",
  }, "New"),
  t("editorial-stack-classic", "Editorial Stack", "clean", "editorialStack", {
    fontId: "bodoniModa", secondaryFontId: "inter", fontSizePx: 84,
    baseColor: "#ffffff", accentColor: "#c83232",
  }, "New"),
  t("magazine-cut-classic", "Magazine Cut", "bold", "magazineCut", {
    fontId: "bebas", secondaryFontId: "inter", fontSizePx: 88,
    baseColor: "#ffffff", accentColor: "#c83232",
  }, "New"),
  t("minimal-luxury-classic", "Minimal Luxury", "clean", "minimalLuxury", {
    fontId: "cormorantGaramond", secondaryFontId: "inter", fontSizePx: 78,
    baseColor: "#f5f5f0", accentColor: "#d4af37",
  }, "New"),
  t("layered-depth-classic", "Layered Depth", "clean", "layeredDepth", {
    fontId: "bodoniModa", secondaryFontId: "inter", fontSizePx: 80,
    baseColor: "#ffffff", accentColor: "#ffd60a",
  }, "New"),

  // ==========================================================================
  // 15 PREMIUM TEMPLATES
  // ==========================================================================
  t("pop-scale-pro", "Pop Scale", "trending", "popScale", {}, "New"),
  t("blur-focus-pro", "Blur Focus", "trending", "blurFocus", {}, "New"),
  t("typewriter-pro", "Typewriter", "clean", "typewriter", {}, "New"),
  t("stroke-fill-pro", "Stroke Fill", "bold", "strokeFill", {}, "New"),
  t("glitch-effect-pro", "Glitch Effect", "neon", "glitch", {}, "New"),
  t("zoom-focus-pro", "Zoom Focus", "bold", "zoomFocus", {}, "New"),
  t("gradient-flow-pro", "Gradient Flow", "neon", "gradientFlow", {}, "New"),
  t("mask-reveal-pro", "Mask Reveal", "bold", "maskReveal", {}, "New"),
  t("draw-on-pro", "Draw On", "clean", "drawOn", {}, "New"),
  t("depth-3d-pro", "3D Depth", "trending", "depth3d", {}, "New"),

  // ==========================================================================
  // MOTION SYSTEMS FAMILY
  // ==========================================================================
  t("dynamic-slide-stack-pro", "Dynamic Slide Stack", "trending", "dynamicSlideStack", {}, "New"),
  t("glass-highlight-pro", "Glass Highlight", "clean", "glassHighlight", {}, "New"),

  t("liquid-flow-pro", "Liquid Flow", "neon", "liquidFlow", {}, "New"),
  t("light-sweep-pro", "Light Sweep", "clean", "lightSweep", {}, "New"),

  t("flip-card-pro", "Flip Card", "bold", "flipCard", {}, "New"),
  t("floating-bubble-pro", "Floating Bubble", "festive", "floatingBubble", {}, "New"),

  // ==========================================================================
  // EDITORIAL STACK HERO
  // ==========================================================================
  t("editorial-stack-hero", "Editorial Stack Hero", "trending", "editorialStackHero", {}, "New"),
  t("stack", "Stack", "trending", "stack", {}, "New"),
];

export const templateById = (
  id: string,
): CaptionTemplate | undefined =>
  CAPTION_TEMPLATES.find((template) => template.id === id);

/** Resolves a template to a full config by layering it over its engine defaults. */
export const resolveTemplate = (
  template: CaptionTemplate,
): CaptionStyleConfig => ({
  ...getStyleDefaults(template.engine),
  ...template.overrides,
  styleId: template.engine,
});

export const templatesByCategory = (
  category: TemplateCategory,
): readonly CaptionTemplate[] =>
  CAPTION_TEMPLATES.filter((template) => template.category === category);
