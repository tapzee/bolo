import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  roleCaseTransform,
  verticalImpactCharFontSize,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { hasDevanagari } from "@/core";
import { ENTER_BOUNCY, ENTER_SMOOTH, letterStagger, tokenEnter } from "../captions/animation";

/**
 * Vertical Impact — Template 06.
 *
 * The page's English keyword builds letter-by-letter down a vertical column;
 * Hindi (or any other supporting word) renders normally, horizontally, and
 * dominant — the two compositions sit side by side rather than either one
 * rotating, which is what keeps individual letters legible.
 */
export const VerticalImpactToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}) => {
  const role = token.role ?? "normal";
  const isDevanagariWord = hasDevanagari(token.text);
  const timing = { frame, fps, fromFrame };
  const fontFamily = FONT_FAMILY[config.fontId];

  const isVerticalKeyword = !isDevanagariWord && (role === "critical" || role === "keyword");

  if (isVerticalKeyword) {
    const chars = displayText(token).split("");
    const staggerFrames = Math.round(fps * 0.05);
    // Only the page's critical word gets the accent colour running down its
    // column; a "keyword" that isn't the critical one stays neutral white.
    const isCritical = role === "critical";
    return (
      <span style={{ ...tokenShellStyle, flexDirection: "column", lineHeight: 0.94, gap: 2 }}>
        {chars.map((ch, i) => {
          const reveal = letterStagger(i, timing, ENTER_SMOOTH, staggerFrames);
          return (
            <span
              key={i}
              style={{
                ...textStyle,
                fontFamily,
                fontSize: verticalImpactCharFontSize(textStyle.fontSize as number),
                color: token.color ?? (isCritical ? config.accentColor : config.baseColor),
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 10}px)`,
                display: "block",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  }

  const enter = tokenEnter(timing, ENTER_BOUNCY);
  const clampedEnter = enter < 0 ? 0 : enter > 1 ? 1 : enter;
  const scale = isDevanagariWord ? 1.15 : role === "connector" ? 0.55 : 0.65;

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily: isDevanagariWord ? FONT_FAMILY.devanagari : fontFamily,
          fontSize: (textStyle.fontSize as number) * scale,
          color: isDevanagariWord ? (token.color ?? config.accentColor) : "#ffffff",
          opacity: clampedEnter,
          transform: `translateY(${(1 - clampedEnter) * 16}px)`,
          zIndex: 1,
          // The small English connector/supporting tier stays clean — no
          // stroke. The dominant Hindi word keeps the template's own stroke.
          WebkitTextStroke: isDevanagariWord ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
