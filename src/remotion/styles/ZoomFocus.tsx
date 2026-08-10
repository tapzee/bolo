import { memo } from "react";
import { interpolateColors } from "remotion";
import type { WordRole } from "@/core";
import { centerPunchScale, ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter, tokenHighlight } from "../captions/animation";
import {
  displayText,
  isZoomFocusAccent,
  tokenGlyphStyle,
  tokenShellStyle,
  zoomFocusFontScale,
  type TokenViewProps,
} from "../captions/primitives";

const CORNER_PATHS = [
  "M6 20 L6 6 L20 6",
  "M80 6 L94 6 L94 20",
  "M6 80 L6 94 L20 94",
  "M94 80 L94 94 L80 94",
];

/**
 * Zoom Focus — camera-style punch-in on the page's one critical word, with
 * corner brackets that scale in step with it. Supporting words stay small
 * and largely still, so the zoom reads as a deliberate rack-focus rather
 * than every word lunging at the viewer.
 *
 * Opacity uses `tokenEnter` (rise once, hold) rather than the word's
 * `tokenPulse`/`tokenHighlight` envelope, which falls back off after the
 * word's speaking window ends — that faded already-spoken words out instead
 * of leaving them visible. Only the punch-in scale itself is allowed to
 * overshoot, via the unclamped, non-decaying `centerPunchScale`.
 */
export const ZoomFocusToken = memo(function ZoomFocusToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const timing = { frame, fps, fromFrame, toFrame };
  const isAccent = isZoomFocusAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const punch = centerPunchScale({ frame, fps, fromFrame }, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * zoomFocusFontScale(role);
  // Rapid zoom-in with a controlled overshoot (never past ~1.25x resting
  // size) rather than a runaway punch — the camera-style read comes from the
  // *speed* of the zoom (a bouncy spring), not from how far it overshoots.
  const scale = isAccent
    ? Math.min(1.25, 0.4 + punch * 0.85 * config.emphasisScale)
    : 0.7 + enter * 0.3;
  const color = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `scale(${scale})` }}>
      {isAccent && (
        <svg
          aria-hidden
          width={fontSize * 1.6}
          height={fontSize * 1.6}
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${enter})`,
            opacity: 0.8,
          }}
        >
          {CORNER_PATHS.map((d) => (
            <path key={d} d={d} stroke={config.accentColor} strokeWidth={4} fill="none" strokeLinecap="round" />
          ))}
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
