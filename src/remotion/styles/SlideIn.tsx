import { memo } from "react";
import type { WordRole } from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
  tokenHighlight,
} from "../captions/animation";
import {
  displayText,
  isSlideInAccent,
  roleCaseTransform,
  slideInDirection,
  slideInFontScale,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Slide In — directional entrance with motion blur and a coloured highlight
 * pill on the page's keyword(s). Non-critical words alternate their entry
 * edge by position so a page doesn't read as one word repeated; the critical
 * word always rises from below, distinguishing it as the punchline.
 */
export const SlideInToken = memo(function SlideInToken({
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
  const isAccent = isSlideInAccent(role);
  const enter = tokenEnter(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);

  const dir = slideInDirection(role, index);
  const travel = dir === "up" ? 60 : 90;
  const offset = (1 - enter) * travel;
  const tx = dir === "left" ? -offset : dir === "right" ? offset : 0;
  const ty = dir === "up" ? offset : 0;
  // Motion blur scales with how far the word still has to travel.
  const blurPx = Math.abs(1 - enter) * 8;

  const fontSize = (textStyle.fontSize as number) * slideInFontScale(role);

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translate(${tx}px, ${ty}px)`,
        filter: blurPx > 0.5 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      {isAccent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: `${-fontSize * 0.08}px ${-fontSize * 0.18}px`,
            background: config.accentColor,
            borderRadius: fontSize * 0.16,
            transform: `scaleX(${highlight})`,
            transformOrigin: dir === "right" ? "right center" : "left center",
            opacity: 0.95,
            zIndex: 0,
          }}
        />
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: isAccent ? "#ffffff" : (token.color ?? config.baseColor),
          fontWeight: isAccent ? 800 : textStyle.fontWeight,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
