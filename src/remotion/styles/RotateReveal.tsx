import { memo } from "react";
import { interpolateColors } from "remotion";
import type { WordRole } from "@/core";
import { ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter, tokenHighlight } from "../captions/animation";
import {
  displayText,
  isRotateRevealAccent,
  rotateRevealFontScale,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Rotate Reveal — text swings into place with spring easing, and the page's
 * keyword(s) get a small curved arrow flourish. Swing is a mild -8..+8deg,
 * not a full spin, so it stays premium rather than cartoonish.
 */
export const RotateRevealToken = memo(function RotateRevealToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const timing = { frame, fps, fromFrame, toFrame };
  const isAccent = isRotateRevealAccent(role);
  const enter = tokenEnter(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * rotateRevealFontScale(role);
  const swing = index % 2 === 0 ? -8 : 8;
  const rotation = (1 - enter) * swing;
  const scale = 0.9 + enter * 0.1;
  const color = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `rotate(${rotation}deg) scale(${scale})`,
      }}
    >
      {isAccent && (
        <svg
          aria-hidden
          width={fontSize * 0.6}
          height={fontSize * 0.6}
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            right: -fontSize * 0.42,
            top: -fontSize * 0.32,
            opacity: enter * 0.85,
          }}
        >
          <path d="M4 14 Q 10 2 20 6" stroke={config.accentColor} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path
            d="M15 4 L20 6 L17 10"
            stroke={config.accentColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
