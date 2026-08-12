import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  displayText,
  haloTextShadow,
  isStackAccentColour,
  premiumStrokePx,
  stackFontScale,
  stackRowAlign,
  stackRowOffsetPx,
  stackTier,
  stackTierIsUpper,
  tokenShellStyle,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import {
  ENTER_SMOOTH,
  tokenEnter,
} from "../captions/animation";

/**
 * Stack — the editorial poster caption.
 *
 * Three rows, one word per row, four typographic tiers on the page at once:
 * a tiny lowercase sans support word, a bold condensed anchor, one oversized
 * headline word in the accent colour, and an italic serif accent. The headline
 * holds the centre line and the smaller rows are tucked alternately left and
 * right of it (`stackRowOffsetPx`), which is what gives the block its offset,
 * magazine-page rhythm.
 *
 * Each tier also enters differently — the headline blurs and punches in, the
 * anchor rises, the italic accent slides in from the edge it sits against, and
 * support words fade up a few pixels — so one page carries several motions
 * without any of them being random.
 *
 * WHAT THIS TEMPLATE DELIBERATELY DOES NOT DO, having been rebuilt from a
 * version that did:
 *
 * - **No hashed scatter.** Words are not pushed to random x/y offsets. Scatter
 *   moved glyphs outside the measured caption block, so the editor's transform
 *   box no longer contained its own text.
 * - **No continuous pan.** A word that keeps drifting for as long as it is on
 *   screen never settles, and reads as drift rather than design.
 * - **No negative row margins.** Tight leading comes from `lineHeight`, which
 *   *both* renderers derive row height and row gap from. A DOM-only negative
 *   margin has no Canvas2D equivalent, so it silently exports differently.
 *
 * `flexBasis: 100%` gives every word its own row. Every row is centred; the
 * left/right rhythm is applied on top as a transform, so no part of this
 * layout depends on how wide the browser happened to make the block.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "stack"` and in
 * `remotion/captions/page-fit.ts`. All three must change together.
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
  const tier = stackTier(role, token.text);
  const align = stackRowAlign(tier, index);
  const timing = { frame, fps, fromFrame, toFrame };
  // Where this row rests, left/right of the page's centre line. A transform,
  // not a justification, so it is identical in both renderers and can never
  // affect wrapping — see `stackRowOffsetPx`.
  const tuckX = stackRowOffsetPx(tier, index, textStyle.fontSize as number);

  const fontSize = (textStyle.fontSize as number) * stackFontScale(tier);

  // Devanagari has no italic and no condensed display face here, so the
  // serif/sans split is carried by Noto Serif vs Noto Sans instead — the same
  // decision the export makes, so a Hindi word never draws in a different face
  // than it measured in.
  const fontFamily = isDevanagariWord
    ? tier === "support"
      ? FONT_FAMILY.devanagari
      : FONT_FAMILY.notoSerifDevanagari
    : tier === "hero" || tier === "primary"
      ? FONT_FAMILY[config.fontId]
      : tier === "accent"
        ? FONT_FAMILY[config.specialFontId ?? "playfair"]
        : FONT_FAMILY[config.secondaryFontId ?? "inter"];

  const fontWeight =
    tier === "hero" || tier === "primary"
      ? config.fontWeight
      : tier === "accent"
        ? 500
        : 600;

  const enter = tokenEnter(timing, ENTER_SMOOTH);

  let xOffset = 0;
  let yOffset = 0;
  let blurPx = 0;

  if (tier === "hero") {
    blurPx = (1 - enter) * 7;
  } else if (tier === "primary") {
    yOffset = (1 - enter) * 22;
    blurPx = (1 - enter) * 5;
  } else if (tier === "accent") {
    // Slides in from whichever edge it settles against, so the motion agrees
    // with the composition instead of cutting across it.
    xOffset = (1 - enter) * (align === "right" ? 26 : -26);
    blurPx = (1 - enter) * 4;
  } else {
    yOffset = (1 - enter) * 12;
  }

  return (
    <span
      style={{
        ...tokenShellStyle,
        // Owns its row — this is what produces the vertical stack.
        flexBasis: "100%",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle: tier === "accent" && !isDevanagariWord ? "italic" : "normal",
          color: isStackAccentColour(tier)
            ? (token.color ?? config.accentColor)
            : (token.color ?? config.baseColor),
          textTransform: stackTierIsUpper(tier) ? "uppercase" : "lowercase",
          opacity: enter,
          transform: `translate(${tuckX + xOffset}px, ${yOffset}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          // The two-part readability guarantee this template uses in place of
          // a conventional outline — see `PREMIUM_HALO` / `premiumStrokePx`.
          // Sized off this word's own tier, so the hairline stays a hairline
          // behind a 49px support word and behind a 116px headline alike.
          textShadow: haloTextShadow(fontSize),
          WebkitTextStroke: `${premiumStrokePx(fontSize, config)}px ${config.strokeColor}`,
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
