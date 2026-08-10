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
 * Wipe Up — Text reveals upward through a mask with a highlight block.
 */
export const WipeUpToken = memo(function WipeUpToken({
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

  // Reveals by clipping from bottom to top
  const clipPercentage = (1 - pulse) * 100;

  return (
    <span
      style={{
        ...tokenShellStyle,
        clipPath: `inset(${clipPercentage}% 0 0 0)`, // Wipe up
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        // The block highlight behind
        backgroundColor: highlight > 0.5 ? config.accentColor : "transparent",
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
