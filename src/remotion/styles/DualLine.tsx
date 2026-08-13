import { memo } from "react";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { hasDevanagari } from "@/core";

export const DualLineToken = memo(function DualLineToken({
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
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const splitIndex = Math.ceil(totalTokens / 2);
  const isTopLine = index < splitIndex;

  const text = displayText(token);
  const isDevanagariWord = hasDevanagari(text);

  // Top line: Primary font (Sans-serif, uppercase, yellow/accent)
  // Bottom line: Secondary font (Script/Calligraphy, titlecase, white/base)
  const isScript = !isTopLine && !isDevanagariWord;

  const family = isTopLine
    ? textStyle.fontFamily
    : isScript
      ? FONT_FAMILY[config.specialFontId ?? "rougeScript"]
      : textStyle.fontFamily;

  const color = isTopLine ? config.accentColor : config.baseColor;
  const transformCase = isTopLine ? "uppercase" : "none";
  const weight = isTopLine ? Math.max(800, config.fontWeight) : 700;
  
  // Slide up animation (down to up)
  const lift = (1 - enter) * 40;

  return (
    <>
      <span
        style={{
          ...tokenShellStyle,
          opacity: enter,
          transform: `translateY(${lift}px)`,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: family,
            fontSize: config.fontSizePx * (isTopLine ? 1 : 0.95),
            fontWeight: weight,
            color: color,
            textTransform: transformCase,
            fontStyle: isScript ? "italic" : "normal",
            WebkitTextStroke: isScript ? "0px transparent" : textStyle.WebkitTextStroke,
          }}
        >
          {text}
        </span>
      </span>
      {/* Force line break after the top line finishes */}
      {index === splitIndex - 1 && <span style={{ flexBasis: "100%", height: 0 }} />}
    </>
  );
});
