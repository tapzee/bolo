import React from "react";
import { interpolateColors } from "remotion";
import type { TokenViewProps } from "../captions/primitives";
import {
  displayText,
  focusFontScale,
  focusFontWeight,
  focusTier,
  focusTierIsUpper,
  focusWordOpacity,
  focusWordMotion,
  focusActiveGlowShadow,
  isFocusAccent,
  isFocusScript,
  premiumStrokePx,
  tokenGlyphStyle,
  tokenShellStyle,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import { focusEnvelope } from "../captions/animation";

/**
 * Focus — the minimal premium caption.
 *
 * One centred block, precise hierarchy across four typographic tiers, up to three wrapped
 * rows. The whole page arrives once (the shared `pageEntrance` on the block),
 * then each spoken word enters with a silky "blur up-to-down" kinetic drop:
 * starting offset above with rich optical motion blur that instantly sharpens into pin-sharp
 * focus as speech hits, with dynamic scale pop (+5-8%), subtle buoyant float, and radiant
 * active bloom.
 *
 * Words already spoken settle back to `FOCUS_SPOKEN_OPACITY` in sharp resting clarity,
 * preserving full line readability and flawless text alignment.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "focus"`.
 */
export const FocusToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}) => {
  const role: WordRole = token.role ?? "normal";
  const tier = focusTier(role);
  const isDevanagariWord = hasDevanagari(token.text);
  const isScript = isFocusScript(role) && !isDevanagariWord;

  const { started, ended } = focusEnvelope({ frame, fps, fromFrame, toFrame });
  const fontSize = (textStyle.fontSize as number) * focusFontScale(tier);
  const opacity = focusWordOpacity(started, ended, config.upcomingOpacity);

  const isUpcoming = frame < fromFrame;
  const { yOffset, scale, blurPx, activeProgress } = focusWordMotion(
    started,
    ended,
    tier,
    fontSize,
    isUpcoming,
  );

  const isHero = tier === "hero";
  const isAccent = isFocusAccent(role);
  const baseColour = isAccent
    ? (token.color ?? config.accentColor)
    : (token.color ?? config.baseColor);
  const activeColour = isAccent
    ? (token.color ?? config.accentColor)
    : (token.color ?? config.activeColor ?? "#ffffff");

  const colour = activeProgress > 0.05
    ? interpolateColors(activeProgress, [0, 1], [baseColour, activeColour])
    : baseColour;

  const glowColor = isAccent ? config.accentColor : config.activeColor || config.baseColor;
  const shadow = focusActiveGlowShadow(fontSize, glowColor, activeProgress);

  return (
    <span
      style={{
        ...tokenShellStyle,
        flexBasis: isHero ? "100%" : undefined,
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: isScript
            ? FONT_FAMILY[config.specialFontId ?? "playfair"]
            : tier === "support" || tier === "body"
              ? FONT_FAMILY[config.secondaryFontId ?? "instrumentSans"]
              : FONT_FAMILY[config.fontId],
          fontSize,
          fontStyle: isScript ? "italic" : "normal",
          fontWeight: focusFontWeight(tier, config),
          color: colour,
          textTransform: focusTierIsUpper(tier) ? "uppercase" : "lowercase",
          opacity,
          transform: `translate3d(0, ${yOffset}px, 0) scale(${scale})`,
          transformOrigin: "center center",
          filter: blurPx > 0.2 ? `blur(${blurPx}px)` : undefined,
          textShadow: shadow,
          WebkitTextStroke: `${premiumStrokePx(fontSize, config)}px ${config.strokeColor}`,
          willChange: "transform, opacity, filter",
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
