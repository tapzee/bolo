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
 * 3D Depth — Extruded layered text creating a solid 3D depth effect.
 */
export const Depth3DToken = memo(function Depth3DToken({
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

  // Fake 3D using text-shadow extrusion when highlighted
  const isHighlighted = highlight > 0.5;
  const depth = isHighlighted ? 6 : 0;
  
  let shadowStr = "";
  for(let i=1; i<=depth; i++) {
    shadowStr += `${i}px ${i}px 0 ${config.accentColor}${i === depth ? '' : ', '}`;
  }

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `translateY(${isHighlighted ? -depth : 0}px) scale(${0.9 + pulse * 0.1})`,
        opacity: pulse, 
        transition: "transform 0.1s"
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        textShadow: shadowStr || "none"
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
