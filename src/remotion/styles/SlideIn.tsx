import { memo } from "react";
import { interpolateColors } from "remotion";
import {
  ENTER_BOUNCY,
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
 * Slide In — Words slide from different directions with a configurable highlight pill.
 */
export const SlideInToken = memo(function SlideInToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
}: TokenViewProps) {
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const highlight = tokenHighlight({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);

  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.activeColor],
  );

  // Direction depends on the index so it's pseudo-random but stable
  const directions = [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 }
  ];
  const dir = directions[index % directions.length] || directions[0];

  // Starts from dir and moves to 0 as pulse goes from 0 to 1
  const x = dir!.x * (1 - pulse);
  const y = dir!.y * (1 - pulse);

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `translate(${x}px, ${y}px)`,
        opacity: pulse, // Fades in as it slides
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        // Green Pill Background for highlight
        backgroundColor: highlight > 0.5 ? config.accentColor : "transparent",
        padding: highlight > 0.5 ? "0 10px" : "0",
        borderRadius: "8px",
        transition: "background-color 0.1s, padding 0.1s"
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
