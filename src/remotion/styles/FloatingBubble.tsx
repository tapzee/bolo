import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_BOUNCY, tokenEnter, tokenPulse } from "../captions/animation";
import {
  displayText,
  floatingBubbleFontScale,
  floatingBubbleOffset,
  floatingBubbleTint,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Floating Bubble — each word sits inside a soft glass pill, drifting on a
 * slow ambient sine (`floatingBubbleOffset`) and bounce-settling into place
 * on entry. Stays inside the normal per-token flex-wrap flow (the drift is
 * a pure transform) rather than true free 2D scatter, which would need a
 * page-level absolute-position layout system outside this template's scope
 * — same category of simplification as Editorial Kinetic's one-word-per-row
 * decision.
 */
export const FloatingBubbleToken = memo(function FloatingBubbleToken({
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
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_BOUNCY);
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const fontSize = (textStyle.fontSize as number) * floatingBubbleFontScale(role);
  const drift = floatingBubbleOffset(token.text, index, frame, fps);
  const settleScale = 0.7 + Math.min(1.1, pulse) * 0.3;
  const tint = floatingBubbleTint(token.text);
  const color = token.color ?? "#ffffff";

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translate(${drift.x}px, ${drift.y - (1 - enter) * 24}px) scale(${settleScale})`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          left: -fontSize * 0.42,
          right: -fontSize * 0.42,
          top: -fontSize * 0.28,
          bottom: -fontSize * 0.28,
          borderRadius: 999,
          background: `linear-gradient(135deg, ${tint}55, ${tint}22)`,
          border: `1px solid ${tint}88`,
          boxShadow: `0 6px 18px ${tint}33, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      />
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
        {displayText(token)}
      </span>
    </span>
  );
});
