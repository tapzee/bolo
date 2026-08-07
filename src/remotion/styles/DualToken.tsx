import { memo } from "react";
import { interpolateColors } from "remotion";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenHighlight,
  tokenPulse,
  tokenEnter,
} from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  strokeStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Dual Layer — Gen-Z kinetic typography.
 *
 * Every token renders two visual tiers stacked vertically:
 *   1. ANNOTATION (top): same word in small, thin Poppins — slides in softly
 *   2. BIG WORD (bottom): large, bold, uppercase — springs in with pop/bounce
 *
 * This creates the viral "CapCut Big Text" echo effect where the word appears
 * huge below and whisper-thin above simultaneously. No sibling tokens needed.
 */
export const DualToken = memo(function DualToken({
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
  const pulse = tokenPulse(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const enter = tokenEnter(timing, ENTER_BOUNCY);

  const text = displayText(token);
  const isImpactWord = index === totalTokens - 1 && totalTokens > 1;
  const isSingleWord = totalTokens === 1;

  // Big word opacity & color
  const isSpoken = fromFrame <= frame;
  const alpha = isSpoken
    ? highlight > 0.01
      ? 1
      : Math.max(0.6, config.upcomingOpacity)
    : config.upcomingOpacity;

  const bigColor = interpolateColors(highlight, [0, 1], [
    token.color ?? config.baseColor,
    token.color ?? config.accentColor,
  ]);

  // Pop spring — stronger on the last/only word
  const shouldAnimate = isImpactWord || isSingleWord;
  const popScale = shouldAnimate
    ? 1 + pulse * 0.28 * config.emphasisScale
    : 1 + pulse * 0.08 * config.emphasisScale;
  const popRotate = shouldAnimate ? pulse * -1.5 : 0;
  const liftY = (1 - enter) * 10;

  const annotationSizeRatio = config.annotationSizeRatio > 0 ? config.annotationSizeRatio : 0.30;
  const annotationFontSize = config.fontSizePx * annotationSizeRatio;
  const annotationWeight = config.annotationWeight > 0 ? config.annotationWeight : 300;
  const annotationColor = config.annotationColor || "#ffffff";

  const annotationAlpha = isSpoken ? (highlight > 0.01 ? 0.85 : 0.5) : 0.35;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: alpha,
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      {/* Annotation — thin whisper text above the big word */}
      <span
        style={{
          display: "block",
          fontFamily: "var(--bolo-font-poppins)",
          fontSize: `${annotationFontSize}px`,
          fontWeight: annotationWeight,
          lineHeight: 1.1,
          letterSpacing: "0.04em",
          color: annotationColor,
          opacity: annotationAlpha,
          textTransform: "none",
          whiteSpace: "pre",
          WebkitTextStroke: `${Math.max(1, config.strokeWidthPx * 0.4)}px ${config.strokeColor}`,
          paintOrder: "stroke fill",
          transform: `translateY(${(1 - enter) * -6}px)`,
          transition: "opacity 0.12s ease-out",
          userSelect: "none",
          pointerEvents: "none",
          marginBottom: `${annotationFontSize * 0.15}px`,
        }}
      >
        {text}
      </span>

      {/* Big impact word */}
      <span
        style={{
          ...tokenGlyphStyle,
          ...textStyle,
          color: bigColor,
          transform: `translateY(${-liftY}px) scale(${popScale}) rotate(${popRotate}deg)`,
          display: "inline-block",
          textShadow:
            highlight > 0.01
              ? "0 6px 28px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.85)"
              : "0 3px 12px rgba(0,0,0,0.5)",
          transition: "color 0.06s ease-out",
        }}
      >
        {text}
      </span>
    </span>
  );
});
