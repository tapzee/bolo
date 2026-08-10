import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  isLightSweepAccent,
  lightSweepFontScale,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Light Sweep — the keyword starts dim, a bright diagonal gradient band
 * sweeps across it once as it enters, then settles fully lit. Built with a
 * `background-clip: text` gradient whose stop positions track `enter` (a
 * one-shot spring), not a looping shimmer — the reference is a single
 * cinematic pass. Once past ~92% the gradient collapses to a flat bright
 * fill so the word doesn't keep a visible seam once fully lit.
 */
export const LightSweepToken = memo(function LightSweepToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isLightSweepAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * lightSweepFontScale(role);
  const dim = token.color ?? config.baseColor;
  const bright = token.color ?? config.accentColor;

  const bandCenter = -40 + enter * 180;
  const settled = enter > 0.92;

  return (
    <span style={{ ...tokenShellStyle, opacity: Math.max(0.35, enter) }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: isAccent && !settled ? "transparent" : bright,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          backgroundImage:
            isAccent && !settled
              ? `linear-gradient(100deg, ${dim} ${bandCenter - 30}%, ${bright} ${bandCenter}%, ${dim} ${bandCenter + 30}%)`
              : undefined,
          WebkitBackgroundClip: isAccent && !settled ? "text" : undefined,
          backgroundClip: isAccent && !settled ? "text" : undefined,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
