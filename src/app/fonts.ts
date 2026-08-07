import {
  Anton,
  Bebas_Neue,
  Caveat,
  Geist,
  Geist_Mono,
  Montserrat,
  Noto_Sans_Devanagari,
  Playfair_Display,
  Poppins,
} from "next/font/google";

/**
 * UI chrome fonts. Kept separate from caption fonts so the editor's own
 * typography never changes when the user picks a caption font.
 */
export const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Caption fonts.
 *
 * `adjustFontFallback` is disabled on every caption font on purpose. Next
 * otherwise injects a metric-adjusted `local("Arial")` face directly after the
 * real font, and that face would absorb Devanagari codepoints on any machine
 * whose Arial happens to carry them — producing different glyphs per OS inside
 * a video that is supposed to render identically everywhere. With it off, the
 * family list falls straight through to Noto Sans Devanagari (see
 * `--bolo-font-*` in globals.css). Caption text lives inside a fixed-size
 * Remotion canvas, so the usual CLS cost of doing this does not apply.
 */
export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: false,
});

export const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
  adjustFontFallback: false,
});

export const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  adjustFontFallback: false,
});

/** Poppins is the one display face here that ships real Devanagari glyphs. */
export const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext", "devanagari"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: false,
});

/** The safety net for every Devanagari codepoint the display fonts lack. */
export const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: false,
});

export const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: false,
});

export const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  montserrat.variable,
  anton.variable,
  bebasNeue.variable,
  poppins.variable,
  playfairDisplay.variable,
  caveat.variable,
  notoSansDevanagari.variable,
].join(" ");
