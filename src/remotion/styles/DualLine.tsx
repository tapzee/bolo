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

  // Top line: Primary font (Sans-serif / Impact, uppercase, red/accent with subtle soft glow, zero outline)
  // Bottom line: Secondary cursive font (Script/Calligraphy, natural case, white/base, zero glow, zero outline, overlapping top line)
  const isScript = !isTopLine && !isDevanagariWord;

  const family = isTopLine
    ? textStyle.fontFamily
    : isScript
      ? FONT_FAMILY[config.specialFontId ?? config.secondaryFontId ?? "kaushanScript"]
      : textStyle.fontFamily;

  const color = isTopLine
    ? (token.color ?? config.accentColor ?? "#FF2A2A")
    : (token.color ?? config.baseColor ?? "#FFFFFF");
  const transformCase = isTopLine ? "uppercase" : "none";
  const weight = isTopLine ? Math.max(800, config.fontWeight) : 700;

  // Clean, organized vertical animation:
  // Top row enters smoothly from up to down (e.g. translateY((1 - enter) * -28px))
  // Bottom row enters smoothly from down to up (e.g. translateY((1 - enter) * 28px))
  const travel = isTopLine ? (1 - enter) * -28 : (1 - enter) * 28;

  // Primary font gets a very subtle, soft glow around the text
  // Secondary font gets NO glow and NO outline
  const glowColor = config.glowColor ?? config.accentColor ?? "#FF2A2A";
  const textGlow = isTopLine
    ? `0 0 ${config.fontSizePx * 0.14}px ${glowColor}cc, 0 0 ${config.fontSizePx * 0.28}px ${glowColor}55, 0 2px 6px rgba(0,0,0,0.5)`
    : "0 2px 6px rgba(0,0,0,0.6)";

  return (
    <>
      <span
        style={{
          ...tokenShellStyle,
          opacity: enter,
          transform: `translateY(${travel}px)`,
          zIndex: isTopLine ? 1 : 2,
          marginTop: isTopLine ? 0 : `${-0.34 * config.fontSizePx}px`,
          position: "relative",
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: family,
            fontSize: `${config.fontSizePx * (isTopLine ? 1 : 1.25)}px`,
            fontWeight: weight,
            color: color,
            textTransform: transformCase,
            fontStyle: isScript ? "italic" : "normal",
            textShadow: textGlow,
            WebkitTextStroke: "none",
            paintOrder: "normal",
          }}
        >
          {text}
        </span>
      </span>
      {/* Force line break after the top line finishes */}
      {index === splitIndex - 1 && (
        <span style={{ flexBasis: "100%", width: "100%", height: 0 }} />
      )}
    </>
  );
});

