import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  isMixedWeightKeyword,
  mixedWeightFontScale,
  roleCaseTransform,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import { ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter } from "../captions/animation";

/**
 * Mixed Weight — Template 08.
 *
 * Extreme typographic-weight contrast: supporting words sit at the light end
 * of the same family (300) in neutral white, the keyword explodes into an
 * ultra-bold 900 in the template's accent colour with a punch-in overshoot —
 * weight *and* colour both signal "this is the word," matching how every
 * other template in the family highlights its keyword.
 */
export const MixedWeightToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}) => {
  const role: WordRole = token.role ?? "normal";
  const isKeyword = isMixedWeightKeyword(role);
  const timing = { frame, fps, fromFrame, toFrame };
  const isDevanagari = hasDevanagari(token.text);

  const fontFamily = isKeyword
    ? FONT_FAMILY[config.fontId]
    : FONT_FAMILY[config.secondaryFontId ?? "inter"];

  const fontSize = (textStyle.fontSize as number) * mixedWeightFontScale(role);

  let opacity: number;
  let yOffset: number;

  if (isKeyword) {
    opacity = tokenEnter(timing, ENTER_SMOOTH);
    yOffset = 0;
  } else if (isDevanagari) {
    // "Fast upward reveal" — a snappier, larger rise than the light text's
    // slow fade, per the template's own animation brief.
    const enter = tokenEnter(timing, ENTER_BOUNCY);
    opacity = Math.min(1, enter);
    yOffset = (1 - Math.min(1, enter)) * 20;
  } else {
    // Light supporting text: a slow, quiet fade — no movement.
    opacity = tokenEnter(timing, ENTER_SMOOTH);
    yOffset = 0;
  }

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          fontWeight: isKeyword ? 900 : 300,
          color: token.color ?? (isKeyword ? config.accentColor : config.baseColor),
          opacity,
          transform: `translateY(${yOffset}px)`,
          zIndex: 1,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
