import { memo } from "react";
import { interpolateColors } from "remotion";
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

/**
 * Bounce Word — Words appear one-by-one with energetic emphasis.
 */
export const BounceWordToken = memo(function BounceWordToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const highlight = tokenHighlight({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);

  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.activeColor],
  );

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `translateY(${(1 - pulse) * 30}px) scale(${0.8 + pulse * 0.2})`,
        opacity: pulse, 
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        backgroundColor: highlight > 0.5 ? config.accentColor : "transparent",
        padding: highlight > 0.5 ? "0 10px" : "0",
        borderRadius: "8px",
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
