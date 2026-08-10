import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  isEditorialStackKeyword,
  editorialStackFontScale,
  roleCaseTransform,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { hasDevanagari } from "@/core";
import { ENTER_SMOOTH, ENTER_SUBTLE, tokenEnter } from "../captions/animation";

/**
 * Editorial Stack — Template 01.
 *
 * A premium magazine-editorial mix: a large serif keyword, tiny sans
 * supporting context, and a large serif Hindi emphasis word — three
 * typographic tiers reading as one deliberate composition rather than one
 * shouted line. Hindi gets its own large-serif tier regardless of the word's
 * computed role, since in this template Hindi is always meant to punctuate.
 */
export const EditorialStackToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}) => {
  const role = token.role ?? "normal";
  const isDevanagariWord = hasDevanagari(token.text);
  const isKeyword = isEditorialStackKeyword(role);
  const timing = { frame, fps, fromFrame };

  const primaryFamily = FONT_FAMILY[config.fontId];
  const secondaryFamily = FONT_FAMILY[config.secondaryFontId ?? "inter"];
  const hindiFamily = FONT_FAMILY.notoSerifDevanagari;

  const fontSize = (textStyle.fontSize as number) * editorialStackFontScale(role, isDevanagariWord);

  let fontFamily: string;
  let color: string;
  let fontWeight: number;
  let enter: number;
  let scale = 1;
  let yOffset = 0;

  if (isDevanagariWord) {
    fontFamily = hindiFamily;
    color = token.color ?? config.accentColor;
    fontWeight = 600;
    enter = tokenEnter(timing, ENTER_SUBTLE);
    scale = 0.95 + enter * 0.05;
  } else if (isKeyword) {
    fontFamily = primaryFamily;
    // The page's one critical word carries the accent colour, same as the
    // Hindi emphasis tier — everything else large stays neutral white so
    // only one word per page actually reads as "the highlighted one."
    color = token.color ?? (role === "critical" ? config.accentColor : config.baseColor);
    fontWeight = 500;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    // Slow editorial settle — 94% → 102% → 100%, not a bouncy overshoot.
    scale = 0.94 + enter * 0.08;
  } else {
    fontFamily = secondaryFamily;
    color = token.color ?? "#ffffff";
    fontWeight = 500;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    yOffset = (1 - enter) * 10;
  }

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          color,
          fontWeight,
          opacity: enter,
          transform: `scale(${scale}) translateY(${yOffset}px)`,
          zIndex: 1,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
