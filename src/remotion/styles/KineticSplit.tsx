import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  kineticSplitSide,
  isKineticSplitAccent,
  kineticSplitFontScale,
  roleCaseTransform,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { ENTER_SMOOTH, splitEntrance, tokenEnter } from "../captions/animation";

/**
 * Kinetic Split — Template 02.
 *
 * Words alternate which screen edge they enter from (even index → left, odd
 * → right) and converge toward the caption's own centre as they settle —
 * energetic and synchronised to speech order, no rotation, no motion-blur
 * gimmick beyond the entrance itself.
 */
export const KineticSplitToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
  index,
}) => {
  const role = token.role ?? "normal";
  const isAccent = isKineticSplitAccent(role);
  const timing = { frame, fps, fromFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  const side = kineticSplitSide(index ?? 0);
  const travelPx = isAccent ? 260 : 160;
  const offsetX = splitEntrance(side, travelPx, timing, ENTER_SMOOTH);

  const fontFamily = FONT_FAMILY[config.fontId];
  const fontSize = (textStyle.fontSize as number) * kineticSplitFontScale(role);
  const color = isAccent ? (token.color ?? config.accentColor) : (token.color ?? "#ffffff");

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          color,
          fontWeight: isAccent ? 800 : 500,
          opacity: enter,
          transform: `translateX(${offsetX}px)`,
          zIndex: 1,
          // Small supporting text stays clean — no stroke, bright white only.
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
