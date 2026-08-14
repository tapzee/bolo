import { memo } from "react";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
  displayText
} from "../captions/primitives";

export const GrandCaptionToken = memo(function GrandCaptionToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
}: TokenViewProps) {
  const text = displayText(token);
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  // Alternating up/down direction
  const isUp = index % 2 === 0;
  const travel = (1 - enter) * (isUp ? 40 : -40); // 40px up or down
  
  // Combine translation with scale from DesignWallaPro's middle role
  const transformStr = `translateY(${travel}px) scale(${0.9 + enter * 0.1})`;
  const blurPx = (1 - enter) * 4;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: transformStr,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
        }}
      >
        {text}
      </span>
    </span>
  );
});
