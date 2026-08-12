import { memo } from "react";
import { interpolateColors } from "remotion";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter, tokenHighlight } from "../captions/animation";
import {
  displayText,
  isZoomFocusAccent,
  roleCaseTransform,
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
 * Zoom Focus — the page's one critical word gets corner brackets and an
 * accent-colour highlight sweep; supporting words stay small and largely
 * still. No scale/zoom transform — the "focus" read comes from colour and
 * the corner-bracket accessory, not from the word changing size.
 *
 * Opacity uses `tokenEnter` (rise once, hold) rather than the word's
 * `tokenPulse`/`tokenHighlight` envelope, which falls back off after the
 * word's speaking window ends — that faded already-spoken words out instead
 * of leaving them visible.
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
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * zoomFocusFontScale(role);
  const color = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);

  return (
    <span style={{ ...tokenShellStyle, opacity: enter }}>
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
            transform: `translate(-50%, -50%)`,
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
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
