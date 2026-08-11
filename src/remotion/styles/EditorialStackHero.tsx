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
export const EditorialStackHeroToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
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

  const fontStyle = "normal";

  const hash = getHash(token.text + index);
  const alignVariant = hash % 3;
  const slideVariant = (hash + 1) % 2;

  let fontWeight: number;
  let color: string;
  let noStroke = false;
  let enter: number;
  let scale = 1;
  let yOffset = 0;
  let blurPx = 0;

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
    noStroke = true;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    yOffset = (1 - enter) * 35;
    scale = 0.97 + enter * 0.03;
    blurPx = (1 - enter) * 6;
  } else if (tier === "secondary" || tier === "support") {
    fontWeight = 900;
    color = token.color ?? "#ffffff";
    noStroke = true;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    const travel = slideVariant === 0 ? -25 : 25;
    yOffset = (1 - enter) * travel;
    scale = 1;
    blurPx = (1 - enter) * 4;
  } else {
    fontWeight = 600;
    color = token.color ?? "#ffffff";
    noStroke = true;
    enter = tokenEnter(timing, ENTER_SMOOTH);
  }

  // Controlled overlap: each tier tucks a little closer to the row above it
  // than a flat line-height would, without independently centering any line
  // — the whole page still shares one visual centre.
  const overlapMarginEm =
    tier === "main" ? -0.15 : tier === "primary" ? -0.12 : tier === "secondary" ? -0.18 : -0.12;

  const justifyContent =
    tier === "main" || tier === "primary"
      ? "center"
      : alignVariant === 0
        ? "flex-start"
        : alignVariant === 1
          ? "center"
          : "flex-end";

  return (
    <span
      style={{
        ...tokenShellStyle,
        // Owns its row — this is what produces the vertical stack.
        flexBasis: "100%",
        justifyContent,
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
          transform: `translateY(${yOffset}px) scale(${scale})`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          WebkitTextStroke: noStroke ? "0px transparent" : textStyle.WebkitTextStroke,
          textShadow:
            tier === "main"
              ? "0 6px 20px rgba(0,0,0,0.65)"
              : "0 2px 10px rgba(0,0,0,0.6)",
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
