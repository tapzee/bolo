import { memo } from "react";
import type { WordRole } from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
  tokenPulse,
} from "../captions/animation";
import {
  displayText,
  dynamicSlideStackDirection,
  dynamicSlideStackFontScale,
  isDynamicSlideStackHero,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Dynamic Slide Stack — one word per row (not evenly spaced subtitle lines),
 * each sliding in from a hashed direction (left/right/up/down) with a brief
 * directional motion blur, and the page's one critical word dominating with
 * a bounce overshoot. Mirrored in `draw-captions.ts` and `page-fit.ts`.
 */
export const DynamicSlideStackToken = memo(function DynamicSlideStackToken({
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
  const isHero = isDynamicSlideStackHero(role);
  const direction = dynamicSlideStackDirection(token.text, index);

  const enter = tokenEnter({ frame, fps, fromFrame }, isHero ? ENTER_BOUNCY : ENTER_SMOOTH);
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);

  const fontSize = (textStyle.fontSize as number) * dynamicSlideStackFontScale(role);
  const travel = (1 - enter) * (isHero ? 60 : 40);
  const xOffset = direction === "left" ? -travel : direction === "right" ? travel : 0;
  const yOffset = direction === "up" ? -travel : direction === "down" ? travel : 0;
  const heroScale = isHero ? Math.min(1.08, 0.85 + pulse * 0.23) : 1;
  const blurPx = (1 - enter) * (isHero ? 5 : 3);
  const color = token.color ?? (isHero ? config.accentColor : config.baseColor);

  return (
    <span
      style={{
        ...tokenShellStyle,
        flexBasis: "100%",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color,
          opacity: enter,
          transform: `translate(${xOffset}px, ${yOffset}px) scale(${heroScale})`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          WebkitTextStroke: isHero ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
