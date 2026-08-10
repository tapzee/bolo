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
 * Draw On — Elegant script typography with a hand-drawn animated underline.
 */
export const DrawOnToken = memo(function DrawOnToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index,
  specialIndex,
}: TokenViewProps) {
  const isSpecial = index === specialIndex;
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);
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
        opacity: pulse, 
        position: "relative",
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        fontFamily: isSpecial && config.secondaryFontId ? config.secondaryFontId : textStyle.fontFamily
      }}>
        {displayText(token)}
        
        {/* Animated underline for the highlighted word */}
        {highlight > 0 && (
          <svg style={{
            position: "absolute",
            bottom: "-5px",
            left: 0,
            width: "100%",
            height: "10px",
            overflow: "visible"
          }} preserveAspectRatio="none">
            <path 
              d="M 0 5 Q 50 0 100 5" 
              stroke={config.accentColor} 
              strokeWidth="4" 
              fill="none" 
              strokeDasharray="100" 
              strokeDashoffset={100 - (highlight * 100)} 
            />
          </svg>
        )}
      </span>
    </span>
  );
});
