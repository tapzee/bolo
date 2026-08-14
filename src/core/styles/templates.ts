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
): CaptionTemplate => ({ id, name, category, engine, overrides, ...(tag ? { tag } : {}) });

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
    fontId: "inter", fontSizePx: 100, fontWeight: 900,
    baseColor: "#ffffff", accentColor: "#f97316", textCase: "lower"
  }, "New"),

  t("design-walla", "Design Walla", "premium", "designWalla", {
    fontId: "inter", fontSizePx: 95, fontWeight: 600, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffe600",
    strokeWidthPx: 3, dropShadow: true,
    specialFontId: "caveat", secondaryFontId: "montserrat"
  }, "Hot"),

  t("design-walla-pro", "Design Walla Pro", "premium", "designWallaPro", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffe600",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot"),
  t("design-walla-pro-pink", "Design Walla Pro (Pink)", "premium", "designWallaProPink", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff1493",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot"),
  t("design-walla-pro-blue", "Design Walla Elite (Blue)", "premium", "designWallaProBlue", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#00e5ff",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot"),
  t("design-walla-pro-green", "Design Walla Elite (Green)", "premium", "designWallaProGreen", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#39ff14",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot"),
  t("design-walla-pro-orange", "Design Walla Pro (Orange)", "premium", "designWallaProOrange", {
    fontId: "montserrat", fontSizePx: 95, fontWeight: 900, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff6f00",
    strokeWidthPx: 3, dropShadow: true,
    secondaryFontId: "poppins"
  }, "Hot"),

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
  t("rhythm-dynamic", "Rhythm Dynamic", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 100, letterSpacingPx: 2,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#00e5ff",
    strokeWidthPx: 4,
  }, "Hot"),
  t("motion-title-pro", "Motion Title Pro", "trending", "splash", {
    fontId: "anton", uppercase: true, fontSizePx: 110,
    baseColor: "#ffffff", activeColor: "#00d2ff", accentColor: "#3a7bd5",
    strokeWidthPx: 3, dropShadow: true,
  }, "Hot"),
  t("free-demo-hindi", "FREE demo के लिए", "trending", "splash", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 86,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    maxWordsPerPage: 3, upcomingOpacity: 0.45, strokeWidthPx: 4,
  }, "Viral"),
  t("captik-cyan-glow", "Captik Cyan Glow", "trending", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#06b6d4", baseColor: "#e0f8ff", activeColor: "#ffffff",
    upcomingOpacity: 0.35, strokeWidthPx: 4,
  }, "Popular"),
  t("captik-glow", "Captik Glow Green", "trending", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96,
    accentColor: "#76ff03", baseColor: "#e8f5e9", activeColor: "#ffffff",
    upcomingOpacity: 0.4,
  }, "Popular"),
  t("submagic-hinglish", "Submagic Hinglish", "trending", "splash", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 84,
    baseColor: "#ffffff", activeColor: "#00e5ff", accentColor: "#ffd60a",
    maxWordsPerPage: 3, upcomingOpacity: 0.4,
  }, "Trending"),
  t("hormozi-gold-pro", "Hormozi Gold Pro", "trending", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 86,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    strokeWidthPx: 5, maxWordsPerPage: 3,
  }, "Popular"),
  t("reels-fire-kinetic", "Reels Fire", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 94,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff3d00",
    strokeWidthPx: 5, maxWordsPerPage: 2,
  }, "Hot"),
  t("mumbai-kinetic", "Mumbai Kinetic", "trending", "splash", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 84,
    baseColor: "#ffffff", activeColor: "#ff2d55", accentColor: "#ffd60a",
    maxWordsPerPage: 3, upcomingOpacity: 0.45,
  }, "Viral"),
  t("editorial-vogue", "Editorial Vogue", "trending", "splash", {
    fontId: "playfair", fontWeight: 700, fontSizePx: 76,
    baseColor: "#fbf8f3", activeColor: "#d4af37", accentColor: "#d4af37",
    maxWordsPerPage: 4,
  }, "New"),
  t("hormozi-splash", "Hormozi Splash", "trending", "splash", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 84,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    maxWordsPerPage: 3,
  }, "Trending"),
  t("submagic-pro", "Submagic Pro", "trending", "splash", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 80,
    baseColor: "#ffffff", activeColor: "#00e5ff", accentColor: "#00e5ff",
    maxWordsPerPage: 3,
  }, "Popular"),
  t("reels-kinetic", "Reels Kinetic", "trending", "splash", {
    fontId: "anton", fontSizePx: 88,
    baseColor: "#ffffff", activeColor: "#ff2d55", accentColor: "#ff2d55",
    maxWordsPerPage: 3,
  }),
  t("mrbeast-hyper", "MrBeast Hyper", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 98,
    baseColor: "#ffffff", accentColor: "#ffd60a", strokeWidthPx: 5,
    maxWordsPerPage: 2,
  }, "Popular"),
  t("editorial-chic", "Editorial Chic", "trending", "splash", {
    fontId: "playfair", fontWeight: 700, fontSizePx: 74,
    baseColor: "#fbf8f3", activeColor: "#d4af37", accentColor: "#d4af37",
    maxWordsPerPage: 4,
  }),
  t("storyteller", "Storyteller", "trending", "splash", {
    fontId: "caveat", fontWeight: 700, fontSizePx: 82,
    baseColor: "#ffffff", activeColor: "#00e676", accentColor: "#00e676",
    maxWordsPerPage: 4,
  }),
  t("cyberpunk-neon", "Cyberpunk", "trending", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 92,
    accentColor: "#00e5ff", activeColor: "#ff007f", baseColor: "#e0f7fa",
  }),
  t("mumbai-nights", "Mumbai Nights", "trending", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 86,
    baseColor: "#ffffff", accentColor: "#ff2d55", maxWordsPerPage: 3,
  }),
  t("reel-gold", "Reel Gold", "trending", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 80,
    baseColor: "#ffffff", activeColor: "#ffd60a",
  }),
  t("desi-punch", "Desi Punch", "trending", "pop", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 82,
    baseColor: "#ffffff", accentColor: "#ff6b00", maxWordsPerPage: 3,
  }),
  t("viral-mint", "Viral Mint", "trending", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 70,
    accentColor: "#00e5a0", activeColor: "#07131a",
  }),
  t("hook-red", "Hook Red", "trending", "box", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 68,
    accentColor: "#ff1744", activeColor: "#ffffff",
  }),
  t("street-cyan", "Street Cyan", "trending", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 94,
    accentColor: "#00e5ff", baseColor: "#eaf6ff",
  }),
  t("creator-white", "Creator White", "trending", "clean", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 62, upcomingOpacity: 0.4,
  }),
  t("shorts-lime", "Shorts Lime", "trending", "bold-yellow", {
    fontId: "anton", uppercase: true, fontSizePx: 88, activeColor: "#c6ff00",
  }),

  // ---- Bold --------------------------------------------------------------
  t("baba-modern-bold", "Baba Modern", "bold", "splash", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 88,
    baseColor: "#e0e0e0", activeColor: "#ffffff", accentColor: "#ffffff",
    strokeWidthPx: 4, dropShadow: true, maxWordsPerPage: 3,
  }, "New"),
  t("titan-hyper", "Titan Hyper Snap", "bold", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 104,
    accentColor: "#ffd60a", baseColor: "#ffffff", strokeWidthPx: 5, maxWordsPerPage: 2,
  }, "Hot"),
  t("bollywood-blockbuster", "Blockbuster", "bold", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 88,
    activeColor: "#ff9500", strokeWidthPx: 5, letterSpacingPx: -1,
  }, "Popular"),
  t("titan-gold", "Titan Gold", "bold", "splash", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 86,
    baseColor: "#ffffff", activeColor: "#ffaa00", accentColor: "#ffaa00",
  }, "Trending"),
  t("anton-white", "Anton White", "bold", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 92,
    baseColor: "#ffffff", accentColor: "#ffffff", maxWordsPerPage: 3,
  }),
  t("bollywood-bold", "Bollywood Bold", "bold", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 84,
    activeColor: "#ff9500", letterSpacingPx: -1,
  }),
  t("cricket-live", "Cricket Live", "bold", "box", {
    fontId: "bebas", uppercase: true, fontSizePx: 84,
    accentColor: "#0057ff", activeColor: "#ffffff", letterSpacingPx: 2,
  }),
  t("news-flash", "News Flash", "bold", "box", {
    fontId: "montserrat", fontWeight: 800, uppercase: true, fontSizePx: 62,
    accentColor: "#d50000", activeColor: "#ffffff", placement: "bottom",
  }),
  t("mega-caps", "Mega Caps", "bold", "pop", {
    fontId: "bebas", uppercase: true, fontSizePx: 108, letterSpacingPx: 3,
    accentColor: "#ffd60a", maxWordsPerPage: 2,
  }),
  t("power-orange", "Power Orange", "bold", "bold-yellow", {
    fontId: "anton", uppercase: true, fontSizePx: 90, activeColor: "#ff5a2c",
  }),
  t("stadium", "Stadium", "bold", "pop", {
    fontId: "bebas", uppercase: true, fontSizePx: 100, letterSpacingPx: 4,
    accentColor: "#00e676", maxWordsPerPage: 2,
  }),
  t("impact-pink", "Impact Pink", "bold", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 86, accentColor: "#ff4081",
  }),
  t("bold-sky", "Bold Sky", "bold", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 80,
    activeColor: "#40c4ff",
  }),
  t("heavy-violet", "Heavy Violet", "bold", "pop", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 84,
    accentColor: "#b388ff",
  }),

  // ---- Highlight ---------------------------------------------------------
  t("baba-script-box", "Baba Script Box", "highlight", "box", {
    fontId: "caveat", fontWeight: 700, fontSizePx: 92,
    baseColor: "#ffffff", activeColor: "#111111", accentColor: "#ffd60a",
    strokeWidthPx: 2,
  }, "Viral"),
  t("lower-third-cyan", "Cyan Nameplate", "highlight", "box", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 64,
    accentColor: "#00e5ff", activeColor: "#000000", placement: "bottom", verticalOffsetPct: -5,
  }, "Popular"),
  t("lower-third-coral", "Coral Nameplate", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 60,
    accentColor: "#ff4757", activeColor: "#ffffff", placement: "bottom", verticalOffsetPct: -5,
  }),
  t("marker-cyan-box", "Marker Cyan Box", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 72,
    accentColor: "#00e5ff", activeColor: "#0a0a0b",
  }, "New"),
  t("marker-crimson", "Marker Crimson", "highlight", "box", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 68,
    accentColor: "#ff0033", activeColor: "#ffffff",
  }, "Trending"),
  t("highlighter-neon", "Highlighter Neon", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 70,
    accentColor: "#76ff03", activeColor: "#0a0a0b",
  }, "Popular"),
  t("marker-yellow", "Marker Yellow", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 68,
    accentColor: "#ffd60a", activeColor: "#0a0a0b",
  }),
  t("marker-lime", "Marker Lime", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 68,
    accentColor: "#c6ff00", activeColor: "#0a0a0b",
  }),
  t("marker-coral", "Marker Coral", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 68,
    accentColor: "#ff7043", activeColor: "#ffffff",
  }),
  t("marker-ink", "Marker Ink", "highlight", "box", {
    fontId: "montserrat", fontWeight: 800, fontSizePx: 66,
    accentColor: "#111318", activeColor: "#ffd60a",
  }),
  t("marker-violet", "Marker Violet", "highlight", "box", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 68,
    accentColor: "#7c4dff", activeColor: "#ffffff",
  }),
  t("marker-teal", "Marker Teal", "highlight", "box", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 66,
    accentColor: "#00bfa5", activeColor: "#ffffff",
  }),
  t("sticker-caps", "Sticker Caps", "highlight", "box", {
    fontId: "anton", uppercase: true, fontSizePx: 74,
    accentColor: "#ffffff", activeColor: "#0a0a0b",
  }),
  t("badge-blue", "Badge Blue", "highlight", "box", {
    fontId: "montserrat", fontWeight: 800, uppercase: true, fontSizePx: 60,
    accentColor: "#2979ff", activeColor: "#ffffff", placement: "bottom",
  }),
  t("tape-black", "Tape Black", "highlight", "box", {
    fontId: "bebas", uppercase: true, fontSizePx: 80, letterSpacingPx: 2,
    accentColor: "#0a0a0b", activeColor: "#ffffff",
  }),

  // ---- Neon --------------------------------------------------------------
  t("rgb-glitch", "RGB Glitch", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 108, letterSpacingPx: 4,
    accentColor: "#ff007f", activeColor: "#00e5ff", baseColor: "#ffffff",
  }, "Trending"),
  t("gaming-cyber-rgb", "Cyber RGB", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 96,
    accentColor: "#ff007f", activeColor: "#00e5ff", baseColor: "#f3e5f5",
  }, "New"),
  t("neon-matrix", "Neon Matrix", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#00ff66", activeColor: "#ffffff", baseColor: "#e8f5e9",
  }, "Trending"),
  t("electric-indigo", "Electric Indigo", "neon", "glow", {
    fontId: "poppins", fontWeight: 800, uppercase: true, fontSizePx: 84,
    accentColor: "#651fff", activeColor: "#ffffff",
  }, "New"),
  t("sunset-vibes", "Sunset Vibes", "neon", "glow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 84,
    accentColor: "#ff6e40", activeColor: "#ffff00",
  }, "Hot"),
  t("laser-fuchsita", "Laser Fuchsia", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96,
    accentColor: "#d500f9", activeColor: "#ffffff",
  }, "Popular"),
  t("neon-plasma", "Neon Plasma", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#00ffcc", activeColor: "#ffffff", baseColor: "#e0f2f1",
  }),
  t("neon-cyan", "Neon Cyan", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96, accentColor: "#18ffff",
  }),
  t("neon-pink", "Neon Pink", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96, accentColor: "#ff4081",
  }),
  t("neon-lime", "Neon Lime", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 90, accentColor: "#76ff03",
  }),
  t("neon-violet", "Neon Violet", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 96, accentColor: "#b388ff",
  }),
  t("gaming-green", "Gaming Green", "neon", "glow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 78,
    accentColor: "#00e676",
  }),
  t("cyber-orange", "Cyber Orange", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 92, accentColor: "#ff6d00",
  }),
  t("midnight-blue", "Midnight Blue", "neon", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 94, accentColor: "#448aff",
  }),
  t("ember", "Ember", "neon", "glow", {
    fontId: "anton", uppercase: true, fontSizePx: 88, accentColor: "#ff3d00",
  }),
  t("ice", "Ice", "neon", "glow", {
    fontId: "montserrat", fontWeight: 800, uppercase: true, fontSizePx: 76,
    accentColor: "#80d8ff", baseColor: "#ffffff",
  }),

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
  t("cinema-gold", "Cinema Gold", "clean", "splash", {
    fontId: "playfair", fontWeight: 700, fontSizePx: 68,
    baseColor: "#ffffff", activeColor: "#ffd54f", accentColor: "#ffd54f",
    maxWordsPerPage: 5,
  }, "New"),
  t("podcast-pro-dark", "Podcast Pro", "clean", "box", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 64,
    accentColor: "#1a1c23", activeColor: "#00e5ff", placement: "bottom",
  }, "Trending"),
  t("luxury-serif", "Luxury Serif", "clean", "splash", {
    fontId: "playfair", fontWeight: 600, fontSizePx: 64,
    baseColor: "#ffffff", activeColor: "#e6c687", accentColor: "#e6c687",
    upcomingOpacity: 0.5, maxWordsPerPage: 5,
  }),
  t("podcast", "Podcast", "clean", "clean", {
    fontId: "poppins", fontWeight: 600, fontSizePx: 58, maxWordsPerPage: 7,
  }),
  t("interview", "Interview", "clean", "clean", {
    fontId: "montserrat", fontWeight: 600, fontSizePx: 56, maxWordsPerPage: 8,
    upcomingOpacity: 0.35,
  }),
  t("documentary", "Documentary", "clean", "clean", {
    fontId: "poppins", fontWeight: 500, fontSizePx: 54, maxWordsPerPage: 8,
    placement: "bottom", upcomingOpacity: 1,
  }),
  t("course", "Course", "clean", "clean", {
    fontId: "poppins", fontWeight: 600, fontSizePx: 60, maxWordsPerPage: 6,
  }),
  t("minimal-caps", "Minimal Caps", "clean", "clean", {
    fontId: "montserrat", fontWeight: 700, uppercase: true, fontSizePx: 52,
    letterSpacingPx: 2, maxWordsPerPage: 6,
  }),
  t("brand-safe", "Brand Safe", "clean", "clean", {
    fontId: "montserrat", fontWeight: 600, fontSizePx: 56, upcomingOpacity: 0.5,
  }),
  t("subtle-yellow", "Subtle Yellow", "clean", "bold-yellow", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 60, uppercase: false,
    activeColor: "#ffd60a", maxWordsPerPage: 5,
  }),
  t("devanagari-pro", "Devanagari Pro", "clean", "clean", {
    fontId: "devanagari", fontWeight: 700, fontSizePx: 60, maxWordsPerPage: 6,
  }),
  t("centered", "Centered", "clean", "clean", {
    fontId: "poppins", fontWeight: 600, fontSizePx: 62, placement: "center",
    maxWordsPerPage: 5,
  }),
  t("top-strip", "Top Strip", "clean", "clean", {
    fontId: "montserrat", fontWeight: 600, fontSizePx: 54, placement: "top",
    maxWordsPerPage: 7,
  }),

  // ---- Festive -----------------------------------------------------------
  t("diwali-sparkles", "Diwali Sparkles", "festive", "glow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 86,
    accentColor: "#ffca28", activeColor: "#fffde7", strokeWidthPx: 4,
  }, "Popular"),
  t("holi-vibes-ultra", "Holi Ultra Pop", "festive", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 94,
    accentColor: "#ff007f", activeColor: "#00e5ff",
  }, "Viral"),
  t("desi-street", "Desi Street Glow", "festive", "glow", {
    fontId: "bebas", uppercase: true, fontSizePx: 98,
    accentColor: "#ff6b00", activeColor: "#ffffff",
  }, "Hot"),
  t("diwali-gold", "Diwali Gold", "festive", "glow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 80,
    accentColor: "#ffc107", activeColor: "#fff8e1",
  }),
  t("holi-splash", "Holi Splash", "festive", "pop", {
    fontId: "anton", uppercase: true, fontSizePx: 88, accentColor: "#e91e63",
  }),
  t("saffron", "Saffron", "festive", "bold-yellow", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 82,
    activeColor: "#ff9933",
  }),
  t("wedding-rose", "Wedding Rose", "festive", "box", {
    fontId: "poppins", fontWeight: 700, fontSizePx: 66,
    accentColor: "#f06292", activeColor: "#ffffff",
  }),
  t("royal-maroon", "Royal Maroon", "festive", "box", {
    fontId: "montserrat", fontWeight: 800, fontSizePx: 66,
    accentColor: "#8e0038", activeColor: "#ffd54f",
  }),
  t("temple-gold", "Temple Gold", "festive", "bold-yellow", {
    fontId: "devanagari", fontWeight: 700, fontSizePx: 72,
    activeColor: "#ffca28", baseColor: "#fffde7",
  }),
  t("navratri", "Navratri", "festive", "pop", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 76, accentColor: "#ff6f00",
  }),
  t("independence", "Independence", "festive", "box", {
    fontId: "montserrat", fontWeight: 800, uppercase: true, fontSizePx: 64,
    accentColor: "#138808", activeColor: "#ffffff",
  }),

  // ---- Gen-Z Dual Layer --------------------------------------------------
  // Each template: big bold impact word + thin Poppins annotation above it.
  // annotationColor = the small text color, accentColor = active big word color.

  t("big-sigma", "Big Sigma", "trending", "dual", {
    fontId: "anton", fontWeight: 400, uppercase: true, fontSizePx: 114,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    strokeWidthPx: 5, letterSpacingPx: 1, maxWordsPerPage: 2,
    annotationSizeRatio: 0.28, annotationWeight: 300, annotationColor: "#ffffff",
    upcomingOpacity: 0.25, dropShadow: true,
  }, "Viral"),

  t("chaos-theory", "Chaos Theory", "trending", "dual", {
    fontId: "bebas", fontWeight: 400, uppercase: true, fontSizePx: 118,
    baseColor: "#f0f0f0", activeColor: "#ff007f", accentColor: "#ff007f",
    strokeWidthPx: 5, letterSpacingPx: 3, maxWordsPerPage: 2,
    annotationSizeRatio: 0.26, annotationWeight: 200, annotationColor: "#ff007f",
    upcomingOpacity: 0.2, dropShadow: true,
  }, "Hot"),

  t("whisper-shout", "Whisper Shout", "bold", "dual", {
    fontId: "anton", fontWeight: 400, uppercase: true, fontSizePx: 120,
    baseColor: "#ffffff", activeColor: "#00e5ff", accentColor: "#00e5ff",
    strokeWidthPx: 6, letterSpacingPx: -1, maxWordsPerPage: 2,
    annotationSizeRatio: 0.25, annotationWeight: 200, annotationColor: "#b2ebf2",
    backgroundEnabled: true, backgroundColor: "#000000", backgroundOpacity: 0.5,
    upcomingOpacity: 0.2,
  }, "New"),

  t("broke-to-rich", "Broke To Rich", "trending", "dual", {
    fontId: "bebas", fontWeight: 400, uppercase: true, fontSizePx: 112,
    baseColor: "#e0e0e0", activeColor: "#c6ff00", accentColor: "#c6ff00",
    strokeWidthPx: 5, letterSpacingPx: 2, maxWordsPerPage: 2,
    annotationSizeRatio: 0.28, annotationWeight: 300, annotationColor: "#c6ff00",
    upcomingOpacity: 0.22, dropShadow: true,
  }, "Viral"),

  t("creator-mode", "Creator Mode", "trending", "dual", {
    fontId: "montserrat", fontWeight: 900, uppercase: true, fontSizePx: 104,
    baseColor: "#ffffff", activeColor: "#00e5ff", accentColor: "#00e5ff",
    strokeWidthPx: 5, maxWordsPerPage: 3,
    annotationSizeRatio: 0.30, annotationWeight: 300, annotationColor: "#ffffff",
    upcomingOpacity: 0.3, dropShadow: true,
  }, "Popular"),

  t("hindi-drop", "Hindi Drop", "trending", "dual", {
    fontId: "devanagari", fontWeight: 900, uppercase: false, fontSizePx: 100,
    baseColor: "#ffffff", activeColor: "#ff9933", accentColor: "#ff9933",
    strokeWidthPx: 4, maxWordsPerPage: 2,
    annotationSizeRatio: 0.30, annotationWeight: 300, annotationColor: "#ffe0b2",
    upcomingOpacity: 0.25, dropShadow: true,
  }, "Viral"),

  t("villain-arc", "Villain Arc", "bold", "dual", {
    fontId: "bebas", fontWeight: 400, uppercase: true, fontSizePx: 122,
    baseColor: "#cccccc", activeColor: "#ff1744", accentColor: "#ff1744",
    strokeWidthPx: 6, letterSpacingPx: 2, maxWordsPerPage: 2,
    annotationSizeRatio: 0.24, annotationWeight: 200, annotationColor: "#ff8a80",
    upcomingOpacity: 0.15, dropShadow: true,
  }, "Hot"),

  t("soft-launch", "Soft Launch", "clean", "dual", {
    fontId: "playfair", fontWeight: 700, uppercase: false, fontSizePx: 88,
    baseColor: "#ffe0e6", activeColor: "#f06292", accentColor: "#f06292",
    strokeWidthPx: 2, maxWordsPerPage: 3,
    annotationSizeRatio: 0.32, annotationWeight: 200, annotationColor: "#fce4ec",
    upcomingOpacity: 0.4, dropShadow: true,
  }, "New"),

  // ---- Hero Stack --------------------------------------------------------
  //
  // The editorial layout: one oversized headline word with the rest of the
  // line set small above and below it. Every one of these runs on the `hero`
  // engine, so what separates them is entirely typographic — face, palette,
  // and the size gap between headline and supporting text.
  //
  // `annotationSizeRatio` is the control that matters. Below ~0.28 the
  // supporting text stops being readable on a phone; above ~0.45 the contrast
  // collapses and the page reads as two sizes of the same thing rather than a
  // headline with context. Everything here sits between those.

  t("blockbuster", "Blockbuster", "trending", "hero", {
    fontId: "anton", fontSizePx: 132, letterSpacingPx: -2,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff1e1e",
    strokeWidthPx: 6, maxWordsPerPage: 5, upcomingOpacity: 0.5,
    annotationSizeRatio: 0.30, annotationWeight: 700, annotationColor: "#ffffff",
    dropShadow: true,
  }, "New"),

  t("editor-masala", "Editor Masala", "trending", "hero", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 120, letterSpacingPx: -1,
    baseColor: "#ffffff", activeColor: "#ffd60a", accentColor: "#ffd60a",
    strokeWidthPx: 6, maxWordsPerPage: 5, upcomingOpacity: 0.6,
    annotationSizeRatio: 0.32, annotationWeight: 600, annotationColor: "#ffffff",
    dropShadow: true,
  }, "Hot"),

  t("the-biggest", "The Biggest", "bold", "hero", {
    fontId: "bebas", fontSizePx: 142, letterSpacingPx: 1,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffffff",
    strokeWidthPx: 5, maxWordsPerPage: 6, upcomingOpacity: 0.7,
    annotationSizeRatio: 0.26, annotationWeight: 500, annotationColor: "#ffffff",
    dropShadow: true,
  }, "Popular"),

  t("archives", "Archives", "clean", "hero", {
    // Playfair carries no Devanagari, so a Hinglish line falls back to Noto for
    // the Hindi half. That is the intended behaviour, not a defect — the serif
    // is doing the work on the Latin words where the contrast is visible.
    fontId: "playfair", fontWeight: 700, fontSizePx: 118, textCase: "none",
    baseColor: "#fdfaf3", activeColor: "#d4af37", accentColor: "#d4af37",
    strokeWidthPx: 3, maxWordsPerPage: 5, upcomingOpacity: 0.55,
    annotationSizeRatio: 0.30, annotationWeight: 400, annotationColor: "#fdfaf3",
    dropShadow: true,
  }, "New"),

  t("scribble", "Scribble", "clean", "hero", {
    fontId: "caveat", fontWeight: 700, fontSizePx: 148, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ff5c8a", accentColor: "#ff5c8a",
    strokeWidthPx: 4, maxWordsPerPage: 5, upcomingOpacity: 0.6,
    annotationSizeRatio: 0.34, annotationWeight: 700, annotationColor: "#ffffff",
    dropShadow: true,
  }, "New"),

  t("hero-hindi", "बड़ा बोल", "trending", "hero", {
    fontId: "devanagari", fontWeight: 900, fontSizePx: 116, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ff9933", accentColor: "#ff9933",
    strokeWidthPx: 6, maxWordsPerPage: 5, upcomingOpacity: 0.55,
    annotationSizeRatio: 0.34, annotationWeight: 700, annotationColor: "#ffffff",
    dropShadow: true,
  }, "Viral"),

  t("mint-drop", "Mint Drop", "highlight", "hero", {
    fontId: "poppins", fontWeight: 800, fontSizePx: 118,
    baseColor: "#ffffff", activeColor: "#00e5a0", accentColor: "#00e5a0",
    strokeWidthPx: 5, maxWordsPerPage: 5, upcomingOpacity: 0.55,
    annotationSizeRatio: 0.32, annotationWeight: 600, annotationColor: "#e8fff7",
    dropShadow: true,
  }, "Trending"),

  t("cyber-hero", "Cyber Hero", "neon", "hero", {
    fontId: "bebas", fontSizePx: 138, letterSpacingPx: 2,
    baseColor: "#dff9ff", activeColor: "#00e5ff", accentColor: "#00e5ff",
    strokeWidthPx: 5, maxWordsPerPage: 5, upcomingOpacity: 0.45,
    annotationSizeRatio: 0.28, annotationWeight: 500, annotationColor: "#dff9ff",
    dropShadow: true,
  }, "Hot"),

  t("festival-hero", "त्योहार", "festive", "hero", {
    fontId: "devanagari", fontWeight: 900, fontSizePx: 114, textCase: "none",
    baseColor: "#fff8e1", activeColor: "#ffc107", accentColor: "#e91e63",
    strokeWidthPx: 6, maxWordsPerPage: 5, upcomingOpacity: 0.6,
    annotationSizeRatio: 0.34, annotationWeight: 700, annotationColor: "#fff8e1",
    dropShadow: true,
  }, "Popular"),

  t("noir-hero", "Noir", "bold", "hero", {
    fontId: "anton", fontSizePx: 130, letterSpacingPx: -1,
    baseColor: "#e0e0e0", activeColor: "#ffffff", accentColor: "#ffffff",
    strokeWidthPx: 6, maxWordsPerPage: 5, upcomingOpacity: 0.4,
    annotationSizeRatio: 0.28, annotationWeight: 500, annotationColor: "#bdbdbd",
    backgroundEnabled: true, backgroundColor: "#000000", backgroundOpacity: 0.35,
  }, "New"),

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
  }, "New"),

  t("kinetic-punch", "Kinetic Punch", "bold", "kinetic", {
    fontId: "anton", uppercase: true, fontSizePx: 100,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff2d55",
    strokeWidthPx: 6, maxWordsPerPage: 3, upcomingOpacity: 0.35,
  }, "Hot"),

  t("kinetic-electric", "Kinetic Electric", "neon", "kinetic", {
    fontId: "bebas", uppercase: true, fontSizePx: 100,
    baseColor: "#eaf6ff", activeColor: "#ffffff", accentColor: "#00e5ff",
    strokeWidthPx: 5, maxWordsPerPage: 3, upcomingOpacity: 0.35,
  }, "Trending"),

  t("kinetic-gold", "Kinetic Gold", "highlight", "kinetic", {
    fontId: "montserrat", fontWeight: 900, fontSizePx: 90,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffd60a",
    strokeWidthPx: 5, maxWordsPerPage: 3, upcomingOpacity: 0.4,
  }, "Popular"),

  t("kinetic-hinglish", "Kinetic Hinglish", "trending", "kinetic", {
    fontId: "devanagari", fontWeight: 700, fontSizePx: 88, textCase: "none",
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ff9933",
    strokeWidthPx: 4, maxWordsPerPage: 3, upcomingOpacity: 0.4,
  }, "Viral"),

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
  t("vertical-impact-classic", "Vertical Impact", "bold", "verticalImpact", {
    fontId: "bebas", fontSizePx: 72, baseColor: "#ffffff", accentColor: "#ffd60a",
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
  t("slide-in-pro", "Slide In", "trending", "slideIn", {}, "New"),
  t("blur-focus-pro", "Blur Focus", "trending", "blurFocus", {}, "New"),
  t("typewriter-pro", "Typewriter", "clean", "typewriter", {}, "New"),
  t("rotate-reveal-pro", "Rotate Reveal", "trending", "rotateReveal", {}, "New"),
  t("wipe-up-pro", "Wipe Up", "bold", "wipeUp", {}, "New"),
  t("stroke-fill-pro", "Stroke Fill", "bold", "strokeFill", {}, "New"),
  t("bounce-word-pro", "Bounce Word", "highlight", "bounceWord", {}, "New"),
  t("glitch-effect-pro", "Glitch Effect", "neon", "glitch", {}, "New"),
  t("highlight-word-pro", "Highlight Word", "highlight", "highlightWord", {}, "New"),
  t("zoom-focus-pro", "Zoom Focus", "bold", "zoomFocus", {}, "New"),
  t("gradient-flow-pro", "Gradient Flow", "neon", "gradientFlow", {}, "New"),
  t("mask-reveal-pro", "Mask Reveal", "bold", "maskReveal", {}, "New"),
  t("draw-on-pro", "Draw On", "clean", "drawOn", {}, "New"),
  t("depth-3d-pro", "3D Depth", "trending", "depth3d", {}, "New"),
  t("dual-line-pro", "Dual Line Pro", "premium", "dualLine", {
    fontId: "anton", specialFontId: "rougeScript", uppercase: true,
    fontSizePx: 76, maxWordsPerPage: 4, linesPerPage: 2,
    baseColor: "#ffffff", activeColor: "#ffffff", accentColor: "#ffd60a",
    dropShadow: true, strokeWidthPx: 0,
  }, "New"),

  // ==========================================================================
  // MOTION SYSTEMS FAMILY
  // ==========================================================================
  t("dynamic-slide-stack-pro", "Dynamic Slide Stack", "trending", "dynamicSlideStack", {}, "New"),
  t("glass-highlight-pro", "Glass Highlight", "clean", "glassHighlight", {}, "New"),
  t("split-text-pro", "Split Text", "bold", "splitText", {}, "New"),
  t("liquid-flow-pro", "Liquid Flow", "neon", "liquidFlow", {}, "New"),
  t("light-sweep-pro", "Light Sweep", "clean", "lightSweep", {}, "New"),
  t("paper-cut-pro", "Paper Cut", "highlight", "paperCut", {}, "New"),
  t("flip-card-pro", "Flip Card", "bold", "flipCard", {}, "New"),
  t("ribbon-slide-pro", "Ribbon Slide", "festive", "ribbonSlide", {}, "New"),
  t("spiral-reveal-pro", "Spiral Reveal", "trending", "spiralReveal", {}, "New"),
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
