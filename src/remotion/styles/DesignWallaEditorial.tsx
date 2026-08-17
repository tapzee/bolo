import { memo } from "react";
import { ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import { FONT_FAMILY } from "../fonts";
import {
  buildGlowShadow,
  designWallaEditorialFontScale,
  designWallaEditorialRow,
  designWallaEditorialTier,
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Design Walla Editorial — Signature 3-tier typographic interplay:
 * 1. Punch: Heavy condensed uppercase sans (Yellow/White Anton or Montserrat Black)
 * 2. Hero Serif: High-contrast flowing italic serif (Playfair Display Italic in White, ~1.45x size, -2deg tilt, overlapping vertically)
 * 3. Support: Clean compact geometric sans (Inter / Poppins, ~0.52x size)
 *
 * Words dynamically nest across 3 rows with negative leading for an authentic editorial poster feel.
 */
export const DesignWallaEditorialToken = memo(function DesignWallaEditorialToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
  specialIndex = -1,
  totalTokens = 1,
}: TokenViewProps) {
  const text = displayText(token);
  const tier = designWallaEditorialTier(index, heroIndex, specialIndex, totalTokens);
  const currentRow = designWallaEditorialRow(index, heroIndex, specialIndex, totalTokens);
  const prevRow = index > 0 ? designWallaEditorialRow(index - 1, heroIndex, specialIndex, totalTokens) : -1;
  const isRowStart = index === 0 || currentRow !== prevRow;

  const timing = { frame, fps, fromFrame, toFrame };

  if (tier === "punch") {
    const enter = tokenEnter(timing, ENTER_BOUNCY);
    const punchScale = designWallaEditorialFontScale("punch");
    const travelY = (1 - enter) * -18;
    const punchColor =
      token.color ??
      (config.styleId === "designWallaEditorialYellow"
        ? config.accentColor
        : config.accentColor || config.activeColor || "#ffe600");

    return (
      <span
        style={{
          ...tokenShellStyle,
          ...(isRowStart && totalTokens > 1 ? { flexBasis: "100%", justifyContent: "center" } : {}),
          zIndex: 1,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: FONT_FAMILY[config.fontId ?? "anton"],
            fontSize: config.fontSizePx * punchScale,
            fontWeight: Math.max(800, config.fontWeight),
            fontStyle: "normal",
            color: punchColor,
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
            opacity: enter,
            transform: `translateY(${travelY}px) scale(${0.92 + enter * 0.08})`,
            textShadow:
              buildGlowShadow(config, punchColor, 1) ||
              "0 4px 14px rgba(0,0,0,0.65)",
            filter: (1 - enter) > 0.1 ? `blur(${(1 - enter) * 3}px)` : undefined,
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  if (tier === "serif") {
    const enter = tokenEnter(timing, ENTER_SMOOTH);
    const serifScale = designWallaEditorialFontScale("serif");
    const travelY = (1 - enter) * 20;

    return (
      <span
        style={{
          ...tokenShellStyle,
          ...(isRowStart && totalTokens > 1 ? { flexBasis: "100%", justifyContent: "center" } : {}),
          // Vertical negative overlap so the serif ascenders tuck under the row above
          marginTop: currentRow > 0 ? "-0.18em" : undefined,
          zIndex: 3,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: FONT_FAMILY[config.specialFontId ?? "playfair"],
            fontSize: config.fontSizePx * serifScale,
            fontWeight: 700,
            fontStyle: "italic",
            color: token.color ?? "#ffffff",
            textTransform: "lowercase",
            letterSpacing: "0px",
            opacity: enter,
            transform: `translateY(${travelY}px) rotate(-2deg)`,
            textShadow:
              buildGlowShadow(config, "#ffffff", 1) ||
              "0 4px 20px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0,0,0,0.7)",
            WebkitTextStroke: "0px transparent",
            filter: (1 - enter) > 0.1 ? `blur(${(1 - enter) * 2.5}px)` : undefined,
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  // Tier 3: Support Connectors
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const supportRatio =
    config.annotationSizeRatio > 0
      ? config.annotationSizeRatio
      : designWallaEditorialFontScale("support");
  const travelX = (1 - enter) * (currentRow === 0 ? -16 : 16);
  const blurPx = (1 - enter) * 3;

  return (
    <span
      style={{
        ...tokenShellStyle,
        ...(isRowStart && totalTokens > 1 ? { flexBasis: "100%", justifyContent: "center" } : {}),
        zIndex: 1,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: config.secondaryFontId
            ? FONT_FAMILY[config.secondaryFontId]
            : FONT_FAMILY["inter"],
          fontSize: config.fontSizePx * supportRatio,
          fontWeight: config.annotationWeight > 0 ? config.annotationWeight : 600,
          fontStyle: "normal",
          color: config.annotationColor || config.baseColor || "#ffffff",
          textTransform:
            config.textCase === "upper" || config.uppercase
              ? "uppercase"
              : config.textCase === "lower"
                ? "lowercase"
                : "none",
          opacity: enter,
          transform: `translateX(${travelX}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          WebkitTextStroke: "0px transparent",
          textShadow: "0 2px 10px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </span>
    </span>
  );
});
