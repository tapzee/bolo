import { memo } from "react";
import { interpolate } from "remotion";
import {
  ENTER_BOUNCY,
  tokenEnter,
} from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Dynamic Typography Animation
 * 
 * Mixes heavy uppercase, cursive lowercase, and small heavy text based on position.
 * Features a pop-in scale/translate animation and heavy drop shadow.
 */
export const DynamicTypographyToken = memo(function DynamicTypographyToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
}: TokenViewProps) {
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_BOUNCY);
  
  const text = displayText(token);
  const isSpoken = fromFrame <= frame;

  // Determine role deterministically based on index and heroIndex
  let type: "heavy" | "cursive" | "small";
  if (index === heroIndex) {
    type = "cursive";
  } else if (index < heroIndex) {
    type = "small";
  } else {
    type = "heavy";
  }

  // Animation values: popIn
  // 0% -> scale(0.5) translateY(20px)
  // 60% -> scale(1.1) translateY(-5px)
  // 100% -> scale(1) translateY(0)
  
  let scale = 1;
  let translateY = 0;
  
  if (enter < 0.6) {
    scale = interpolate(enter, [0, 0.6], [0.5, 1.1]);
    translateY = interpolate(enter, [0, 0.6], [20, -5]);
  } else {
    scale = interpolate(enter, [0.6, 1], [1.1, 1]);
    translateY = interpolate(enter, [0.6, 1], [-5, 0]);
  }

  const baseFontSize = config.fontSizePx;
  let fontSize = baseFontSize;
  let fontFamily = textStyle.fontFamily;
  let fontWeight = config.fontWeight;
  let fontStyle = "normal";
  let textTransform: any = "none";
  let color = config.baseColor;
  let letterSpacing = 0;

  if (type === "heavy") {
    fontFamily = `"Montserrat", sans-serif`;
    fontWeight = 900;
    textTransform = "uppercase";
    color = token.color ?? config.accentColor;
  } else if (type === "cursive") {
    fontFamily = `"Playfair Display", serif`;
    fontWeight = 600;
    fontStyle = "italic";
    textTransform = "lowercase";
    fontSize = baseFontSize * 1.2;
    color = "#ffffff";
  } else if (type === "small") {
    fontFamily = `"Montserrat", sans-serif`;
    fontWeight = 700;
    textTransform = "lowercase";
    fontSize = baseFontSize * 0.55;
    letterSpacing = -2;
    color = "#ffffff";
  }

  // Heavy drop shadow
  const textShadow = "2px 4px 10px rgba(0, 0, 0, 0.8), 0px 0px 4px rgba(0,0,0,0.5)";

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: isSpoken ? 1 : Math.max(0, config.upcomingOpacity),
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          display: "inline-block",
          fontFamily,
          fontWeight,
          fontStyle,
          fontSize: `${fontSize}px`,
          textTransform,
          color,
          letterSpacing: `${letterSpacing}px`,
          textShadow,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          opacity: enter,
          paddingLeft: "0.15em",
          paddingRight: "0.15em",
        }}
      >
        {text}
      </span>
    </span>
  );
});
