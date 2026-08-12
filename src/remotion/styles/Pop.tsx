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
 * Pop — the spoken word tilts in with a real overshoot.
 *
 * Rotation rides the *unclamped* pulse so the bouncy spring keeps its
 * overshoot. Colour rides the clamped highlight instead — letting an
 * overshooting value drive `interpolateColors` would push it past the end of
 * the range and flash the wrong colour on the bounce.
 */
export const PopToken = memo(function PopToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const highlight = tokenHighlight(
    { frame, fps, fromFrame, toFrame },
    ENTER_SMOOTH,
  );

  // Override replaces both ends of the ramp so it is visible immediately —
  // see the note in BoldYellow.
  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.accentColor],
  );

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `rotate(${pulse * -1.2}deg)`,
      }}
    >
      <span style={{ ...textStyle, ...tokenGlyphStyle, color }}>
        {displayText(token)}
      </span>
    </span>
  );
});
