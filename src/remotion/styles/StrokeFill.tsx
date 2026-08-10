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
 * Stroke Fill — Shows outlined typography then fills with solid color.
 */
export const StrokeFillToken = memo(function StrokeFillToken({
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

  const isHighlighted = highlight > 0.5;

  // The outline color vs the fill color
  const color = isHighlighted ? (token.color ?? config.activeColor) : "transparent";

  // Use the stroke color from config or baseColor if we want the outline to match baseColor
  const outlineColor = config.baseColor;

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `scale(${0.9 + pulse * 0.1})`,
        opacity: pulse, 
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        WebkitTextStroke: `${config.strokeWidthPx}px ${outlineColor}`,
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
