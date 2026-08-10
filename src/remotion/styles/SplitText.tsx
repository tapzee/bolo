import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  isSplitTextHero,
  roleCaseTransform,
  splitTextFontScale,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Split Text — the page's critical word renders as two clipped halves
 * (`clip-path: inset(0 0 50% 0)` on top, `inset(50% 0 0 0)` on bottom) that
 * start offset and slide apart-to-together as the word enters, with a thin
 * diagonal accent line marking the seam. Supporting words render plainly.
 * `clip-path` doesn't shrink the layout box, so both halves share exactly
 * the same footprint the plain-word branch would have used — page-fit's
 * flat `splitTextFontScale` estimate stays accurate either way.
 */
export const SplitTextToken = memo(function SplitTextToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isHero = isSplitTextHero(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * splitTextFontScale(role);
  const color = token.color ?? (isHero ? config.accentColor : config.baseColor);
  const text = displayText(token);

  if (!isHero) {
    return (
      <span
        style={{
          ...tokenShellStyle,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 10}px)`,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize,
            color,
            WebkitTextStroke: "0px transparent",
            textTransform: roleCaseTransform(role, config),
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  const splitOffset = (1 - enter) * fontSize * 0.5;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 2,
          background: color,
          opacity: enter * 0.7,
          transform: `translateY(-1px) rotate(-3deg) scaleX(${enter})`,
        }}
      />
      <span
        style={{
          ...textStyle,
          fontSize,
          color,
          position: "relative",
          clipPath: "inset(0 0 50% 0)",
          transform: `translateX(${-splitOffset}px)`,
        }}
      >
        {text}
      </span>
      <span
        style={{
          ...textStyle,
          fontSize,
          color,
          position: "absolute",
          left: 0,
          top: 0,
          clipPath: "inset(50% 0 0 0)",
          transform: `translateX(${splitOffset}px)`,
        }}
      >
        {text}
      </span>
    </span>
  );
});
