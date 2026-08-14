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
  
  // Scale-in + Fade-in
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  // Scale-out + Fade-out
  const exitFrames = fps * 0.3;
  const exitProgress = Math.max(0, Math.min(1, (frame - toFrame) / exitFrames));
  const isLeaving = exitProgress > 0;
  
  // Determine opacity and scale based on enter/exit
  const opacity = isLeaving ? 1 - exitProgress : enter;
  const scale = isLeaving ? 1 - (0.5 * exitProgress) : 0.5 + (0.5 * enter);
  
  const isHero = index === heroIndex;
  const isTopLine = index < heroIndex;

  const fontId = config.fontId || "montserrat";
  const specialFontId = config.specialFontId || "rubik";

  const color = token.color ?? config.baseColor;
  const heroColor = config.accentColor ?? "#87ceeb";

  // Sizes based on level
  // Level 1: Hero
  // Level 2: Bottom row (~50% of hero)
  // Level 3: Top row (~30% of hero)
  const baseSize = config.fontSizePx || 110;
  let sizePx = baseSize;
  let family = FONT_FAMILY[fontId];
  let fontColor = color;
  let letterSpacing = "normal";
  let backgroundClip: React.CSSProperties | undefined = undefined;

  if (isHero) {
    // Row 2: Level 1
    sizePx = baseSize;
    family = FONT_FAMILY[specialFontId];
    fontColor = "transparent"; // for background clip
    // Dotted/grid texture for the hero word
    backgroundClip = {
      backgroundImage: `radial-gradient(${heroColor} 40%, transparent 40%), radial-gradient(${heroColor} 40%, transparent 40%)`,
      backgroundSize: "6px 6px",
      backgroundPosition: "0 0, 3px 3px",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
    };
  } else if (isTopLine) {
    // Row 1: Level 3
    sizePx = baseSize * 0.35;
    family = FONT_FAMILY[fontId];
  } else {
    // Row 3: Level 2
    sizePx = baseSize * 0.50;
    family = FONT_FAMILY[fontId];
    letterSpacing = `${sizePx * 0.15}px`; // Generous spacing
  }

  const transformStr = `scale(${scale})`;

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity,
        transform: transformStr,
        width: "100%", // Force onto new line
        display: "flex",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: family,
          fontSize: `${sizePx}px`,
          fontWeight: isHero ? 900 : 700,
          color: fontColor,
          letterSpacing,
          ...backgroundClip,
        }}
      >
        {text}
      </span>
    </span>
  );
});
