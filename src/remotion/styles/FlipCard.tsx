import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  flipCardFontScale,
  isFlipCardAccent,
  roleCaseTransform,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";

/**
 * Flip Card — the keyword sits on a white card, supporting words on a green
 * card, both flipping up via a real CSS 3D `rotateX` on entry. Canvas2D has
 * no 3D transforms, so the export approximates the flip with a vertical
 * `scale(1, cos(angle))` squash (the flat-projection equivalent of the same
 * rotation, minus perspective skew) — documented deviation, verified
 * against a rendered mid-flip frame.
 */
export const FlipCardToken = memo(function FlipCardToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isFlipCardAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);
  const fontSize = (textStyle.fontSize as number) * flipCardFontScale(role);
  const rotateX = (1 - enter) * -100;
  const textOpacity = Math.max(0, Math.min(1, (enter - 0.45) / 0.35));
  const cardColor = isAccent ? "#ffffff" : config.accentColor;
  const textColor = isAccent ? "#111111" : "#062b16";
  const supportFamily = FONT_FAMILY[config.secondaryFontId ?? "inter"];

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, perspective: 600 }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          left: -fontSize * 0.2,
          right: -fontSize * 0.2,
          top: -fontSize * 0.16,
          bottom: -fontSize * 0.16,
          borderRadius: fontSize * 0.1,
          background: cardColor,
          boxShadow: "0 10px 18px rgba(0,0,0,0.4)",
          transform: `rotateX(${rotateX}deg)`,
          transformOrigin: "center top",
          backfaceVisibility: "hidden",
        }}
      />
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: isAccent ? textStyle.fontFamily : supportFamily,
          fontSize,
          color: textColor,
          opacity: textOpacity,
          WebkitTextStroke: "0px transparent",
          textTransform: roleCaseTransform(role, config),
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
