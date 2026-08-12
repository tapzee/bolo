import { memo } from "react";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
} from "../captions/animation";
import {
  displayText,
  dynamicSlideStackDirection,
  getSplashWordRole,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Design Walla — A 4-directional slide-in engine that supports 3 font roles:
 * - normal (config.fontId)
 * - accent (config.secondaryFontId)
 * - script (config.specialFontId)
 */
export const DesignWallaToken = memo(function DesignWallaToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  totalTokens = 1,
}: TokenViewProps) {
  const text = displayText(token);
  const role = getSplashWordRole(text, index, totalTokens);
  const isAccent = role === "accent";
  const isScript = role === "script";

  const direction = dynamicSlideStackDirection(text, index);
  const enter = tokenEnter({ frame, fps, fromFrame }, isAccent ? ENTER_BOUNCY : ENTER_SMOOTH);

  let roleFontFamily = textStyle.fontFamily;
  let roleFontSize = config.fontSizePx;
  let roleColor = token.color ?? config.baseColor;
  let roleTransform = config.textCase === "upper" || config.uppercase ? "uppercase" : config.textCase === "lower" ? "lowercase" : "none";
  let roleFontStyle = "normal";
  let roleWeight = config.fontWeight;

  if (isAccent) {
    if (config.secondaryFontId) {
      roleFontFamily = `var(--bolo-font-${config.secondaryFontId})`;
    }
    roleColor = token.color ?? config.accentColor;
    roleFontSize = config.fontSizePx * 1.15; // 15% oversized for punchy emphasis
    roleWeight = Math.max(800, config.fontWeight);
    roleTransform = "uppercase"; // always uppercase for accent
  } else if (isScript) {
    const specialFont = config.specialFontId ?? "playfair";
    if (!roleFontFamily?.toString().includes(specialFont) && !roleFontFamily?.toString().includes("caveat")) {
      roleFontFamily = `var(--bolo-font-${specialFont})`;
    }
    roleFontSize = config.fontSizePx * 1.05; // slightly oversized for script readability
    roleFontStyle = "italic";
    roleTransform = "none"; // Preserve natural script flow
  } else {
    // Normal / Base
    if (config.textCase === "upper" || config.uppercase) roleTransform = "uppercase";
    else if (config.textCase === "lower") roleTransform = "lowercase";
  }

  const travel = (1 - enter) * (isAccent ? 60 : 40);
  const xOffset = direction === "left" ? -travel : direction === "right" ? travel : 0;
  const yOffset = direction === "up" ? -travel : direction === "down" ? travel : 0;
  const blurPx = (1 - enter) * (isAccent ? 5 : 3);

  return (
    <span
      style={{
        ...tokenShellStyle,
        flexBasis: "100%", // Force one word per row, just like dynamicSlideStack
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: roleFontFamily,
          fontSize: roleFontSize,
          color: roleColor,
          fontWeight: roleWeight,
          fontStyle: roleFontStyle,
          opacity: enter,
          transform: `translate(${xOffset}px, ${yOffset}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleTransform as React.CSSProperties["textTransform"],
        }}
      >
        {text}
      </span>
    </span>
  );
});
