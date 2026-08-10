import { memo } from "react";
import { interpolateColors } from "remotion";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, maskRevealY, tokenHighlight } from "../captions/animation";
import {
  displayText,
  isWipeUpAccent,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  wipeUpFontScale,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Wipe Up — text reveals upward through a clip mask; the page's keyword(s)
 * additionally get a solid highlight block that expands in behind them, and
 * the text itself flips to dark once the block has caught up, for contrast
 * against the solid colour rather than white-on-yellow.
 */
export const WipeUpToken = memo(function WipeUpToken({
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
  const isAccent = isWipeUpAccent(role);
  const reveal = maskRevealY({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * wipeUpFontScale(role);
  const clipInset = (1 - reveal) * 100;
  const color = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);
  const blockScale = isAccent ? Math.max(0, Math.min(1, (reveal - 0.15) / 0.85)) : 0;

  return (
    <span
      style={{
        ...tokenShellStyle,
        clipPath: `inset(${clipInset}% 0 0 0)`,
      }}
    >
      {isAccent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: -fontSize * 0.14,
            right: -fontSize * 0.14,
            top: "8%",
            bottom: "8%",
            background: config.accentColor,
            transform: `scaleX(${blockScale})`,
            transformOrigin: "left center",
            borderRadius: fontSize * 0.1,
            zIndex: 0,
          }}
        />
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: isAccent && blockScale > 0.5 ? "#0a0a0b" : color,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
