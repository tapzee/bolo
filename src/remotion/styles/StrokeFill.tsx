import { memo } from "react";
import type { WordRole } from "@/core";
import { withOpacity } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  isStrokeFillAccent,
  strokeFillFontScale,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Stroke Fill — outlined typography that fills solid.
 *
 * Non-keyword words stay permanently outline-only (transparent interior,
 * solid stroke) — that's the "DREAM" half of the reference. The page's
 * keyword(s) additionally animate their fill in over the outline once
 * their entrance has mostly settled, so the fill reads as a deliberate
 * second beat rather than every word filling at once.
 */
export const StrokeFillToken = memo(function StrokeFillToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isStrokeFillAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fillIn = isAccent ? Math.max(0, Math.min(1, (enter - 0.35) / 0.65)) : 0;

  const fontSize = (textStyle.fontSize as number) * strokeFillFontScale(role);
  const fillColor = token.color ?? config.activeColor;
  const outlineColor = token.color ?? config.baseColor;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: isAccent ? withOpacity(fillColor, fillIn) : "transparent",
          WebkitTextStroke: `${config.strokeWidthPx}px ${outlineColor}`,
          paintOrder: "stroke fill",
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
