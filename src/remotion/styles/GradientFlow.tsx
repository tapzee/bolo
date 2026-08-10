import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  gradientFlowFontScale,
  isGradientFlowAccent,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Gradient Flow — premium animated blue→purple gradient fill on the page's
 * keyword(s), with a continuous slow drift (not a frame-modulo loop) and a
 * small directional cue beneath. Deliberately stroke-free: a black outline
 * fights a soft gradient fill rather than complementing it.
 */
export const GradientFlowToken = memo(function GradientFlowToken({
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
  const isAccent = isGradientFlowAccent(role);
  const enter = tokenEnter(timing, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * gradientFlowFontScale(role);
  const yOffset = (1 - enter) * 10;
  const flowPct = ((frame / fps) * 22) % 200;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `translateY(${yOffset}px)` }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: isAccent ? "transparent" : (token.color ?? config.baseColor),
          WebkitTextStroke: "0px transparent",
          backgroundImage: isAccent
            ? `linear-gradient(90deg, ${config.accentColor}, #9b5cff, ${config.accentColor})`
            : undefined,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: isAccent ? "text" : undefined,
          backgroundClip: isAccent ? "text" : undefined,
          backgroundPosition: `${flowPct}% center`,
        }}
      >
        {displayText(token)}
      </span>
      {isAccent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: -fontSize * 0.32,
            transform: `translateX(-50%) translateY(${(1 - enter) * 6}px)`,
            color: config.accentColor,
            fontSize: fontSize * 0.32,
            opacity: enter * 0.85,
          }}
        >
          {"›››"}
        </span>
      )}
    </span>
  );
});
