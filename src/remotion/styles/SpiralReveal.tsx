import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  getHash,
  isSpiralRevealHero,
  roleCaseTransform,
  spiralRevealFontScale,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Spiral Reveal — the page's one hero (critical/keyword) word curves along
 * an arc via native SVG `<textPath>`; supporting words stay small and
 * centred, matching the reference's "keyword curves, context stays inside"
 * composition. Canvas2D has no `textPath` (see `spiralCharAngleDeg` in
 * primitives.ts), so the export manually places each character around the
 * same arc — documented deviation, kerning is not pixel-identical.
 */
export const SpiralRevealToken = memo(function SpiralRevealToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isHero = isSpiralRevealHero(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * spiralRevealFontScale(role);
  const color = token.color ?? (isHero ? config.accentColor : config.baseColor);
  const text = displayText(token);

  if (!isHero) {
    return (
      <span style={{ ...tokenShellStyle, opacity: enter }}>
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize,
            color,
            WebkitTextStroke: "0px transparent",
            textTransform: roleCaseTransform(role, config),
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  const rotateDeg = (1 - enter) * 40;
  const pathId = `spiral-${getHash(token.text.toLowerCase())}-${fromFrame}`;
  const radius = fontSize * 1.9;
  const size = radius * 2.4;

  return (
    <span
      style={{
        ...tokenShellStyle,
        width: size,
        height: size,
        opacity: enter,
        transform: `rotate(${rotateDeg}deg) scale(${0.9 + enter * 0.1})`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <path
            id={pathId}
            d={`M ${size / 2 - radius},${size / 2} A ${radius},${radius} 0 1 1 ${size / 2 + radius},${size / 2}`}
            fill="none"
          />
        </defs>
        <text
          fill={color}
          fontSize={fontSize}
          fontFamily={textStyle.fontFamily as string}
          fontWeight={textStyle.fontWeight as number}
          letterSpacing={fontSize * 0.05}
          textAnchor="middle"
        >
          <textPath href={`#${pathId}`} startOffset="50%">
            {text}
          </textPath>
        </text>
      </svg>
    </span>
  );
});
