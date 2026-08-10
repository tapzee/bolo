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
 * Gradient Flow — Premium animated gradient applied to important text.
 */
export const GradientFlowToken = memo(function GradientFlowToken({
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

  // Instead of a flat color, if it's highlighted we use a gradient
  const isHighlighted = highlight > 0.5;

  const color = isHighlighted ? "transparent" : (token.color ?? config.baseColor);

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `scale(${0.9 + pulse * 0.1})`,
        opacity: pulse, 
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        backgroundImage: isHighlighted ? `linear-gradient(90deg, ${config.accentColor}, #ff007f, ${config.accentColor})` : "none",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: isHighlighted ? "text" : "border-box",
        backgroundPosition: isHighlighted ? `${(frame % 30) * 3}% center` : "0% center", // Animate gradient
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
