import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, maskRevealX, tokenEnter } from "../captions/animation";
import {
  bounceWordFontScale,
  displayText,
  isBounceWordAccent,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Bounce Word — words land one-by-one with a lift, no scale. The page's
 * keyword(s) additionally get a rounded pill that grows in behind them.
 *
 * Opacity and the pill's growth are driven by `tokenEnter`/`maskRevealX`
 * (rise once, hold), not `tokenPulse` — `tokenPulse` shares `tokenHighlight`'s
 * fall-off after the word's speaking window ends, which faded already-spoken
 * words to near-invisible instead of leaving them readable.
 */
export const BounceWordToken = memo(function BounceWordToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isBounceWordAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const pillGrow = maskRevealX({ frame, fps, fromFrame }, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * bounceWordFontScale(role);
  const yOffset = (1 - enter) * 26;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translateY(${yOffset}px)`,
      }}
    >
      {isAccent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: `${-fontSize * 0.1}px ${-fontSize * 0.18}px`,
            background: config.accentColor,
            borderRadius: fontSize * 0.2,
            opacity: pillGrow * 0.95,
            zIndex: 0,
          }}
        />
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: token.color ?? "#ffffff",
          WebkitTextStroke: isAccent ? "0px transparent" : textStyle.WebkitTextStroke,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
