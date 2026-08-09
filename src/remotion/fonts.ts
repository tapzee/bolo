import type { FontId } from "@/core";

/**
 * Maps a font choice to the composite CSS stack declared in `globals.css`.
 *
 * Every stack ends in Noto Sans Devanagari, so a caption mixing Latin and
 * Devanagari resolves each glyph independently and Hindi never renders as tofu
 * even under Anton or Bebas Neue, neither of which ships Devanagari.
 */
export const FONT_FAMILY: Readonly<Record<FontId, string>> = {
  montserrat: "var(--bolo-font-montserrat)",
  anton: "var(--bolo-font-anton)",
  bebas: "var(--bolo-font-bebas)",
  poppins: "var(--bolo-font-poppins)",
  playfair: "var(--bolo-font-playfair)",
  caveat: "var(--bolo-font-caveat)",
  dynapuff: "var(--bolo-font-dynapuff)",
  limelight: "var(--bolo-font-limelight)",
  tangerine: "var(--bolo-font-tangerine)",
  grandHotel: "var(--bolo-font-grand-hotel)",
  devanagari: "var(--bolo-font-devanagari)",
  archivoBlack: "var(--bolo-font-archivo-black)",
  oswald: "var(--bolo-font-oswald)",
  inter: "var(--bolo-font-inter)",
  cormorantGaramond: "var(--bolo-font-cormorant-garamond)",
  bodoniModa: "var(--bolo-font-bodoni-moda)",
  notoSerifDevanagari: "var(--bolo-font-noto-serif-devanagari)",
};
