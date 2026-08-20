import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import { tokenShellStyle, resolveSecondaryFontSize, resolveSpecialFontSize } from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { CaptionToken, WordEmphasis } from "@/core";
import {
  ENTER_SMOOTH,
  ENTER_SUBTLE,
  tokenEnter,
} from "../captions/animation";

/**
 * Determines the emphasis role of a token if not explicitly set.
 *
 * Rules for auto-assignment:
 * 1. The hero word (index === heroIndex) is always "important" — the bold
 *    caps header.
 * 2. A *different* word, chosen by `specialWordIndex`, is "special" — the
 *    script flourish. Previously this was `heroIndex % 3`, which put special
 *    and important on the *same* word and meant a page never showed a bold
 *    header and a script word together — the look every reference caption
 *    using this style actually has.
 * 3. A very short connecting word (<= 3 chars) is "supporting".
 * 4. Everything else is "normal" — the sub-header tier: present but not
 *    shouting.
 */
export function resolveEmphasis(
  token: CaptionToken,
  index: number | undefined,
  heroIndex: number | undefined,
  specialIndex: number | undefined = -1,
): WordEmphasis {
  if (token.emphasis) return token.emphasis;

  if (index !== undefined && index === heroIndex) return "important";
  if (index !== undefined && index === specialIndex) return "special";

  const clean = token.text.trim();
  if (clean.length <= 3) {
    return "supporting";
  }

  return "normal";
}

/**
 * Font-size ratio per emphasis tier, applied against `config.fontSizePx`.
 *
 * Extracted as a named export (rather than left inline where each ratio was
 * used) so `remotion/captions/page-fit.ts` can read the exact same numbers
 * this token renderer and `draw-captions.ts` use — a box-fit page-size
 * estimate built from different numbers than the real render would silently
 * drift out of sync with what's actually drawn.
 */
export const DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE: Readonly<Record<WordEmphasis, number>> = {
  supporting: 0.4,
  normal: 0.6,
  important: 1.1,
  special: 0.9,
};

export const DynamicHighlightToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index,
  heroIndex,
  specialIndex,
}) => {
  // Resolve which font to use based on emphasis
  const primaryFontStack = FONT_FAMILY[config.fontId];
  const secondaryFontStack = config.secondaryFontId ? FONT_FAMILY[config.secondaryFontId] : primaryFontStack;
  const specialFontStack = config.specialFontId ? FONT_FAMILY[config.specialFontId] : primaryFontStack;

  const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);

  const timing = { frame, fps, fromFrame, toFrame };

  // ---------------------------------------------------------------------------
  // ANIMATIONS
  // ---------------------------------------------------------------------------
  const enterSmooth = tokenEnter(timing, ENTER_SMOOTH);
  const enterSubtle = tokenEnter(timing, ENTER_SUBTLE);

  let opacity = 1;
  let yOffset = 0;
  let blurPx = 0;

  if (emphasis === "important") {
    // A slide-and-focus entrance instead of the bouncy pop every other role
    // still uses: the header rises into place while resolving out of a soft
    // blur. It reads calmer and more like a title card, which suits a word
    // that then holds the frame for the rest of the page instead of
    // springing back to rest.
    yOffset = (1 - enterSmooth) * 22;
    blurPx = (1 - enterSmooth) * 7;
    opacity = enterSmooth;
  }
  else if (emphasis === "supporting") {
    // Smooth fade up
    yOffset = (1 - enterSmooth) * 15;
    opacity = enterSmooth;
  }
  else if (emphasis === "special") {
    // Elegant reveal (slower)
    yOffset = (1 - enterSubtle) * 8;
    opacity = enterSubtle;
  }
  else {
    // Normal
    opacity = enterSmooth;
  }

  // ---------------------------------------------------------------------------
  // TYPOGRAPHY STYLES
  // ---------------------------------------------------------------------------
  
  let fontFamily = primaryFontStack;
  let color = config.baseColor;
  let fontSize = textStyle.fontSize as number;
  let textTransform = textStyle.textTransform;
  let fontWeight = textStyle.fontWeight;
  let fontStyle: React.CSSProperties["fontStyle"] = undefined;
  let textShadow = undefined as string | undefined;

  if (emphasis === "supporting") {
    fontFamily = secondaryFontStack;
    fontSize = resolveSecondaryFontSize(config, DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.supporting);
    color = "rgba(255, 255, 255, 0.75)";
    fontWeight = 400; // light/regular
    textTransform = "lowercase";
  }
  else if (emphasis === "normal") {
    fontFamily = secondaryFontStack;
    fontSize = config.secondaryFontSizePx ? config.secondaryFontSizePx : (fontSize * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.normal);
    fontWeight = 600; // semibold
  }
  else if (emphasis === "important") {
    fontFamily = primaryFontStack;
    fontSize = fontSize * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.important; // Huge
    color = token.color ?? config.activeColor; // Yellow accent
    textTransform = "uppercase";
    fontWeight = 900;

    // Lighting effect: refined, subtle glow controllable via glow settings
    const isGlowOn = Boolean(config.glowEnabled ?? true);
    const breathe = 0.8 + 0.2 * Math.sin((frame / fps) * Math.PI * 1.2);
    const glowStrength = enterSmooth * breathe * (config.glowIntensity ?? 0.5);
    const glowColor = config.glowColor ?? color;
    const radiusScale = (config.glowRadius ?? 75.0) / 100;

    textShadow = isGlowOn && glowStrength > 0.02
      ? [
          `0 0 ${fontSize * 0.06 * glowStrength * radiusScale}px #ffffff`,
          `0 0 ${fontSize * 0.14 * glowStrength * radiusScale}px ${glowColor}`,
          `0 0 ${fontSize * 0.28 * glowStrength * radiusScale}px ${glowColor}99`,
          `0 2px 10px rgba(0, 0, 0, 0.75)`,
        ].join(", ")
      : "0 2px 10px rgba(0, 0, 0, 0.75)";
  }
  else if (emphasis === "special") {
    fontFamily = specialFontStack;
    fontSize = resolveSpecialFontSize(config, DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.special);
    color = "#FFFFFF";
    textTransform = "none";
    fontWeight = 400; // editorial/script usually lighter
    // Only synthetically slant a serif special font — a script face like Grand
    // Hotel already leans, so italicising it on top warps the letterforms.
    fontStyle = config.specialFontId === "playfair" ? "italic" : undefined;
    // Optional subtle shadow instead of hard stroke for editorial feel
    textShadow = "2px 2px 8px rgba(0,0,0,0.5)";
  }

  const style: React.CSSProperties = {
    ...textStyle,
    fontFamily,
    fontSize,
    color,
    textTransform,
    fontWeight,
    fontStyle,
    zIndex: 1,
    transform: `translateY(${yOffset}px)`,
    opacity,
    textShadow,
    filter: blurPx > 0.05 ? `blur(${blurPx}px)` : undefined,
  };

  // Special fonts look bad with heavy text-strokes, so we remove them. The
  // header keeps its stroke — the glow above is additive, not a replacement,
  // and bold caps still need the stroke's contrast against busy footage.
  if (emphasis === "special") {
    style.WebkitTextStroke = undefined;
  }

  // Allow word color override
  if (token.color && emphasis !== "important") {
    style.color = token.color;
  }

  return (
    <span style={tokenShellStyle}>
      <span style={style}>{token.text}</span>
    </span>
  );
};
