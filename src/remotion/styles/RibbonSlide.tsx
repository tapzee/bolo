import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, splitEntrance, tokenEnter } from "../captions/animation";
import {
  displayText,
  isRibbonSlideAccent,
  ribbonClipPath,
  ribbonSlideFontScale,
  ribbonSlideSide,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type PaperCutPoint,
  type TokenViewProps,
} from "../captions/primitives";

const clipPathString = (points: readonly PaperCutPoint[]): string =>
  `polygon(${points.map((p) => `${(p.x * 100).toFixed(1)}% ${(p.y * 100).toFixed(1)}%`).join(", ")})`;

/**
 * Ribbon Slide — the page's accent word(s) sit on a pointed banner ribbon
 * that slides in from an alternating screen edge, the text following ~2
 * frames later for the layered feel the reference asks for. Supporting
 * words render plainly and keep the template's own readability stroke —
 * they have no ribbon behind them to supply contrast on their own.
 */
export const RibbonSlideToken = memo(function RibbonSlideToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
  index = 0,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isRibbonSlideAccent(role);
  const fontSize = (textStyle.fontSize as number) * ribbonSlideFontScale(role);

  if (!isAccent) {
    const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
    return (
      <span style={{ ...tokenShellStyle, opacity: enter }}>
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize,
            color: token.color ?? config.baseColor,
            textTransform: roleCaseTransform(role, config),
          }}
        >
          {displayText(token)}
        </span>
      </span>
    );
  }

  const side = ribbonSlideSide(index);
  const ribbonOffset = splitEntrance(side, 220, { frame, fps, fromFrame }, ENTER_SMOOTH);
  const textEnter = tokenEnter({ frame, fps, fromFrame: fromFrame + 2 }, ENTER_SMOOTH);
  const ribbonColor = index % 2 === 0 ? "#7c4dff" : config.accentColor;
  const clip = clipPathString(ribbonClipPath());

  return (
    <span style={{ ...tokenShellStyle, opacity: textEnter }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          left: -fontSize * 0.3,
          right: -fontSize * 0.3,
          top: -fontSize * 0.12,
          bottom: -fontSize * 0.12,
          background: ribbonColor,
          clipPath: clip,
          boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
          transform: `translateX(${ribbonOffset}px)`,
        }}
      />
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: "#ffffff",
          transform: `translateX(${ribbonOffset}px)`,
          WebkitTextStroke: "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
