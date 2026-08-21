import { memo } from "react";
import type { WordRole } from "@/core";
import { popWordState } from "../captions/animation";
import {
  displayText,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
  buildGlowShadow,
} from "../captions/primitives";

/**
 * Pop Word — punchy kinetic bounce-in with active glow and role micro-tilts.
 *
 * Words pop in sequentially with an elastic overshoot and subtle upward lift.
 * The active word illuminates with vibrant accent/glow, while keywords and hero
 * words feature clean stroke/tilt dynamics with paint-order fill preservation.
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
  const anim = popWordState({ frame, fps, fromFrame, toFrame }, role);

  // Hidden before spoken
  if (anim.opacity <= 0) {
    return (
      <span style={{ ...tokenShellStyle, opacity: 0 }}>
        <span style={{ ...textStyle, ...tokenGlyphStyle }}>
          {displayText(token)}
        </span>
      </span>
    );
  }

  const isAccent = role === "critical";
  const isAnchor = role === "keyword";
  const isHero = role === "emphasis";

  const color = (isAccent || isHero || anim.isActive)
    ? (config.activeColor || config.accentColor || "#ff5e00")
    : (config.baseColor || "#ffffff");

  let webkitTextStroke = textStyle.WebkitTextStroke;
  let fillColor = color;
  let textShadow = textStyle.textShadow;

  if (isAnchor) {
    // High-contrast clean outline
    const strokeWidth = Math.max(2, config.strokeWidthPx || 3);
    webkitTextStroke = `${strokeWidth}px ${config.accentColor || "#ff5e00"}`;
    fillColor = anim.isActive ? (config.accentColor || "#ff5e00") : "transparent";
  }

  if (isHero || (anim.isActive && config.glowEnabled)) {
    textShadow = buildGlowShadow(config, config.accentColor || "#ff5e00", 1.4) || textShadow;
  }

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: anim.opacity,
        transform: `translateY(${anim.translateY}px) rotate(${anim.rotateDeg}deg) scale(${anim.scale})`,
        transformOrigin: "center center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          color: fillColor,
          WebkitTextStroke: webkitTextStroke,
          paintOrder: "stroke fill",
          textShadow,
          textTransform: roleCaseTransform(role, config),
          letterSpacing: `${config.letterSpacingPx ?? -1}px`,
          lineHeight: config.lineHeight ?? 0.95,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});

