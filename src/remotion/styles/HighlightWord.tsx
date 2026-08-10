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
 * Highlight Word — Highlight slides underneath the active word.
 */
export const HighlightWordToken = memo(function HighlightWordToken({
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

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: pulse, 
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color,
        position: "relative",
        zIndex: 1,
      }}>
        {/* Background highlight that slides in */}
        {highlight > 0 && (
          <span style={{
            position: "absolute",
            left: 0,
            bottom: "5%",
            height: "40%",
            width: `${highlight * 100}%`,
            backgroundColor: config.accentColor,
            zIndex: -1,
            opacity: 0.7,
            borderRadius: "4px"
          }} />
        )}
        {displayText(token)}
      </span>
    </span>
  );
});
