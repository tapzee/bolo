import {
  Anton,
  Archivo_Black,
  Bebas_Neue,
  Bodoni_Moda,
  Caveat,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Grand_Hotel,
  IBM_Plex_Mono,
  Inter,
  Montserrat,
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
  Oswald,
  Playfair_Display,
  Poppins,
  DynaPuff,
  Limelight,
  Tangerine,
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

export const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: false,
});

export const dynapuff = DynaPuff({
  variable: "--font-dynapuff",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const limelight = Limelight({
  variable: "--font-limelight",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  adjustFontFallback: false,
});

export const tangerine = Tangerine({
  variable: "--font-tangerine",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: false,
});

/** Connected signature script — the "special" flourish font for DynamicHighlight. */
export const grandHotel = Grand_Hotel({
  variable: "--font-grand-hotel",
  subsets: ["latin"],
  weight: "400",
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

/** Highlight Marker / Mixed Weight keyword face — ships one weight only. */
export const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
  adjustFontFallback: false,
});

/** Kinetic Split's condensed keyword face. */
export const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: false,
});

/**
 * Minimal Luxury / Mixed Weight supporting text. Needs a genuine Light
 * weight for the light-vs-black contrast neither Montserrat nor Poppins
 * (both loaded here starting around semi-bold) can produce.
 */
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: false,
});

/** Minimal Luxury's elegant keyword face. */
export const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: false,
});

/** Magazine Cut / Layered Depth's oversized backdrop face. */
export const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: false,
});

/** Editorial Stack / Minimal Luxury's Hindi serif — Noto Sans's editorial cousin. */
export const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-serif-devanagari",
  subsets: ["devanagari", "latin"],
  display: "swap",
  adjustFontFallback: false,
});

/** Typewriter's monospace face — the whole template reads as a typed caption. */
export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
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
  dynapuff.variable,
  limelight.variable,
  tangerine.variable,
  grandHotel.variable,
  notoSansDevanagari.variable,
  archivoBlack.variable,
  oswald.variable,
  inter.variable,
  cormorantGaramond.variable,
  bodoniModa.variable,
  notoSerifDevanagari.variable,
  ibmPlexMono.variable,
].join(" ");
