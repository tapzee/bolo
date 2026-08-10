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
 * Glitch Effect — Quick RGB glitch bursts on the active word.
 */
export const GlitchToken = memo(function GlitchToken({
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

  // A simple glitch offset based on frame parity when highlighted
  const isHighlighted = highlight > 0.5;
  const glitchOffset = isHighlighted && frame % 3 === 0 ? 3 : 0;

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `scale(${0.9 + pulse * 0.1}) translateX(${glitchOffset}px)`,
        opacity: pulse, 
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        textShadow: isHighlighted ? `2px 0 ${config.accentColor}, -2px 0 #00ffff` : "none",
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
