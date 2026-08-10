import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import { tokenShellStyle, displayText, layeredDepthForegroundScale } from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { hasDevanagari } from "@/core";
import { ENTER_SMOOTH, layeredDepthDrift, tokenEnter } from "../captions/animation";

/**
 * Layered Depth — Template 10.
 *
 * The page's critical word gets a second, huge, low-opacity copy of itself
 * drifting behind the readable foreground text — depth from opacity and
 * scale, not fake 3D. Every other word on the page is foreground-only.
 */
export const LayeredDepthToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}) => {
  const role = token.role ?? "normal";
  const isCritical = role === "critical";
  const isDevanagariWord = hasDevanagari(token.text);
  const timing = { frame, fps, fromFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const drift = layeredDepthDrift(frame, fps, 10, 7);

  const foregroundFamily = isCritical
    ? FONT_FAMILY[config.secondaryFontId ?? "inter"]
    : isDevanagariWord
      ? FONT_FAMILY.notoSerifDevanagari
      : FONT_FAMILY[config.secondaryFontId ?? "inter"];

  const foregroundSize = (textStyle.fontSize as number) * layeredDepthForegroundScale(role);
  // The critical word's readable foreground copy carries the accent colour
  // — the backdrop ghost behind it is deliberately quiet, so the colour is
  // what actually signals "this is the highlighted word," not just size.
  const foregroundColor = isCritical
    ? (token.color ?? config.accentColor)
    : (token.color ?? (isDevanagariWord ? config.accentColor : config.baseColor));

  return (
    <span style={{ ...tokenShellStyle, position: "relative" }}>
      {isCritical && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateX(${drift}px)`,
            fontFamily: FONT_FAMILY[config.fontId],
            fontSize: (textStyle.fontSize as number) * 2.6,
            color: config.baseColor,
            // Top of the spec's own "10-20% opacity" range for the backdrop
            // — 0.14 read as essentially invisible against real footage.
            opacity: 0.2 * enter,
            fontWeight: 700,
            whiteSpace: "nowrap",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          {displayText(token).toUpperCase()}
        </span>
      )}
      <span
        style={{
          ...textStyle,
          fontFamily: foregroundFamily,
          fontSize: foregroundSize,
          color: foregroundColor,
          opacity: enter,
          position: "relative",
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
