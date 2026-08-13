import { memo } from "react";
import { hasDevanagari } from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
} from "../captions/animation";
import { FONT_FAMILY } from "../fonts";
import {
  DESIGN_WALLA_SMALL_RATIO,
  designWallaHeroDirection,
  designWallaHeroIsScript,
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Design Walla — one hero word per page (bold yellow caps or an italic
 * script flourish), sandwiched by small supporting text above and below.
 *
 * Built from a real reference video: every page there shows exactly one
 * enlarged word, never more, with the rest of the sentence set small around
 * it — not the "every other word gets a treatment" pattern this template
 * used to have. `heroIndex` (page-scoped, computed once in
 * `CaptionOverlay.tsx`) picks that one word; `flexBasis: 100%` on it alone
 * (not on every token, unlike the old version) is what produces the
 * sandwich — the surrounding small words wrap onto the rows above/below it
 * for free, the same mechanism `HeroStack.tsx` already uses.
 *
 * Which hero style (`accent` vs `script`) and which vertical direction it
 * slides in from are both chosen once per page from `pageSeed`
 * (`designWallaHeroIsScript` / `designWallaHeroDirection`) rather than per
 * word, so a page commits to one identity instead of flip-flopping word to
 * word.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "designWalla"` and in
 * `remotion/captions/page-fit.ts`. All three must change together.
 */
export const DesignWallaToken = memo(function DesignWallaToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
  pageSeed = 0,
}: TokenViewProps) {
  const text = displayText(token);
  const isHero = index === heroIndex;
  const isDevanagariWord = hasDevanagari(token.text);
  const timing = { frame, fps, fromFrame, toFrame };

  const smallRatio =
    config.annotationSizeRatio > 0
      ? config.annotationSizeRatio
      : DESIGN_WALLA_SMALL_RATIO;

  if (!isHero) {
    // Supporting text: fades and lifts toward the hero line. Deliberately
    // inert beyond that — the hero is what carries the page's motion.
    const enter = tokenEnter(timing, ENTER_SMOOTH);
    const isTopLine = index < heroIndex;
    const lift = (1 - enter) * (isTopLine ? 16 : -16);
    const blurPx = (1 - enter) * 3;

    return (
      <span
        style={{
          ...tokenShellStyle,
          opacity: enter,
          transform: `translateY(${lift}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontFamily: config.secondaryFontId
              ? FONT_FAMILY[config.secondaryFontId]
              : textStyle.fontFamily,
            fontSize: config.fontSizePx * smallRatio,
            fontWeight: config.annotationWeight > 0 ? config.annotationWeight : 500,
            color: config.annotationColor || config.baseColor,
            textTransform:
              config.textCase === "upper" || config.uppercase
                ? "uppercase"
                : config.textCase === "lower"
                  ? "lowercase"
                  : "none",
            WebkitTextStroke: "0px transparent",
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  // Devanagari has no italic face — a script hero word falls back to the
  // bold accent treatment and is marked by colour alone, same convention
  // `Focus.tsx` already uses for its own script accent.
  const isScript = designWallaHeroIsScript(pageSeed) && !isDevanagariWord;
  const direction = designWallaHeroDirection(pageSeed);

  const enter = tokenEnter(timing, isScript ? ENTER_SMOOTH : ENTER_BOUNCY);
  const travel = (1 - enter) * (isScript ? 40 : 55);
  const yOffset = direction === "up" ? travel : -travel;
  const blurPx = (1 - enter) * (isScript ? 3 : 5);

  return (
    <span
      style={{
        ...tokenShellStyle,
        // Owns its row — this is what produces the sandwich.
        flexBasis: "100%",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: isScript
            ? FONT_FAMILY[config.specialFontId ?? "grandHotel"]
            : textStyle.fontFamily,
          fontSize: config.fontSizePx * (isScript ? 1.05 : 1.15),
          fontWeight: isScript ? 400 : Math.max(800, config.fontWeight),
          fontStyle: isScript ? "italic" : "normal",
          color: token.color ?? (isScript ? config.baseColor : config.accentColor),
          textTransform: isScript ? "none" : "uppercase",
          opacity: enter,
          transform: `translateY(${yOffset}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          WebkitTextStroke: isScript ? "0px transparent" : textStyle.WebkitTextStroke,
        }}
      >
        {text}
      </span>
    </span>
  );
});
