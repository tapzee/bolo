import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  glassHighlightFontScale,
  isGlassHighlightAccent,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Glass Highlight — a premium glassmorphism panel (blurred translucent
 * background, soft border, subtle shadow) scales in behind the page's
 * keyword. Canvas2D has no `backdrop-filter` (there is nothing composited
 * behind a flat-drawn export frame to blur), so the export approximates the
 * glass read with a slightly more opaque fill plus a soft drawn border and
 * inner highlight — documented deviation, verified against a busy backdrop
 * frame that the panel still reads as "glass" without true blur-behind.
 */
export const GlassHighlightToken = memo(function GlassHighlightToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isGlassHighlightAccent(role);

  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * glassHighlightFontScale(role);
  const yOffset = (1 - enter) * 12;
  // Panel finishes its scale-in slightly ahead of the word's own fade, so the
  // glass reads as already-there by the time the keyword settles.
  const panelScale = isAccent ? Math.max(0, Math.min(1, (enter - 0.1) / 0.9)) : 0;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `translateY(${yOffset}px)` }}>
      {isAccent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            zIndex: 0,
            pointerEvents: "none",
            left: -fontSize * 0.22,
            right: -fontSize * 0.22,
            top: -fontSize * 0.14,
            bottom: -fontSize * 0.14,
            borderRadius: fontSize * 0.28,
            background: "rgba(255,255,255,0.14)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
            transform: `scaleX(${panelScale})`,
            transformOrigin: "center",
          }}
        />
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: token.color ?? (isAccent ? config.accentColor : config.baseColor),
          WebkitTextStroke: isAccent ? "0px transparent" : textStyle.WebkitTextStroke,
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
