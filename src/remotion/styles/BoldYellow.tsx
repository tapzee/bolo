import { memo } from "react";
import { interpolateColors } from "remotion";
import { ENTER_SUBTLE, tokenHighlight } from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Bold Yellow — white text, spoken word snaps to yellow.
 *
 * The workhorse preset. Movement is kept deliberately small (8px lift) so
 * the colour change carries the emphasis; anything larger competes with the
 * Pop preset and starts to feel cheap on talking-head footage.
 */
export const BoldYellowToken = memo(function BoldYellowToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const highlight = tokenHighlight(
    { frame, fps, fromFrame, toFrame },
    ENTER_SUBTLE,
  );

  // A per-word override replaces both ends of the ramp, not just the active
  // one. Applying it to the highlight alone means clicking a swatch changes
  // nothing until playback happens to reach that word, which reads as a broken
  // control. The word still animates its scale and lift, so it remains obvious
  // which one is being spoken.
  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.activeColor],
  );

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `translateY(${-highlight * 8 * config.emphasisScale}px)`,
      }}
    >
      <span style={{ ...textStyle, ...tokenGlyphStyle, color }}>
        {displayText(token)}
      </span>
    </span>
  );
});
