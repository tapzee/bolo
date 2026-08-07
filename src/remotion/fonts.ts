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
  devanagari: "var(--bolo-font-devanagari)",
};
