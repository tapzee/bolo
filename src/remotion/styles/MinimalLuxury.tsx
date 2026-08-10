import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  minimalLuxuryFontScale,
  minimalLuxuryTrackingRatio,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { hasDevanagari } from "@/core";
import { ENTER_SUBTLE, tokenEnter } from "../captions/animation";

/**
 * Minimal Luxury — Template 05.
 *
 * Quiet, negative-space-first typography: a tiny metadata-style numeral, a
 * large elegant keyword, a small Hindi phrase underneath. Every word fades
 * in slowly with a soft rise — no scale, no slide, no bounce, which is the
 * whole point of "luxury" here.
 *
 * Tracking (letter-spacing) is generous but *static*, not animated: it sits
 * directly on glyphs that participate in flex layout, and animating a
 * layout-affecting CSS property per frame would reflow every sibling word on
 * the line each tick — precisely the jitter `tokenShellStyle`'s own doc
 * comment calls out as disallowed. A transform-based animation (scale,
 * translate) never has that problem; letter-spacing does.
 */
export const MinimalLuxuryToken: React.FC<TokenViewProps> = ({
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
  const enter = tokenEnter(timing, ENTER_SUBTLE);

  const isCritical = role === "critical";
  const isKeyword = isCritical || role === "keyword";
  const isNumber = role === "number";

  const fontFamily = isDevanagariWord
    ? FONT_FAMILY.notoSerifDevanagari
    : isKeyword
      ? FONT_FAMILY[config.fontId]
      : FONT_FAMILY[config.secondaryFontId ?? "inter"];

  const fontSize = (textStyle.fontSize as number) * minimalLuxuryFontScale(role, isDevanagariWord);
  const trackingPx = fontSize * minimalLuxuryTrackingRatio(role);

  const color = isDevanagariWord
    ? (token.color ?? config.accentColor)
    : isCritical
      ? (token.color ?? config.accentColor)
      : isKeyword
        ? (token.color ?? config.baseColor)
        : isNumber
          ? (token.color ?? config.accentColor)
          : (token.color ?? "#ffffff");

  const yOffset = isKeyword || isDevanagariWord ? (1 - enter) * 8 : 0;

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          color,
          fontWeight: isKeyword || isDevanagariWord ? 500 : 300,
          letterSpacing: trackingPx,
          opacity: enter,
          transform: `translateY(${yOffset}px)`,
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
