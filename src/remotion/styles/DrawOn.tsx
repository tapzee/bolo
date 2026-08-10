import { memo } from "react";
import { interpolateColors } from "remotion";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, maskRevealX, tokenEnter, tokenHighlight } from "../captions/animation";
import {
  displayText,
  drawOnFontScale,
  isDrawOnScript,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";

/**
 * Draw On — elegant supporting typography with a script hero word and a
 * hand-drawn animated underline beneath it.
 *
 * The script swap resolves `secondaryFontId` through `FONT_FAMILY`, not the
 * raw font id string — assigning a bare id like `"playfair"` straight to
 * `fontFamily` is not a valid CSS family name, so the previous version's
 * swap silently never took effect.
 */
export const DrawOnToken = memo(function DrawOnToken({
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
  const isScript = isDrawOnScript(role);
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const underline = isScript
    ? maskRevealX({ frame, fps, fromFrame: fromFrame + Math.round(fps * 0.15) }, ENTER_SMOOTH)
    : 0;

  const fontSize = (textStyle.fontSize as number) * drawOnFontScale(role);
  const secondaryFamily = config.secondaryFontId
    ? FONT_FAMILY[config.secondaryFontId]
    : (textStyle.fontFamily as string);
  const color = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `translateY(${(1 - enter) * 10}px)` }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          fontFamily: isScript ? textStyle.fontFamily : secondaryFamily,
          color: isScript ? (token.color ?? config.accentColor) : color,
          WebkitTextStroke: isScript ? textStyle.WebkitTextStroke : "0px transparent",
        }}
      >
        {displayText(token)}
        {isScript && underline > 0 && (
          <svg
            aria-hidden
            width="100%"
            height={Math.max(10, fontSize * 0.14)}
            viewBox="0 0 100 16"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, bottom: -fontSize * 0.1, overflow: "visible" }}
          >
            <path
              d="M 1 9 C 20 3, 45 13, 65 6 S 90 4, 99 9"
              stroke={config.accentColor}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={140}
              strokeDashoffset={140 - underline * 140}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </span>
    </span>
  );
});
