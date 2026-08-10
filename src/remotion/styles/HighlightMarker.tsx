import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  isHighlightMarkerAccent,
  highlightMarkerFontScale,
  roleCaseTransform,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, maskRevealX, tokenEnter } from "../captions/animation";

/**
 * Highlight Marker — Template 07.
 *
 * A clean editorial caption with a moving highlight block behind the
 * keyword/critical word — a mask that reveals left→right just behind the
 * text's own entrance, not a sticker slapped on top. Ink stays a single flat
 * dark tone on the highlighted word rather than swapping colour mid-reveal,
 * which is what keeps this reading as a sophisticated annotation instead of
 * a highlighter-pen gimmick.
 */
export const HighlightMarkerToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}) => {
  const role: WordRole = token.role ?? "normal";
  const isKeyword = isHighlightMarkerAccent(role);
  const timing = { frame, fps, fromFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  // The block should feel like it's catching up to the word, not arriving
  // with it — a short delay keyed off the word's own entrance frame.
  const highlightDelayFrames = Math.round(fps * 0.1);
  const highlightProgress = isKeyword
    ? maskRevealX({ frame, fps, fromFrame: fromFrame + highlightDelayFrames }, ENTER_SMOOTH)
    : 0;

  const fontFamily = FONT_FAMILY[config.fontId];
  const fontSize = (textStyle.fontSize as number) * highlightMarkerFontScale(role);

  const paddingX = fontSize * 0.16;
  const paddingY = fontSize * 0.08;

  return (
    <span
      style={{
        ...tokenShellStyle,
        padding: isKeyword ? `${paddingY}px ${paddingX}px` : undefined,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      {isKeyword && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            transformOrigin: "left center",
            transform: `scaleX(${highlightProgress})`,
            background: token.color ?? config.accentColor,
            borderRadius: fontSize * 0.08,
          }}
        />
      )}
      <span
        style={{
          ...textStyle,
          position: "relative",
          zIndex: 1,
          fontFamily,
          fontSize,
          fontWeight: isKeyword ? 800 : 500,
          color: isKeyword ? "#111111" : (token.color ?? "#ffffff"),
          // Small supporting text stays clean — no stroke.
          WebkitTextStroke: "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
