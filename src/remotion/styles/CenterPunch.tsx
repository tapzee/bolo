import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  frameProgress,
  pickFrameState,
  CENTER_PUNCH_STATES,
  centerPunchFontScale,
  roleCaseTransform,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";

/**
 * Center Punch — Template 09.
 *
 * Builds tension with small words, then the page's one critical word takes
 * over the screen at a massive size before settling to a calmer rest size —
 * driven by page progress (`frameProgress`/`pickFrameState`), not by any one
 * word's own speaking window, so the whole page's words agree on which phase
 * they're in.
 */
export const CenterPunchToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
  pageStartFrame,
  pageDurationFrames,
}) => {
  const role = token.role ?? "normal";
  const isCritical = role === "critical";
  const timing = { frame, fps, fromFrame };

  const progress = frameProgress(frame, pageStartFrame ?? fromFrame, pageDurationFrames ?? 1);
  const state = pickFrameState(progress, CENTER_PUNCH_STATES);

  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const fontFamily = FONT_FAMILY[config.fontId];
  const fontSize = (textStyle.fontSize as number) * centerPunchFontScale(role, state);
  const color = isCritical ? (token.color ?? config.accentColor) : (token.color ?? config.baseColor);

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          fontWeight: isCritical ? 900 : 500,
          opacity: enter,
          zIndex: isCritical ? 2 : 1,
          // Small buildup text stays clean — no stroke, bright white only.
          WebkitTextStroke: isCritical ? textStyle.WebkitTextStroke : "0px transparent",
          color: isCritical ? color : "#ffffff",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
