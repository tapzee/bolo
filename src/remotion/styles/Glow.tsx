import { memo } from "react";
import { interpolateColors } from "remotion";
import { GLOW_RADII } from "@/core";
import { ENTER_SMOOTH, tokenHighlight } from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Glow — a neon bloom builds on the spoken word.
 *
 * Three stacked shadows (tight core, mid halo, wide wash) read as real light
 * instead of a flat blur. Radii scale off `fontSizePx` so the bloom keeps its
 * proportions whether the frame is exported at 720p or 4K.
 *
 * The shadow string collapses to `none` at rest — leaving three zero-radius
 * shadows on every idle word makes Chromium keep a paint layer alive for each
 * one and costs frames during playback for no visible benefit.
 */
export const GlowToken = memo(function GlowToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const highlight = tokenHighlight(
    { frame, fps, fromFrame, toFrame },
    ENTER_SMOOTH,
  );

  // On this preset a per-word override recolours the *bloom*, which is what
  // carries the emphasis here — the glyph itself stays near-white so it never
  // loses contrast against the stroke.
  const bloom = token.color ?? config.accentColor;
  const unit = config.fontSizePx;

  const textShadow =
    highlight > 0.01
      ? [
          `0 0 ${unit * 0.08 * highlight}px #ffffff`,
          ...GLOW_RADII.map(
            (radius) => `0 0 ${unit * radius * 1.35 * highlight}px ${bloom}`,
          ),
          `0 0 ${unit * 0.6 * highlight}px ${bloom}`,
        ].join(", ")
      : "0 2px 6px rgba(0, 0, 0, 0.55)";

  const color = interpolateColors(
    highlight,
    [0, 1],
    [config.baseColor, config.activeColor],
  );

  const alpha = highlight > 0.01 ? 1 : (fromFrame > frame ? 0.45 : 0.7);

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: alpha,
        transition: "opacity 0.08s ease-out",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          color,
          textShadow,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
