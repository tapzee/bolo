import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_BOUNCY, tokenEnter, clamp01 } from "../captions/animation";
import {
  displayText,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Pop Word — bouncy sequential punch in.
 *
 * Words remain invisible until they are spoken, then pop in with a bouncy scale
 * and a quick fade. Styling maps directly to roles: normal (solid), anchor (outline),
 * accent (solid color), hero (solid color + glow).
 */
export const PopWordToken = memo(function PopWordToken({
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

  // Wait until it's spoken
  if (frame < fromFrame) {
    return (
      <span style={{ ...tokenShellStyle, opacity: 0 }}>
        <span style={{ ...textStyle, ...tokenGlyphStyle }}>
          {displayText(token)}
        </span>
      </span>
    );
  }

  // Bouncy scale (equivalent to user's easeOutBack over 400ms)
  const scale = tokenEnter(timing, ENTER_BOUNCY);
  
  // Fade in quickly (equivalent to user's 200ms fade in)
  const opacity = clamp01((frame - fromFrame) / 6); // 6 frames = 200ms at 30fps

  const isAccent = role === "critical";
  const isAnchor = role === "keyword";
  const isHero = role === "emphasis";

  const color = (isAccent || isHero) ? config.accentColor : config.baseColor;
  
  let webkitTextStroke = textStyle.WebkitTextStroke;
  let fillColor = color;
  let textShadow = textStyle.textShadow;

  if (isAnchor) {
    // Outline style
    webkitTextStroke = `4px ${config.accentColor}`;
    fillColor = "transparent";
  }

  if (isHero) {
    // Glow style
    textShadow = `0 0 20px ${config.accentColor}, 0 0 40px ${config.accentColor}`;
  }

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          color: fillColor,
          WebkitTextStroke: webkitTextStroke,
          textShadow,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
