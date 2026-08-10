import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  getHash,
  isPaperCutAccent,
  paperCutFontScale,
  paperStripClipPath,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type PaperCutPoint,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";

const clipPathString = (points: readonly PaperCutPoint[]): string =>
  `polygon(${points.map((p) => `${(p.x * 100).toFixed(1)}% ${(p.y * 100).toFixed(1)}%`).join(", ")})`;

/**
 * Paper Cut — the keyword sits on a torn-edge yellow paper strip, supporting
 * words on a plain torn white strip, both with a slight settle rotation.
 * The torn edge (`paperStripClipPath`) is hashed from the word's own text so
 * the same word always tears the same way in the DOM preview and the
 * Canvas2D export.
 */
export const PaperCutToken = memo(function PaperCutToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isPaperCutAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * paperCutFontScale(role);
  const rotation = (1 - enter) * (isAccent ? -6 : 4);
  const yOffset = (1 - enter) * 20;
  const clip = clipPathString(paperStripClipPath(getHash(token.text.toLowerCase())));
  const supportFamily = FONT_FAMILY[config.secondaryFontId ?? "inter"];
  const paperColor = isAccent ? "#ffd60a" : "#f5f2e8";
  const ink = isAccent ? "#1a1206" : "#2a2a2a";

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translateY(${yOffset}px) rotate(${rotation}deg)`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          left: -fontSize * 0.22,
          right: -fontSize * 0.22,
          top: -fontSize * 0.16,
          bottom: -fontSize * 0.16,
          background: paperColor,
          clipPath: clip,
          boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
        }}
      />
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: isAccent ? textStyle.fontFamily : supportFamily,
          fontWeight: isAccent ? 900 : 500,
          fontSize,
          color: ink,
          WebkitTextStroke: "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
