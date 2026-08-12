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
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";

/**
 * Editorial Stack — Template 01.
 *
 * A premium magazine-editorial mix: a large serif keyword, tiny sans
 * supporting context, and a large serif Hindi emphasis word — three
 * typographic tiers reading as one deliberate composition rather than one
 * shouted line. Hindi gets its own large-serif tier regardless of the word's
 * computed role, since in this template Hindi is always meant to punctuate.
 *
 * Motion mirrors Editorial Kinetic's per-tier reveal (blur + rise on the big
 * serif anchor, a quiet fade-up on everything else) — the original version
 * only scaled 94%→102%, which read as flat next to that template. The accent
 * colour is restricted to the page's one `critical` word (previously every
 * Devanagari word got it unconditionally, which is what made the whole line
 * look uniformly tinted instead of having one clear highlight).
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
  const isCritical = role === "critical";
  const isBigTier = isDevanagariWord || isKeyword;
  const timing = { frame, fps, fromFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  const primaryFamily = FONT_FAMILY[config.fontId];
  const secondaryFamily = FONT_FAMILY[config.secondaryFontId ?? "inter"];
  const hindiFamily = FONT_FAMILY.notoSerifDevanagari;

  const fontSize = (textStyle.fontSize as number) * editorialStackFontScale(role, isDevanagariWord);

  const fontFamily = isDevanagariWord ? hindiFamily : isKeyword ? primaryFamily : secondaryFamily;
  const fontWeight = isCritical ? 700 : isBigTier ? 600 : 500;
  // Only the page's one critical word carries the accent colour — everything
  // else in the big tier stays neutral white so one word actually reads as
  // "the highlighted one" instead of the whole line looking tinted.
  const color = isCritical
    ? (token.color ?? config.accentColor)
    : isBigTier
      ? (token.color ?? config.baseColor)
      : (token.color ?? "#ffffff");

  const yOffset = (isBigTier ? (1 - enter) * 22 : (1 - enter) * 8);
  const blurPx = isBigTier ? (1 - enter) * 7 : 0;

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
          transform: `translateY(${yOffset}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          zIndex: 1,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
