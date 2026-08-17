import { memo } from "react";
import { hasDevanagari } from "@/core";
import { FONT_FAMILY } from "../fonts";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
  displayText,
} from "../captions/primitives";

export const BigGrandToken = memo(function BigGrandToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  index = 0,
  heroIndex = 0,
}: TokenViewProps) {
  const text = displayText(token);
  const timing = { frame, fps, fromFrame, toFrame };
  
  // Word-by-word snappy spring reveal
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const isSpoken = timing.fromFrame <= frame;
  
  // Word stays 100% visible after entering
  const opacity = isSpoken ? Math.min(1, enter) : 0;
  const scale = 0.88 + 0.12 * Math.min(1, enter);
  const translateY = (1 - Math.min(1, enter)) * 12;
  const blurPx = (1 - Math.min(1, enter)) * 4;

  const isHero = index === heroIndex;
  const isTopLine = index < heroIndex;
  const isDeva = hasDevanagari(text);

  const fontId = config.fontId || "montserrat";
  const specialFontId = config.specialFontId || fontId;

  // Vibrant Electric Cyan for Hero, Crisp Pure White for Supporting text
  const heroColor = config.accentColor || "#38bdf8";
  const textColor = "#ffffff";

  const baseSize = config.fontSizePx || 120;
  let sizePx = baseSize;
  let family = FONT_FAMILY[fontId];
  let fontWeight = 800;
  let letterSpacing = isDeva ? "normal" : "0.02em";
  let color = textColor;
  let textShadow = "0 2px 10px rgba(0, 0, 0, 0.9), 0 0 4px rgba(0, 0, 0, 0.9)";
  const textTransform: "uppercase" | "none" = isDeva ? "none" : "uppercase";

  if (isHero) {
    // Row 2: Hero word (Massive, Vibrant Solid Cyan with Glowing Aura)
    sizePx = baseSize;
    family = FONT_FAMILY[specialFontId];
    fontWeight = 900;
    color = heroColor;
    textShadow = `0 0 16px ${heroColor}, 0 0 32px ${heroColor}80, 0 2px 12px rgba(0, 0, 0, 0.95)`;
  } else if (isTopLine) {
    // Row 1: Top lead-in (Solid White, ExtraBold)
    sizePx = baseSize * 0.52;
    family = FONT_FAMILY[fontId];
    fontWeight = 800;
    letterSpacing = isDeva ? "normal" : "0.04em";
  } else {
    // Row 3: Bottom punchline (Solid White, Wide Letter Spacing)
    sizePx = baseSize * 0.40;
    family = FONT_FAMILY[fontId];
    fontWeight = 800;
    letterSpacing = isDeva ? "normal" : "0.18em";
  }

  const transformStr = `translateY(${translateY}px) scale(${scale})`;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity,
        transform: transformStr,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
        flexBasis: isHero ? "100%" : undefined,
        width: isHero ? "100%" : undefined,
        display: isHero ? "flex" : "inline-flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span
        style={{
          ...tokenGlyphStyle,
          fontFamily: family,
          fontSize: `${sizePx}px`,
          fontWeight,
          color,
          letterSpacing,
          textTransform,
          textShadow,
          WebkitTextStroke: "none",
          paintOrder: "normal",
        }}
      >
        {text}
      </span>
    </span>
  );
});

