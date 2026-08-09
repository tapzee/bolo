import { memo } from "react";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
  tokenHighlight,
  tokenPulse,
} from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";

export const EditorialOverlayToken = memo(function EditorialOverlayToken({
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
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const enterBouncy = tokenEnter(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const text = displayText(token);
  const isHero = index === heroIndex;
  const isSpoken = fromFrame <= frame;

  // Resolve fonts
  const primaryFontFamily = FONT_FAMILY[config.fontId];
  const secondaryFontFamily = config.secondaryFontId ? FONT_FAMILY[config.secondaryFontId] : "var(--font-inter), sans-serif";

  if (!isHero) {
    // Supporting text: small, clean, overlays the hero
    const smallAlpha = isSpoken
      ? highlight > 0.01
        ? 1
        : Math.max(0.7, config.upcomingOpacity)
      : config.upcomingOpacity;

    const smallSize = config.fontSizePx * 0.45; // 22-42px range (if base is ~80px)

    return (
      <span
        style={{
          ...tokenShellStyle,
          opacity: smallAlpha,
          transform: `translateY(${(1 - enter) * 10}px)`,
          transition: "opacity 0.1s ease-out",
          zIndex: 10,
          position: "relative",
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize: `${smallSize}px`,
            fontWeight: 500,
            letterSpacing: `0px`,
            color: token.color || "#FFFFFF",
            fontFamily: secondaryFontFamily,
            textTransform: "none",
            WebkitTextStroke: "none",
            textShadow: "0px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  // HERO WORD (Editorial backdrop)
  const scale = 0.92 + enterBouncy * 0.08 + pulse * 0.03;
  const color = token.color ?? config.activeColor; // Crimson red #C83232

  return (
    <span
      style={{
        ...tokenShellStyle,
        position: "absolute", // Break out of flow to act as overlay backdrop
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%)`,
        zIndex: 0,
        pointerEvents: "none", // Let clicks pass through if needed
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          transform: `translateX(${(1 - enterBouncy) * 20}px) scale(${scale})`, // slight horizontal slide
          transformOrigin: "center center",
          color,
          fontFamily: primaryFontFamily,
          fontSize: `${config.fontSizePx * 2.2}px`, // Huge
          textTransform: "uppercase",
          fontWeight: config.fontWeight || 500, // Medium serif weight
          letterSpacing: "-0.02em",
          WebkitTextStroke: "none",
          opacity: enterBouncy,
          filter: `blur(${(1 - enterBouncy) * 10}px) ${config.dropShadow ? `drop-shadow(0px ${config.fontSizePx * 0.06}px ${config.fontSizePx * 0.12}px rgba(0,0,0,0.4))` : ''}`,
          whiteSpace: "nowrap", // Ensure the huge word doesn't wrap unnecessarily
        }}
      >
        {text}
      </span>
    </span>
  );
});
