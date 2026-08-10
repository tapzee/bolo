import { memo } from "react";
import { interpolateColors } from "remotion";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter, tokenHighlight } from "../captions/animation";
import {
  blurFocusFontScale,
  displayText,
  isBlurFocusAccent,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Blur Focus — cinematic reveal from heavy blur into perfect sharpness.
 *
 * Only keyword/critical words carry the full blur-to-sharp treatment plus a
 * soft accent glow once sharp; supporting words snap in fast and small with
 * no blur, so the blur reads as a deliberate cinematic focus pull rather
 * than every word swimming into view.
 */
export const BlurFocusToken = memo(function BlurFocusToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const timing = { frame, fps, fromFrame, toFrame };
  const isAccent = isBlurFocusAccent(role);
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * blurFocusFontScale(role);
  const color = isAccent
    ? interpolateColors(highlight, [0, 1], [token.color ?? config.accentColor, token.color ?? config.activeColor])
    : (token.color ?? config.baseColor);

  const blurPx = isAccent ? (1 - enter) * 22 : (1 - enter) * 4;
  const scale = isAccent ? 1.08 - enter * 0.08 : 1;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `scale(${scale})`,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textShadow: isAccent && enter > 0.7 ? `0 0 ${fontSize * 0.14}px ${config.accentColor}` : undefined,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
