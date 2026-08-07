import type { CaptionPlacement } from "./types";

/**
 * Caption layout constants shared by BOTH renderers.
 *
 * There are two independent implementations of the caption styles: the DOM one
 * that drives the live preview, and the Canvas2D one that draws into exported
 * frames. That duplication is unavoidable — an exported frame is a `VideoFrame`,
 * not a DOM tree — but silent divergence between them is the single worst bug
 * this app could ship, because the user would approve one thing and download
 * another.
 *
 * Every number that positions a caption therefore lives here, imported by both.
 * If you add a layout constant, put it in this file.
 */

/**
 * Vertical anchor as a fraction of canvas height.
 *
 * `bottom-third` at 66% and `bottom` at 80% both clear the Reels/Shorts chrome,
 * which eats roughly the bottom 15% for the caption and the right 12% for the
 * action rail. The same fractions hold on landscape, where 80% clears a
 * player's control bar.
 */
export const PLACEMENT_ANCHOR: Readonly<Record<CaptionPlacement, number>> = {
  top: 0.18,
  center: 0.5,
  "bottom-third": 0.66,
  bottom: 0.8,
};

export const anchorFraction = (
  placement: CaptionPlacement,
  verticalOffsetPct: number,
): number => PLACEMENT_ANCHOR[placement] + verticalOffsetPct / 100;

/**
 * Horizontal centre of the caption block, as a fraction of canvas width.
 *
 * Captions are centred by default; dragging shifts this. Clamped to 5–95% so a
 * caption can never be dragged fully off-frame and become unrecoverable — the
 * user would have no handle left to drag back.
 */
export const horizontalFraction = (horizontalOffsetPct: number): number => {
  const raw = 0.5 + horizontalOffsetPct / 100;
  return Math.min(0.95, Math.max(0.05, raw));
};

/** Same guard for the vertical axis. */
export const clampAnchor = (fraction: number): number =>
  Math.min(0.95, Math.max(0.05, fraction));

/**
 * Applies an alpha to a `#rrggbb` colour.
 *
 * Returns `rgba(...)` rather than 8-digit hex because Canvas2D's `fillStyle`
 * handles `rgba()` everywhere, while `#rrggbbaa` support is inconsistent in
 * older engines — and this string is used by both renderers.
 */
export const withOpacity = (hex: string, opacity: number): string => {
  const alpha = Math.min(1, Math.max(0, opacity));
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (match === null) return hex;

  const [, r, g, b] = match;
  return `rgba(${parseInt(r ?? "0", 16)}, ${parseInt(g ?? "0", 16)}, ${parseInt(b ?? "0", 16)}, ${alpha})`;
};

/** Vertical gap between wrapped caption lines, in the same px space as the font. */
export const lineGapPx = (lineHeight: number, fontSizePx: number): number =>
  lineHeight * 0.28 * fontSizePx;

/**
 * Box preset geometry. Derived from font size rather than `em` because the
 * backdrop element sits outside the node carrying the font size.
 */
export const BOX_PAD_X_RATIO = 0.24;
export const BOX_PAD_Y_RATIO = 0.1;
export const BOX_RADIUS_RATIO = 0.2;

/** Glow preset bloom radii, as fractions of font size. */
export const GLOW_RADII = [0.06, 0.18, 0.42] as const;
