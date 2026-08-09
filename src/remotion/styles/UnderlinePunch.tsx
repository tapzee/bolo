import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  isUnderlinePunchAccent,
  underlinePunchFontScale,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, maskRevealX, tokenEnter } from "../captions/animation";

/**
 * Underline Punch — Template 03.
 *
 * A bold keyword gets a hairline-to-bar underline that draws itself left to
 * right, timed just after the word settles in. Everything else (connectors,
 * supporting words) is plain, quiet text — the underline is the only accent
 * in the whole design, which is what keeps it reading as "premium editorial
 * annotation" rather than a marker/highlighter effect.
 */
export const UnderlinePunchToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}) => {
  const role: WordRole = token.role ?? "normal";
  const timing = { frame, fps, fromFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  const isAccent = isUnderlinePunchAccent(role);

  const fontFamily = FONT_FAMILY[config.fontId];
  const color = token.color ?? "#ffffff";
  const fontSize = (textStyle.fontSize as number) * underlinePunchFontScale(role);

  const yOffset = (1 - enter) * 14;
  const opacity = enter;

  // Underline draws once the word itself has mostly settled, not concurrently
  // with it — a bar racing under text that is still moving reads as jittery.
  const underlineDelayFrames = Math.round(fps * 0.12);
  const underlineProgress = isAccent
    ? maskRevealX({ frame, fps, fromFrame: fromFrame + underlineDelayFrames }, ENTER_SMOOTH)
    : 0;

  return (
    <span style={{ ...tokenShellStyle, flexDirection: "column", alignItems: "center" }}>
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          color,
          fontWeight: isAccent ? 800 : 400,
          transform: `translateY(${yOffset}px)`,
          opacity,
          zIndex: 1,
          // Small supporting text stays clean — no stroke, bright white only.
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
        }}
      >
        {displayText(token)}
      </span>
      {isAccent && (
        <span
          aria-hidden
          style={{
            marginTop: fontSize * 0.08,
            height: Math.max(3, fontSize * 0.06),
            width: "100%",
            transformOrigin: "left center",
            transform: `scaleX(${underlineProgress})`,
            background: token.color ?? config.accentColor,
            opacity: enter,
            borderRadius: 2,
          }}
        />
      )}
    </span>
  );
};
