"use client";

import { REFERENCE_HEIGHT } from "@/core";

type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/**
 * Free-tier watermark.
 *
 * Sized against the reference canvas like everything else, so it stays
 * proportionally identical at 720p and 4K rather than becoming a speck on a
 * large export.
 *
 * Deliberately placed bottom-centre and kept modest: it has to be clearly
 * present (it is the reason to upgrade) without ruining a clip the user might
 * still want to post. It sits below the `bottom` caption anchor at 80%, so it
 * never collides with the captions themselves.
 */
export const drawWatermark = (
  ctx: Ctx,
  width: number,
  height: number,
): void => {
  const scale = height / REFERENCE_HEIGHT;
  const fontSize = Math.max(14, 30 * scale);
  const padY = 44 * scale;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.letterSpacing = `${fontSize * 0.04}px`;

  const text = "Made with Bolo";
  const x = width / 2;
  const y = height - padY;

  // Soft shadow rather than a stroke: it stays legible on both bright and dark
  // footage without reading as a second caption style.
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 10 * scale;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(text, x, y);

  ctx.restore();
};
