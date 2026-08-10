import type { CaptionBoxFitConfig, CaptionToken, EstimatedTokenBox, StyleId } from "@/core";
import {
  analyzeWordRoles,
  estimateMaxLineWidthPx,
  estimateWordWidthPx,
  hasDevanagari,
} from "@/core";
import {
  DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE,
  resolveEmphasis,
} from "@/remotion/styles/DynamicHighlight";
import {
  HERO_SMALL_RATIO,
  heroWordIndex,
  specialWordIndex,
  getSplashWordRole,
  underlinePunchFontScale,
  highlightMarkerFontScale,
  mixedWeightFontScale,
  kineticSplitFontScale,
  centerPunchFontScale,
  editorialStackFontScale,
  magazineCutFontScale,
  minimalLuxuryFontScale,
  layeredDepthForegroundScale,
  verticalImpactCharFontSize,
  verticalImpactColumnHeight,
  popScaleFontScale,
  slideInFontScale,
  blurFocusFontScale,
  rotateRevealFontScale,
  wipeUpFontScale,
  strokeFillFontScale,
  bounceWordFontScale,
  highlightWordFontScale,
  zoomFocusFontScale,
  gradientFlowFontScale,
  maskRevealFontScale,
  drawOnFontScale,
  depth3dFontScale,
  editorialKineticRole,
  editorialKineticFontScale,
} from "./primitives";

/**
 * Estimates each token's on-screen footprint for a given style, for box-fit
 * page building (`buildCaptionPages`).
 *
 * Built entirely from the same pure, exported role/index resolvers and
 * font-scale functions the real renderers (the DOM `.tsx` token components
 * and `draw-captions.ts`) already use — so this can never invent a size rule
 * that disagrees with what actually gets drawn. What's genuinely new here is
 * only the *width* number (character-count estimate, not real text
 * measurement — see `core/styles/estimate.ts`'s doc comment for why) and the
 * per-style *dispatch*.
 *
 * Deliberately takes just the *candidate* token list for a page being built
 * (not the whole transcript): several of the resolvers below (`heroWordIndex`,
 * `analyzeWordRoles`'s "critical" pick, `specialWordIndex`) are page-scoped —
 * which word is "the big one" depends on which words end up together, which
 * is exactly what page-building is deciding. Calling this fresh on the
 * candidate list as it grows one word at a time keeps that decision
 * consistent with how pages are rendered once built.
 */
export const resolveTokenBoxes = (
  tokens: readonly CaptionToken[],
  styleId: StyleId,
  config: CaptionBoxFitConfig,
): EstimatedTokenBox[] => {
  const texts = tokens.map((token) => token.text);

  const toBox = (text: string, fontSizePx: number): EstimatedTokenBox => ({
    width: estimateWordWidthPx(text, fontSizePx, config.letterSpacingPx, hasDevanagari(text)),
    height: fontSizePx * config.lineHeight,
  });

  switch (styleId) {
    case "splash": {
      return tokens.map((token, index) => {
        const role = getSplashWordRole(token.text, index, tokens.length);
        const scale = role === "accent" ? 1.15 : role === "script" ? 1.05 : 1;
        return toBox(token.text, config.fontSizePx * scale);
      });
    }

    case "dual":
    case "hero":
    case "heroMixed":
    case "editorialOverlay": {
      const heroIndex = heroWordIndex(texts);
      const smallRatio =
        config.annotationSizeRatio > 0 ? config.annotationSizeRatio : HERO_SMALL_RATIO;
      return tokens.map((token, index) =>
        toBox(token.text, config.fontSizePx * (index === heroIndex ? 1 : smallRatio)),
      );
    }

    case "dynamicHighlight": {
      const heroIndex = heroWordIndex(texts);
      const specialIndex = specialWordIndex(texts, heroIndex);
      return tokens.map((token, index) => {
        const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
        return toBox(token.text, config.fontSizePx * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE[emphasis]);
      });
    }

    case "underlinePunch": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * underlinePunchFontScale(roles[i]!)),
      );
    }

    case "highlightMarker": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * highlightMarkerFontScale(roles[i]!)),
      );
    }

    case "mixedWeight": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * mixedWeightFontScale(roles[i]!)),
      );
    }

    case "kineticSplit": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * kineticSplitFontScale(roles[i]!)),
      );
    }

    case "centerPunch": {
      const roles = analyzeWordRoles(tokens);
      // The "punch" state is the largest the critical word ever gets — using
      // it unconditionally (rather than modelling playback time, which isn't
      // known during page-building) keeps the estimate conservative.
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * centerPunchFontScale(roles[i]!, "punch")),
      );
    }

    case "editorialStack": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => {
        const isDevanagariWord = hasDevanagari(token.text);
        return toBox(
          token.text,
          config.fontSizePx * editorialStackFontScale(roles[i]!, isDevanagariWord),
        );
      });
    }

    case "magazineCut": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => {
        const isDevanagariWord = hasDevanagari(token.text);
        return toBox(
          token.text,
          config.fontSizePx * magazineCutFontScale(roles[i]!, isDevanagariWord),
        );
      });
    }

    case "minimalLuxury": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => {
        const isDevanagariWord = hasDevanagari(token.text);
        return toBox(
          token.text,
          config.fontSizePx * minimalLuxuryFontScale(roles[i]!, isDevanagariWord),
        );
      });
    }

    case "layeredDepth": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * layeredDepthForegroundScale(roles[i]!)),
      );
    }

    case "verticalImpact": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => {
        const role = roles[i]!;
        const isDevanagariWord = hasDevanagari(token.text);
        const isVerticalKeyword = !isDevanagariWord && (role === "critical" || role === "keyword");

        if (isVerticalKeyword) {
          // A stacked column: narrow (one character wide) but very tall —
          // the generic wrap simulation only needs an accurate *height* here,
          // since whichever row it lands on becomes as tall as this column
          // regardless of how many short words share that row (mirrors a
          // flex row's height being driven by its tallest child).
          return {
            width: verticalImpactCharFontSize(config.fontSizePx),
            height: verticalImpactColumnHeight(token.text, config.fontSizePx),
          };
        }

        const scale = isDevanagariWord ? 1.15 : role === "connector" ? 0.55 : 0.65;
        return toBox(token.text, config.fontSizePx * scale);
      });
    }

    case "popScale": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * popScaleFontScale(roles[i]!)));
    }

    case "slideIn": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * slideInFontScale(roles[i]!)));
    }

    case "blurFocus": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * blurFocusFontScale(roles[i]!)));
    }

    case "rotateReveal": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * rotateRevealFontScale(roles[i]!)));
    }

    case "wipeUp": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * wipeUpFontScale(roles[i]!)));
    }

    case "strokeFill": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * strokeFillFontScale(roles[i]!)));
    }

    case "bounceWord": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * bounceWordFontScale(roles[i]!)));
    }

    case "highlightWord": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * highlightWordFontScale(roles[i]!)));
    }

    case "zoomFocus": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * zoomFocusFontScale(roles[i]!)));
    }

    case "gradientFlow": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * gradientFlowFontScale(roles[i]!)));
    }

    case "maskReveal": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * maskRevealFontScale(roles[i]!)));
    }

    case "drawOn": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * drawOnFontScale(roles[i]!)));
    }

    case "depth3d": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * depth3dFontScale(roles[i]!)));
    }

    case "editorialKinetic":
    case "editorialKineticPop": {
      // Every word renders on its own row (see EditorialKinetic.tsx), so
      // reporting a token's width as the full line-wrap width forces the
      // same greedy-wrap simulation `estimateBlockHeightPx` runs to close a
      // row after each one — matching the real one-word-per-line layout
      // instead of packing several short words onto an estimated row that
      // never happens in the actual render.
      const roles = analyzeWordRoles(tokens);
      const rowWidth = estimateMaxLineWidthPx(config);
      return tokens.map((token, i) => {
        const ekRole = editorialKineticRole(roles[i]!, token.text);
        return {
          width: rowWidth,
          height:
            config.fontSizePx *
            editorialKineticFontScale(roles[i]!, ekRole) *
            config.lineHeight,
        };
      });
    }

    default:
      // Flat styles (bold-yellow, pop, box, glow, clean, kinetic, dynamic,
      // typewriter, glitch, and any future style that doesn't vary size per
      // word): the active word's "boost" is a CSS/canvas transform, which
      // never affects layout — so every word genuinely renders at
      // `config.fontSizePx`, and this isn't an approximation for these
      // styles, it's exact.
      return tokens.map((token) => toBox(token.text, config.fontSizePx));
  }
};
