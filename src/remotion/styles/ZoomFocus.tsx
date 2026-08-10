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
 * Zoom Focus — Starts small, rapid zoom in, then zooms out with camera motion.
 */
export const ZoomFocusToken = memo(function ZoomFocusToken({
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

  // Zoom effect: starts small (0), rapidly goes to 1.3 on highlight, then settles to 1
  const scale = 0.5 + (pulse * 0.5) + (highlight > 0.5 ? 0.3 * config.emphasisScale : 0);

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `scale(${scale})`,
        opacity: pulse, 
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
