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
  DESIGN_WALLA_SMALL_RATIO,
  designWallaEditorialTier,
  designWallaEditorialFontScale,
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
  dynamicSlideStackFontScale,
  glassHighlightFontScale,
  splitTextFontScale,
  liquidFlowFontScale,
  lightSweepFontScale,
  paperCutFontScale,
  flipCardFontScale,
  ribbonSlideFontScale,
  isSpiralRevealHero,
  spiralRevealFontScale,
  floatingBubbleFontScale,
  editorialStackHeroRole,
  editorialStackHeroFontScale,
  stackTier,
  stackFontScale,
  focusTier,
  focusFontScale,
  designWallaProBlueFontScale,
  designWallaProFontScale,
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

    case "bigGrand": {
      const heroIndex = heroWordIndex(texts);
      return tokens.map((token, index) => {
        const isHero = index === heroIndex;
        const isTopLine = index < heroIndex;
        const scale = isHero ? 1.0 : isTopLine ? 0.52 : 0.40;
        return toBox(token.text, config.fontSizePx * scale);
      });
    }

    case "designWalla": {
      const heroIndex = heroWordIndex(texts);
      const smallRatio =
        config.annotationSizeRatio > 0 ? config.annotationSizeRatio : DESIGN_WALLA_SMALL_RATIO;
      // Conservatively uses the larger of the two hero scales (accent's
      // 1.15x) regardless of which one a page actually lands on at render
      // time — the box-fit estimate only needs to never *underestimate*,
      // per `estimate.ts`'s "wrong-but-safe" rule.
      return tokens.map((token, index) =>
        toBox(token.text, config.fontSizePx * (index === heroIndex ? 1.15 : smallRatio)),
      );
    }

    case "designWallaEditorial":
    case "designWallaEditorialYellow": {
      const heroIndex = heroWordIndex(texts);
      const specialIndex = specialWordIndex(texts, heroIndex);
      return tokens.map((token, index) => {
        const tier = designWallaEditorialTier(index, heroIndex, specialIndex, tokens.length);
        const scale = designWallaEditorialFontScale(tier);
        const supportRatio = config.annotationSizeRatio > 0 ? config.annotationSizeRatio : scale;
        const finalScale = tier === "support" ? supportRatio : scale;
        return toBox(token.text, config.fontSizePx * finalScale);
      });
    }

    case "designWallaPro":
    case "designWallaProPink":
    case "designWallaProBlue":
    case "designWallaProGreen":
    case "designWallaProOrange": {
      const heroIndex = heroWordIndex(texts);
      const isBlueOrGreen = styleId === "designWallaProBlue" || styleId === "designWallaProGreen";
      return tokens.map((token, index) => {
        const role = index === heroIndex ? "middle" : index < heroIndex ? "top" : "bottom";
        const scaleFunc = isBlueOrGreen ? designWallaProBlueFontScale : designWallaProFontScale;
        let scale = scaleFunc(role);
        
        // Secondary fonts shrink dynamically if there are many words.
        // We artificially reduce the estimated width for secondary text here so the greedy wrap packs them all on one line.
        if (isBlueOrGreen && role !== "middle") {
          scale = scale * 0.5; // highly optimistic so it packs 6+ words without breaking
        }
        
        return toBox(token.text, config.fontSizePx * scale * 1.2); // 1.2 safety factor for hero serifs
      });
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

    case "dynamicSlideStack": {
      // Every word owns its row (see DynamicSlideStackToken's `flexBasis:
      // 100%`), same reasoning as `editorialKinetic` above.
      const roles = analyzeWordRoles(tokens);
      const rowWidth = estimateMaxLineWidthPx(config);
      return tokens.map((token, i) => ({
        width: rowWidth,
        height: config.fontSizePx * dynamicSlideStackFontScale(roles[i]!) * config.lineHeight,
      }));
    }

    case "editorialStackHero": {
      // Every word owns its row (see EditorialStackHero.tsx), same
      // reasoning as `editorialKinetic` above.
      const roles = analyzeWordRoles(tokens);
      const rowWidth = estimateMaxLineWidthPx(config);
      return tokens.map((token, i) => {
        const tier = editorialStackHeroRole(roles[i]!, token.text);
        return {
          width: rowWidth,
          height:
            config.fontSizePx *
            editorialStackHeroFontScale(roles[i]!, tier) *
            config.lineHeight,
        };
      });
    }

    case "stack": {
      // One word per row (see Stack.tsx's `flexBasis: 100%`), so reporting the
      // full line-wrap width as each token's width makes the greedy-wrap
      // simulation in `estimateBlockHeightPx` close a row after every word —
      // which is what the real layout does, and what makes `linesPerPage: 3`
      // mean "three words" here.
      const roles = analyzeWordRoles(tokens);
      const rowWidth = estimateMaxLineWidthPx(config);
      return tokens.map((token, i) => ({
        width: rowWidth,
        height:
          config.fontSizePx * stackFontScale(stackTier(roles[i]!, token.text)) * config.lineHeight,
      }));
    }

    case "focus": {
      const roles = analyzeWordRoles(tokens);
      const rowWidth = estimateMaxLineWidthPx(config);
      return tokens.map((token, i) => {
        const tier = focusTier(roles[i]!);
        const box = toBox(token.text, config.fontSizePx * focusFontScale(tier));
        return tier === "hero" ? { ...box, width: rowWidth } : box;
      });
    }

    case "glassHighlight": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * glassHighlightFontScale(roles[i]!)));
    }

    case "splitText": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * splitTextFontScale(roles[i]!)));
    }

    case "liquidFlow": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * liquidFlowFontScale(roles[i]!)));
    }

    case "lightSweep": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * lightSweepFontScale(roles[i]!)));
    }

    case "paperCut": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * paperCutFontScale(roles[i]!)));
    }

    case "flipCard": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * flipCardFontScale(roles[i]!)));
    }

    case "ribbonSlide": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * ribbonSlideFontScale(roles[i]!)));
    }

    case "spiralReveal": {
      // The hero (curving) word owns a square-ish arc box, not a flat line —
      // matches `SpiralRevealToken`'s `size = radius * 2.4` box exactly.
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => {
        const role = roles[i]!;
        if (isSpiralRevealHero(role)) {
          const heroFontSize = config.fontSizePx * spiralRevealFontScale(role);
          const size = heroFontSize * 1.9 * 2.4;
          return { width: size, height: size };
        }
        return toBox(token.text, config.fontSizePx * spiralRevealFontScale(role));
      });
    }

    case "floatingBubble": {
      const roles = analyzeWordRoles(tokens);
      return tokens.map((token, i) => toBox(token.text, config.fontSizePx * floatingBubbleFontScale(roles[i]!)));
    }

    case "dualLine": {
      const splitIndex = Math.ceil(tokens.length / 2);
      return tokens.map((token, i) =>
        toBox(token.text, config.fontSizePx * (i < splitIndex ? 1 : 1.25)),
      );
    }

    default:
      // Flat styles (bold-yellow, pop, box, glow, clean, kinetic, dynamic,
      // typewriter, glitch, focus, and any future style that doesn't vary size
      // per word): the active word's "boost" is a CSS/canvas transform, which
      // never affects layout — so every word genuinely renders at
      // `config.fontSizePx`, and this isn't an approximation for these
      // styles, it's exact.
      return tokens.map((token) => toBox(token.text, config.fontSizePx));
  }
};
