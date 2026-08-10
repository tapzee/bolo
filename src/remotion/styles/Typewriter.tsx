import { memo } from "react";
import { interpolateColors } from "remotion";
import {
  ENTER_SMOOTH,
  tokenHighlight,
} from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Typewriter — Clean monospace caption revealing character-by-character.
 */
export const TypewriterToken = memo(function TypewriterToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const highlight = tokenHighlight({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);

  const color = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.activeColor],
  );

  const text = displayText(token);
  // Reveal characters based on highlight progress
  const visibleChars = Math.max(1, Math.floor(highlight * text.length));
  
  // Keep the width stable by rendering the whole text, but hiding the upcoming characters with opacity
  const visibleText = text.substring(0, visibleChars);
  const hiddenText = text.substring(visibleChars);

  return (
    <span
      style={{
        ...tokenShellStyle,
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
      }}>
        <span style={{ color }}>{visibleText}</span>
        <span style={{ color: "transparent" }}>{hiddenText}</span>
      </span>
    </span>
  );
});
