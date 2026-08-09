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
  displayText,
  isKineticAccentWord,
  kineticVariant,
  lightenHex,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

const clamp01 = (value: number): number =>
  value < 0 ? 0 : value > 1 ? 1 : value;

/**
 * Kinetic — every word is dealt one of six entrance directions (slide from
 * above/below/left/right, or a blur pop/blur-out) picked deterministically
 * from the word itself (`kineticVariant`), so a page of text arrives looking
 * hand-randomised rather than uniform, but never flickers between two
 * different animations on a re-render of the same word.
 *
 * Roughly a third of words (`isKineticAccentWord`) render on a light diagonal
 * gradient fill instead of the plain karaoke colour swap every other word
 * gets, plus a white shine that sweeps across them once as they settle.
 *
 * The shine is a second `background-image` layer riding `background-position`
 * over an oversized `background-size`, not a gradient whose colour-stop
 * offsets get rewritten every frame — an earlier version clamped stop
 * offsets per frame, which could collapse two stops onto the same position
 * and alias into a jagged seam against the readability stroke. Sliding the
 * *position* leaves the stops themselves untouched, so that failure mode
 * can't happen here.
 */
export const KineticToken = memo(function KineticToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
}: TokenViewProps) {
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const text = displayText(token);
  const variant = kineticVariant(text, index);
  const isAccent = isKineticAccentWord(text);
  const isSpoken = fromFrame <= frame;

  const settle = clamp01(enter);
  const arrive = 1 - settle;

  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  let blurPx = 0;

  switch (variant) {
    case "slideUp":
      translateY = arrive * 46;
      blurPx = arrive * 9;
      break;
    case "slideDown":
      translateY = arrive * -46;
      blurPx = arrive * 9;
      break;
    case "slideLeft":
      translateX = arrive * 60;
      blurPx = arrive * 9;
      break;
    case "slideRight":
      translateX = arrive * -60;
      blurPx = arrive * 9;
      break;
    case "blurPop":
      scale = 0.72 + settle * 0.28;
      blurPx = arrive * 14;
      break;
    case "blurOut":
      scale = 1.4 - settle * 0.4;
      blurPx = arrive * 14;
      break;
  }

  // A small settle-bounce layered on top of the word's own arrival, so the
  // page keeps feeling alive after the slide/blur resolves.
  scale += pulse * 0.05;

  const restColor = token.color ?? config.baseColor;
  const spokenColor = token.color ?? config.activeColor;
  const color = interpolateColors(highlight, [0, 1], [restColor, spokenColor]);

  const opacity = isSpoken
    ? highlight > 0.01
      ? 1
      : Math.max(0.85, config.upcomingOpacity)
    : config.upcomingOpacity;

  const accent = token.color ?? config.accentColor;
  // Both ends of the identity gradient are lightened tints of accentColor —
  // even the "dark" end never touches the raw, fully-saturated colour, which
  // is what read as too dark once the stroke (below) was removed and the
  // colour had nothing else breaking it up.
  const gradientLight = lightenHex(accent, 0.65);
  const gradientDark = lightenHex(accent, 0.15);
  // Travels the oversized shine layer from fully off one edge to fully off
  // the other over the word's one-shot `settle`, so the flash of light and
  // the slide/blur arrival resolve together.
  const shineTravel = -100 + settle * 300;
  // The mandatory readability stroke reads as a heavy black border once it's
  // sitting under a gradient fill instead of a flat colour — the gradient
  // itself already separates the word from the footage, so accent words drop
  // the stroke instead of layering both.
  const shineStyle = isAccent
    ? {
        backgroundImage:
          `linear-gradient(45deg, transparent 32%, rgba(255,255,255,0.95) 50%, transparent 68%), ` +
          `linear-gradient(45deg, ${gradientLight} 0%, ${gradientDark} 100%)`,
        backgroundSize: "300% 300%, 100% 100%",
        backgroundPosition: `${shineTravel}% ${shineTravel}%, 0% 0%`,
        backgroundRepeat: "no-repeat, no-repeat",
        WebkitBackgroundClip: "text" as const,
        backgroundClip: "text" as const,
        color: "transparent",
        WebkitTextStroke: "0px transparent",
      }
    : { color };

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        filter: blurPx > 0.05 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          ...shineStyle,
          // `text-shadow`, not `filter: drop-shadow()` — a CSS `filter` on the
          // same element as `background-clip: text` breaks Chromium's text
          // clip mask and paints the glyph's full box solid instead of just
          // the gradient-filled letterforms. `text-shadow` is computed from
          // the actual glyph coverage and doesn't fight the clip.
          textShadow: config.dropShadow
            ? `0px ${config.fontSizePx * 0.05}px ${config.fontSizePx * 0.1}px rgba(0,0,0,0.5)`
            : undefined,
        }}
      >
        {text}
      </span>
    </span>
  );
});
