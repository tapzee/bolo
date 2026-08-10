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
 * Rotate Reveal — Text slightly rotates and swings into place with spring easing.
 */
export const RotateRevealToken = memo(function RotateRevealToken({
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

  // Starts rotated at -20deg and scales up
  const rotation = (1 - pulse) * -20;
  const scale = 0.8 + (pulse * 0.2);

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        opacity: pulse, 
        transformOrigin: "bottom left",
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
