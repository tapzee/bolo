import { memo } from "react";
import { interpolateColors } from "remotion";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
  tokenHighlight,
  tokenPulse,
} from "../captions/animation";
import {
  HERO_SMALL_RATIO,
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Hero Stack — one oversized headline word with the rest of the line set small
 * above and below it.
 *
 * This is the layout every polished caption app leans on and the one Bolo did
 * not have. `dual` looks adjacent but is a different idea: it prints the *same*
 * word twice, large and small, as an echo. Here the small text is the *other*
 * words, so the page still reads as a sentence while one word carries the
 * frame.
 *
 * The row break is done with `flexBasis: 100%` on the hero rather than by
 * grouping tokens into rows. The page container is already a centred
 * `flex-wrap` row, so a full-width item pushes everything before it onto the
 * lines above and everything after onto the lines below — the stack falls out
 * of the layout that is already there, and the alignment is the browser's
 * rather than something arithmetic that has to be kept true at every aspect
 * ratio.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "hero"`. Both must
 * change together.
 */
export const HeroStackToken = memo(function HeroStackToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
  totalTokens = 1,
}: TokenViewProps) {
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const text = displayText(token);
  const isHero = index === heroIndex;
  const isSpoken = fromFrame <= frame;

  const smallRatio =
    config.annotationSizeRatio > 0 ? config.annotationSizeRatio : HERO_SMALL_RATIO;

  if (!isHero) {
    // Supporting text. Deliberately inert — it fades and lifts, and that is
    // all. Small text that also springs turns the page into noise and steals
    // the emphasis the hero word exists to carry.
    const smallAlpha = isSpoken
      ? highlight > 0.01
        ? 1
        : Math.max(0.7, config.upcomingOpacity)
      : config.upcomingOpacity;
      
    const isTopLine = index < heroIndex;
    const isBottomLine = index > heroIndex;

    const slideX = isTopLine ? (1 - enter) * -30 : isBottomLine ? (1 - enter) * 30 : 0;
    const slideY = isTopLine ? (1 - enter) * 15 : isBottomLine ? (1 - enter) * -15 : 0;
    const blurAmount = (1 - enter) * 8;
    const displayRatio = smallRatio * 1.6; // Tangerine is a thin script, needs to be larger to be properly visible

    return (
      <span
        style={{
          ...tokenShellStyle,
          opacity: smallAlpha,
          transform: `translate(${slideX}px, ${slideY}px)`,
          filter: `blur(${blurAmount}px)`,
          transition: "opacity 0.1s ease-out",
          marginLeft: isTopLine && index === 0 ? "auto" : undefined,
          marginRight: isBottomLine && index === totalTokens - 1 ? "auto" : undefined,
          marginBottom: isTopLine ? "-0.4em" : undefined,
          marginTop: isBottomLine ? "-0.4em" : undefined,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: `"Tangerine", cursive`,
            fontSize: `${config.fontSizePx * displayRatio}px`,
            fontWeight: 700,
            letterSpacing: `${config.fontSizePx * displayRatio * 0.02}px`,
            color: config.annotationColor || config.baseColor,
            // Forces lowercase unconditionally, same as `heroMixed`'s
            // annotation layer — the small/BIG/small case contrast is this
            // template's own signature, not something that should depend on
            // whatever case the user picked for the template overall.
            textTransform: "lowercase",
            WebkitTextStroke: `${Math.max(
              config.fontSizePx * displayRatio * 0.06,
              config.strokeWidthPx * displayRatio * 1.1,
            )}px ${config.strokeColor}`,
            paintOrder: "stroke fill",
            textShadow: "0 3px 12px rgba(0,0,0,0.85)",
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  const heroColor = interpolateColors(
    highlight,
    [0, 1],
    [token.color ?? config.baseColor, token.color ?? config.accentColor],
  );

  const scale = 1 + pulse * 0.16 * config.emphasisScale + highlight * 0.04;
  const lift = (1 - enter) * 14;

  return (
    <span
      style={{
        ...tokenShellStyle,
        // Owns its row, which is what produces the stack.
        flexBasis: "100%",
        justifyContent: "center",
        opacity: isSpoken ? 1 : Math.max(0.5, config.upcomingOpacity),
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          display: "inline-block",
          fontSize: `${config.fontSizePx}px`,
          color: heroColor,
          textTransform: "uppercase",
          transform: `translateY(${-lift}px) scale(${scale})`,
          textShadow:
            highlight > 0.01
              ? "0 8px 32px rgba(0,0,0,0.72), 0 2px 10px rgba(0,0,0,0.85)"
              : "0 4px 16px rgba(0,0,0,0.55)",
          transition: "color 0.06s ease-out",
        }}
      >
        {text}
      </span>
    </span>
  );
});
