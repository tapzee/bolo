import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  isLiquidFlowAccent,
  liquidFlowFontScale,
  liquidRibbonControlPoints,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Liquid Flow — a curved, drifting ribbon (SVG bezier through
 * `liquidRibbonControlPoints`) flows behind the page's keyword while the
 * word itself rises out of a soft blur. Premium motion-graphics curve, not a
 * splash — the ribbon never obscures the glyphs (drawn at reduced opacity,
 * behind the text via z-index).
 */
export const LiquidFlowToken = memo(function LiquidFlowToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isLiquidFlowAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * liquidFlowFontScale(role);
  const yOffset = (1 - enter) * 14;
  const blurPx = (1 - enter) * 5;
  const color = token.color ?? (isAccent ? config.accentColor : config.baseColor);

  const ribbonW = fontSize * 3.2;
  const ribbonH = fontSize * 0.9;
  // Continuous drift, not a frame-modulo loop — `fromFrame` offsets the
  // phase so neighbouring words on the same page don't flow in lockstep.
  const phase = frame / fps / 4 + (fromFrame % 17) / 17;
  const { start, cp1, cp2, end } = liquidRibbonControlPoints(ribbonW, ribbonH, phase);

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translateY(${yOffset}px)`,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      {isAccent && (
        <svg
          aria-hidden
          width={ribbonW}
          height={ribbonH}
          viewBox={`0 0 ${ribbonW} ${ribbonH}`}
          style={{
            position: "absolute",
            left: -(ribbonW - fontSize) / 2,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 0,
            opacity: 0.55 * enter,
          }}
        >
          <path
            d={`M ${start[0]},${start[1]} C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${end[0]},${end[1]}`}
            stroke={config.accentColor}
            strokeWidth={ribbonH * 0.22}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
