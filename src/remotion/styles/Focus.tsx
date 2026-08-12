import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  FOCUS_ACTIVE_LIFT_RATIO,
  displayText,
  focusWordOpacity,
  focusWordScale,
  haloTextShadow,
  isFocusAccent,
  premiumStrokePx,
  tokenGlyphStyle,
  tokenShellStyle,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import { focusEnvelope } from "../captions/animation";

/**
 * Focus — the minimal premium caption.
 *
 * One centred block, every word the same size and weight, up to three wrapped
 * rows. The whole page arrives once (the shared `pageEntrance` on the block),
 * then nothing enters again: the only thing that moves is the spoken word,
 * which lifts slightly, scales up ~7% and brightens to full white while the
 * words around it hold at `upcomingOpacity`. Words already spoken settle back
 * to `FOCUS_SPOKEN_OPACITY` rather than snapping off, so the viewer can still
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
  const isDevanagariWord = hasDevanagari(token.text);
  // Playfair carries no Devanagari, and the Noto fallback has no italic — a
  // Hindi accent word would silently render as plain upright Noto while the
  // export drew something else. Devanagari accent words keep the primary face
  // and are marked by colour alone.
  const isAccent = isFocusAccent(role) && !isDevanagariWord;

  const { started, ended } = focusEnvelope({ frame, fps, fromFrame, toFrame });

  const fontSize = textStyle.fontSize as number;
  const opacity = focusWordOpacity(started, ended, config.upcomingOpacity);
  const scale = focusWordScale(started, ended);
  const lift = -(started - ended) * fontSize * FOCUS_ACTIVE_LIFT_RATIO;

  const colour = isFocusAccent(role)
    ? (token.color ?? config.accentColor)
    : (token.color ?? config.baseColor);

  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: isAccent
            ? FONT_FAMILY[config.specialFontId ?? "playfair"]
            : FONT_FAMILY[config.fontId],
          fontStyle: isAccent ? "italic" : "normal",
          fontWeight: isAccent ? 600 : config.fontWeight,
          color: colour,
          opacity,
          transform: `translateY(${lift}px) scale(${scale})`,
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
