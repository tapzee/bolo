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

    return (
      <span
        style={{
          ...tokenShellStyle,
          opacity: smallAlpha,
          transform: `translateY(${(1 - enter) * 6}px)`,
          transition: "opacity 0.1s ease-out",
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize: `${config.fontSizePx * smallRatio}px`,
            fontWeight: config.annotationWeight > 0 ? config.annotationWeight : 500,
            letterSpacing: `${config.fontSizePx * smallRatio * 0.02}px`,
            color: config.annotationColor || config.baseColor,
            // Scaled with the small text rather than inherited: the block
            // stroke is sized for the hero, and at a third of the size it
            // closes up the counters of small glyphs entirely.
            //
            // The floor is the readability ratio the whole app is held to
            // (~8.5% of glyph size, see `strokeRatio`) rather than a fraction
            // of the hero's stroke. Scaling the hero's stroke down by the size
            // ratio alone lands the supporting text under 6%, which measured
            // against the `busy` backdrop is where white text stops separating.
            WebkitTextStroke: `${Math.max(
              config.fontSizePx * smallRatio * 0.085,
              config.strokeWidthPx * smallRatio * 1.4,
            )}px ${config.strokeColor}`,
            paintOrder: "stroke fill",
            textShadow: "0 2px 10px rgba(0,0,0,0.55)",
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
