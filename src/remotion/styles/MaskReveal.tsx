import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter, tokenPulse } from "../captions/animation";
import {
  displayText,
  isMaskRevealHero,
  maskRevealFontScale,
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
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const fontSize = (textStyle.fontSize as number) * maskRevealFontScale(role);
  const scale = isHero ? 0.82 + Math.min(1.1, pulse) * 0.18 : 1;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `scale(${scale})` }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: token.color ?? (isHero ? config.accentColor : config.baseColor),
          WebkitTextStroke: "0px transparent",
          textShadow: isHero ? `0 0 18px ${config.accentColor}` : undefined,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
