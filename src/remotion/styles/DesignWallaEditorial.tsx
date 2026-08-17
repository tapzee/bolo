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
 * 1. Punch: Heavy bold condensed uppercase sans (Yellow/White Anton or Montserrat 900)
 * 2. Hero Serif: High-contrast flowing italic serif with continuous floating animation (Playfair Display Italic in White, ~1.50x size, -2.5deg tilt, overlapping vertically)
 * 3. Support: Clean compact geometric sans (Inter / Poppins, ~0.50x size)
 *
 * Words dynamically arrange across exactly 3 rows with 2/3-letter words neatly side-aligned next to their focal word.
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
  pageSeed = 0,
  pageTexts,
}: TokenViewProps) {
  const text = displayText(token);
  const texts = pageTexts ?? [text];
  const tier = designWallaEditorialTier(index, heroIndex, specialIndex, totalTokens);
  const currentRow = designWallaEditorialRow(index, texts);
  const prevRow = index > 0 ? designWallaEditorialRow(index - 1, texts) : -1;
  const isRowStart = index === 0 || currentRow !== prevRow;
  const tokensOnCurrentRow = texts.filter((_, i) => designWallaEditorialRow(i, texts) === currentRow).length;
  const isSoloRow = tokensOnCurrentRow === 1;

  const timing = { frame, fps, fromFrame, toFrame };

  const rowDivider = isRowStart && currentRow > 0 ? (
    <span
      key={`break-${index}`}
      style={{
        flexBasis: "100%",
        width: "100%",
        height: 0,
        margin: 0,
        padding: 0,
        pointerEvents: "none",
      }}
    />
  ) : null;

  if (tier === "punch") {
    const enter = tokenEnter(timing, ENTER_BOUNCY);
    const punchScale = designWallaEditorialFontScale("punch");
    const direction = (pageSeed + index) % 2 === 0 ? "up" : "down";
    const travelY = direction === "up" ? (1 - enter) * 24 : (1 - enter) * -24;
    const scale = 0.88 + enter * 0.12;
    const blurPx = (1 - enter) * 4.5;
    const punchColor =
      token.color ??
      (config.styleId === "designWallaEditorialYellow"
        ? config.accentColor
        : config.accentColor || config.activeColor || "#ffe600");

    return (
      <>
        {rowDivider}
        <span
          style={{
            ...tokenShellStyle,
            ...(isSoloRow && totalTokens > 1
              ? { flexBasis: "100%", justifyContent: "center" }
              : { marginRight: "8px", alignSelf: "center" }),
            marginTop: currentRow > 0 ? "-0.16em" : undefined,
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
              transform: `translateY(${travelY}px) scale(${scale})`,
              textShadow:
                buildGlowShadow(config, punchColor, 1) ||
                "0 4px 14px rgba(0,0,0,0.65)",
              filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
            }}
          >
            {text}
          </span>
        </span>
      </>
    );
  }

  if (tier === "serif") {
    const enter = tokenEnter(timing, ENTER_SMOOTH);
    const serifScale = designWallaEditorialFontScale("serif");
    
    // Always-moving continuous floating breathing animation for italic serif
    const floatTime = frame / (fps || 30);
    const floatY = Math.sin(floatTime * 3.4) * 3.5;
    const floatRotate = -2.5 + Math.cos(floatTime * 2.6) * 0.8;
    const floatScale = 1 + Math.sin(floatTime * 2.0) * 0.015;

    const travelY = (1 - enter) * 24;
    const blurPx = (1 - enter) * 4;

    return (
      <>
        {rowDivider}
        <span
          style={{
            ...tokenShellStyle,
            ...(isSoloRow && totalTokens > 1
              ? { flexBasis: "100%", justifyContent: "center" }
              : { marginRight: "8px", alignSelf: "center" }),
            // Vertical negative overlap so the serif ascenders gracefully tuck under the row above
            marginTop: currentRow > 0 ? "-0.22em" : undefined,
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
              transform: `translateY(${travelY + floatY}px) rotate(${floatRotate}deg) scale(${floatScale})`,
              textShadow:
                buildGlowShadow(config, "#ffffff", 1) ||
                "0 4px 20px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0,0,0,0.7)",
              WebkitTextStroke: "0px transparent",
              filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
            }}
          >
            {text}
          </span>
        </span>
      </>
    );
  }

  // Tier 3: Support Connectors (2-3 letter words neatly aligned)
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const supportRatio =
    config.annotationSizeRatio > 0
      ? config.annotationSizeRatio
      : designWallaEditorialFontScale("support");
  const slideX = (1 - enter) * (currentRow === 0 ? -18 : 18);
  const blurPx = (1 - enter) * 3.5;
  const isBottomTrailing = currentRow === 2 && totalTokens >= 3;

  return (
    <>
      {rowDivider}
      <span
        style={{
          ...tokenShellStyle,
          ...(isSoloRow && totalTokens > 1
            ? {
                flexBasis: "100%",
                justifyContent: isBottomTrailing ? "flex-end" : "center",
                paddingRight: isBottomTrailing ? "16px" : undefined,
              }
            : {
                marginRight: "4px",
                alignSelf: "flex-start",
                paddingTop: "0.10em",
              }),
          marginTop: currentRow > 0 ? "-0.18em" : undefined,
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
            fontWeight: config.annotationWeight > 0 ? config.annotationWeight : 700,
            fontStyle: "normal",
            color: config.annotationColor || config.baseColor || "#ffffff",
            textTransform:
              config.textCase === "upper" || config.uppercase
                ? "uppercase"
                : config.textCase === "lower"
                  ? "lowercase"
                  : "none",
            opacity: enter,
            transform: `translateX(${slideX}px)`,
            filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
            WebkitTextStroke: "0px transparent",
            textShadow: "0 2px 10px rgba(0,0,0,0.6)",
          }}
        >
          {text}
        </span>
      </span>
    </>
  );
});
