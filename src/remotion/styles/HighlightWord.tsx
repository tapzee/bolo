import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, maskRevealX, tokenEnter } from "../captions/animation";
import {
  displayText,
  highlightWordFontScale,
  isHighlightWordAccent,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Highlight Word — a solid marker slides in from the left underneath the
 * page's keyword(s); once it has mostly covered the word, the text itself
 * flips from white to dark for contrast against the solid marker, matching
 * the reference's black-on-yellow treatment.
 */
export const HighlightWordToken = memo(function HighlightWordToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isHighlightWordAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const markerDelay = Math.round(fps * 0.1);
  const marker = isAccent
    ? maskRevealX({ frame, fps, fromFrame: fromFrame + markerDelay }, ENTER_SMOOTH)
    : 0;

  const fontSize = (textStyle.fontSize as number) * highlightWordFontScale(role);
  const isCovered = marker > 0.6;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          position: "relative",
          zIndex: 1,
          color: isAccent && isCovered ? "#0a0a0b" : (token.color ?? config.baseColor),
          WebkitTextStroke: isAccent && !isCovered ? textStyle.WebkitTextStroke : "0px transparent",
        }}
      >
        {isAccent && marker > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: -fontSize * 0.12,
              top: "8%",
              bottom: "8%",
              width: `calc(100% + ${fontSize * 0.24}px)`,
              transform: `scaleX(${marker})`,
              transformOrigin: "left center",
              background: config.accentColor,
              borderRadius: fontSize * 0.08,
              zIndex: -1,
            }}
          />
        )}
        {displayText(token)}
      </span>
    </span>
  );
});
