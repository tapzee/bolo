import { memo } from "react";
import { FONT_FAMILY } from "../fonts";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
  displayText
} from "../captions/primitives";

export const BigGrandToken = memo(function BigGrandToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
}: TokenViewProps) {
  const text = displayText(token);
  const timing = { frame, fps, fromFrame, toFrame };
  
  // Word-by-word spring scale-in and fade-in
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const isSpoken = timing.fromFrame <= frame;
  
  // Word stays fully visible after entering until whole page exits
  const opacity = isSpoken ? Math.min(1, enter) : 0;
  const scale = 0.85 + 0.15 * Math.min(1, enter);
  const translateY = (1 - Math.min(1, enter)) * 14;
  const blurPx = (1 - Math.min(1, enter)) * 4;

  const isHero = index === heroIndex;
  const isTopLine = index < heroIndex;

  const fontId = config.fontId || "montserrat";
  const specialFontId = config.specialFontId || fontId;

  const heroColor = config.accentColor ?? "#38bdf8";

  const baseSize = config.fontSizePx || 125;
  let sizePx = baseSize;
  let family = FONT_FAMILY[fontId];
  let fontWeight = 800;
  let letterSpacing = "0.02em";
  let backgroundClip: React.CSSProperties | undefined = undefined;
  let filterStyle = "drop-shadow(0 2px 10px rgba(0, 0, 0, 0.7))";

  if (isHero) {
    // Row 2: Hero word (Massive, Textured, Glowing Electric Cyan)
    sizePx = baseSize;
    family = FONT_FAMILY[specialFontId];
    fontWeight = 900;
    letterSpacing = "0.02em";
    
    // Crisp vertical scanline / pinstripe texture
    backgroundClip = {
      backgroundImage: `repeating-linear-gradient(90deg, ${heroColor} 0px, ${heroColor} 3px, #0284c7 3px, #0284c7 5px)`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
    
    // Glowing electric aura drop shadow
    filterStyle = `drop-shadow(0 0 16px ${heroColor}b0) drop-shadow(0 0 32px ${heroColor}60) drop-shadow(0 2px 10px rgba(0,0,0,0.5))`;
  } else if (isTopLine) {
    // Row 1: Top lead-in (Medium, White, Bold)
    sizePx = baseSize * 0.52;
    family = FONT_FAMILY[fontId];
    fontWeight = 800;
    letterSpacing = "0.04em";
  } else {
    // Row 3: Bottom punchline (Small, White, Wide letter-spacing)
    sizePx = baseSize * 0.40;
    family = FONT_FAMILY[fontId];
    fontWeight = 800;
    letterSpacing = "0.18em";
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
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: family,
          fontSize: `${sizePx}px`,
          fontWeight,
          letterSpacing,
          textTransform: "uppercase",
          filter: filterStyle,
          ...backgroundClip,
        }}
      >
        {text}
      </span>
    </span>
  );
});

