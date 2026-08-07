"use client";

import type { FontId } from "@/core";
import { FONT_FAMILY } from "@/remotion/fonts";

/**
 * Resolves a caption font to a family name Canvas2D can actually use.
 *
 * The DOM renderer sets `font-family: var(--bolo-font-anton)`, but `ctx.font`
 * does not resolve CSS custom properties — assigning a `var(...)` string is
 * silently ignored and the canvas falls back to 10px sans-serif. So we mount a
 * throwaway element, let the browser resolve the variable, and read the
 * concrete family list back out.
 *
 * The resolved list still ends in Noto Sans Devanagari, which is what keeps
 * Hindi glyphs rendering under Anton and Bebas Neue in exports exactly as they
 * do in the preview.
 */
const cache = new Map<FontId, string>();

export const resolveFontFamily = (fontId: FontId): string => {
  const cached = cache.get(fontId);
  if (cached !== undefined) return cached;

  const probe = document.createElement("span");
  probe.style.fontFamily = FONT_FAMILY[fontId];
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);

  const resolved = getComputedStyle(probe).fontFamily || "sans-serif";
  document.body.removeChild(probe);

  cache.set(fontId, resolved);
  return resolved;
};

export const canvasFont = (
  weight: number,
  sizePx: number,
  family: string,
  style = "normal",
): string => `${style !== "normal" ? `${style} ` : ""}${weight} ${sizePx}px ${family}`;

/**
 * Forces the browser to actually load a face before the first frame is drawn.
 *
 * `document.fonts.ready` only covers fonts already in use. A caption font the
 * preview never rendered would otherwise be missing on the first exported
 * frames and appear mid-video — baked permanently into the file.
 *
 * The sample string deliberately mixes Devanagari and Latin so the Noto
 * fallback is pulled in too, not just the display face.
 */
export const ensureCaptionFontLoaded = async (
  weight: number,
  sizePx: number,
  family: string,
  style = "normal",
): Promise<void> => {
  const spec = canvasFont(weight, sizePx, family, style);
  try {
    await document.fonts.load(spec, "बोलो Bolo");
    await document.fonts.ready;
  } catch {
    // A failed preload is not fatal — the browser still resolves something.
    // Better a fallback face than a failed export.
  }
};
