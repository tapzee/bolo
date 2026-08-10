import { memo } from "react";
import { interpolateColors } from "remotion";
import {
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

/**
 * Blur Focus — Cinematic reveal from heavy blur into perfect sharpness.
 */
export const BlurFocusToken = memo(function BlurFocusToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);
  const highlight = tokenHighlight({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);

  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.activeColor],
  );

  // Blur starts at 20px and goes to 0px
  const blurAmount = (1 - pulse) * 20;

  return (
    <span
      style={{
        ...tokenShellStyle,
        filter: `blur(${blurAmount}px)`,
        opacity: pulse, 
        transform: `scale(${1 + highlight * 0.1 * config.emphasisScale})`,
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        textShadow: highlight > 0.5 ? `0 0 10px ${config.accentColor}` : "none",
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
