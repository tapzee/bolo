import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  isMaskRevealHero,
  maskRevealFontScale,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Mask Reveal.
 *
 * Glows the hero word in the accent color, without an outline.
 */
export const MaskRevealToken = memo(function MaskRevealToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isHero = isMaskRevealHero(role);
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  const durationFrames = Math.max(1, toFrame - fromFrame);
  const elapsed = Math.max(0, frame - fromFrame);
  const progress = Math.min(1, elapsed / durationFrames);

  const fontSize = (textStyle.fontSize as number) * maskRevealFontScale(role);
  const sweepPct = progress * 100;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: isHero ? "transparent" : (token.color ?? config.baseColor),
          backgroundImage: isHero
            ? `linear-gradient(90deg, ${config.accentColor} ${sweepPct - 15}%, #ffffff ${sweepPct}%, ${config.accentColor} ${sweepPct + 15}%)`
            : undefined,
          WebkitBackgroundClip: isHero ? "text" : undefined,
          backgroundClip: isHero ? "text" : undefined,
          WebkitTextStroke: "0px transparent",
          textShadow: isHero ? `0 0 18px ${config.accentColor}` : undefined,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
