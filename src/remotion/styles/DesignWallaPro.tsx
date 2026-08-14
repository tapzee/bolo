import { memo } from "react";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import { FONT_FAMILY } from "../fonts";
import {
  designWallaProRole,
  designWallaProBlueRole,
  designWallaProDirection,
  designWallaProHeroIsSerif,
  designWallaProFontScale,
  designWallaProBlueFontScale,
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

export const DesignWallaProToken = memo(function DesignWallaProToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
  pageSeed = 0,
  totalTokens = 1,
}: TokenViewProps) {
  const text = displayText(token);
  const isBlueOrGreen = config.styleId === "designWallaProBlue" || config.styleId === "designWallaProGreen";
  const role = isBlueOrGreen ? designWallaProBlueRole(index, heroIndex, pageSeed) : designWallaProRole(index, heroIndex);
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const isMiddle = role === "middle";

  const scale = isBlueOrGreen ? designWallaProBlueFontScale(role) : designWallaProFontScale(role);
  let fitScale = 1;
  if (isBlueOrGreen && !isMiddle) {
    const rowTokensCount = role === "top" ? heroIndex : (totalTokens ?? 1) - heroIndex - 1;
    if (rowTokensCount > 4) {
      fitScale = 4 / rowTokensCount;
    }
  }
  const finalScale = scale * fitScale;

  // Animation logic:
  // Middle pops from center (or small lift)
  // Top / Bottom slide in from sides based on direction
  const direction = designWallaProDirection(pageSeed);
  const isSerif = config.styleId === "designWallaProGreen" ? false : designWallaProHeroIsSerif(pageSeed);

  let transformStr = "";
  if (isMiddle) {
    if (isBlueOrGreen) {
      const travel = (1 - enter) * 60; // down to up animation
      transformStr = `translateY(${travel}px)`;
    } else {
      const travel = (1 - enter) * 20;
      transformStr = `translateY(${travel}px) scale(${0.9 + enter * 0.1})`;
    }
  } else {
    // Bi-directional slide
    const isTop = role === "top";
    // If direction is left, top slides from left (-X), bottom slides from right (+X)
    // If direction is right, top slides from right (+X), bottom slides from left (-X)
    const baseOffset = direction === "left" ? -60 : 60;
    const finalOffset = isTop ? baseOffset : -baseOffset;
    const travel = (1 - enter) * finalOffset;
    transformStr = `translateX(${travel}px)`;
  }

  const blurPx = (1 - enter) * 4;

  if (isMiddle) {
    return (
      <span
        style={{
          ...tokenShellStyle,
          flexBasis: "100%", // Owns its row for exactly 3 lines
          justifyContent: "center",
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: isSerif ? FONT_FAMILY["instrumentSerif"] : textStyle.fontFamily,
            fontSize: config.fontSizePx * finalScale * (isSerif ? 1.2 : 1),
            fontWeight: Math.max(800, config.fontWeight), // Both are bold now
            fontStyle: isSerif ? "italic" : "normal",
            color: isSerif ? "#ffffff" : (token.color ?? config.accentColor),
            textShadow: (isBlueOrGreen && isMiddle)
              ? (isSerif ? "0 0 12px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)" : `0 0 12px ${token.color ?? config.accentColor}90, 0 0 20px ${token.color ?? config.accentColor}40`)
              : (isSerif ? "0 0 10px rgba(255, 255, 255, 0.3)" : `0 0 10px ${token.color ?? config.accentColor}80`),
            textTransform: isSerif ? "lowercase" : "uppercase",
            opacity: enter,
            transform: transformStr,
            filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  // Top or Bottom
  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: transformStr,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: config.secondaryFontId
            ? FONT_FAMILY[config.secondaryFontId]
            : textStyle.fontFamily,
          fontSize: config.fontSizePx * finalScale,
          fontWeight: config.annotationWeight > 0 ? config.annotationWeight : 500,
          color: config.annotationColor || config.baseColor,
          textTransform:
            config.textCase === "upper" || config.uppercase
              ? "uppercase"
              : config.textCase === "lower"
                ? "lowercase"
                : "none",
          WebkitTextStroke: "none",
          textShadow: "none",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </span>
  );
});
