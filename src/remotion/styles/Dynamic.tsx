import { memo } from "react";
import { interpolateColors } from "remotion";
import type { FontId } from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenHighlight,
  tokenPulse,
} from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";

/**
 * Dynamic Mix — cycles through fonts and animation parameters deterministically
 * based on the word's index, producing a chaotic, high-energy layout.
 */
export const DynamicToken = memo(function DynamicToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index,
}: TokenViewProps) {
  // 1. Deterministic Font Selection
  // If base font is Anton, we mix robotic/blocky fonts. Otherwise, stylish/script fonts.
  const isRobot = config.fontId === "anton";
  const mixFonts: FontId[] = isRobot 
    ? ["anton", "bebas", "montserrat", "poppins"]
    : ["playfair", "caveat", "montserrat", "poppins"];
  
  // Fallback to 0 if index is undefined (though it should always be provided)
  const i = index ?? 0;
  const chosenFontId = mixFonts[i % mixFonts.length]!;
  const fontFamily = FONT_FAMILY[chosenFontId];

  // 2. Deterministic Animation Parameters
  const pulseBouncy = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const pulseSmooth = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);
  const highlight = tokenHighlight({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);

  const animType = i % 3;
  let rotate = 0;

  if (animType === 0) {
    rotate = pulseBouncy * -2.5;
  } else if (animType === 1) {
    rotate = pulseSmooth * 3.5;
  } else {
    rotate = pulseBouncy * -1.5;
  }

  // 3. Color Variation
  // Alternate between activeColor and accentColor for the highlight to add more chaos.
  const activeColor = config.activeColor ?? "#ffffff";
  const accentColor = config.accentColor ?? activeColor;
  const targetColor = (i % 2 === 0) ? activeColor : accentColor;
  const baseColor = config.baseColor ?? "#ffffff";
  
  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? baseColor, token.color ?? targetColor],
  );

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <span style={{ ...textStyle, ...tokenGlyphStyle, fontFamily, color }}>
        {displayText(token)}
      </span>
    </span>
  );
});
