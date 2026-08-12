import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  displayText,
  focusFontScale,
  focusFontWeight,
  focusTier,
  focusTierIsUpper,
  focusWordOpacity,
  haloTextShadow,
  isFocusAccent,
  isFocusScript,
  premiumStrokePx,
  tokenGlyphStyle,
  tokenShellStyle,
  dynamicSlideStackDirection,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import { focusEnvelope, tokenPulse, ENTER_BOUNCY } from "../captions/animation";

/**
 * Focus — the minimal premium caption.
 *
 * One centred block, every word the same size and weight, up to three wrapped
 * rows. The whole page arrives once (the shared `pageEntrance` on the block),
 * then nothing enters again: the only thing that moves is the spoken word,
 * which lifts slightly and brightens to full white while the words around it
 * hold at `upcomingOpacity`. Words already spoken settle back to
 * `FOCUS_SPOKEN_OPACITY` rather than snapping off, so the viewer can still
 * read the start of the line.
 *
 * The one deviation from uniformity is deliberate and is what keeps the page
 * from looking like a subtitle track: the sentence's single most salient word
 * (`isFocusAccent`) is set in an italic serif and the accent colour, at the
 * same size as everything else. Two faces, one accent, no third idea.
 *
 * Every value here is a transform or an opacity — the layout box of a word
 * never changes — so nothing on the row can ever shift as words are spoken.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "focus"`. The size is
 * uniform, so `page-fit.ts`'s default branch is exact for this style and needs
 * no case of its own.
 */
export const FocusToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}) => {
  const role: WordRole = token.role ?? "normal";
  const tier = focusTier(role);
  const isDevanagariWord = hasDevanagari(token.text);
  // Playfair carries no Devanagari, and the Noto fallback has no italic — a
  // Hindi accent word would silently render as plain upright Noto while the
  // export drew something else. Devanagari accent words keep the primary face
  // Playfair carries no Devanagari, and the Noto fallback has no italic — a
  // Hindi accent word would silently render as plain upright Noto while the
  // export drew something else. Devanagari accent words keep the primary face
  // and are marked by colour alone.
  const isScript = isFocusScript(role) && !isDevanagariWord;

  const { started, ended } = focusEnvelope({ frame, fps, fromFrame, toFrame });
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_BOUNCY);
  const direction = dynamicSlideStackDirection(token.text, fromFrame);

  const fontSize = (textStyle.fontSize as number) * focusFontScale(tier);
  const opacity = focusWordOpacity(started, ended, config.upcomingOpacity);

  const travel = pulse * fontSize * 0.15;
  const xOffset = direction === "left" ? -travel : direction === "right" ? travel : 0;
  const yOffset = direction === "up" ? -travel : direction === "down" ? travel : 0;
  
  const blurPx = (1 - started) * 2.5 + ended * 2.5;

  const colour = isFocusAccent(role)
    ? (token.color ?? config.accentColor)
    : (token.color ?? config.baseColor);

  return (
    <span
      style={{
        ...tokenShellStyle,
        flexBasis: tier === "hero" ? "100%" : undefined,
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: isScript
            ? FONT_FAMILY[config.specialFontId ?? "playfair"]
            : tier === "support" || tier === "body"
              ? FONT_FAMILY[config.secondaryFontId ?? "instrumentSans"]
            : FONT_FAMILY[config.fontId],
          fontSize,
          fontStyle: isScript ? "italic" : "normal",
          fontWeight: focusFontWeight(tier, config),
          color: colour,
          textTransform: focusTierIsUpper(tier) ? "uppercase" : "lowercase",
          opacity,
          transform: `translate(${xOffset}px, ${yOffset}px)`,
          filter: blurPx > 0.1 ? `blur(${blurPx}px)` : undefined,
          // The two-part readability guarantee this template uses in place of
          // a conventional outline — see `PREMIUM_HALO` / `premiumStrokePx`.
          textShadow: haloTextShadow(fontSize),
          WebkitTextStroke: `${premiumStrokePx(fontSize, config)}px ${config.strokeColor}`,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
