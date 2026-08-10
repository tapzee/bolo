import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, glitchBurst, tokenEnter } from "../captions/animation";
import {
  displayText,
  getHash,
  isGlitchAccent,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Glitch — 2-4 brief RGB-split/slice bursts on the page's keyword(s), not a
 * continuous glitch. `glitchBurst` is a deterministic, seeded schedule so
 * the burst frames are identical between the DOM preview and the Canvas2D
 * export, and so a word never glitches for its entire time on screen.
 */
export const GlitchToken = memo(function GlitchToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isGlitchAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const text = displayText(token);
  const seed = getHash(text);
  const burst = isAccent ? glitchBurst(frame, fps, fromFrame, seed) : 0;
  const sliceOffset = burst > 0 ? (seed % 5) - 2 : 0;

  const baseColor = token.color ?? config.baseColor;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `translateX(${sliceOffset}px)` }}>
      {burst > 0 && (
        <>
          <span
            aria-hidden
            style={{
              ...textStyle,
              ...tokenGlyphStyle,
              position: "absolute",
              inset: 0,
              color: "#00ffff",
              transform: "translateX(-3px)",
              opacity: 0.85,
              WebkitTextStroke: "0px transparent",
            }}
          >
            {text}
          </span>
          <span
            aria-hidden
            style={{
              ...textStyle,
              ...tokenGlyphStyle,
              position: "absolute",
              inset: 0,
              color: config.accentColor,
              transform: "translateX(3px)",
              opacity: 0.85,
              WebkitTextStroke: "0px transparent",
            }}
          >
            {text}
          </span>
        </>
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          color: baseColor,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
        }}
      >
        {text}
      </span>
    </span>
  );
});
