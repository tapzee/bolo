import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  editorialStackHeroRole,
  editorialStackHeroFontScale,
  isEditorialStackHeroAccent,
  getHash,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  centerPunchScale,
  tokenEnter,
} from "../captions/animation";

/**
 * Editorial Stack Hero — a 4-tier stacked poster: tiny sans support words,
 * bold condensed primary anchors, one oversized yellow hero word, and an
 * elegant italic secondary accent, each tier on its own row.
 *
 * Splits Editorial Kinetic's "display" tier into two (see
 * `editorialStackHeroRole`'s doc comment): only the page's single critical
 * word gets the pop-in hero treatment, everything else that would have been
 * "display" stays a calmer slide-up anchor.
 *
 * `flexBasis: 100%` gives every word its own row, same mechanism as
 * `EditorialKinetic.tsx` — deliberately not driven by fixed per-role Y
 * offsets, which would assume a fixed word count per page and break the
 * moment a page has more or fewer than four words.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "editorialStackHero"`
 * and in `remotion/captions/page-fit.ts`'s box-fit estimate. All three must
 * change together.
 */
export const StackToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
}) => {
  const role: WordRole = token.role ?? "normal";
  const isDevanagariWord = hasDevanagari(token.text);
  const tier = editorialStackHeroRole(role, token.text);
  const isAccent = isEditorialStackHeroAccent(role);
  const timing = { frame, fps, fromFrame, toFrame };

  const fontSize =
    (textStyle.fontSize as number) * editorialStackHeroFontScale(role, tier);

  const primaryFamily = FONT_FAMILY[config.fontId];
  const supportFamily = FONT_FAMILY[config.secondaryFontId ?? "montserrat"];

  const fontFamily = isDevanagariWord
    ? tier === "support"
      ? FONT_FAMILY.devanagari
      : FONT_FAMILY.notoSerifDevanagari
    : tier === "main" || tier === "primary"
      ? primaryFamily
      : supportFamily;

  const hash = getHash(token.text + index);
  const slideVariant = (hash + 1) % 2;

  let enter: number;
  let scale = 1;
  let yOffset = 0;
  let xOffset = 0;
  let blurPx = 0;
  let fontWeight: number;
  let color: string;
  const fontStyle = "normal";

  if (tier === "main") {
    fontWeight = isDevanagariWord ? 700 : 400;
    color = isAccent
      ? (token.color ?? config.accentColor)
      : (token.color ?? config.baseColor);
    // Punch in past 100%, settle, and hold — see `centerPunchScale`'s own
    // doc comment for why this is a bare spring rather than `tokenPulse`.
    const punch = centerPunchScale(timing, ENTER_BOUNCY);
    scale = 0.82 + punch * 0.18;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    blurPx = (1 - enter) * 6;
  } else if (tier === "primary") {
    fontWeight = isDevanagariWord ? 700 : 400;
    color = token.color ?? config.baseColor;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    yOffset = (1 - enter) * 35;
    scale = 0.97 + enter * 0.03;
    blurPx = (1 - enter) * 6;
  } else if (tier === "secondary" || tier === "support") {
    fontWeight = 900;
    color = token.color ?? "#ffffff";
    enter = tokenEnter(timing, ENTER_SMOOTH);
    const travelY = slideVariant === 0 ? -25 : 25;
    
    // Continuous pan from left to right over the lifetime of the word
    const duration = toFrame - fromFrame;
    const progress = Math.max(0, Math.min(1, (frame - fromFrame) / duration));
    const panOffset = -15 + (progress * 30); // starts slightly left, moves slightly right
    
    yOffset = (1 - enter) * travelY;
    xOffset = panOffset;
    scale = 1;
    blurPx = (1 - enter) * 4;
  } else {
    fontWeight = 600;
    color = token.color ?? "#ffffff";
    enter = tokenEnter(timing, ENTER_SMOOTH);
  }

  // — the whole page still shares one visual centre.
  const overlapMarginEm =
    tier === "main" ? -0.15 : tier === "primary" ? -0.12 : tier === "secondary" ? -0.18 : -0.12;

  return (
    <span
      style={{
        ...tokenShellStyle,
        // Only the hero word (or primary anchor) claims its own row to break lines.
        flexBasis: tier === "main" || tier === "primary" ? "100%" : "auto",
        justifyContent: "center",
        marginTop: `${overlapMarginEm}em`,
      }}
    >
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle,
          color,
          textTransform: tier === "main" || tier === "primary" ? "uppercase" : "lowercase",
          letterSpacing: tier === "main" || tier === "primary" ? textStyle.letterSpacing : 0,
          opacity: enter,
          transform: `translate(${xOffset}px, ${yOffset}px) scale(${scale})`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
