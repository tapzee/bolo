import { memo } from "react";
import { interpolateColors } from "remotion";
import {
  BOX_PAD_X_RATIO,
  BOX_PAD_Y_RATIO,
  BOX_RADIUS_RATIO,
} from "@/core";
import {
  ENTER_SMOOTH,
  ENTER_SUBTLE,
  tokenHighlight,
  tokenPulse,
} from "../captions/animation";
import {
  displayText,
  tokenBackdropStyle,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Box — a rounded block springs in behind the spoken word.
 *
 * The block is an absolutely positioned sibling, not padding on the word. As
 * padding it would change the word's measured width every frame and reflow the
 * rest of the line, which is the single worst source of caption jitter.
 *
 * Its inset and radius derive from `fontSizePx` rather than `em`, because the
 * backdrop sits outside the element that carries the font size and would
 * otherwise resolve `em` against the wrong value.
 */
export const BoxToken = memo(function BoxToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const timing = { frame, fps, fromFrame, toFrame };
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  // Unclamped so the block overshoots slightly on the way in; floored at 0 so a
  // negative spring value can never flip it inside-out.
  const grow = Math.max(0, tokenPulse(timing, ENTER_SUBTLE));

  const padX = config.fontSizePx * BOX_PAD_X_RATIO;
  const padY = config.fontSizePx * BOX_PAD_Y_RATIO;

  // On this preset a per-word override recolours the *block*, not the text.
  // The text sits dark on a bright block, so applying the override there would
  // let a user pick a colour that renders their own word invisible.
  const blockColor = token.color ?? config.accentColor;

  const color = interpolateColors(
    highlight,
    [0, 1],
    [config.baseColor, config.activeColor],
  );

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...tokenBackdropStyle,
          top: -padY,
          bottom: -padY,
          left: -padX,
          right: -padX,
          background: blockColor,
          borderRadius: config.fontSizePx * BOX_RADIUS_RATIO,
          opacity: highlight,
          transform: `scale(${grow})`,
        }}
      />
      <span style={{ ...textStyle, ...tokenGlyphStyle, color }}>
        {displayText(token)}
      </span>
    </span>
  );
});
