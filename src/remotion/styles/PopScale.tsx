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
 * Pop Scale — hierarchy-driven punch in.
 *
 * The hero word gets enlarged, and the spoken word springs in with scale overshoot.
 */
export const PopScaleToken = memo(function PopScaleToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index,
  heroIndex,
}: TokenViewProps) {
  const isHero = index === heroIndex;
  
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const highlight = tokenHighlight(
    { frame, fps, fromFrame, toFrame },
    ENTER_SMOOTH,
  );

  const baseColor = isHero ? config.accentColor : config.baseColor;
  
  // Replace ramp with baseColor if not highlighting, or highlight if it is
  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? baseColor, token.color ?? config.activeColor],
  );

  // Hero text is larger, supporting text is smaller
  const scaleMult = isHero ? 1.0 : 0.7;

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `scale(${scaleMult + pulse * 0.4 * config.emphasisScale})`,
      }}
    >
      <span style={{ ...textStyle, ...tokenGlyphStyle, color, fontSize: `${(textStyle.fontSize as number) * scaleMult}px` }}>
        {displayText(token)}
      </span>
    </span>
  );
});
