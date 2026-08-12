import { memo } from "react";
import type { WordRole } from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
} from "../captions/animation";
import {
  displayText,
  isPopScaleHero,
  popScaleFontScale,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Pop Scale — hierarchy-driven punch in.
 *
 * Supporting words fade up plainly. The page's one critical word (from
 * `analyzeWordRoles`, not a hard-coded index) punches in with a bounce
 * overshoot, a brief blur-out and a pair of accent tick marks flanking it —
 * the "keyword punches into frame" read from the reference, built from role
 * hierarchy so it works on any sentence, not just the demo one.
 */
export const PopScaleToken = memo(function PopScaleToken({
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
  const isHero = isPopScaleHero(role);

  const enter = tokenEnter(timing, isHero ? ENTER_BOUNCY : ENTER_SMOOTH);

  const color = token.color ?? (isHero ? config.accentColor : config.baseColor);
  const fontSize = (textStyle.fontSize as number) * popScaleFontScale(role);
  const yOffset = isHero ? 0 : (1 - enter) * 14;
  const blurPx = isHero ? (1 - Math.min(1, enter * 1.4)) * 6 : 0;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translateY(${yOffset}px)`,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      {isHero && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: -fontSize * 0.24,
            top: "50%",
            width: fontSize * 0.1,
            height: fontSize * 0.46,
            background: color,
            opacity: enter * 0.85,
            transform: "translateY(-50%)",
            borderRadius: 2,
          }}
        />
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color,
          WebkitTextStroke: isHero ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
      {isHero && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: -fontSize * 0.24,
            top: "50%",
            width: fontSize * 0.1,
            height: fontSize * 0.46,
            background: color,
            opacity: enter * 0.85,
            transform: "translateY(-50%)",
            borderRadius: 2,
          }}
        />
      )}
    </span>
  );
});
