"use client";

import { interpolateColors } from "remotion";
import type { CaptionPage, CaptionStyleConfig, CaptionToken } from "@/core";
import {
  BOX_PAD_X_RATIO,
  BOX_PAD_Y_RATIO,
  BOX_RADIUS_RATIO,
  GLOW_RADII,
  VIDEO_FPS,
  anchorFraction,
  applyTextCase,
  clampAnchor,
  hasDevanagari,
  horizontalFraction,
  resolveTextCase,
  withOpacity,
  canvasScale,
  captionMaxWidthPx,
  findActivePageIndex,
  lineGapPx,
  msToFrames,
  scaleStyleConfig,
} from "@/core";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  ENTER_SUBTLE,
  tokenEnter,
  tokenHighlight,
  tokenPulse,
  pageEntrance,
  maskRevealX,
  splitEntrance,
  letterStagger,
  layeredDepthDrift,
  maskRevealY,
  glitchBurst,
  focusEnvelope,
  popWordState,
} from "@/remotion/captions/animation";
import {
  HERO_SMALL_RATIO,
  getSplashWordRole,
  heroWordIndex,
  specialWordIndex,
  getHash,
  kineticVariant,
  isKineticAccentWord,
  lightenHex,
  annotationFontId,
  heroFontStyle,
  isUnderlinePunchAccent,
  underlinePunchFontScale,
  isHighlightMarkerAccent,
  highlightMarkerFontScale,
  isMixedWeightKeyword,
  mixedWeightFontScale,
  kineticSplitSide,
  isKineticSplitAccent,
  kineticSplitFontScale,
  roleCaseTransform,
  frameProgress,
  pickFrameState,
  CENTER_PUNCH_STATES,
  centerPunchFontScale,
  verticalImpactCharFontSize,
  verticalImpactColumnHeight,
  isEditorialStackKeyword,
  editorialStackFontScale,
  isMagazineCutKeyword,
  magazineCutFontScale,
  minimalLuxuryFontScale,
  minimalLuxuryTrackingRatio,
  layeredDepthForegroundScale,
  isPopScaleHero,
  popScaleFontScale,
  isSlideInAccent,
  slideInFontScale,
  slideInDirection,
  isBlurFocusAccent,
  blurFocusFontScale,
  isTypewriterAccent,
  isRotateRevealAccent,
  rotateRevealFontScale,
  isWipeUpAccent,
  wipeUpFontScale,
  isStrokeFillAccent,
  strokeFillFontScale,
  isBounceWordAccent,
  bounceWordFontScale,
  isGlitchAccent,
  isHighlightWordAccent,
  highlightWordFontScale,
  isZoomFocusAccent,
  zoomFocusFontScale,
  isGradientFlowAccent,
  gradientFlowFontScale,
  isMaskRevealHero,
  maskRevealFontScale,
  isDrawOnScript,
  drawOnFontScale,
  isDepth3dAccent,
  depth3dFontScale,
  roleTextCase,
  editorialKineticRole,
  editorialKineticFontScale,
  isEditorialKineticAccent,
  isDynamicSlideStackHero,
  dynamicSlideStackFontScale,
  dynamicSlideStackDirection,
  DESIGN_WALLA_SMALL_RATIO,
  designWallaHeroIsScript,
  designWallaHeroDirection,
  designWallaEditorialTier,
  designWallaEditorialFontScale,
  designWallaEditorialRow,
  designWallaProRole,
  designWallaProBlueRole,
  designWallaProDirection,
  designWallaProHeroIsSerif,
  designWallaProFontScale,
  designWallaProBlueFontScale,
  isGlassHighlightAccent,
  glassHighlightFontScale,
  isSplitTextHero,
  splitTextFontScale,
  isLiquidFlowAccent,
  liquidFlowFontScale,
  liquidRibbonControlPoints,
  isLightSweepAccent,
  lightSweepFontScale,
  isPaperCutAccent,
  paperCutFontScale,
  paperStripClipPath,
  type PaperCutPoint,
  isFlipCardAccent,
  flipCardFontScale,
  isRibbonSlideAccent,
  ribbonSlideFontScale,
  ribbonSlideSide,
  ribbonClipPath,
  isSpiralRevealHero,
  spiralRevealFontScale,
  spiralCharAngleDeg,
  floatingBubbleFontScale,
  floatingBubbleOffset,
  floatingBubbleTint,
  editorialStackHeroRole,
  editorialStackHeroFontScale,
  isEditorialStackHeroAccent,
  stackTier,
  stackFontScale,
  stackRowAlign,
  stackRowOffsetPx,
  stackTierIsUpper,
  isStackAccentColour,
  isFocusAccent,
  isFocusScript,
  focusFontScale,
  focusFontWeight,
  focusTier,
  focusTierIsUpper,
  focusWordOpacity,
  bigGrandRole,
  bigGrandTransform,
  resolveSecondaryFontSize,
  resolveSpecialFontSize,
  PREMIUM_HALO,
  premiumStrokePx,
} from "@/remotion/captions/primitives";
import { resolveEmphasis, DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE } from "@/remotion/styles/DynamicHighlight";
import { canvasFont, resolveFontFamily } from "./fonts";

/**
 * Canvas2D caption renderer — the export-side twin of the DOM styles.
 *
 * WHY THIS EXISTS: an exported frame is a `VideoFrame`, not a DOM tree, so the
 * captions have to be drawn with the 2D context. Rasterising the real DOM
 * (SVG `foreignObject` → `drawImage`) was rejected: it needs every font
 * inlined, silently drops `-webkit-text-stroke`, and costs a serialise-and-
 * decode round trip on all 1,800 frames of a 60s reel.
 *
 * WHAT KEEPS IT HONEST: this file shares the *inputs* with the DOM renderer
 * rather than reimplementing them — the same `CaptionStyleConfig`, the same
 * `scaleStyleConfig`, the same layout constants from `core/styles/layout`, and
 * critically the same `spring()` helpers from `remotion/captions/animation`.
 * Only the drawing calls differ. If a caption looks different in the export
 * than the preview, the bug is in this file, not in the timing.
 */

type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

interface Measured {
  token: CaptionToken;
  index: number;
  width: number;
  /**
   * Resting size this token is drawn at.
   *
   * Carried per token rather than assumed to be `config.fontSizePx`, because
   * two engines now draw words at different sizes on the same line — `splash`
   * oversizes its accent word, and `hero` sets everything except the headline
   * at a third scale. Without this the row height is computed from a size
   * nothing on the row is actually drawn at.
   */
  fontSize: number;
}

interface Line {
  items: Measured[];
  width: number;
  /**
   * Row height, from the tallest item on the row.
   *
   * Mirrors CSS: a flex row is as tall as its tallest child. The previous
   * uniform `fontSizePx * lineHeight` was correct only while every engine drew
   * every word at one size, and it already disagreed with the preview for
   * `splash`, whose accent word is 1.15x.
   */
  height: number;
}

/**
 * Wraps words into centred lines, mirroring the DOM's `flex-wrap` behaviour.
 *
 * Widths are measured at resting size, ignoring the active word's scale — CSS
 * transforms do not affect layout, so a scaled word must not shift its
 * neighbours here either.
 */
const getRenderText = (
  token: CaptionToken,
  config: CaptionStyleConfig,
  index: number,
  totalTokens: number,
  heroIndex: number,
  heroMixedBackdrop = false,
  specialIndex = -1,
  pageSeed = 0,
): string => {
  const text = token.text.trim();
  if (config.styleId === "splash") {
    const role = getSplashWordRole(text, index, totalTokens);
    if (role === "accent") {
      return text.toUpperCase();
    }
    return text;
  }
  if (config.styleId === "dualLine") {
    const splitIndex = Math.ceil(totalTokens / 2);
    return index < splitIndex ? text.toUpperCase() : text;
  }
  if (config.styleId === "designWalla") {
    if (index !== heroIndex) return applyTextCase(text, resolveTextCase(config));
    const isScript = designWallaHeroIsScript(pageSeed) && !hasDevanagari(text);
    return isScript ? text : text.toUpperCase();
  }
  if (config.styleId.startsWith("designWallaEditorial")) {
    const tier = designWallaEditorialTier(index, heroIndex, specialIndex, totalTokens);
    if (tier === "punch") return text.toUpperCase();
    if (tier === "serif") return text.toLowerCase();
    return applyTextCase(text, resolveTextCase(config));
  }
  if (config.styleId.startsWith("designWallaPro")) {
    if (index === heroIndex) return text.toUpperCase();
    return applyTextCase(text, resolveTextCase(config));
  }
  if (config.styleId === "bigGrand") {
    return hasDevanagari(text) ? text : text.toUpperCase();
  }
  if (config.styleId === "hero") {
    // The headline is forced upper, the supporting text forced lower —
    // unconditionally, same as `heroMixed`'s annotation layer just below.
    // The small/BIG/small case contrast is this template's own signature,
    // not something that should depend on whatever case the user picked for
    // the template overall.
    return index === heroIndex ? text.toUpperCase() : text.toLowerCase();
  }
  if (config.styleId === "heroMixed") {
    if (index === heroIndex) return text.toUpperCase();
    // Poster scenes' bold overlay words are a normal caption read, not the
    // annotation layer — they follow the template's own case, matching
    // HeroMixed.tsx's overlay span (which inherits `textStyle` unmodified).
    if (heroMixedBackdrop) return applyTextCase(text, resolveTextCase(config));
    // The stacked layout's small annotation text forces lowercase
    // unconditionally (the case-mix against the shouted headline is this
    // engine's signature), so this must match rather than reuse `hero`'s
    // "respect the template" rule — that would upper-case the annotation
    // words in the export while the live preview kept showing them lowercase.
    return text.toLowerCase();
  }
  if (config.styleId === "dynamicTypography") {
    if (index === heroIndex) return text.toLowerCase();
    if (index < heroIndex) return text.toLowerCase();
    return text.toUpperCase();
  }
  if (config.styleId === "dynamicHighlight") {
    const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
    if (emphasis === "supporting") return text.toLowerCase();
    if (emphasis === "important") return text.toUpperCase();
    if (emphasis === "special") return text;
    return applyTextCase(text, resolveTextCase(config));
  }
  if (config.styleId === "editorialKinetic" || config.styleId === "editorialKineticPop") {
    // Display words shout in caps, editorial and support words stay
    // lowercase — the same case contrast `EditorialKineticToken` applies via
    // CSS `text-transform`, reproduced here since Canvas has none.
    const ekRole = editorialKineticRole(token.role ?? "normal", text);
    return ekRole === "display" ? text.toUpperCase() : text.toLowerCase();
  }
  if (config.styleId === "stack") {
    // Headline and anchor rows shout in caps, the italic accent and the tiny
    // support words stay lowercase — the same contrast `StackToken` applies
    // via CSS `text-transform`, reproduced here since Canvas has none.
    return stackTierIsUpper(stackTier(token.role ?? "normal", text))
      ? text.toUpperCase()
      : text.toLowerCase();
  }
  if (config.styleId === "focus") {
    return focusTierIsUpper(focusTier(token.role ?? "normal"))
      ? text.toUpperCase()
      : text.toLowerCase();
  }
  if (config.styleId === "editorialStackHero") {
    // Main/primary words shout in caps, secondary/support words stay
    // lowercase — the same case contrast `EditorialStackHeroToken` applies
    // via CSS `text-transform`, reproduced here since Canvas has none.
    const tier = editorialStackHeroRole(token.role ?? "normal", text);
    return tier === "main" || tier === "primary" ? text.toUpperCase() : text.toLowerCase();
  }
  // Canvas has no `text-transform`, so casing is applied to the string
  // itself. Goes through `roleTextCase` (shared with the DOM's
  // `roleCaseTransform`) rather than the flat `resolveTextCase`, so the
  // ~25 role-aware engines' highlighted/de-emphasised words draw upper/
  // lower cased the same way here as in the preview.
  return applyTextCase(text, roleTextCase(token.role ?? "normal", config));
};

const layoutLines = (
  ctx: Ctx,
  page: CaptionPage,
  config: CaptionStyleConfig,
  maxWidth: number,
  family: string,
  heroIndex: number,
  heroMixedBackdrop: boolean,
  specialIndex: number,
  frame: number,
  fps: number,
  pageSeed: number,
): Line[] => {
  const lines: Line[] = [];
  let current: Measured[] = [];
  let currentWidth = 0;

  const rowHeight = (items: readonly Measured[]): number => {
    const tallest = items.reduce((max, item) => Math.max(max, item.fontSize), 0);
    return tallest * config.lineHeight;
  };

  const flush = (): void => {
    if (current.length === 0) return;
    lines.push({
      items: current,
      width: currentWidth,
      height: rowHeight(current),
    });
    current = [];
    currentWidth = 0;
  };

  const heroSmallRatio =
    config.annotationSizeRatio > 0 ? config.annotationSizeRatio : HERO_SMALL_RATIO;

  page.tokens.forEach((token, index) => {
    const text = getRenderText(token, config, index, page.tokens.length, heroIndex, heroMixedBackdrop, specialIndex, pageSeed);
    let fontSize = config.fontSizePx;
    let fontToRestore: string | null = null;
    let letterSpacingToRestore: string | null = null;

    if (config.styleId === "splash") {
      const role = getSplashWordRole(text, index, page.tokens.length);
      if (role === "accent") {
        fontSize = config.fontSizePx * 1.15;
        ctx.font = canvasFont(Math.max(800, config.fontWeight), fontSize, family);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (role === "script") {
        let scriptFamily = family;
        if (config.specialFontId) {
          scriptFamily = resolveFontFamily(config.specialFontId);
        } else if (!family.toLowerCase().includes("playfair") && !family.toLowerCase().includes("caveat")) {
          scriptFamily = resolveFontFamily("playfair");
        }
        fontSize = resolveSpecialFontSize(config, 1.05);
        ctx.font = canvasFont(config.fontWeight, fontSize, scriptFamily, "italic");
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else {
        fontSize = resolveSecondaryFontSize(config, 1.0);
        const secFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
        ctx.font = canvasFont(config.fontWeight, fontSize, secFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      }
    } else if (config.styleId === "dualLine") {
      const splitIndex = Math.ceil(page.tokens.length / 2);
      const isTopLine = index < splitIndex;
      const isScript = !isTopLine && !hasDevanagari(text);
      fontSize = isTopLine ? config.fontSizePx : resolveSpecialFontSize(config, 1.25);
      const fam = isTopLine
        ? family
        : isScript
          ? resolveFontFamily(config.specialFontId ?? config.secondaryFontId ?? "kaushanScript")
          : family;
      const weight = isTopLine ? Math.max(800, config.fontWeight) : 700;
      ctx.font = canvasFont(weight, fontSize, fam, isScript ? "italic" : "normal");
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "heroMixed" && heroMixedBackdrop) {
      // Poster scene: the hero is drawn separately as a full-bleed backdrop
      // (see the block above the lines loop), so it takes no space in flow.
      // Everything else draws bold, not the thin annotation size — this text
      // is what actually gets read, not a caption for the giant word.
      if (index === heroIndex) return;
      fontSize = resolveSecondaryFontSize(config, 0.52);
      ctx.font = canvasFont(800, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if ((config.styleId === "hero" || config.styleId === "heroMixed" || config.styleId === "maskReveal") && index !== heroIndex) {
      // Mirrors HeroMixed.tsx's `fitScale`: shrink the annotation side that's
      // carrying more words so it stays on one row instead of wrapping.
      // `hero` (Hero Stack) isn't included — its own layout wasn't reported
      // as wrapping and this wasn't asked for there.
      const clusterSize =
        config.styleId === "heroMixed"
          ? index < heroIndex
            ? heroIndex
            : page.tokens.length - heroIndex - 1
          : 0;

      const fitScale = clusterSize <= 2 ? 1 : clusterSize === 3 ? 0.88 : 0.78;

      fontSize = resolveSecondaryFontSize(config, heroSmallRatio) * fitScale;
      // Mirrors HeroMixed.tsx: heroMixed's annotation alternates between two
      // condensed sans faces per word; `hero` (HeroStack) keeps the
      // template's own font — this multi-font treatment wasn't asked for
      // there.
      const annotationFamily =
        config.secondaryFontId
          ? resolveFontFamily(config.secondaryFontId)
          : (config.styleId === "heroMixed" ? resolveFontFamily(annotationFontId(text)) : family);
      ctx.font = canvasFont(
        config.annotationWeight > 0 ? config.annotationWeight : 500,
        fontSize,
        annotationFamily,
      );
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "maskReveal" && index === heroIndex) {
      fontSize = config.fontSizePx * 1.5;
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "popScale") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * popScaleFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "heroMixed" && index === heroIndex) {
      // Mirrors HeroMixed.tsx's `heroFontStyle` — measured at the same face
      // it will actually be drawn in, or the row would wrap against a width
      // that doesn't match what ends up on screen.
      const style = heroFontStyle(text);
      if (style === "cursive") {
        const fam = config.specialFontId ? resolveFontFamily(config.specialFontId) : resolveFontFamily("caveat");
        ctx.font = canvasFont(700, config.fontSizePx, fam);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (style === "impact") {
        ctx.font = canvasFont(400, config.fontSizePx, resolveFontFamily("anton"));
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (style === "serif") {
        const fam = config.specialFontId ? resolveFontFamily(config.specialFontId) : resolveFontFamily("playfair");
        ctx.font = canvasFont(700, config.fontSizePx, fam, "italic");
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      }
    } else if (config.styleId === "dynamicHighlight") {
      const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
      const primaryFontFamily = family;
      const secondaryFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : primaryFontFamily;
      const specialFontFamily = config.specialFontId ? resolveFontFamily(config.specialFontId) : primaryFontFamily;

      if (emphasis === "supporting") {
        fontSize = config.fontSizePx * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.supporting;
        ctx.font = canvasFont(400, fontSize, secondaryFontFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (emphasis === "normal") {
        fontSize = config.fontSizePx * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.normal;
        ctx.font = canvasFont(600, fontSize, secondaryFontFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (emphasis === "important") {
        fontSize = config.fontSizePx * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.important;
        ctx.font = canvasFont(900, fontSize, primaryFontFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (emphasis === "special") {
        fontSize = config.fontSizePx * DYNAMIC_HIGHLIGHT_EMPHASIS_SCALE.special;
        ctx.font = canvasFont(400, fontSize, specialFontFamily, "italic");
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      }
    } else if (config.styleId === "editorialOverlay") {
      if (index === heroIndex) return; // Do not include hero in flow layout

      const secondaryFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
      fontSize = config.fontSizePx * 0.45;
      ctx.font = canvasFont(500, fontSize, secondaryFontFamily);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "underlinePunch") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * underlinePunchFontScale(role);
      ctx.font = canvasFont(isUnderlinePunchAccent(role) ? 800 : 400, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "highlightMarker") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * highlightMarkerFontScale(role);
      ctx.font = canvasFont(isHighlightMarkerAccent(role) ? 800 : 500, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "mixedWeight") {
      const role = token.role ?? "normal";
      const isKeyword = isMixedWeightKeyword(role);
      const wFamily = isKeyword
        ? family
        : config.secondaryFontId
          ? resolveFontFamily(config.secondaryFontId)
          : family;
      fontSize = config.fontSizePx * mixedWeightFontScale(role);
      ctx.font = canvasFont(isKeyword ? 900 : 300, fontSize, wFamily);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "kineticSplit") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * kineticSplitFontScale(role);
      ctx.font = canvasFont(isKineticSplitAccent(role) ? 800 : 500, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "centerPunch") {
      const role = token.role ?? "normal";
      const pageProgress = frameProgress(
        frame,
        msToFrames(page.startMs, fps),
        msToFrames(page.durationMs, fps),
      );
      const state = pickFrameState(pageProgress, CENTER_PUNCH_STATES);
      fontSize = config.fontSizePx * centerPunchFontScale(role, state);
      ctx.font = canvasFont(role === "critical" ? 900 : 500, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "editorialStack") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const isKeyword = isEditorialStackKeyword(role);
      const isBigTier = isDevanagariWord || isKeyword;
      fontSize = config.fontSizePx * editorialStackFontScale(role, isDevanagariWord);
      const fam = isDevanagariWord
        ? resolveFontFamily("notoSerifDevanagari")
        : isKeyword
          ? family
          : config.secondaryFontId
            ? resolveFontFamily(config.secondaryFontId)
            : family;
      const weight = role === "critical" ? 700 : isBigTier ? 600 : 500;
      ctx.font = canvasFont(weight, fontSize, fam);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "magazineCut") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      fontSize = config.fontSizePx * magazineCutFontScale(role, isDevanagariWord);
      const isKeyword = isMagazineCutKeyword(role);
      const fam = isKeyword
        ? family
        : isDevanagariWord
          ? resolveFontFamily("notoSerifDevanagari")
          : config.secondaryFontId
            ? resolveFontFamily(config.secondaryFontId)
            : family;
      ctx.font = canvasFont(isKeyword ? 800 : isDevanagariWord ? 600 : 400, fontSize, fam);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "minimalLuxury") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const isKeyword = role === "critical" || role === "keyword";
      fontSize = config.fontSizePx * minimalLuxuryFontScale(role, isDevanagariWord);
      const fam = isDevanagariWord
        ? resolveFontFamily("notoSerifDevanagari")
        : isKeyword
          ? family
          : config.secondaryFontId
            ? resolveFontFamily(config.secondaryFontId)
            : family;
      ctx.font = canvasFont(isKeyword || isDevanagariWord ? 500 : 300, fontSize, fam);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "layeredDepth") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const isCritical = role === "critical";
      fontSize = config.fontSizePx * layeredDepthForegroundScale(role);
      const fam = isCritical
        ? config.secondaryFontId
          ? resolveFontFamily(config.secondaryFontId)
          : family
        : isDevanagariWord
          ? resolveFontFamily("notoSerifDevanagari")
          : config.secondaryFontId
            ? resolveFontFamily(config.secondaryFontId)
            : family;
      ctx.font = canvasFont(500, fontSize, fam);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "slideIn") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * slideInFontScale(role);
      ctx.font = canvasFont(isSlideInAccent(role) ? 800 : config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "blurFocus") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * blurFocusFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "rotateReveal") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * rotateRevealFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "wipeUp") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * wipeUpFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "strokeFill") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * strokeFillFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "bounceWord") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * bounceWordFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "highlightWord") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * highlightWordFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "zoomFocus") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * zoomFocusFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "gradientFlow") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * gradientFlowFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "maskReveal") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * maskRevealFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "drawOn") {
      const role = token.role ?? "normal";
      const isScript = isDrawOnScript(role);
      fontSize = config.fontSizePx * drawOnFontScale(role);
      const scriptFamily = isScript
        ? family
        : config.secondaryFontId
          ? resolveFontFamily(config.secondaryFontId)
          : family;
      ctx.font = canvasFont(config.fontWeight, fontSize, scriptFamily);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "depth3d") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * depth3dFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "editorialKinetic" || config.styleId === "editorialKineticPop") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const ekRole = editorialKineticRole(role, text);
      fontSize = config.fontSizePx * editorialKineticFontScale(role, ekRole);
      const fam = isDevanagariWord
        ? ekRole === "support"
          ? resolveFontFamily("devanagari")
          : resolveFontFamily("notoSerifDevanagari")
        : ekRole === "display"
          ? family
          : ekRole === "editorial"
            ? resolveFontFamily(config.specialFontId ?? "playfair")
            : resolveFontFamily(config.secondaryFontId ?? "inter");
      const weight = ekRole === "display" ? config.fontWeight : ekRole === "editorial" ? 500 : 600;
      const style = ekRole === "editorial" && !isDevanagariWord ? "italic" : "normal";
      ctx.font = canvasFont(weight, fontSize, fam, style);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "editorialStackHero") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const tier = editorialStackHeroRole(role, text);
      fontSize = config.fontSizePx * editorialStackHeroFontScale(role, tier);
      const fam = isDevanagariWord
        ? tier === "support"
          ? resolveFontFamily("devanagari")
          : resolveFontFamily("notoSerifDevanagari")
        : tier === "main" || tier === "primary"
          ? family
          : tier === "secondary"
            ? resolveFontFamily(config.specialFontId ?? "playfair")
            : resolveFontFamily(config.secondaryFontId ?? "inter");
      const weight = tier === "main" || tier === "primary" ? config.fontWeight : tier === "secondary" ? 500 : 600;
      const style = tier === "secondary" && !isDevanagariWord ? "italic" : "normal";
      ctx.font = canvasFont(weight, fontSize, fam, style);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "stack") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const tier = stackTier(role, text);
      fontSize = config.fontSizePx * stackFontScale(tier);
      const fam = isDevanagariWord
        ? tier === "support"
          ? resolveFontFamily("devanagari")
          : resolveFontFamily("notoSerifDevanagari")
        : tier === "hero" || tier === "primary"
          ? family
          : tier === "accent"
            ? resolveFontFamily(config.specialFontId ?? "playfair")
            : resolveFontFamily(config.secondaryFontId ?? "inter");
      const weight =
        tier === "hero" || tier === "primary" ? config.fontWeight : tier === "accent" ? 500 : 600;
      const style = tier === "accent" && !isDevanagariWord ? "italic" : "normal";
      ctx.font = canvasFont(weight, fontSize, fam, style);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "focus") {
      // Uniform size — only the accent word's face changes, and it still has
      // to be *measured* in that face or the row wraps against a width the
      // draw pass never uses. Devanagari keeps the primary face (Playfair has
      // no Devanagari and the Noto fallback has no italic), matching
      // `FocusToken`.
      const role = token.role ?? "normal";
      const tier = focusTier(role);
      const isScript = isFocusScript(role) && !hasDevanagari(text);
      fontSize = config.fontSizePx * focusFontScale(tier);
      const fam = isScript
        ? resolveFontFamily(config.specialFontId ?? "playfair")
        : tier === "support" || tier === "body"
          ? resolveFontFamily(config.secondaryFontId ?? "instrumentSans")
          : family;
      ctx.font = canvasFont(
        focusFontWeight(tier, config),
        fontSize,
        fam,
        isScript ? "italic" : "normal",
      );
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "designWalla") {
      const isDwHero = index === heroIndex;
      const smallRatio =
        config.annotationSizeRatio > 0 ? config.annotationSizeRatio : DESIGN_WALLA_SMALL_RATIO;

      if (!isDwHero) {
        fontSize = resolveSecondaryFontSize(config, smallRatio);
        const smallFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
        ctx.font = canvasFont(
          config.annotationWeight > 0 ? config.annotationWeight : 700,
          fontSize,
          smallFamily,
        );
      } else if (designWallaHeroIsScript(pageSeed) && !hasDevanagari(text)) {
        fontSize = resolveSpecialFontSize(config, 1.05);
        ctx.font = canvasFont(400, fontSize, resolveFontFamily(config.specialFontId ?? "grandHotel"), "italic");
      } else {
        fontSize = config.fontSizePx * 1.15;
        ctx.font = canvasFont(Math.max(800, config.fontWeight), fontSize, family);
      }
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId.startsWith("designWallaEditorial")) {
      const tier = designWallaEditorialTier(index, heroIndex, specialIndex, page.tokens.length);
      const scale = designWallaEditorialFontScale(tier);
      if (tier === "punch") {
        fontSize = config.fontSizePx * scale;
        ctx.font = canvasFont(Math.max(800, config.fontWeight), fontSize, family);
      } else if (tier === "serif") {
        fontSize = resolveSpecialFontSize(config, scale);
        const serifFamily = resolveFontFamily(config.specialFontId ?? "playfair");
        ctx.font = canvasFont(700, fontSize, serifFamily, "italic");
      } else {
        const supportRatio = config.annotationSizeRatio > 0 ? config.annotationSizeRatio : scale;
        fontSize = resolveSecondaryFontSize(config, supportRatio);
        const supportFamily = resolveFontFamily(config.secondaryFontId ?? "inter");
        ctx.font = canvasFont(config.annotationWeight > 0 ? config.annotationWeight : 700, fontSize, supportFamily);
      }
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId.startsWith("designWallaPro")) {
      const isBlueOrGreen = config.styleId === "designWallaProBlue" || config.styleId === "designWallaProGreen";
      const role = isBlueOrGreen ? designWallaProBlueRole(index, heroIndex, pageSeed) : designWallaProRole(index, heroIndex);
      const scale = isBlueOrGreen ? designWallaProBlueFontScale(role) : designWallaProFontScale(role);
      let fitScale = 1;
      const text = token.text.trim();
      if (isBlueOrGreen && role !== "middle" && text.length > 15) {
        fitScale = 15 / text.length;
      }
      if (role === "middle") {
        fontSize = (config.specialFontSizePx ? config.specialFontSizePx : config.fontSizePx * scale) * fitScale;
        ctx.font = canvasFont(Math.max(800, config.fontWeight), fontSize, family, "italic");
      } else {
        fontSize = (config.secondaryFontSizePx ? config.secondaryFontSizePx : config.fontSizePx * scale) * fitScale;
        const smallFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
        ctx.font = canvasFont(config.annotationWeight > 0 ? config.annotationWeight : 700, fontSize, smallFamily);
      }
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "dynamicSlideStack") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * dynamicSlideStackFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "glassHighlight") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * glassHighlightFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "splitText") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * splitTextFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "liquidFlow") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * liquidFlowFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "lightSweep") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * lightSweepFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "paperCut") {
      const role = token.role ?? "normal";
      const isAccent = isPaperCutAccent(role);
      fontSize = config.fontSizePx * paperCutFontScale(role);
      const paperFamily = isAccent
        ? family
        : config.secondaryFontId
          ? resolveFontFamily(config.secondaryFontId)
          : family;
      ctx.font = canvasFont(isAccent ? 900 : 500, fontSize, paperFamily);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "flipCard") {
      const role = token.role ?? "normal";
      const isAccent = isFlipCardAccent(role);
      fontSize = config.fontSizePx * flipCardFontScale(role);
      const cardFamily = isAccent
        ? family
        : config.secondaryFontId
          ? resolveFontFamily(config.secondaryFontId)
          : family;
      ctx.font = canvasFont(config.fontWeight, fontSize, cardFamily);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "ribbonSlide") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * ribbonSlideFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "spiralReveal") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * spiralRevealFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "floatingBubble") {
      const role = token.role ?? "normal";
      fontSize = config.fontSizePx * floatingBubbleFontScale(role);
      ctx.font = canvasFont(config.fontWeight, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "dynamicTypography") {
      let type: "heavy" | "cursive" | "small";
      if (index === heroIndex) {
        type = "cursive";
      } else if (index < heroIndex) {
        type = "small";
      } else {
        type = "heavy";
      }
      
      const montserrat = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : resolveFontFamily("montserrat");
      const playfair = config.specialFontId ? resolveFontFamily(config.specialFontId) : resolveFontFamily("playfair");
      
      if (type === "heavy") {
        fontSize = config.fontSizePx;
        ctx.font = canvasFont(900, fontSize, montserrat);
      } else if (type === "cursive") {
        fontSize = config.fontSizePx * 1.2;
        ctx.font = canvasFont(600, fontSize, playfair, "italic");
      } else if (type === "small") {
        fontSize = config.fontSizePx * 0.55;
        ctx.font = canvasFont(700, fontSize, montserrat);
      }
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "bigGrand") {
      const isHero = index === heroIndex;
      const isTopLine = index < heroIndex;
      const fontId = config.fontId || "montserrat";
      const specialFontId = config.specialFontId || fontId;
      let sizePx = config.fontSizePx || 125;
      let fontFam = resolveFontFamily(fontId);
      
      if (isHero) {
        sizePx = config.specialFontSizePx ? config.specialFontSizePx : sizePx;
        fontFam = resolveFontFamily(specialFontId);
        ctx.font = canvasFont(900, sizePx, fontFam);
      } else if (isTopLine) {
        sizePx = config.secondaryFontSizePx ? config.secondaryFontSizePx : sizePx * 0.52;
        ctx.font = canvasFont(800, sizePx, fontFam);
        ctx.letterSpacing = `${sizePx * 0.04}px`;
        letterSpacingToRestore = `${config.letterSpacingPx}px`;
      } else {
        sizePx = config.secondaryFontSizePx ? config.secondaryFontSizePx * 0.8 : sizePx * 0.40;
        ctx.font = canvasFont(800, sizePx, fontFam);
        ctx.letterSpacing = `${sizePx * 0.18}px`;
        letterSpacingToRestore = `${config.letterSpacingPx}px`;
      }
      fontSize = sizePx;
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    }

    // Spiral Reveal's hero word owns a square arc box (matches
    // `resolveTokenBoxes`' `size = radius * 2.4` estimate and
    // `SpiralRevealToken`'s SVG box exactly), not a normal text-width row
    // item — sized and measured here rather than in the generic path below
    // so neighbouring words never overlap the circle in the export.
    if (config.styleId === "spiralReveal") {
      const role = token.role ?? "normal";
      if (isSpiralRevealHero(role)) {
        const heroFontSize = config.fontSizePx * spiralRevealFontScale(role);
        const size = heroFontSize * 1.9 * 2.4;
        const measured: Measured = { token, index, width: size, fontSize: size / config.lineHeight };
        flush();
        lines.push({ items: [measured], width: size, height: size });
        return;
      }
    }

    // Vertical Impact's keyword is a stacked column, not a row item — it
    // needs its own width/height measurement and owns its row outright, so
    // it is handled before the generic single-line measurement below.
    if (config.styleId === "verticalImpact") {
      const role = token.role ?? "normal";
      const isDevanagariWord = hasDevanagari(text);
      const isVerticalKeyword = !isDevanagariWord && (role === "critical" || role === "keyword");

      if (isVerticalKeyword) {
        const charFontSize = verticalImpactCharFontSize(config.fontSizePx);
        ctx.font = canvasFont(config.fontWeight, charFontSize, family);
        let maxCharWidth = 0;
        for (const ch of text) maxCharWidth = Math.max(maxCharWidth, ctx.measureText(ch).width);
        const totalHeight = verticalImpactColumnHeight(text, config.fontSizePx);
        ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);

        const measured: Measured = {
          token, index, width: maxCharWidth, fontSize: totalHeight / config.lineHeight,
        };
        flush();
        lines.push({ items: [measured], width: maxCharWidth, height: totalHeight });
        return;
      }

      const scale = isDevanagariWord ? 1.15 : role === "connector" ? 0.55 : 0.65;
      fontSize = config.fontSizePx * scale;
      const vFamily = isDevanagariWord ? resolveFontFamily("devanagari") : family;
      ctx.font = canvasFont(config.fontWeight, fontSize, vFamily);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    }

    const width = ctx.measureText(text).width;
    if (fontToRestore) ctx.font = fontToRestore;
    if (letterSpacingToRestore) ctx.letterSpacing = letterSpacingToRestore;

    const measured: Measured = { token, index, width, fontSize };

    // The hero owns its row, exactly as `flexBasis: 100%` does in the DOM:
    // close whatever was accumulating, emit the hero alone, and let the
    // remaining words start a fresh row beneath it.
    if (
      (config.styleId === "hero" ||
        config.styleId === "heroMixed" ||
        config.styleId === "maskReveal" ||
        config.styleId === "designWalla" ||
        config.styleId.startsWith("designWallaPro") ||
        config.styleId === "bigGrand") &&
      index === heroIndex
    ) {
      flush();
      lines.push({ items: [measured], width, height: rowHeight([measured]) });
      return;
    }

    if (config.styleId === "dualLine" && index === Math.ceil(page.tokens.length / 2)) {
      flush();
    }

    if (config.styleId.startsWith("designWallaEditorial")) {
      const texts = page.tokens.map((t) => t.text);
      const currentRow = designWallaEditorialRow(index, texts);
      const prevRow = index > 0 ? designWallaEditorialRow(index - 1, texts) : -1;
      if (index > 0 && currentRow !== prevRow) {
        flush();
      }
    }

    if (config.styleId === "focus" && focusTier(token.role ?? "normal") === "hero") {
      flush();
      lines.push({ items: [measured], width, height: rowHeight([measured]) });
      return;
    }
    
    // In dynamicHighlight, Important and Special words own their own row too.
    if (config.styleId === "dynamicHighlight") {
      const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
      if (emphasis === "important" || emphasis === "special") {
        flush();
        lines.push({ items: [measured], width, height: rowHeight([measured]) });
        return;
      }
    }

    // Every Editorial Kinetic word owns its row — mirrors the DOM's
    // `flexBasis: 100%` on every token, matching `resolveTokenBoxes`'
    // one-row-per-token box-fit estimate.
    if (config.styleId === "editorialKinetic" || config.styleId === "editorialKineticPop") {
      flush();
      lines.push({ items: [measured], width, height: rowHeight([measured]) });
      return;
    }

    // Dynamic Slide Stack: every word owns its row too, mirroring the DOM's
    // `flexBasis: 100%` (see DynamicSlideStackToken). Design Walla no longer
    // belongs here — only its hero word owns a row (handled above); its
    // supporting words wrap together like `hero`'s small/BIG/small stack.
    if (config.styleId === "dynamicSlideStack") {
      flush();
      lines.push({ items: [measured], width, height: rowHeight([measured]) });
      return;
    }

    // Every Editorial Stack Hero word owns its row too, mirroring the DOM's
    // `flexBasis: 100%` (see EditorialStackHero.tsx), matching
    // `resolveTokenBoxes`' one-row-per-token box-fit estimate.
    if (config.styleId === "editorialStackHero") {
      flush();
      lines.push({ items: [measured], width, height: rowHeight([measured]) });
      return;
    }

    // Stack: one word per row too (see Stack.tsx's `flexBasis: 100%`), which
    // is what makes the three-row poster shape hold no matter how short the
    // words are. Matches `resolveTokenBoxes`' one-row-per-token estimate.
    if (config.styleId === "stack") {
      flush();
      lines.push({ items: [measured], width, height: rowHeight([measured]) });
      return;
    }

    const withGap =
      current.length === 0 ? width : currentWidth + config.wordGapPx + width;

    if (current.length > 0 && withGap > maxWidth) {
      flush();
      current = [measured];
      currentWidth = width;
      return;
    }

    current.push(measured);
    currentWidth = withGap;
  });

  flush();
  return lines;
};

const drawGlowPass = (
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  config: CaptionStyleConfig,
  bloomColor?: string,
  intensityFactor = 1,
): void => {
  if (!config.glowEnabled && config.styleId !== "glow") return;
  const bloom = bloomColor ?? config.glowColor ?? config.accentColor ?? "#ffd60a";
  const mult = (config.glowIntensity ?? 1) * intensityFactor;
  if (mult <= 0.01) return;

  const radiusScale = (config.glowRadius ?? 111.0) / 100;
  const threshold = config.glowThreshold ?? 72.5;
  const alpha = Math.max(0.1, 1 - (threshold / 100));

  let bloomStr = bloom;
  if (bloom.startsWith("#")) {
    let c = bloom.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const r = parseInt(c.slice(0, 2), 16) || 255;
    const g = parseInt(c.slice(2, 4), 16) || 255;
    const b = parseInt(c.slice(4, 6), 16) || 255;
    bloomStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  ctx.save();
  ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
  ctx.shadowBlur = config.fontSizePx * 0.08 * mult * radiusScale;
  ctx.fillStyle = bloomStr;
  ctx.fillText(text, x, y);

  ctx.shadowColor = bloomStr;
  for (const radius of GLOW_RADII) {
    ctx.shadowBlur = config.fontSizePx * radius * 1.35 * mult * radiusScale;
    ctx.fillText(text, x, y);
  }
  clearShadow(ctx);
  ctx.restore();
};

/**
 * Paints text with an outward-only stroke and optional glow.
 *
 * `strokeText` centres the stroke on the glyph outline, so half of it would eat
 * into the letterform — the exact problem `paint-order: stroke fill` solves in
 * the DOM. Doubling the width and drawing the stroke *before* the fill
 * reproduces that: the fill covers the inner half, leaving a clean outward
 * outline. This is what keeps thin Devanagari matras intact.
 */
const strokeThenFill = (
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  fill: string | CanvasGradient,
  strokeWidth: number,
  strokeColor: string,
  config?: CaptionStyleConfig,
  bloomColor?: string,
): void => {
  if (config && (config.glowEnabled || config.styleId === "glow")) {
    drawGlowPass(ctx, text, x, y, config, bloomColor);
  }
  if (strokeWidth > 0) {
    ctx.lineWidth = strokeWidth * 2;
    ctx.strokeStyle = strokeColor;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
};

const clearShadow = (ctx: Ctx): void => {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
};

/**
 * Canvas2D twin of the DOM's two-layer `text-shadow` (see `PREMIUM_HALO`).
 *
 * A `text-shadow` list paints every layer behind the glyph and then the glyph
 * on top; Canvas has no shadow list, so each layer is its own `fillText` pass
 * and a final unshadowed pass lays the crisp glyph over them. Same layers in
 * the same order, so `focus` and `stack` separate from footage identically in
 * the preview and in the exported file.
 *
 * Runs inside the per-token `ctx.save()`/`restore()`, so it does not have to
 * put the shadow state back itself.
 */
const fillWithHalo = (
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  fill: string,
  fontSizePx: number,
  strokeWidth: number,
  strokeColor: string,
): void => {
  ctx.fillStyle = fill;
  for (const layer of PREMIUM_HALO) {
    ctx.shadowColor = layer.color;
    ctx.shadowBlur = layer.blurRatio * fontSizePx;
    ctx.shadowOffsetY = layer.offsetYRatio * fontSizePx;
    ctx.fillText(text, x, y);
  }
  clearShadow(ctx);
  ctx.shadowOffsetY = 0;
  // Crisp pass last, over the halo. `strokeThenFill` keeps the hairline
  // outward-only, which is what stops it eating Devanagari matras.
  strokeThenFill(ctx, text, x, y, fill, strokeWidth, strokeColor);
};

export interface DrawCaptionsOptions {
  pages: readonly CaptionPage[];
  /** Authored against the reference canvas; scaled internally. */
  config: CaptionStyleConfig;
  timeMs: number;
  width: number;
  height: number;
  fps?: number;
}

/**
 * Draws the caption page for `timeMs` onto the context.
 *
 * No-op when no page is active, so the caller can call it unconditionally for
 * every frame.
 */
export const drawCaptions = (ctx: Ctx, options: DrawCaptionsOptions): void => {
  const { pages, timeMs, width, height } = options;
  const fps = options.fps ?? VIDEO_FPS;

  const config = scaleStyleConfig(options.config, canvasScale({ width, height }));

  const pageIndex = findActivePageIndex(pages, timeMs, config.holdMs);
  if (pageIndex === -1) return;
  const page = pages[pageIndex];
  if (page === undefined) return;

  const family = resolveFontFamily(config.fontId);
  const frame = (timeMs / 1000) * fps;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
  ctx.letterSpacing = `${config.letterSpacingPx}px`;

  const maxWidth = captionMaxWidthPx({ width, height }, config.maxLineWidthPct);
  // Same rule the preview uses, over the same strings, so the word that gets
  // enlarged is the same word in both. See `heroWordIndex`.
  const heroIndex = heroWordIndex(page.tokens.map((t) => t.text));
  // Mirrors CaptionOverlay: the header (important) and flourish (special)
  // words are picked independently, so a page can carry both at once.
  const specialIndex = specialWordIndex(page.tokens.map((t) => t.text), heroIndex);
  // Mirrors HeroMixedToken's `isBackdropScene` — same page id, same hash, so
  // the export never disagrees with the preview about which pages are posters.
  const pageSeed = getHash(page.id);
  const heroMixedBackdrop = config.styleId === "heroMixed" && pageSeed % 3 === 0;
  const lines = layoutLines(ctx, page, config, maxWidth, family, heroIndex, heroMixedBackdrop, specialIndex, frame, fps, pageSeed);

  const gapY = config.styleId === "dualLine"
    ? -0.34 * config.fontSizePx
    : lineGapPx(config.lineHeight, config.fontSizePx);
  const blockHeight =
    lines.reduce((total, line) => total + line.height, 0) +
    Math.max(0, lines.length - 1) * gapY;

  // Must match CaptionOverlay exactly — same clamp, same fractions. A drift
  // here is invisible in the preview and permanent in the exported file.
  const anchorY =
    clampAnchor(anchorFraction(config.placement, config.verticalOffsetPct)) *
    height;
  const anchorX = horizontalFraction(config.horizontalOffsetPct) * width;

  // Page entrance, identical to the DOM overlay: fade plus a small rise.
  const entrance = pageEntrance(frame, fps, msToFrames(page.startMs, fps));
  const entranceOffset = (1 - entrance) * 16 * canvasScale({ width, height });

  ctx.globalAlpha = entrance;

  const widestLine = lines.reduce((max, line) => Math.max(max, line.width), 0);

  // Plate behind the whole block, drawn before any glyphs — the DOM renderer
  // applies it to the row container, so it must be one shape here too, not one
  // per word.
  if (config.backgroundEnabled && widestLine > 0) {
    const padX = config.fontSizePx * 0.34;
    const padY = config.fontSizePx * 0.22;

    ctx.save();
    ctx.fillStyle = withOpacity(
      config.backgroundColor,
      config.backgroundOpacity,
    );
    ctx.beginPath();
    ctx.roundRect(
      anchorX - widestLine / 2 - padX,
      anchorY - blockHeight / 2 - padY + entranceOffset,
      widestLine + padX * 2,
      blockHeight + padY * 2,
      config.fontSizePx * 0.22,
    );
    ctx.fill();
    ctx.restore();
  }

  // Draw Editorial Overlay Hero Backdrop
  if (config.styleId === "editorialOverlay" && page.tokens[heroIndex]) {
    const heroToken = page.tokens[heroIndex];
    const text = heroToken.text.toUpperCase();
    const timing = {
      frame,
      fps,
      fromFrame: msToFrames(heroToken.fromMs, fps),
      toFrame: msToFrames(heroToken.toMs, fps),
    };

    const enterBouncy = tokenEnter(timing, ENTER_BOUNCY);

    const color = heroToken.color ?? config.activeColor;

    ctx.save();
    ctx.font = canvasFont(config.fontWeight || 500, config.fontSizePx * 2.2, family);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const scaleFactor = canvasScale({ width, height });
    ctx.translate(anchorX, anchorY);
    ctx.translate((1 - enterBouncy) * 20 * scaleFactor, 0);

    ctx.globalAlpha = entrance * enterBouncy;
    
    if (config.dropShadow) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = config.fontSizePx * 0.12 * scaleFactor;
      ctx.shadowOffsetY = config.fontSizePx * 0.06 * scaleFactor;
    }

    // Canvas doesn't natively support blur filter on text without shadow trick or filter prop.
    // The filter prop is standard in most modern browsers now.
    ctx.filter = `blur(${(1 - enterBouncy) * 10}px)`;

    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // Draw Hero Mixed's poster-scene backdrop. Mirrors HeroMixedToken's
  // `isBackdropScene` branch — the hero is skipped from `lines` above
  // (`layoutLines`'s `heroMixedBackdrop` case), so it has to be drawn here
  // instead, the same way editorialOverlay's hero is.
  if (heroMixedBackdrop && page.tokens[heroIndex]) {
    const heroToken = page.tokens[heroIndex];
    const text = heroToken.text.toUpperCase();
    const timing = {
      frame,
      fps,
      fromFrame: msToFrames(heroToken.fromMs, fps),
      toFrame: msToFrames(heroToken.toMs, fps),
    };

    const enterBouncy = tokenEnter(timing, ENTER_BOUNCY);
    const highlight = tokenHighlight(timing, ENTER_SMOOTH);

    const color = highlight > 0.01 ? config.activeColor : config.baseColor;
    const scaleFactor = canvasScale({ width, height });
    const backdropSize = config.fontSizePx * 2.1;

    ctx.save();
    ctx.font = canvasFont(config.fontWeight, backdropSize, family);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = `${backdropSize * -0.02}px`;

    ctx.translate(anchorX, anchorY);

    ctx.globalAlpha = entrance * 0.82 * enterBouncy;

    if (config.dropShadow) {
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = config.fontSizePx * 0.14 * scaleFactor;
      ctx.shadowOffsetY = config.fontSizePx * 0.06 * scaleFactor;
    }
    ctx.filter = `blur(${(1 - enterBouncy) * 10}px)`;

    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  if (config.dropShadow) {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = config.fontSizePx * 0.12;
    ctx.shadowOffsetY = config.fontSizePx * 0.06;
  }

  // Top of the block. Each row's centre is derived from its own height below,
  // rather than stepping by one shared line height — rows are no longer all the
  // same height once an engine mixes sizes.
  let y = anchorY - blockHeight / 2 + entranceOffset;

  for (const line of lines) {
    const lineCenterY = y + line.height / 2;
    // Mirrors the DOM's `justify-content`, measured against the widest line so
    // left/right alignment lines up edges rather than centring each row.
    let x =
      config.textAlign === "left"
        ? anchorX - widestLine / 2
        : config.textAlign === "right"
          ? anchorX + widestLine / 2 - line.width
          : anchorX - line.width / 2;

    for (const { token, index, width: tokenWidth } of line.items) {
      const text = getRenderText(
        token,
        config,
        index,
        page.tokens.length,
        heroIndex,
        heroMixedBackdrop,
        specialIndex,
        pageSeed,
      );
      const timing = {
        frame,
        fps,
        fromFrame: msToFrames(token.fromMs, fps),
        toFrame: msToFrames(token.toMs, fps),
      };

      // Centre of this word — every style transforms around it.
      const cx = x + tokenWidth / 2;
      const cy = lineCenterY;

      ctx.save();

      switch (config.styleId) {
        case "bold-yellow": {
          const highlight = tokenHighlight(timing, ENTER_SUBTLE);
          const colour = interpolateColors(
            highlight,
            [0, 1],
            [token.color ?? config.baseColor, token.color ?? config.activeColor],
          );

          const lift =
            highlight * 8 * config.emphasisScale * canvasScale({ width, height });
          ctx.translate(cx, cy - lift);
          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            colour,
            config.strokeWidthPx,
            config.strokeColor,
          );
          break;
        }

        case "pop": {
          const pulse = tokenPulse(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = interpolateColors(
            highlight,
            [0, 1],
            [token.color ?? config.baseColor, token.color ?? config.accentColor],
          );

          ctx.translate(cx, cy);
          ctx.rotate((pulse * -1.2 * Math.PI) / 180);
          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            colour,
            config.strokeWidthPx,
            config.strokeColor,
          );
          break;
        }

        case "box": {
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = interpolateColors(
            highlight,
            [0, 1],
            [config.baseColor, config.activeColor],
          );

          if (highlight > 0.01) {
            const padX = config.fontSizePx * BOX_PAD_X_RATIO;
            const padY = config.fontSizePx * BOX_PAD_Y_RATIO;
            const boxW = tokenWidth + padX * 2;
            const boxH = config.fontSizePx + padY * 2;

            ctx.save();
            ctx.globalAlpha = entrance * highlight;
            ctx.translate(cx, cy);
            ctx.fillStyle = token.color ?? config.accentColor;
            ctx.beginPath();
            ctx.roundRect(
              -boxW / 2,
              -boxH / 2,
              boxW,
              boxH,
              config.fontSizePx * BOX_RADIUS_RATIO,
            );
            ctx.fill();
            ctx.restore();
          }

          ctx.translate(cx, cy);
          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            colour,
            config.strokeWidthPx,
            config.strokeColor,
          );
          break;
        }

        case "glow": {
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = interpolateColors(
            highlight,
            [0, 1],
            [config.baseColor, config.activeColor],
          );
          const bloom = token.color ?? config.accentColor;

          const alpha = highlight > 0.01 ? 1 : (timing.fromFrame > frame ? 0.45 : 0.7);
          ctx.globalAlpha = entrance * alpha;

          ctx.translate(cx, cy);

          if (highlight > 0.01) {
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = config.fontSizePx * 0.08 * highlight;
            ctx.fillStyle = colour;
            ctx.fillText(text, -tokenWidth / 2, 0);

            ctx.shadowColor = bloom;
            for (const radius of GLOW_RADII) {
              ctx.shadowBlur = config.fontSizePx * radius * 1.35 * highlight;
              ctx.fillStyle = colour;
              ctx.fillText(text, -tokenWidth / 2, 0);
            }
            clearShadow(ctx);
          } else {
            ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
            ctx.shadowBlur = 6 * canvasScale({ width, height });
            ctx.shadowOffsetY = 2 * canvasScale({ width, height });
          }

          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            colour,
            config.strokeWidthPx,
            config.strokeColor,
          );
          clearShadow(ctx);
          break;
        }

        case "clean": {
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          ctx.globalAlpha =
            entrance *
            (config.upcomingOpacity + (1 - config.upcomingOpacity) * enter);

          ctx.translate(cx, cy + (1 - enter) * 4);
          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            token.color ?? config.baseColor,
            config.strokeWidthPx,
            config.strokeColor,
          );
          break;
        }
        
        case "dualLine": {
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const splitIndex = Math.ceil(page.tokens.length / 2);
          const isTopLine = index < splitIndex;
          const isScript = !isTopLine && !hasDevanagari(text);
          const scaleFactor = canvasScale({ width, height });

          // Clean, organized vertical animation:
          // Top row enters smoothly from up to down
          // Bottom row enters smoothly from down to up
          const travel = isTopLine
            ? (1 - enter) * -28 * scaleFactor
            : (1 - enter) * 28 * scaleFactor;

          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + travel);

          const color = isTopLine
            ? (token.color ?? config.accentColor ?? "#FF2A2A")
            : (token.color ?? config.baseColor ?? "#FFFFFF");
          const fam = isTopLine
            ? family
            : isScript
              ? resolveFontFamily(config.specialFontId ?? config.secondaryFontId ?? "kaushanScript")
              : family;
          const weight = isTopLine ? Math.max(800, config.fontWeight) : 700;
          const currentFontSize = config.fontSizePx * (isTopLine ? 1 : 1.25);
          ctx.font = canvasFont(weight, currentFontSize, fam, isScript ? "italic" : "normal");

          if (isTopLine) {
            if (config.glowEnabled) {
              drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, config.glowColor ?? config.accentColor ?? "#FF2A2A", 0.5);
            }
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = currentFontSize * 0.08;
            ctx.shadowOffsetY = currentFontSize * 0.03;
            ctx.fillStyle = color;
            ctx.fillText(text, -tokenWidth / 2, 0);
            clearShadow(ctx);
          } else {
            // Secondary cursive font: zero glow, zero outline
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = currentFontSize * 0.06;
            ctx.shadowOffsetY = currentFontSize * 0.03;
            ctx.fillStyle = color;
            ctx.fillText(text, -tokenWidth / 2, 0);
            clearShadow(ctx);
          }

          // Restore font for layout loop next iteration
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "splash": {
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const pulse = tokenPulse(timing, ENTER_BOUNCY);

          const role = getSplashWordRole(text, index, page.tokens.length);
          const inactiveOpacity = config.upcomingOpacity ?? 0.45;
          const isSpokenOrPast = timing.fromFrame <= frame;
          const alpha = isSpokenOrPast ? (highlight > 0.01 ? 1 : Math.max(0.65, inactiveOpacity)) : inactiveOpacity;
          ctx.globalAlpha = entrance * alpha;

          let roleFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
          let roleFontSize = config.fontSizePx;
          let roleColor = token.color ?? config.baseColor;
          let roleWeight = config.fontWeight;
          let roleStyle = "normal";

          if (role === "accent") {
            roleFontFamily = family;
            roleColor = token.color ?? config.accentColor;
            roleFontSize = config.fontSizePx * 1.15;
            roleWeight = Math.max(800, config.fontWeight);
          } else if (role === "script") {
            if (config.specialFontId) {
              roleFontFamily = resolveFontFamily(config.specialFontId);
            } else if (!roleFontFamily.toLowerCase().includes("playfair") && !roleFontFamily.toLowerCase().includes("caveat")) {
              roleFontFamily = resolveFontFamily("playfair");
            }
            roleStyle = "italic";
            roleFontSize = config.fontSizePx * 1.05;
          }

          ctx.font = canvasFont(roleWeight, roleFontSize, roleFontFamily, roleStyle);

          const translateY = (1 - enter) * 12 * canvasScale({ width, height }) - highlight * 4 * canvasScale({ width, height });
          const rotateDeg = role === "accent" ? (pulse * -2.5) : role === "script" ? -2 : 0;

          const colour = interpolateColors(
            highlight,
            [0, 1],
            [roleColor, role === "script" ? (token.color ?? config.activeColor) : roleColor],
          );

          ctx.translate(cx, cy + translateY);
          if (rotateDeg !== 0) {
            ctx.rotate((rotateDeg * Math.PI) / 180);
          }

          if (config.glowEnabled) {
            drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, colour, highlight > 0.01 ? 1 : 0.3);
          } else if (highlight > 0.01) {
            ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
            ctx.shadowBlur = 18 * canvasScale({ width, height });
            ctx.shadowOffsetY = 5 * canvasScale({ width, height });
          } else {
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 8 * canvasScale({ width, height });
            ctx.shadowOffsetY = 2 * canvasScale({ width, height });
          }

          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            colour,
            config.strokeWidthPx,
            config.strokeColor,
          );
          clearShadow(ctx);
          break;
        }

        case "hero": {
          // Mirror of HeroStack.tsx. The row break itself is already handled in
          // `layoutLines`; this only has to draw a word at the right size.
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const isSpoken = timing.fromFrame <= frame;
          const scaleFactor = canvasScale({ width, height });

          const smallRatio =
            config.annotationSizeRatio > 0
              ? config.annotationSizeRatio
              : HERO_SMALL_RATIO;

          if (index !== heroIndex) {
            const smallAlpha = isSpoken
              ? highlight > 0.01
                ? 1
                : Math.max(0.7, config.upcomingOpacity)
              : config.upcomingOpacity;

            let heroOffsetX = 0;
            let heroOffsetY = 0;
            let slideX = 0;
            let slideY = 0;
            const blurAmount = (1 - enter) * 8;
            
            if (index < heroIndex) {
              heroOffsetX = (widestLine - line.width) / 2;
              heroOffsetY = config.fontSizePx * 0.15 * scaleFactor; // Push down closer to hero
              slideX = (1 - enter) * -30 * scaleFactor;
              slideY = (1 - enter) * 15 * scaleFactor;
            } else if (index > heroIndex) {
              heroOffsetX = -(widestLine - line.width) / 2;
              heroOffsetY = -config.fontSizePx * 0.15 * scaleFactor; // Push up closer to hero
              slideX = (1 - enter) * 30 * scaleFactor;
              slideY = (1 - enter) * -15 * scaleFactor;
            }

            ctx.globalAlpha = entrance * smallAlpha;
            const displayRatio = smallRatio * 1.6;
            const smallSize = config.fontSizePx * displayRatio;
            ctx.font = canvasFont(
              700,
              smallSize,
              resolveFontFamily("tangerine"),
            );
            ctx.letterSpacing = `${smallSize * 0.02}px`;
            ctx.shadowColor = "rgba(0,0,0,0.85)";
            ctx.shadowBlur = 12 * scaleFactor;
            ctx.shadowOffsetY = 3 * scaleFactor;
            
            if (blurAmount > 0.05) ctx.filter = `blur(${blurAmount}px)`;

            ctx.translate(cx + heroOffsetX + slideX, cy + slideY + heroOffsetY);
            strokeThenFill(
              ctx,
              text,
              -tokenWidth / 2,
              0,
              config.annotationColor || config.baseColor,
              // Same floor as HeroStack.tsx — see the note there on why this is
              // the readability ratio and not a fraction of the hero's stroke.
              Math.max(
                config.fontSizePx * smallRatio * 0.085,
                config.strokeWidthPx * smallRatio * 1.4,
              ),
              config.strokeColor,
            );
            clearShadow(ctx);
            if (blurAmount > 0.05) ctx.filter = "none";
            // Restored for the next token, which may be the hero and must not
            // inherit the small face or its tracking.
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            ctx.letterSpacing = `${config.letterSpacingPx}px`;
            break;
          }

          ctx.globalAlpha =
            entrance * (isSpoken ? 1 : Math.max(0.5, config.upcomingOpacity));

          const heroColor = interpolateColors(highlight, [0, 1], [
            token.color ?? config.baseColor,
            token.color ?? config.accentColor,
          ]);

          const heroLift = (1 - enter) * 14 * scaleFactor;

          ctx.shadowColor = "rgba(0,0,0,0.72)";
          ctx.shadowBlur = (highlight > 0.01 ? 32 : 16) * scaleFactor;
          ctx.shadowOffsetY = (highlight > 0.01 ? 8 : 4) * scaleFactor;

          ctx.translate(cx, cy - heroLift);
          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            heroColor,
            config.strokeWidthPx,
            config.strokeColor,
          );
          clearShadow(ctx);
          break;
        }

        case "heroMixed": {
          const isSpoken = timing.fromFrame <= frame;
          const heroSmallRatio = config.annotationSizeRatio > 0 ? config.annotationSizeRatio : HERO_SMALL_RATIO;
          const isHero = index === heroIndex;
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);

          if (heroMixedBackdrop) {
            // Poster scene: the hero never reaches this switch — it was
            // skipped from `lines` in `layoutLines` and drawn separately as
            // the full-bleed backdrop above. Every token that does arrive
            // here is a bold overlay word, mirroring HeroMixed.tsx.
            const overlaySize = config.fontSizePx * 0.52;
            const overlayAlpha = isSpoken
              ? highlight > 0.01
                ? 1
                : Math.max(0.75, config.upcomingOpacity)
              : config.upcomingOpacity;

            ctx.globalAlpha = overlayAlpha;
            ctx.translate(cx, cy + (1 - enter) * 8);
            ctx.shadowColor = "rgba(0,0,0,0.55)";
            ctx.shadowBlur = 10 * canvasScale({ width, height });
            ctx.shadowOffsetY = 2 * canvasScale({ width, height });

            strokeThenFill(
              ctx,
              text,
              -tokenWidth / 2,
              0,
              highlight > 0.01 ? config.activeColor : config.baseColor,
              Math.max(overlaySize * 0.085, config.strokeWidthPx * 0.52 * 1.4),
              config.strokeColor,
            );
            clearShadow(ctx);
            break;
          }

          if (!isHero) {
            const smallAlpha = isSpoken
              ? highlight > 0.01
                ? 1
                : Math.max(0.7, config.upcomingOpacity)
              : config.upcomingOpacity;

            // Mirrors HeroMixed.tsx's `fitScale` — see the note in
            // `layoutLines`, which already computed the matching size for
            // this token's measured width.
            const clusterSize =
              index < heroIndex ? heroIndex : page.tokens.length - heroIndex - 1;
            const fitScale = clusterSize <= 2 ? 1 : clusterSize === 3 ? 0.88 : 0.78;
            const fittedRatio = heroSmallRatio * fitScale;

            // Mirrors HeroMixed.tsx's jitter — same hash of the same
            // (already-lowercased) `text`, so the wobble matches per word.
            const wordHash = getHash(text);
            const smallFontPx = config.fontSizePx * fittedRatio;
            const jitterYPx = ((wordHash % 5) - 2) * smallFontPx * 0.1;
            const jitterRotateRad = ((((wordHash >> 2) % 7) - 3) * 1.4 * Math.PI) / 180;
            const jitterScale = 0.9 + (((wordHash >> 5) % 5) / 5) * 0.2;

            ctx.globalAlpha = smallAlpha;
            ctx.translate(cx, cy + (1 - enter) * 6 + jitterYPx);
            ctx.rotate(jitterRotateRad);
            ctx.scale(jitterScale, jitterScale);

            // Alternates between two condensed sans faces per word, mirroring
            // HeroMixed.tsx's `annotationFontId` — `layoutLines` already
            // measured `tokenWidth` at this same face.
            ctx.font = canvasFont(
              config.annotationWeight > 0 ? config.annotationWeight : 500,
              smallFontPx,
              resolveFontFamily(config.secondaryFontId ?? annotationFontId(text)),
            );

            // A dark chip behind the glyphs, not just colour/stroke tuning —
            // mirrors HeroMixed.tsx: stroke and colour both depend on what's
            // *behind* the word, and a solid backdrop is the only guarantee
            // that holds for arbitrary footage.
            const padX = smallFontPx * 0.42;
            const padY = smallFontPx * 0.2;
            ctx.fillStyle = "rgba(8, 8, 14, 0.42)";
            ctx.beginPath();
            ctx.roundRect(
              -tokenWidth / 2 - padX,
              -smallFontPx * 0.5 - padY,
              tokenWidth + padX * 2,
              smallFontPx + padY * 2,
              smallFontPx * 0.5,
            );
            ctx.fill();

            // Mirrors HeroStackToken's `textShadow` — without it the small
            // words wash out against busy footage even with the stroke.
            ctx.shadowColor = "rgba(0,0,0,0.55)";
            ctx.shadowBlur = 10 * canvasScale({ width, height });
            ctx.shadowOffsetY = 2 * canvasScale({ width, height });

            strokeThenFill(
              ctx,
              text.toLowerCase(),
              -tokenWidth / 2,
              0,
              config.annotationColor || "#ececec",
              Math.max(
                config.fontSizePx * fittedRatio * 0.085,
                config.strokeWidthPx * fittedRatio * 1.4,
              ),
              config.strokeColor,
            );
            clearShadow(ctx);
            // Restored for the next token, which may be the hero — without
            // this the hero word silently inherited the small annotation
            // face instead of its own (the hero branch below never sets
            // `ctx.font` itself, relying on whatever was left here).
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          // Hero Word
          ctx.translate(cx, cy + (1 - enter) * -10);

          let colour = interpolateColors(
            highlight,
            [0, 1],
            [token.color ?? config.baseColor, token.color ?? config.activeColor],
          );

          let strokeWidth = config.strokeWidthPx;
          let displayTextStr = text.toUpperCase();

          // Mirrors HeroMixed.tsx's `heroFontStyle` — "primary" leaves font,
          // case and stroke at the template's defaults; the other three
          // borrow a face and adjust to suit it. Set explicitly (not left to
          // whatever `ctx.font` the previous token left behind) — see the
          // restore note in the annotation branch above for why that matters.
          const style = heroFontStyle(text);
          if (style === "cursive") {
            ctx.font = canvasFont(700, config.fontSizePx, resolveFontFamily(config.specialFontId ?? "caveat"));
            // The template's accent color, not a hardcoded white — otherwise
            // a template's `accentColor` had nowhere in this engine it ever
            // rendered.
            colour = token.color ?? config.accentColor;
            strokeWidth = Math.max(2, config.strokeWidthPx * 0.5);
            displayTextStr = text.toLowerCase();
          } else if (style === "impact") {
            ctx.font = canvasFont(400, config.fontSizePx, resolveFontFamily("anton"));
          } else if (style === "serif") {
            ctx.font = canvasFont(700, config.fontSizePx, resolveFontFamily(config.specialFontId ?? "playfair"), "italic");
            colour = token.color ?? config.accentColor;
            strokeWidth = Math.max(2, config.strokeWidthPx * 0.6);
            // Sentence case, not the forced uppercase every other variant
            // uses — `text` was already uppercased by `getRenderText`, so
            // recover the original casing straight from the token, matching
            // HeroMixed.tsx's `textTransform: 'none'`.
            displayTextStr = token.text.trim();
          } else {
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          }

          if (config.glowEnabled) {
            drawGlowPass(ctx, displayTextStr, -tokenWidth / 2, 0, config, colour, highlight > 0.01 ? 1 : 0.4);
          } else if (config.dropShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = config.fontSizePx * 0.12;
            ctx.shadowOffsetY = config.fontSizePx * 0.06;
          }

          strokeThenFill(
            ctx,
            displayTextStr,
            -tokenWidth / 2,
            0,
            colour,
            strokeWidth,
            config.strokeColor,
          );
          break;
        }

        case "dynamicTypography": {
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const isSpoken = timing.fromFrame <= frame;

          let translateY = 0;
          if (enter < 0.6) {
             translateY = 20 - (enter / 0.6) * 25;
          } else {
             const t = (enter - 0.6) / 0.4;
             translateY = -5 + t * 5;
          }
          
          const scaleFactor = canvasScale({ width, height });
          translateY = translateY * scaleFactor;

          let type: "heavy" | "cursive" | "small";
          if (index === heroIndex) {
            type = "cursive";
          } else if (index < heroIndex) {
            type = "small";
          } else {
            type = "heavy";
          }

          const montserrat = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : resolveFontFamily("montserrat");
          const playfair = config.specialFontId ? resolveFontFamily(config.specialFontId) : resolveFontFamily("playfair");

          let color = config.baseColor;
          const strokeWidth = config.strokeWidthPx;
          let displayFont = family;
          let weight = config.fontWeight;
          let style = "normal";
          let fontSizeStr = config.fontSizePx;

          if (type === "heavy") {
            displayFont = montserrat;
            weight = 900;
            color = token.color ?? config.accentColor;
          } else if (type === "cursive") {
            displayFont = playfair;
            weight = 600;
            style = "italic";
            fontSizeStr = config.fontSizePx * 1.2;
            color = "#ffffff";
          } else if (type === "small") {
            displayFont = montserrat;
            weight = 700;
            fontSizeStr = config.fontSizePx * 0.55;
            color = "#ffffff";
          }

          ctx.globalAlpha = entrance * (isSpoken ? 1 : Math.max(0, config.upcomingOpacity)) * enter;

          ctx.translate(cx, cy + translateY);

          ctx.font = canvasFont(weight, fontSizeStr, displayFont, style);

          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 10 * scaleFactor;
          ctx.shadowOffsetY = 4 * scaleFactor;
          ctx.shadowOffsetX = 2 * scaleFactor;

          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            color,
            strokeWidth,
            config.strokeColor,
          );
          clearShadow(ctx);
          break;
        }

        case "dynamicHighlight": {
          const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
          const enterSmooth = tokenEnter(timing, ENTER_SMOOTH);
          const enterSubtle = tokenEnter(timing, ENTER_SUBTLE);

          const primaryFontFamily = family;
          const secondaryFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : primaryFontFamily;
          const specialFontFamily = config.specialFontId ? resolveFontFamily(config.specialFontId) : primaryFontFamily;

          let alpha = 1;
          let yOffset = 0;
          let blurPx = 0;

          if (emphasis === "important") {
            // Mirrors DynamicHighlight.tsx: a slide-and-focus entrance.
            // `yOffset` is scaled by the shared `ctx.translate` call below,
            // like every other role here.
            yOffset = (1 - enterSmooth) * 22;
            blurPx = (1 - enterSmooth) * 7 * canvasScale({ width, height });
            alpha = enterSmooth;
          } else if (emphasis === "supporting") {
            yOffset = (1 - enterSmooth) * 15;
            alpha = enterSmooth;
          } else if (emphasis === "special") {
            yOffset = (1 - enterSubtle) * 8;
            alpha = enterSubtle;
          } else {
            alpha = enterSmooth;
          }

          ctx.globalAlpha = entrance * alpha;
          ctx.translate(cx, cy + yOffset * canvasScale({ width, height }));

          let roleFontFamily = primaryFontFamily;
          let roleFontSize = config.fontSizePx;
          let roleColor = config.baseColor;
          let roleWeight = config.fontWeight;
          let roleTransform = "none";
          let roleShadow = false;

          if (emphasis === "supporting") {
            roleFontFamily = secondaryFontFamily;
            roleFontSize = config.fontSizePx * 0.4;
            roleColor = "rgba(255, 255, 255, 0.75)";
            roleWeight = 400;
            roleTransform = "lowercase";
          } else if (emphasis === "normal") {
            roleFontFamily = secondaryFontFamily;
            roleFontSize = config.fontSizePx * 0.6;
            roleWeight = 600;
          } else if (emphasis === "important") {
            roleFontFamily = primaryFontFamily;
            roleFontSize = config.fontSizePx * 1.1;
            roleColor = token.color ?? config.activeColor;
            roleTransform = "uppercase";
            roleWeight = 900;
          } else if (emphasis === "special") {
            roleFontFamily = specialFontFamily;
            roleFontSize = config.fontSizePx * 0.9;
            roleColor = "#ffffff";
            roleTransform = "none";
            roleWeight = 400;
            roleShadow = true;
          }

          // Mirrors DynamicHighlight.tsx: only synthetically slant a serif
          // special font. A script face like Grand Hotel already leans, so
          // italicising it on top warps the letterforms.
          const specialItalic = emphasis === "special" && config.specialFontId === "playfair";
          ctx.font = canvasFont(
            roleWeight,
            roleFontSize,
            roleFontFamily,
            specialItalic ? "italic" : "normal",
          );

          if (roleShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 8 * canvasScale({ width, height });
            ctx.shadowOffsetY = 2 * canvasScale({ width, height });
          }

          if (blurPx > 0.05) ctx.filter = `blur(${blurPx}px)`;

          let displayText = text;
          if (roleTransform === "uppercase") displayText = text.toUpperCase();
          if (roleTransform === "lowercase") displayText = text.toLowerCase();

          const strokeWidth = emphasis === "special" ? 0 : config.strokeWidthPx;
          const strokeColor = emphasis === "special" ? "transparent" : config.strokeColor;

          let fill = roleColor;
          if (token.color && emphasis !== "important" && emphasis !== "special" && emphasis !== "supporting") {
            fill = token.color;
          }

          if (emphasis === "important") {
            const isGlowOn = Boolean(config.glowEnabled ?? true);
            const breathe = 0.8 + 0.2 * Math.sin((frame / fps) * Math.PI * 1.2);
            const glowStrength = enterSmooth * breathe * (config.glowIntensity ?? 0.5);
            const glowColor = config.glowColor ?? fill;
            const radiusScale = (config.glowRadius ?? 75.0) / 100;
            if (isGlowOn && glowStrength > 0.02) {
              ctx.shadowColor = "#ffffff";
              ctx.shadowBlur = roleFontSize * 0.06 * glowStrength * radiusScale;
              ctx.fillStyle = fill;
              ctx.fillText(displayText, -tokenWidth / 2, 0);

              ctx.shadowColor = glowColor;
              ctx.shadowBlur = roleFontSize * 0.16 * glowStrength * radiusScale;
              ctx.fillStyle = fill;
              ctx.fillText(displayText, -tokenWidth / 2, 0);

              clearShadow(ctx);
            }
          }

          strokeThenFill(
            ctx,
            displayText,
            -tokenWidth / 2,
            0,
            fill,
            strokeWidth,
            strokeColor,
          );
          
          if (roleShadow) clearShadow(ctx);
          break;
        }

        case "editorialOverlay": {
          // The hero was already drawn globally as a backdrop.
          // This loop only hits supporting text because layoutLines skipped the hero.
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const isSpoken = timing.fromFrame <= frame;

          const smallAlpha = isSpoken
            ? highlight > 0.01
              ? 1
              : Math.max(0.7, config.upcomingOpacity)
            : config.upcomingOpacity;

          ctx.globalAlpha = entrance * smallAlpha;
          ctx.translate(cx, cy + (1 - enter) * 10 * canvasScale({ width, height }));

          const secondaryFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : resolveFontFamily("poppins");
          ctx.font = canvasFont(500, config.fontSizePx * 0.45, secondaryFontFamily);

          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 4 * canvasScale({ width, height });
          ctx.shadowOffsetY = 2 * canvasScale({ width, height });

          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            token.color ?? "#FFFFFF",
            0,
            config.strokeColor,
          );
          
          clearShadow(ctx);
          break;
        }

        case "dual": {
          // Mirror of DualToken.tsx — annotation above, big word below.
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const pulse = tokenPulse(timing, ENTER_BOUNCY);

          const isImpactWord = index === page.tokens.length - 1 && page.tokens.length > 1;
          const isSingleWord = page.tokens.length === 1;
          const isSpokenOrPast = timing.fromFrame <= frame;

          const alpha = isSpokenOrPast
            ? highlight > 0.01 ? 1 : Math.max(0.6, config.upcomingOpacity)
            : config.upcomingOpacity;
          ctx.globalAlpha = entrance * alpha;

          const bigColor = interpolateColors(highlight, [0, 1], [
            token.color ?? config.baseColor,
            token.color ?? config.accentColor,
          ]);

          const shouldAnimate = isImpactWord || isSingleWord;
          const popRotate = shouldAnimate ? pulse * -1.5 : 0;
          const liftY = (1 - enter) * 10 * canvasScale({ width, height });

          const annotationSizeRatio = config.annotationSizeRatio > 0 ? config.annotationSizeRatio : 0.30;
          const annotationFontSize = config.fontSizePx * annotationSizeRatio;
          const annotationWeight = config.annotationWeight > 0 ? config.annotationWeight : 300;
          const annotationColor = config.annotationColor || "#ffffff";
          const annotationAlpha = isSpokenOrPast ? (highlight > 0.01 ? 0.85 : 0.5) : 0.35;
          const annotationStroke = Math.max(1, config.strokeWidthPx * 0.4);
          const annotationFamily = resolveFontFamily("poppins");
          const annotationSlide = (1 - enter) * -6 * canvasScale({ width, height });

          // ---- Draw annotation (above) ----
          ctx.save();
          ctx.globalAlpha = entrance * annotationAlpha;
          ctx.font = canvasFont(annotationWeight, annotationFontSize, annotationFamily);
          ctx.letterSpacing = "0.04em";
          const annotationWidth = ctx.measureText(text).width;
          // Position: same cx, but shifted up by big-word half + annotation half + gap
          const annotationGap = annotationFontSize * 0.15;
          const annotationCy = cy - config.fontSizePx * 0.55 - annotationFontSize * 0.5 - annotationGap + annotationSlide;
          ctx.translate(cx, annotationCy + entranceOffset);
          strokeThenFill(ctx, text, -annotationWidth / 2, 0, annotationColor, annotationStroke, config.strokeColor);
          ctx.restore();

          // ---- Draw big word (below) ----
          ctx.save();
          ctx.globalAlpha = entrance * alpha;
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          ctx.letterSpacing = `${config.letterSpacingPx}px`;
          ctx.translate(cx, cy + entranceOffset - liftY);
          ctx.rotate((popRotate * Math.PI) / 180);

          if (highlight > 0.01) {
            ctx.shadowColor = "rgba(0,0,0,0.7)";
            ctx.shadowBlur = 28 * canvasScale({ width, height });
            ctx.shadowOffsetY = 6 * canvasScale({ width, height });
          } else {
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 12 * canvasScale({ width, height });
            ctx.shadowOffsetY = 3 * canvasScale({ width, height });
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, bigColor, config.strokeWidthPx, config.strokeColor);
          clearShadow(ctx);
          ctx.restore();
          break;
        }

        case "kinetic": {
          // Mirror of Kinetic.tsx — six deterministic entrance variants per
          // word, plus a light 45° gradient with a moving white shine (no
          // stroke) on the accent-hashed third.
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });
          const isSpoken = timing.fromFrame <= frame;

          const variant = kineticVariant(text, index);
          const isAccent = isKineticAccentWord(text);

          const settle = enter < 0 ? 0 : enter > 1 ? 1 : enter;
          const arrive = 1 - settle;

          let dx = 0;
          let dy = 0;
          let blurPx = 0;

          switch (variant) {
            case "slideUp":
              dy = arrive * 46;
              blurPx = arrive * 9;
              break;
            case "slideDown":
              dy = arrive * -46;
              blurPx = arrive * 9;
              break;
            case "slideLeft":
              dx = arrive * 60;
              blurPx = arrive * 9;
              break;
            case "slideRight":
              dx = arrive * -60;
              blurPx = arrive * 9;
              break;
            case "blurPop":
              blurPx = arrive * 14;
              break;
            case "blurOut":
              blurPx = arrive * 14;
              break;
          }

          const colour = interpolateColors(
            highlight,
            [0, 1],
            [token.color ?? config.baseColor, token.color ?? config.activeColor],
          );

          ctx.globalAlpha =
            entrance *
            (isSpoken
              ? highlight > 0.01
                ? 1
                : Math.max(0.85, config.upcomingOpacity)
              : config.upcomingOpacity);

          ctx.translate(cx + dx * scaleFactor, cy + dy * scaleFactor);
          if (blurPx > 0.05) ctx.filter = `blur(${blurPx * scaleFactor}px)`;

          if (config.dropShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = config.fontSizePx * 0.1 * scaleFactor;
            ctx.shadowOffsetY = config.fontSizePx * 0.05 * scaleFactor;
          }

          if (isAccent) {
            // Mirrors Kinetic.tsx: a light 45°-diagonal identity gradient
            // (both ends lightened tints of accentColor, never the raw,
            // fully-saturated colour) plus a white shine, and no stroke — the
            // black outline reads as a heavy border once it's sitting under a
            // gradient rather than a flat fill, and the gradient already
            // separates the word from the footage on its own.
            const accent = token.color ?? config.accentColor;
            const angleRad = (45 * Math.PI) / 180;
            // CSS gradient angle → canvas direction: 0deg is up (0,-1), 90deg
            // is right (1,0); this is that same mapping.
            const gdx = Math.sin(angleRad);
            const gdy = -Math.cos(angleRad);
            const radius = Math.max(tokenWidth, config.fontSizePx) * 0.6;

            const baseGradient = ctx.createLinearGradient(
              -gdx * radius, -gdy * radius,
              gdx * radius, gdy * radius,
            );
            baseGradient.addColorStop(0, lightenHex(accent, 0.65));
            baseGradient.addColorStop(1, lightenHex(accent, 0.15));

            ctx.fillStyle = baseGradient;
            ctx.fillText(text, -tokenWidth / 2, 0);

            // Moving white shine: a second pass composited only onto the
            // glyphs just drawn (`source-atop`), sliding the *gradient's own
            // coordinates* rather than rewriting its colour-stop offsets each
            // frame. The stops stay fixed at 0/0.42/0.5/0.58/1, so — unlike
            // the earlier version, which clamped per-frame stop offsets and
            // could collapse two onto the same position — there is no
            // degenerate case here to alias into a seam.
            ctx.save();
            ctx.globalCompositeOperation = "source-atop";
            clearShadow(ctx);
            const travel = (-1.5 + settle * 3) * radius;
            const shineGradient = ctx.createLinearGradient(
              -gdx * radius + gdx * travel, -gdy * radius + gdy * travel,
              gdx * radius + gdx * travel, gdy * radius + gdy * travel,
            );
            shineGradient.addColorStop(0, "rgba(255,255,255,0)");
            shineGradient.addColorStop(0.42, "rgba(255,255,255,0)");
            shineGradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
            shineGradient.addColorStop(0.58, "rgba(255,255,255,0)");
            shineGradient.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = shineGradient;
            ctx.fillText(text, -tokenWidth / 2, 0);
            ctx.restore();
          } else {
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, config.strokeWidthPx, config.strokeColor);
          }
          clearShadow(ctx);
          break;
        }

        case "underlinePunch": {
          const role = token.role ?? "normal";
          const isAccent = isUnderlinePunchAccent(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });

          const roleFontSize = config.fontSizePx * underlinePunchFontScale(role);
          ctx.font = canvasFont(isAccent ? 800 : 400, roleFontSize, family);

          const color = token.color ?? "#ffffff";
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy - (1 - enter) * 14 * scaleFactor);

          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0, color,
            isAccent ? config.strokeWidthPx : 0, config.strokeColor,
          );

          if (isAccent) {
            const delayFrames = Math.round(fps * 0.12);
            const underlineProgress = maskRevealX(
              { frame, fps, fromFrame: timing.fromFrame + delayFrames },
              ENTER_SMOOTH,
            );
            const barHeight = Math.max(3, roleFontSize * 0.06);
            ctx.fillStyle = token.color ?? config.accentColor;
            ctx.fillRect(-tokenWidth / 2, roleFontSize * 0.42, tokenWidth * underlineProgress, barHeight);
          }

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "highlightMarker": {
          const role = token.role ?? "normal";
          const isKeyword = isHighlightMarkerAccent(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });

          const roleFontSize = config.fontSizePx * highlightMarkerFontScale(role);
          ctx.font = canvasFont(isKeyword ? 800 : 500, roleFontSize, family);

          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy - (1 - enter) * 12 * scaleFactor);

          if (isKeyword) {
            const delayFrames = Math.round(fps * 0.1);
            const highlightProgress = maskRevealX(
              { frame, fps, fromFrame: timing.fromFrame + delayFrames },
              ENTER_SMOOTH,
            );
            const padX = roleFontSize * 0.16;
            const padY = roleFontSize * 0.08;
            ctx.fillStyle = token.color ?? config.accentColor;
            ctx.beginPath();
            ctx.roundRect(
              -tokenWidth / 2 - padX,
              -roleFontSize / 2 - padY,
              (tokenWidth + padX * 2) * highlightProgress,
              roleFontSize + padY * 2,
              roleFontSize * 0.08,
            );
            ctx.fill();
            ctx.fillStyle = "#111111";
            ctx.fillText(text, -tokenWidth / 2, 0);
          } else {
            strokeThenFill(
              ctx, text, -tokenWidth / 2, 0,
              token.color ?? "#ffffff", 0, config.strokeColor,
            );
          }

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "mixedWeight": {
          const role = token.role ?? "normal";
          const isKeyword = isMixedWeightKeyword(role);
          const isDevanagariWord = hasDevanagari(token.text);
          const scaleFactor = canvasScale({ width, height });

          const roleFontSize = config.fontSizePx * mixedWeightFontScale(role);
          const wFamily = isKeyword
            ? family
            : config.secondaryFontId
              ? resolveFontFamily(config.secondaryFontId)
              : family;
          ctx.font = canvasFont(isKeyword ? 900 : 300, roleFontSize, wFamily);

          let alpha: number;
          let translateY = 0;

          if (isKeyword) {
            alpha = tokenEnter(timing, ENTER_SMOOTH);
          } else if (isDevanagariWord) {
            const enter = tokenEnter(timing, ENTER_BOUNCY);
            alpha = enter;
            translateY = (1 - enter) * 20 * scaleFactor;
          } else {
            alpha = tokenEnter(timing, ENTER_SMOOTH);
          }

          ctx.globalAlpha = entrance * alpha;
          ctx.translate(cx, cy + translateY);
          ctx.fillStyle = token.color ?? (isKeyword ? config.accentColor : config.baseColor);
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "kineticSplit": {
          const role = token.role ?? "normal";
          const isAccent = isKineticSplitAccent(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });

          const side = kineticSplitSide(index);
          const travelPx = isAccent ? 260 : 160;
          const offsetX = splitEntrance(side, travelPx, timing, ENTER_SMOOTH) * scaleFactor;

          const roleFontSize = config.fontSizePx * kineticSplitFontScale(role);
          ctx.font = canvasFont(isAccent ? 800 : 500, roleFontSize, family);

          const color = isAccent ? (token.color ?? config.accentColor) : (token.color ?? "#ffffff");
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + offsetX, cy);
          // Small supporting text stays clean — only the accent word keeps
          // the template's stroke, mirroring `KineticSplitToken`'s DOM version.
          strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, isAccent ? config.strokeWidthPx : 0, config.strokeColor);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "centerPunch": {
          const role = token.role ?? "normal";
          const isCritical = role === "critical";
          const pageProgress = frameProgress(
            frame,
            msToFrames(page.startMs, fps),
            msToFrames(page.durationMs, fps),
          );
          const state = pickFrameState(pageProgress, CENTER_PUNCH_STATES);

          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const roleFontSize = config.fontSizePx * centerPunchFontScale(role, state);
          ctx.font = canvasFont(isCritical ? 900 : 500, roleFontSize, family);

          const color = isCritical ? (token.color ?? config.accentColor) : (token.color ?? "#ffffff");
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          // Small buildup text stays clean — only the critical word keeps the
          // template's stroke, mirroring `CenterPunchToken`'s DOM version.
          strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, isCritical ? config.strokeWidthPx : 0, config.strokeColor);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "verticalImpact": {
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const isVerticalKeyword = !isDevanagariWord && (role === "critical" || role === "keyword");
          const scaleFactor = canvasScale({ width, height });

          if (isVerticalKeyword) {
            const charFontSize = verticalImpactCharFontSize(config.fontSizePx);
            const totalHeight = verticalImpactColumnHeight(text, config.fontSizePx);
            const staggerFrames = Math.round(fps * 0.05);
            const lineStep = charFontSize * 0.94 + 2 * scaleFactor;
            let charY = cy - totalHeight / 2 + charFontSize / 2;

            ctx.font = canvasFont(config.fontWeight, charFontSize, family);
            ctx.textAlign = "center";
            // Only the page's critical word gets the accent colour running
            // down its column — mirrors `VerticalImpactToken`'s DOM version.
            const isCritical = role === "critical";
            const color = token.color ?? (isCritical ? config.accentColor : config.baseColor);

            Array.from(text).forEach((ch, i) => {
              const reveal = letterStagger(i, timing, ENTER_SMOOTH, staggerFrames);
              ctx.save();
              ctx.globalAlpha = entrance * reveal;
              ctx.translate(cx, charY + (1 - reveal) * 10 * scaleFactor);
              // The vertical keyword keeps the template's stroke on every
              // letter, mirroring `VerticalImpactToken`'s DOM version, which
              // never overrides `textStyle`'s stroke for this branch.
              strokeThenFill(ctx, ch, 0, 0, color, config.strokeWidthPx, config.strokeColor);
              ctx.restore();
              charY += lineStep;
            });

            ctx.textAlign = "left";
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const clampedEnter = enter < 0 ? 0 : enter > 1 ? 1 : enter;
          const scale = isDevanagariWord ? 1.15 : role === "connector" ? 0.55 : 0.65;
          const vFamily = isDevanagariWord ? resolveFontFamily("devanagari") : family;
          const roleFontSize = config.fontSizePx * scale;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, vFamily);
          ctx.globalAlpha = entrance * clampedEnter;
          ctx.translate(cx, cy + (1 - clampedEnter) * 16 * scaleFactor);
          // The dominant Hindi word keeps the template's stroke; the small
          // English connector/supporting tier stays clean — mirrors
          // `VerticalImpactToken`'s DOM version.
          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0,
            isDevanagariWord ? (token.color ?? config.accentColor) : (token.color ?? "#ffffff"),
            isDevanagariWord ? config.strokeWidthPx : 0, config.strokeColor,
          );

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "editorialStack": {
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const isKeyword = isEditorialStackKeyword(role);
          const isCritical = role === "critical";
          const isBigTier = isDevanagariWord || isKeyword;
          const roleFontSize = config.fontSizePx * editorialStackFontScale(role, isDevanagariWord);
          const scaleFactor = canvasScale({ width, height });
          const fam = isDevanagariWord
            ? resolveFontFamily("notoSerifDevanagari")
            : isKeyword
              ? family
              : config.secondaryFontId
                ? resolveFontFamily(config.secondaryFontId)
                : family;
          const weight = isCritical ? 700 : isBigTier ? 600 : 500;
          ctx.font = canvasFont(weight, roleFontSize, fam);

          // Mirrors `EditorialStackToken`'s Editorial-Kinetic-style reveal:
          // blur + rise on the big serif tier, a quiet fade-up on everything
          // else. Only the critical word carries the accent colour.
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const yOffset = (isBigTier ? (1 - enter) * 22 : (1 - enter) * 8) * scaleFactor;
          const blurPx = isBigTier ? (1 - enter) * 7 * scaleFactor : 0;
          const color = isCritical
            ? (token.color ?? config.accentColor)
            : isBigTier
              ? (token.color ?? config.baseColor)
              : (token.color ?? "#ffffff");

          ctx.filter = blurPx > 0.3 ? `blur(${blurPx}px)` : "none";
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);
          ctx.filter = "none";

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "magazineCut": {
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const isKeyword = isMagazineCutKeyword(role);
          const roleFontSize = config.fontSizePx * magazineCutFontScale(role, isDevanagariWord);
          const scaleFactor = canvasScale({ width, height });

          if (isKeyword) {
            const reveal = maskRevealX(timing, ENTER_SMOOTH);
            const drift = layeredDepthDrift(frame, fps, 6, 9) * scaleFactor;
            ctx.font = canvasFont(800, roleFontSize, family);
            ctx.letterSpacing = `${-roleFontSize * 0.02}px`;

            ctx.save();
            ctx.beginPath();
            ctx.rect(
              cx - tokenWidth / 2 + drift - 4,
              cy - roleFontSize,
              tokenWidth * reveal + 8,
              roleFontSize * 2,
            );
            ctx.clip();
            ctx.globalAlpha = entrance * Math.min(1, reveal * 3);
            ctx.translate(cx + drift, cy);
            // Only the page's critical word carries the accent colour —
            // mirrors `MagazineCutToken`'s DOM version.
            ctx.fillStyle = token.color ?? (role === "critical" ? config.accentColor : config.baseColor);
            ctx.fillText(text, -tokenWidth / 2, 0);
            ctx.restore();

            ctx.letterSpacing = `${config.letterSpacingPx}px`;
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          if (isDevanagariWord) {
            const enter = tokenEnter(timing, ENTER_SUBTLE);
            ctx.font = canvasFont(600, roleFontSize, resolveFontFamily("notoSerifDevanagari"));
            ctx.globalAlpha = entrance * enter;
            ctx.translate(cx, cy);
            ctx.fillStyle = token.color ?? config.accentColor;
            ctx.fillText(text, -tokenWidth / 2, 0);
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const fam = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
          ctx.font = canvasFont(400, roleFontSize, fam);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          ctx.fillStyle = token.color ?? "#ffffff";
          ctx.fillText(text, -tokenWidth / 2, 0);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "minimalLuxury": {
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const isCritical = role === "critical";
          const isKeyword = isCritical || role === "keyword";
          const isNumber = role === "number";
          const scaleFactor = canvasScale({ width, height });

          const roleFontSize = config.fontSizePx * minimalLuxuryFontScale(role, isDevanagariWord);
          const fam = isDevanagariWord
            ? resolveFontFamily("notoSerifDevanagari")
            : isKeyword
              ? family
              : config.secondaryFontId
                ? resolveFontFamily(config.secondaryFontId)
                : family;

          ctx.font = canvasFont(isKeyword || isDevanagariWord ? 500 : 300, roleFontSize, fam);
          // Static tracking, not animated — see `MinimalLuxuryToken`'s doc
          // comment on why letter-spacing must not vary per frame here.
          ctx.letterSpacing = `${roleFontSize * minimalLuxuryTrackingRatio(role) * scaleFactor}px`;

          const enter = tokenEnter(timing, ENTER_SUBTLE);
          const color = isDevanagariWord
            ? (token.color ?? config.accentColor)
            : isCritical
              ? (token.color ?? config.accentColor)
              : isKeyword
                ? (token.color ?? config.baseColor)
                : isNumber
                  ? (token.color ?? config.accentColor)
                  : (token.color ?? "#ffffff");
          const yOffset = isKeyword || isDevanagariWord ? (1 - enter) * 8 * scaleFactor : 0;

          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.letterSpacing = `${config.letterSpacingPx}px`;
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "layeredDepth": {
          const role = token.role ?? "normal";
          const isCritical = role === "critical";
          const isDevanagariWord = hasDevanagari(token.text);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });
          const drift = layeredDepthDrift(frame, fps, 10, 7) * scaleFactor;

          if (isCritical) {
            const backdropText = token.text.trim().toUpperCase();
            const backdropSize = config.fontSizePx * 2.6;
            ctx.save();
            ctx.font = canvasFont(700, backdropSize, family);
            const backdropWidth = ctx.measureText(backdropText).width;
            // Top of the spec's own "10-20% opacity" range — mirrors
            // `LayeredDepthToken`'s DOM version.
            ctx.globalAlpha = entrance * 0.2 * enter;
            ctx.translate(cx + drift, cy);
            ctx.fillStyle = config.baseColor;
            ctx.fillText(backdropText, -backdropWidth / 2, 0);
            ctx.restore();
          }

          const roleFontSize = config.fontSizePx * layeredDepthForegroundScale(role);
          const fam = isCritical
            ? config.secondaryFontId
              ? resolveFontFamily(config.secondaryFontId)
              : family
            : isDevanagariWord
              ? resolveFontFamily("notoSerifDevanagari")
              : config.secondaryFontId
                ? resolveFontFamily(config.secondaryFontId)
                : family;
          // The critical word's readable foreground copy carries the accent
          // colour — mirrors `LayeredDepthToken`'s DOM version.
          const color = isCritical
            ? (token.color ?? config.accentColor)
            : (token.color ?? (isDevanagariWord ? config.accentColor : config.baseColor));

          ctx.font = canvasFont(500, roleFontSize, fam);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        // ====================================================================
        // 15 PREMIUM TEMPLATES (CANVAS EXPORT PARITY)
        // ====================================================================

        case "popScale": {
          const role = token.role ?? "normal";
          const isHero = isPopScaleHero(role);
          const roleFontSize = config.fontSizePx * popScaleFontScale(role);
          const enter = tokenEnter(timing, isHero ? ENTER_BOUNCY : ENTER_SMOOTH);
          const colour = token.color ?? (isHero ? config.accentColor : config.baseColor);
          const yOffset = isHero ? 0 : (1 - enter) * 14;
          const blurPx = isHero ? (1 - Math.min(1, enter * 1.4)) * 6 : 0;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);
          if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;

          if (isHero) {
            const tickW = roleFontSize * 0.1;
            const tickH = roleFontSize * 0.46;
            ctx.fillStyle = colour;
            ctx.globalAlpha = entrance * enter * 0.85;
            ctx.fillRect(-tokenWidth / 2 - roleFontSize * 0.24 - tickW, -tickH / 2, tickW, tickH);
            ctx.fillRect(tokenWidth / 2 + roleFontSize * 0.24, -tickH / 2, tickW, tickH);
            ctx.globalAlpha = entrance * enter;
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, isHero ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.filter = "none";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "slideIn": {
          const role = token.role ?? "normal";
          const isAccent = isSlideInAccent(role);
          const roleFontSize = config.fontSizePx * slideInFontScale(role);
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const dir = slideInDirection(role, index);
          const travel = dir === "up" ? 60 : 90;
          const offset = (1 - enter) * travel;
          const scaleFactor = canvasScale({ width, height });
          const tx = (dir === "left" ? -offset : dir === "right" ? offset : 0) * scaleFactor;
          const ty = (dir === "up" ? offset : 0) * scaleFactor;
          const blurPx = Math.abs(1 - enter) * 8;

          ctx.font = canvasFont(isAccent ? 800 : config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + tx, cy + ty);
          if (blurPx > 0.5) ctx.filter = `blur(${blurPx}px)`;

          if (isAccent) {
            const padX = roleFontSize * 0.18;
            const fullW = tokenWidth + padX * 2;
            const pillW = fullW * highlight;
            const originX = dir === "right" ? tokenWidth / 2 + padX - pillW : -tokenWidth / 2 - padX;
            ctx.fillStyle = config.accentColor;
            ctx.beginPath();
            ctx.roundRect(originX, -roleFontSize * 0.58, pillW, roleFontSize * 1.16, roleFontSize * 0.16);
            ctx.fill();
          }

          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0,
            isAccent ? "#ffffff" : (token.color ?? config.baseColor),
            isAccent ? config.strokeWidthPx : 0,
            config.strokeColor,
          );
          ctx.filter = "none";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "blurFocus": {
          const role = token.role ?? "normal";
          const isAccent = isBlurFocusAccent(role);
          const roleFontSize = config.fontSizePx * blurFocusFontScale(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = isAccent
            ? interpolateColors(highlight, [0, 1], [token.color ?? config.accentColor, token.color ?? config.activeColor])
            : (token.color ?? config.baseColor);
          const blurPx = isAccent ? (1 - enter) * 22 : (1 - enter) * 4;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
          if (isAccent && enter > 0.7 && config.glowEnabled) {
            drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, config.accentColor, 1);
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.filter = "none";
          clearShadow(ctx);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "typewriter": {
          const role = token.role ?? "normal";
          const isAccent = isTypewriterAccent(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const durationFrames = Math.max(1, timing.toFrame - timing.fromFrame);
          const elapsed = Math.max(0, frame - timing.fromFrame);
          const typedChars = Math.min(text.length, Math.ceil((elapsed / durationFrames) * text.length));
          const visibleText = text.slice(0, typedChars);
          const isTyping = typedChars < text.length && frame <= timing.toFrame;
          const cursorOn = isTyping && Math.floor((frame / fps) * 4) % 2 === 0;
          const colour = token.color ?? (isAccent ? config.accentColor : config.baseColor);

          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          ctx.textAlign = "left";
          ctx.fillStyle = colour;
          ctx.fillText(visibleText, -tokenWidth / 2, 0);
          if (cursorOn) {
            const caretX = -tokenWidth / 2 + ctx.measureText(visibleText).width + config.fontSizePx * 0.05;
            ctx.fillStyle = config.accentColor;
            ctx.fillRect(caretX, -config.fontSizePx * 0.42, Math.max(2, config.fontSizePx * 0.06), config.fontSizePx * 0.84);
          }
          ctx.textAlign = "center";
          break;
        }

        case "rotateReveal": {
          const role = token.role ?? "normal";
          const isAccent = isRotateRevealAccent(role);
          const roleFontSize = config.fontSizePx * rotateRevealFontScale(role);
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);
          const swing = index % 2 === 0 ? -8 : 8;
          const rotation = (1 - enter) * swing;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          ctx.rotate((rotation * Math.PI) / 180);

          if (isAccent) {
            const scaleFactor = canvasScale({ width, height });
            const s = (roleFontSize * 0.6) / 24;
            ctx.save();
            ctx.translate(tokenWidth / 2 + 14 * scaleFactor, -roleFontSize * 0.5 - 6 * scaleFactor);
            ctx.strokeStyle = config.accentColor;
            ctx.lineWidth = 2.5 * scaleFactor;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.globalAlpha = entrance * enter * 0.85;
            ctx.beginPath();
            ctx.moveTo(4 * s, 14 * s);
            ctx.quadraticCurveTo(10 * s, 2 * s, 20 * s, 6 * s);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(15 * s, 4 * s);
            ctx.lineTo(20 * s, 6 * s);
            ctx.lineTo(17 * s, 10 * s);
            ctx.stroke();
            ctx.restore();
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "wipeUp": {
          const role = token.role ?? "normal";
          const isAccent = isWipeUpAccent(role);
          const roleFontSize = config.fontSizePx * wipeUpFontScale(role);
          const reveal = maskRevealY({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);
          const blockScale = isAccent ? Math.max(0, Math.min(1, (reveal - 0.15) / 0.85)) : 0;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance;
          ctx.translate(cx, cy);

          ctx.save();
          ctx.beginPath();
          const visibleH = roleFontSize * reveal;
          ctx.rect(-tokenWidth / 2, roleFontSize / 2 - visibleH, tokenWidth, visibleH);
          ctx.clip();

          if (isAccent && blockScale > 0) {
            ctx.fillStyle = config.accentColor;
            ctx.fillRect(
              -tokenWidth / 2 - roleFontSize * 0.14,
              -roleFontSize * 0.42,
              (tokenWidth + roleFontSize * 0.28) * blockScale,
              roleFontSize * 0.84,
            );
          }

          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0,
            isAccent && blockScale > 0.5 ? "#0a0a0b" : colour,
            isAccent ? config.strokeWidthPx : 0,
            config.strokeColor,
          );
          ctx.restore();
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "strokeFill": {
          const role = token.role ?? "normal";
          const isAccent = isStrokeFillAccent(role);
          const roleFontSize = config.fontSizePx * strokeFillFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const fillIn = isAccent ? Math.max(0, Math.min(1, (enter - 0.35) / 0.65)) : 0;
          const fillColor = token.color ?? config.activeColor;
          const outlineColor = token.color ?? config.baseColor;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);

          ctx.lineWidth = config.strokeWidthPx * 2;
          ctx.strokeStyle = outlineColor;
          ctx.lineJoin = "round";
          ctx.miterLimit = 2;
          ctx.strokeText(text, -tokenWidth / 2, 0);

          if (isAccent && fillIn > 0) {
            ctx.fillStyle = withOpacity(fillColor, fillIn);
            ctx.fillText(text, -tokenWidth / 2, 0);
          }

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "bounceWord": {
          const role = token.role ?? "normal";
          const isAccent = isBounceWordAccent(role);
          const roleFontSize = config.fontSizePx * bounceWordFontScale(role);
          // `enter` (holds after rising) drives visibility — using
          // `tokenPulse` faded already-spoken words back out.
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const pillGrow = maskRevealX({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const yOffset = (1 - enter) * 26;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);

          if (isAccent) {
            const padX = roleFontSize * 0.2;
            ctx.fillStyle = config.accentColor;
            ctx.globalAlpha = entrance * enter * pillGrow * 0.95;
            ctx.beginPath();
            ctx.roundRect(-tokenWidth / 2 - padX, -roleFontSize * 0.6, tokenWidth + padX * 2, roleFontSize * 1.2, roleFontSize * 0.22);
            ctx.fill();
            ctx.globalAlpha = entrance * enter;
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, token.color ?? "#ffffff", isAccent ? 0 : config.strokeWidthPx, config.strokeColor);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "glitch": {
          const role = token.role ?? "normal";
          const isAccent = isGlitchAccent(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const seed = getHash(text);
          const burst = isAccent ? glitchBurst(frame, fps, timing.fromFrame, seed) : 0;
          const scaleFactor = canvasScale({ width, height });
          const sliceOffset = burst > 0 ? ((seed % 5) - 2) * scaleFactor : 0;
          const baseColour = token.color ?? config.baseColor;

          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + sliceOffset, cy);

          if (burst > 0) {
            ctx.globalAlpha = entrance * enter * 0.85;
            ctx.fillStyle = "#00ffff";
            ctx.fillText(text, -tokenWidth / 2 - 3 * scaleFactor, 0);
            ctx.fillStyle = config.accentColor;
            ctx.fillText(text, -tokenWidth / 2 + 3 * scaleFactor, 0);
            ctx.globalAlpha = entrance * enter;
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, baseColour, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          break;
        }

        case "highlightWord": {
          const role = token.role ?? "normal";
          const isAccent = isHighlightWordAccent(role);
          const roleFontSize = config.fontSizePx * highlightWordFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const markerDelay = Math.round(fps * 0.1);
          const marker = isAccent
            ? maskRevealX({ frame, fps, fromFrame: timing.fromFrame + markerDelay }, ENTER_SMOOTH)
            : 0;
          const isCovered = marker > 0.6;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);

          if (isAccent && marker > 0) {
            const padX = roleFontSize * 0.12;
            const fullW = tokenWidth + padX * 2;
            ctx.fillStyle = config.accentColor;
            ctx.beginPath();
            ctx.roundRect(-tokenWidth / 2 - padX, -roleFontSize * 0.42, fullW * marker, roleFontSize * 0.84, roleFontSize * 0.08);
            ctx.fill();
          }

          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0,
            isAccent && isCovered ? "#0a0a0b" : (token.color ?? config.baseColor),
            isAccent && !isCovered ? config.strokeWidthPx : 0,
            config.strokeColor,
          );
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "zoomFocus": {
          const role = token.role ?? "normal";
          const isAccent = isZoomFocusAccent(role);
          const roleFontSize = config.fontSizePx * zoomFocusFontScale(role);
          // `enter` (holds after rising) drives visibility — using
          // `tokenPulse` faded already-spoken words back out.
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const colour = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);

          if (isAccent) {
            const scaleFactor = canvasScale({ width, height });
            const boxHalf = roleFontSize * 0.8 * enter;
            const armLen = roleFontSize * 0.18;
            ctx.save();
            ctx.strokeStyle = config.accentColor;
            ctx.lineWidth = 4 * scaleFactor;
            ctx.lineCap = "round";
            ctx.globalAlpha = entrance * enter * 0.8;
            const corners: Array<[number, number, number, number]> = [
              [-boxHalf, -boxHalf, 1, 1],
              [boxHalf, -boxHalf, -1, 1],
              [-boxHalf, boxHalf, 1, -1],
              [boxHalf, boxHalf, -1, -1],
            ];
            for (const [cornerX, cornerY, sx, sy] of corners) {
              ctx.beginPath();
              ctx.moveTo(cornerX + armLen * sx, cornerY);
              ctx.lineTo(cornerX, cornerY);
              ctx.lineTo(cornerX, cornerY + armLen * sy);
              ctx.stroke();
            }
            ctx.restore();
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "gradientFlow": {
          const role = token.role ?? "normal";
          const isAccent = isGradientFlowAccent(role);
          const roleFontSize = config.fontSizePx * gradientFlowFontScale(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });
          const yOffset = (1 - enter) * 10 * scaleFactor;
          const flowPct = ((frame / fps) * 22) % 200;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);

          if (isAccent) {
            const grad = ctx.createLinearGradient(-tokenWidth, 0, tokenWidth, 0);
            const shift = Math.max(0.001, Math.min(0.999, (flowPct % 100) / 100));
            grad.addColorStop(0, config.accentColor);
            grad.addColorStop(shift, "#9b5cff");
            grad.addColorStop(1, config.accentColor);
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, grad, 0, config.strokeColor);

            ctx.fillStyle = config.accentColor;
            ctx.globalAlpha = entrance * enter * 0.85;
            ctx.font = canvasFont(500, roleFontSize * 0.32, family);
            ctx.fillText("›››", 0, roleFontSize * 0.66);
          } else {
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, token.color ?? config.baseColor, 0, config.strokeColor);
          }
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "maskReveal": {
          const role = token.role ?? "normal";
          const isHero = isMaskRevealHero(role);
          const roleFontSize = config.fontSizePx * maskRevealFontScale(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);

          const durationFrames = Math.max(1, timing.toFrame - timing.fromFrame);
          const elapsed = Math.max(0, frame - timing.fromFrame);
          const progress = Math.min(1, elapsed / durationFrames);

          let colour: string | CanvasGradient = token.color ?? (isHero ? config.accentColor : config.baseColor);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);

          if (isHero) {
            if (config.glowEnabled) {
              drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, config.accentColor, 1);
            }
            ctx.shadowOffsetX = 0;

            const grad = ctx.createLinearGradient(-tokenWidth / 2, 0, tokenWidth / 2, 0);
            const start = Math.max(0, progress - 0.15);
            const end = Math.min(1, progress + 0.15);
            
            grad.addColorStop(0, config.accentColor);
            if (start > 0) grad.addColorStop(start, config.accentColor);
            grad.addColorStop(progress, "#ffffff");
            if (end < 1) grad.addColorStop(end, config.accentColor);
            grad.addColorStop(1, config.accentColor);
            
            colour = grad;
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, 0, config.strokeColor);
          clearShadow(ctx);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "drawOn": {
          const role = token.role ?? "normal";
          const isScript = isDrawOnScript(role);
          const roleFontSize = config.fontSizePx * drawOnFontScale(role);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const underline = isScript
            ? maskRevealX({ frame, fps, fromFrame: timing.fromFrame + Math.round(fps * 0.15) }, ENTER_SMOOTH)
            : 0;
          const scaleFactor = canvasScale({ width, height });
          const yOffset = (1 - enter) * 10 * scaleFactor;
          const secondaryFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
          const colour = interpolateColors(highlight, [0, 1], [token.color ?? config.baseColor, token.color ?? config.activeColor]);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, isScript ? family : secondaryFamily);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);

          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0,
            isScript ? (token.color ?? config.accentColor) : colour,
            isScript ? config.strokeWidthPx : 0,
            config.strokeColor,
          );

          if (isScript && underline > 0) {
            ctx.strokeStyle = config.accentColor;
            ctx.lineWidth = 3 * scaleFactor;
            ctx.lineCap = "round";
            ctx.globalAlpha = entrance * enter * underline;
            const underlineY = roleFontSize * 0.62;
            const w = tokenWidth * underline;
            ctx.beginPath();
            ctx.moveTo(-tokenWidth / 2, underlineY);
            ctx.quadraticCurveTo(-tokenWidth / 2 + w * 0.5, underlineY + roleFontSize * 0.05, -tokenWidth / 2 + w, underlineY - roleFontSize * 0.02);
            ctx.stroke();
          }

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "depth3d": {
          const role = token.role ?? "normal";
          const isAccent = isDepth3dAccent(role);
          const roleFontSize = config.fontSizePx * depth3dFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const depth = isAccent ? enter * 6 : 0;
          const scaleFactor = canvasScale({ width, height });
          const colour = token.color ?? "#ffffff";

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy - depth * 0.4 * scaleFactor);

          if (isAccent && depth > 0.1) {
            ctx.fillStyle = config.accentColor;
            for (let i = 6; i >= 1; i--) {
              const t = (depth * i) / 6;
              ctx.fillText(text, -tokenWidth / 2 + t * scaleFactor, t * scaleFactor);
            }
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "editorialKinetic":
        case "editorialKineticPop": {
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const ekRole = editorialKineticRole(role, token.text);
          const isAccent = isEditorialKineticAccent(role);
          const isPop = config.styleId === "editorialKineticPop";
          const roleFontSize = config.fontSizePx * editorialKineticFontScale(role, ekRole);
          const scaleFactor = canvasScale({ width, height });

          const fam = isDevanagariWord
            ? ekRole === "support"
              ? resolveFontFamily("devanagari")
              : resolveFontFamily("notoSerifDevanagari")
            : ekRole === "display"
              ? family
              : ekRole === "editorial"
                ? resolveFontFamily(config.specialFontId ?? "playfair")
                : resolveFontFamily(config.secondaryFontId ?? "inter");
          const weight = ekRole === "display" ? config.fontWeight : ekRole === "editorial" ? 500 : 600;
          const fontStyle = ekRole === "editorial" && !isDevanagariWord ? "italic" : "normal";
          ctx.font = canvasFont(weight, roleFontSize, fam, fontStyle);

          let enter: number;
          let yOffset = 0;
          let xOffset = 0;
          let blurPx = 0;
          let color: string;

          if (ekRole === "display") {
            color = isAccent ? (token.color ?? config.accentColor) : (token.color ?? config.baseColor);
            if (isPop) {
              enter = tokenEnter(timing, ENTER_SMOOTH);
              blurPx = (1 - enter) * 6 * scaleFactor;
            } else {
              enter = tokenEnter(timing, ENTER_SMOOTH);
              yOffset = (1 - enter) * 26 * scaleFactor;
              blurPx = (1 - enter) * 8 * scaleFactor;
            }
          } else if (ekRole === "editorial") {
            color = token.color ?? "#f5f5f0";
            // Flowing, not bouncy, regardless of variant.
            enter = tokenEnter(timing, ENTER_SUBTLE);
            yOffset = (1 - enter) * 15 * scaleFactor;
            blurPx = (1 - enter) * 4 * scaleFactor;
            xOffset = roleFontSize * 0.03;
          } else {
            color = token.color ?? "#ffffff";
            enter = tokenEnter(timing, ENTER_SMOOTH);
            yOffset = (1 - enter) * 8 * scaleFactor;
            xOffset = -roleFontSize * 0.02;
          }

          ctx.filter = blurPx > 0.3 ? `blur(${blurPx}px)` : "none";
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + xOffset, cy + yOffset);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);
          ctx.filter = "none";

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "editorialStackHero": {
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const tier = editorialStackHeroRole(role, token.text);
          const isAccent = isEditorialStackHeroAccent(role);
          const roleFontSize = config.fontSizePx * editorialStackHeroFontScale(role, tier);
          const scaleFactor = canvasScale({ width, height });

          const fam = isDevanagariWord
            ? tier === "support"
              ? resolveFontFamily("devanagari")
              : resolveFontFamily("notoSerifDevanagari")
            : tier === "main" || tier === "primary"
              ? family
              : resolveFontFamily(config.secondaryFontId ?? "montserrat");
          const weight = tier === "main" || tier === "primary" ? config.fontWeight : 900;
          const fontStyle = "normal";
          ctx.font = canvasFont(weight, roleFontSize, fam, fontStyle);

          let enter: number;
          let yOffset = 0;
          let blurPx = 0;
          let color: string;
          let alignOffsetX = 0;

          const hash = getHash(token.text + index);
          const alignVariant = hash % 3;
          const slideVariant = (hash + 1) % 2;

          if (tier === "main") {
            color = isAccent ? (token.color ?? config.accentColor) : (token.color ?? config.baseColor);
            enter = tokenEnter(timing, ENTER_SMOOTH);
            blurPx = (1 - enter) * 6 * scaleFactor;
          } else if (tier === "primary") {
            color = token.color ?? config.baseColor;
            enter = tokenEnter(timing, ENTER_SMOOTH);
            yOffset = (1 - enter) * 35 * scaleFactor;
            blurPx = (1 - enter) * 6 * scaleFactor;
          } else if (tier === "secondary" || tier === "support") {
            color = token.color ?? "#ffffff";
            enter = tokenEnter(timing, ENTER_SMOOTH);
            const travelY = slideVariant === 0 ? -25 : 25;
            const travelX = alignVariant === 0 ? -20 : alignVariant === 2 ? 20 : 0;
            yOffset = (1 - enter) * travelY * scaleFactor;
            const animXOffset = (1 - enter) * travelX * scaleFactor;
            blurPx = (1 - enter) * 6 * scaleFactor;

            if (alignVariant === 0) {
              alignOffsetX = - (maxWidth / 2) + (tokenWidth / 2) + (20 * scaleFactor) + animXOffset;
            } else if (alignVariant === 2) {
              alignOffsetX = (maxWidth / 2) - (tokenWidth / 2) - (20 * scaleFactor) + animXOffset;
            } else {
              alignOffsetX = animXOffset;
            }
          } else {
            color = token.color ?? "#ffffff";
            enter = tokenEnter(timing, ENTER_SMOOTH);
          }

          ctx.filter = blurPx > 0.3 ? `blur(${blurPx}px)` : "none";
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + alignOffsetX, cy + yOffset);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);
          ctx.filter = "none";

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "stack": {
          // Mirrors `StackToken`. Read that component's doc comment first —
          // it records what this template deliberately does *not* do, and why.
          const role = token.role ?? "normal";
          const isDevanagariWord = hasDevanagari(token.text);
          const tier = stackTier(role, token.text);
          const align = stackRowAlign(tier, index);
          const roleFontSize = config.fontSizePx * stackFontScale(tier);
          const scaleFactor = canvasScale({ width, height });

          const fam = isDevanagariWord
            ? tier === "support"
              ? resolveFontFamily("devanagari")
              : resolveFontFamily("notoSerifDevanagari")
            : tier === "hero" || tier === "primary"
              ? family
              : tier === "accent"
                ? resolveFontFamily(config.specialFontId ?? "playfair")
                : resolveFontFamily(config.secondaryFontId ?? "inter");
          const weight =
            tier === "hero" || tier === "primary"
              ? config.fontWeight
              : tier === "accent"
                ? 500
                : 600;
          const fontStyle = tier === "accent" && !isDevanagariWord ? "italic" : "normal";
          ctx.font = canvasFont(weight, roleFontSize, fam, fontStyle);

          const enter = tokenEnter(timing, ENTER_SMOOTH);

          let animXOffset = 0;
          let yOffset = 0;
          let blurPx = 0;

          if (tier === "hero") {
            blurPx = (1 - enter) * 7 * scaleFactor;
          } else if (tier === "primary") {
            yOffset = (1 - enter) * 22 * scaleFactor;
            blurPx = (1 - enter) * 5 * scaleFactor;
          } else if (tier === "accent") {
            animXOffset = (1 - enter) * (align === "right" ? 26 : -26) * scaleFactor;
            blurPx = (1 - enter) * 4 * scaleFactor;
          } else {
            yOffset = (1 - enter) * 12 * scaleFactor;
          }

          // The same constant the DOM applies as a transform — see
          // `stackRowOffsetPx` for why the row rhythm is a shared offset
          // rather than an alignment against a measured block width.
          const edgeOffsetX = stackRowOffsetPx(tier, index, config.fontSizePx);

          ctx.filter = blurPx > 0.3 ? `blur(${blurPx}px)` : "none";
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + edgeOffsetX + animXOffset, cy + yOffset);
          fillWithHalo(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            isStackAccentColour(tier)
              ? (token.color ?? config.accentColor)
              : (token.color ?? config.baseColor),
            roleFontSize,
            premiumStrokePx(roleFontSize, config),
            config.strokeColor,
          );
          ctx.filter = "none";

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "popWord": {
          const anim = popWordState(timing, token.role ?? "normal");
          if (anim.opacity <= 0) break;

          const role = token.role ?? "normal";
          const isAccent = role === "critical";
          const isAnchor = role === "keyword";
          const isHero = role === "emphasis";

          if (anim.translateY !== 0) {
            ctx.translate(0, anim.translateY);
          }
          if (anim.rotateDeg !== 0) {
            ctx.rotate((anim.rotateDeg * Math.PI) / 180);
          }
          ctx.scale(anim.scale, anim.scale);
          ctx.globalAlpha *= anim.opacity;

          const text = applyTextCase(
            token.text,
            (roleCaseTransform(role, config) as "none" | "upper" | "lower") ?? config.textCase,
          );

          const color = (isAccent || isHero || anim.isActive)
            ? (config.activeColor || config.accentColor || "#ff5e00")
            : (config.baseColor || "#ffffff");

          if (isAnchor) {
            const strokeW = Math.max(2, config.strokeWidthPx || 3);
            ctx.lineWidth = strokeW;
            ctx.strokeStyle = config.accentColor || "#ff5e00";
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeText(text, -tokenWidth / 2, 0);
            if (anim.isActive) {
              ctx.fillStyle = config.accentColor || "#ff5e00";
              ctx.fillText(text, -tokenWidth / 2, 0);
            }
          } else {
            if (config.strokeWidthPx > 0) {
              ctx.lineWidth = config.strokeWidthPx;
              ctx.strokeStyle = config.strokeColor || "#000000";
              ctx.lineJoin = "round";
              ctx.lineCap = "round";
              ctx.strokeText(text, -tokenWidth / 2, 0);
            }
            ctx.fillStyle = color;
            if (isHero || (anim.isActive && config.glowEnabled)) {
              drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, config.accentColor || "#ff5e00", 1.4);
            }
            ctx.fillText(text, -tokenWidth / 2, 0);
          }
          ctx.shadowBlur = 0;
          break;
        }

        case "focus": {
          // Mirrors `FocusToken`: uniform size and weight, the spoken word
          // lifts/scales/brightens, everything else holds at
          // `upcomingOpacity`, and one accent word per page carries the italic
          // serif. Nothing here changes a word's measured box.
          const role = token.role ?? "normal";
          const tier = focusTier(role);
          const isScript = isFocusScript(role) && !hasDevanagari(token.text);
          const roleFontSize = config.fontSizePx * focusFontScale(tier);
          const fam = isScript
            ? resolveFontFamily(config.specialFontId ?? "playfair")
            : tier === "support" || tier === "body"
              ? resolveFontFamily(config.secondaryFontId ?? "instrumentSans")
              : family;

          ctx.font = canvasFont(
            focusFontWeight(tier, config),
            roleFontSize,
            fam,
            isScript ? "italic" : "normal",
          );

          const { started, ended } = focusEnvelope(timing);
          const pulse = tokenPulse(timing, ENTER_BOUNCY);
          const direction = dynamicSlideStackDirection(token.text, timing.fromFrame);

          const travel = pulse * roleFontSize * 0.15;
          const xOffset = direction === "left" ? -travel : direction === "right" ? travel : 0;
          const yOffset = direction === "up" ? -travel : direction === "down" ? travel : 0;
          
          const scaleFactor = canvasScale({ width, height });
          const blurPx = ((1 - started) * 2.5 + ended * 2.5) * scaleFactor;

          ctx.globalAlpha =
            entrance * focusWordOpacity(started, ended, config.upcomingOpacity);
          ctx.translate(cx + xOffset, cy + yOffset);
          if (blurPx > 0.1) {
            ctx.filter = `blur(${blurPx}px)`;
          }
          fillWithHalo(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            isFocusAccent(role)
              ? (token.color ?? config.accentColor)
              : (token.color ?? config.baseColor),
            roleFontSize,
            premiumStrokePx(roleFontSize, config),
            config.strokeColor,
          );
          if (blurPx > 0.1) {
            ctx.filter = "none";
          }

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "designWalla": {
          // Mirror of DesignWallaToken.tsx. The row break itself is already
          // handled in `layoutLines`; this only has to draw a word at the
          // right size, in the right place.
          const isDwHero = index === heroIndex;
          const isDwScript = designWallaHeroIsScript(pageSeed) && !hasDevanagari(token.text);
          const scaleFactor = canvasScale({ width, height });
          const smallRatio =
            config.annotationSizeRatio > 0 ? config.annotationSizeRatio : DESIGN_WALLA_SMALL_RATIO;

          if (!isDwHero) {
            const enter = tokenEnter(timing, ENTER_SMOOTH);
            let heroOffsetX = 0;
            let liftY = 0;
            const blurPx = (1 - enter) * 3 * scaleFactor;

            if (index < heroIndex) {
              heroOffsetX = (widestLine - line.width) / 2;
              liftY = (1 - enter) * 16 * scaleFactor;
            } else if (index > heroIndex) {
              heroOffsetX = -(widestLine - line.width) / 2;
              liftY = (1 - enter) * -16 * scaleFactor;
            }

            ctx.globalAlpha = entrance * enter;
            const smallFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
            ctx.font = canvasFont(
              config.annotationWeight > 0 ? config.annotationWeight : 700,
              resolveSecondaryFontSize(config, smallRatio),
              smallFamily,
            );
            if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
            ctx.translate(cx + heroOffsetX, cy + liftY);
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, config.annotationColor || config.baseColor, 0, config.strokeColor);
            if (blurPx > 0.3) ctx.filter = "none";
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const direction = designWallaHeroDirection(pageSeed);
          const enter = tokenEnter(timing, isDwScript ? ENTER_SMOOTH : ENTER_BOUNCY);
          const travel = (1 - enter) * (isDwScript ? 40 : 55) * scaleFactor;
          const yOffset = direction === "up" ? travel : -travel;
          const blurPx = (1 - enter) * (isDwScript ? 3 : 5) * scaleFactor;
          const color = token.color ?? (isDwScript ? config.baseColor : config.accentColor);
          const heroFamily = isDwScript ? resolveFontFamily(config.specialFontId ?? "grandHotel") : family;
          const heroWeight = isDwScript ? 400 : Math.max(800, config.fontWeight);
          const heroSize = isDwScript
            ? resolveSpecialFontSize(config, 1.05)
            : config.fontSizePx * 1.15;

          ctx.font = canvasFont(heroWeight, heroSize, heroFamily, isDwScript ? "italic" : "normal");
          ctx.globalAlpha = entrance * enter;
          if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
          ctx.translate(cx, cy + yOffset);
          strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, isDwScript ? 0 : config.strokeWidthPx, config.strokeColor, config, isDwScript ? config.baseColor : config.accentColor);
          if (blurPx > 0.3) ctx.filter = "none";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "designWallaEditorial":
        case "designWallaEditorialYellow": {
          const texts = page.tokens.map((t) => t.text);
          const tier = designWallaEditorialTier(index, heroIndex, specialIndex, page.tokens.length);
          const currentRow = designWallaEditorialRow(index, texts);
          const scaleFactor = canvasScale({ width, height });

          if (tier === "punch") {
            const enter = tokenEnter(timing, ENTER_BOUNCY);
            const punchScale = designWallaEditorialFontScale("punch");
            const direction = (pageSeed + index) % 2 === 0 ? "up" : "down";
            const travelY = (direction === "up" ? (1 - enter) * 24 : (1 - enter) * -24) * scaleFactor;
            const blurPx = (1 - enter) * 4.5 * scaleFactor;
            const punchColor =
              token.color ??
              (config.styleId === "designWallaEditorialYellow"
                ? config.accentColor
                : config.accentColor || config.activeColor || "#ffe600");

            ctx.font = canvasFont(Math.max(800, config.fontWeight), config.fontSizePx * punchScale, family);
            ctx.globalAlpha = entrance * enter;
            if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
            ctx.translate(cx, cy + travelY);
            const s = 0.88 + enter * 0.12;
            ctx.scale(s, s);

            if (config.glowEnabled) {
              drawGlowPass(ctx, text.toUpperCase(), -tokenWidth / 2, 0, config, punchColor, 1);
            } else {
              ctx.shadowColor = "rgba(0,0,0,0.65)";
              ctx.shadowBlur = 14 * scaleFactor;
              ctx.shadowOffsetY = 4 * scaleFactor;
            }

            strokeThenFill(
              ctx,
              text.toUpperCase(),
              -tokenWidth / 2,
              0,
              punchColor,
              config.strokeWidthPx,
              config.strokeColor,
            );
            clearShadow(ctx);
            if (blurPx > 0.3) ctx.filter = "none";
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          if (tier === "serif") {
            const enter = tokenEnter(timing, ENTER_SMOOTH);
            const serifScale = designWallaEditorialFontScale("serif");
            const serifFamily = resolveFontFamily(config.specialFontId ?? "playfair");

            const floatTime = timing.frame / (timing.fps || 30);
            const floatY = Math.sin(floatTime * 3.4) * 3.5 * scaleFactor;
            const floatRotate = ((-2.5 + Math.cos(floatTime * 2.6) * 0.8) * Math.PI) / 180;
            const floatScale = 1 + Math.sin(floatTime * 2.0) * 0.015;

            const travelY = (1 - enter) * 24 * scaleFactor;
            const blurPx = (1 - enter) * 4 * scaleFactor;

            ctx.font = canvasFont(700, resolveSpecialFontSize(config, serifScale), serifFamily, "italic");
            ctx.globalAlpha = entrance * enter;
            if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
            const overlapY = currentRow > 0 ? -18 * scaleFactor : 0;
            ctx.translate(cx, cy + travelY + floatY + overlapY);
            ctx.rotate(floatRotate);
            ctx.scale(floatScale, floatScale);

            if (config.glowEnabled) {
              drawGlowPass(ctx, text.toLowerCase(), -tokenWidth / 2, 0, config, "#ffffff", 1);
            } else {
              ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
              ctx.shadowBlur = 20 * scaleFactor;
              ctx.shadowOffsetY = 4 * scaleFactor;
            }

            strokeThenFill(
              ctx,
              text.toLowerCase(),
              -tokenWidth / 2,
              0,
              token.color ?? "#ffffff",
              0,
              config.strokeColor,
            );
            clearShadow(ctx);
            if (blurPx > 0.3) ctx.filter = "none";
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          // Tier 3: Support Connectors
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const supportRatio =
            config.annotationSizeRatio > 0
              ? config.annotationSizeRatio
              : designWallaEditorialFontScale("support");
          const slideX = (1 - enter) * (currentRow === 0 ? -18 : 18) * scaleFactor;
          const blurPx = (1 - enter) * 3.5 * scaleFactor;
          const supportFamily = resolveFontFamily(config.secondaryFontId ?? "inter");
          const overlapY = currentRow > 0 ? -14 * scaleFactor : 0;

          ctx.font = canvasFont(
            config.annotationWeight > 0 ? config.annotationWeight : 700,
            resolveSecondaryFontSize(config, supportRatio),
            supportFamily,
          );
          const isSharingWithBigWord = page.tokens.some((_, i) => i !== index && designWallaEditorialRow(i, texts) === currentRow);
          const isTopAlign = currentRow === 1 || (currentRow !== 0 && (pageSeed + index) % 2 === 0);
          const edgeAlignShift = isSharingWithBigWord ? (isTopAlign ? -10 * scaleFactor : 8 * scaleFactor) : 0;
          ctx.globalAlpha = entrance * enter;
          if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
          ctx.translate(cx + slideX, cy + overlapY + edgeAlignShift);

          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 10 * scaleFactor;
          ctx.shadowOffsetY = 2 * scaleFactor;

          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            config.annotationColor || config.baseColor || "#ffffff",
            0,
            config.strokeColor,
          );
          clearShadow(ctx);
          if (blurPx > 0.3) ctx.filter = "none";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "designWallaPro":
        case "designWallaProPink":
        case "designWallaProBlue":
        case "designWallaProGreen":
        case "designWallaProOrange": {
          const isBlueOrGreen = config.styleId === "designWallaProBlue" || config.styleId === "designWallaProGreen";
          const role = isBlueOrGreen ? designWallaProBlueRole(index, heroIndex, pageSeed) : designWallaProRole(index, heroIndex);
          const scaleFactor = canvasScale({ width, height });
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const isMiddle = role === "middle";
          
          const blurPx = (1 - enter) * 4 * scaleFactor;

          const isSerif = config.styleId === "designWallaProGreen" ? false : designWallaProHeroIsSerif(pageSeed);

          if (isMiddle) {
            let travel = 0;
            if (isBlueOrGreen) {
              travel = (1 - enter) * 60 * scaleFactor;
            } else {
              travel = (1 - enter) * 20 * scaleFactor;
            }
            const scaleFunc = isBlueOrGreen ? designWallaProBlueFontScale : designWallaProFontScale;
            const heroSize = isSerif
              ? (config.specialFontSizePx ? config.specialFontSizePx : config.fontSizePx * scaleFunc(role) * 1.2)
              : (config.fontSizePx * scaleFunc(role));
            const heroFamily = isSerif ? resolveFontFamily(config.specialFontId ?? "instrumentSerif") : family;
            const heroWeight = Math.max(800, config.fontWeight);
            const heroStyle = isSerif ? "italic" : "normal";
            
            ctx.font = canvasFont(heroWeight, heroSize, heroFamily, heroStyle);
            ctx.globalAlpha = entrance * enter;
            
            ctx.translate(cx, cy + travel);
            const scale = 0.9 + enter * 0.1;
            if (!isBlueOrGreen) {
              ctx.scale(scale, scale);
            }
            if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
            
            const color = isSerif ? "#ffffff" : (token.color ?? config.accentColor);
            
            if (config.glowEnabled) {
              drawGlowPass(ctx, applyTextCase(text, isSerif ? "lower" : "upper"), -tokenWidth / 2, 0, config, color, 1);
            } else if (isBlueOrGreen) {
              ctx.shadowColor = isSerif ? "rgba(255, 255, 255, 0.5)" : `${color}a0`;
              ctx.shadowBlur = 15 * scaleFactor;
            } else {
              ctx.shadowColor = isSerif ? "rgba(255, 255, 255, 0.3)" : `${color}80`;
              ctx.shadowBlur = 10 * scaleFactor;
            }
            
            strokeThenFill(ctx, applyTextCase(text, isSerif ? "lower" : "upper"), -tokenWidth / 2, 0, color, config.strokeWidthPx, config.strokeColor);
            
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            
            if (blurPx > 0.3) ctx.filter = "none";
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const direction = designWallaProDirection(pageSeed);
          const isTop = role === "top";
          const baseOffset = direction === "left" ? -60 : 60;
          const finalOffset = isTop ? baseOffset : -baseOffset;
          const travel = (1 - enter) * finalOffset * scaleFactor;
          
          const scaleFunc = isBlueOrGreen ? designWallaProBlueFontScale : designWallaProFontScale;
          let fitScale = 1;
          if (isBlueOrGreen && !isMiddle) {
            const rowTokensCount = role === "top" ? heroIndex : (page.tokens.length - heroIndex - 1);
            if (rowTokensCount > 4) {
              fitScale = 4 / rowTokensCount;
            }
          }
          const smallSize = (config.secondaryFontSizePx ? config.secondaryFontSizePx : config.fontSizePx * scaleFunc(role)) * fitScale;
          const smallFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : family;
          
          ctx.font = canvasFont(
            config.annotationWeight > 0 ? config.annotationWeight : 700,
            smallSize,
            smallFamily,
          );
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + travel, cy);
          
          if (blurPx > 0.3) ctx.filter = `blur(${blurPx}px)`;
          
          const savedShadowColor = ctx.shadowColor;
          ctx.shadowColor = "transparent";

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, config.annotationColor || config.baseColor, 0, config.strokeColor);
          
          ctx.shadowColor = savedShadowColor;

          if (blurPx > 0.3) ctx.filter = "none";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "dynamicSlideStack": {
          const role = token.role ?? "normal";
          const isHero = isDynamicSlideStackHero(role);
          const direction = dynamicSlideStackDirection(token.text, index);
          const roleFontSize = config.fontSizePx * dynamicSlideStackFontScale(role);
          const scaleFactor = canvasScale({ width, height });

          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, isHero ? ENTER_BOUNCY : ENTER_SMOOTH);
          const travel = (1 - enter) * (isHero ? 60 : 40) * scaleFactor;
          const xOffset = direction === "left" ? -travel : direction === "right" ? travel : 0;
          const yOffset = direction === "up" ? -travel : direction === "down" ? travel : 0;
          const blurPx = (1 - enter) * (isHero ? 5 : 3) * scaleFactor;
          const color = token.color ?? (isHero ? config.accentColor : config.baseColor);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.filter = blurPx > 0.3 ? `blur(${blurPx}px)` : "none";
          ctx.translate(cx + xOffset, cy + yOffset);
          strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, isHero ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.filter = "none";

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "glassHighlight": {
          const role = token.role ?? "normal";
          const isAccent = isGlassHighlightAccent(role);
          const roleFontSize = config.fontSizePx * glassHighlightFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const yOffset = (1 - enter) * 12 * canvasScale({ width, height });
          const panelScale = isAccent ? Math.max(0, Math.min(1, (enter - 0.1) / 0.9)) : 0;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);

          if (isAccent && panelScale > 0.01) {
            const padX = roleFontSize * 0.22;
            const padY = roleFontSize * 0.14;
            ctx.save();
            ctx.scale(panelScale, 1);
            ctx.fillStyle = "rgba(255,255,255,0.18)";
            ctx.strokeStyle = "rgba(255,255,255,0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(
              -tokenWidth / 2 - padX,
              -roleFontSize / 2 - padY,
              tokenWidth + padX * 2,
              roleFontSize + padY * 2,
              roleFontSize * 0.28,
            );
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          strokeThenFill(
            ctx, text, -tokenWidth / 2, 0,
            token.color ?? (isAccent ? config.accentColor : config.baseColor),
            0, config.strokeColor,
          );

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "splitText": {
          const role = token.role ?? "normal";
          const isHero = isSplitTextHero(role);
          const roleFontSize = config.fontSizePx * splitTextFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const color = token.color ?? (isHero ? config.accentColor : config.baseColor);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);

          if (!isHero) {
            ctx.globalAlpha = entrance * enter;
            ctx.translate(cx, cy + (1 - enter) * 10 * canvasScale({ width, height }));
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, 0, config.strokeColor);
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const splitOffset = (1 - enter) * roleFontSize * 0.5;
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = entrance * enter * 0.7;
          ctx.beginPath();
          ctx.moveTo(-tokenWidth / 2, -1);
          ctx.lineTo(tokenWidth / 2, 1);
          ctx.stroke();
          ctx.globalAlpha = entrance * enter;

          ctx.save();
          ctx.beginPath();
          ctx.rect(-tokenWidth / 2 - 2, -roleFontSize / 2 - 2, tokenWidth + 4, roleFontSize / 2 + 2);
          ctx.clip();
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2 - splitOffset, 0);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.rect(-tokenWidth / 2 - 2, 0, tokenWidth + 4, roleFontSize / 2 + 2);
          ctx.clip();
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2 + splitOffset, 0);
          ctx.restore();

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "liquidFlow": {
          const role = token.role ?? "normal";
          const isAccent = isLiquidFlowAccent(role);
          const roleFontSize = config.fontSizePx * liquidFlowFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });
          const yOffset = (1 - enter) * 14 * scaleFactor;
          const blurPx = (1 - enter) * 5 * scaleFactor;
          const color = token.color ?? (isAccent ? config.accentColor : config.baseColor);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.filter = blurPx > 0.3 ? `blur(${blurPx}px)` : "none";
          ctx.translate(cx, cy + yOffset);

          if (isAccent) {
            const ribbonW = roleFontSize * 3.2;
            const ribbonH = roleFontSize * 0.9;
            const phase = frame / fps / 4 + (timing.fromFrame % 17) / 17;
            const { start, cp1, cp2, end } = liquidRibbonControlPoints(ribbonW, ribbonH, phase);
            ctx.save();
            ctx.globalAlpha = entrance * enter * 0.55;
            ctx.translate(-ribbonW / 2, -ribbonH / 2);
            ctx.strokeStyle = config.accentColor;
            ctx.lineWidth = ribbonH * 0.22;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
            ctx.stroke();
            ctx.restore();
            ctx.globalAlpha = entrance * enter;
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.filter = "none";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "lightSweep": {
          const role = token.role ?? "normal";
          const isAccent = isLightSweepAccent(role);
          const roleFontSize = config.fontSizePx * lightSweepFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const dim = token.color ?? config.baseColor;
          const bright = token.color ?? config.accentColor;
          const bandCenter = -40 + enter * 180;
          const settled = enter > 0.92;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * Math.max(0.35, enter);
          ctx.translate(cx, cy);

          let colour: string | CanvasGradient = bright;
          if (isAccent && !settled) {
            const grad = ctx.createLinearGradient(-tokenWidth / 2, 0, tokenWidth / 2, 0);
            const stop = Math.max(0, Math.min(1, (bandCenter + 40) / 220));
            grad.addColorStop(Math.max(0, stop - 0.3), dim);
            grad.addColorStop(stop, bright);
            grad.addColorStop(Math.min(1, stop + 0.3), dim);
            colour = grad;
          } else if (!isAccent) {
            colour = dim;
          }

          strokeThenFill(ctx, text, -tokenWidth / 2, 0, colour, isAccent ? config.strokeWidthPx : 0, config.strokeColor);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "paperCut": {
          const role = token.role ?? "normal";
          const isAccent = isPaperCutAccent(role);
          const roleFontSize = config.fontSizePx * paperCutFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });
          const rotationDeg = (1 - enter) * (isAccent ? -6 : 4);
          const yOffset = (1 - enter) * 20 * scaleFactor;
          const paperFamily = isAccent
            ? family
            : config.secondaryFontId
              ? resolveFontFamily(config.secondaryFontId)
              : family;
          const paperColor = isAccent ? "#ffd60a" : "#f5f2e8";
          const ink = isAccent ? "#1a1206" : "#2a2a2a";

          ctx.font = canvasFont(isAccent ? 900 : 500, roleFontSize, paperFamily);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);
          ctx.rotate((rotationDeg * Math.PI) / 180);

          const padX = roleFontSize * 0.22;
          const padY = roleFontSize * 0.16;
          const stripW = tokenWidth + padX * 2;
          const stripH = roleFontSize + padY * 2;
          const points: readonly PaperCutPoint[] = paperStripClipPath(getHash(token.text.toLowerCase()));

          ctx.fillStyle = paperColor;
          ctx.beginPath();
          points.forEach((p, i) => {
            const px = -stripW / 2 + p.x * stripW;
            const py = -stripH / 2 + p.y * stripH;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = ink;
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "flipCard": {
          const role = token.role ?? "normal";
          const isAccent = isFlipCardAccent(role);
          const roleFontSize = config.fontSizePx * flipCardFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const rotateXDeg = (1 - enter) * -100;
          // Flat-projection equivalent of the DOM's `rotateX` — no perspective
          // skew, see this case's doc note in FlipCard.tsx.
          const squashY = Math.max(0.05, Math.cos((rotateXDeg * Math.PI) / 180));
          const textOpacity = Math.max(0, Math.min(1, (enter - 0.45) / 0.35));
          const cardColor = isAccent ? "#ffffff" : config.accentColor;
          const textColor = isAccent ? "#111111" : "#062b16";
          const cardFamily = isAccent
            ? family
            : config.secondaryFontId
              ? resolveFontFamily(config.secondaryFontId)
              : family;

          ctx.font = canvasFont(config.fontWeight, roleFontSize, cardFamily);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);

          const padX = roleFontSize * 0.2;
          const padY = roleFontSize * 0.16;
          const cardW = tokenWidth + padX * 2;
          const cardH = roleFontSize + padY * 2;

          ctx.save();
          ctx.scale(1, squashY);
          ctx.fillStyle = cardColor;
          ctx.beginPath();
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, roleFontSize * 0.1);
          ctx.fill();
          ctx.restore();

          ctx.globalAlpha = entrance * textOpacity;
          ctx.fillStyle = textColor;
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "ribbonSlide": {
          const role = token.role ?? "normal";
          const isAccent = isRibbonSlideAccent(role);
          const roleFontSize = config.fontSizePx * ribbonSlideFontScale(role);
          const scaleFactor = canvasScale({ width, height });

          if (!isAccent) {
            const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
            ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
            ctx.globalAlpha = entrance * enter;
            ctx.translate(cx, cy);
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, token.color ?? config.baseColor, config.strokeWidthPx, config.strokeColor);
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const side = ribbonSlideSide(index);
          const ribbonOffset = splitEntrance(side, 220, { frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH) * scaleFactor;
          const textEnter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame + 2 }, ENTER_SMOOTH);
          const ribbonColor = index % 2 === 0 ? "#7c4dff" : config.accentColor;
          const points: readonly PaperCutPoint[] = ribbonClipPath();

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * textEnter;
          ctx.translate(cx + ribbonOffset, cy);

          const padX = roleFontSize * 0.3;
          const padY = roleFontSize * 0.12;
          const ribbonW = tokenWidth + padX * 2;
          const ribbonH = roleFontSize + padY * 2;

          ctx.fillStyle = ribbonColor;
          ctx.beginPath();
          points.forEach((p, i) => {
            const px = -ribbonW / 2 + p.x * ribbonW;
            const py = -ribbonH / 2 + p.y * ribbonH;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "spiralReveal": {
          const role = token.role ?? "normal";
          const isHero = isSpiralRevealHero(role);
          const roleFontSize = config.fontSizePx * spiralRevealFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_SMOOTH);
          const color = token.color ?? (isHero ? config.accentColor : config.baseColor);

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;

          if (!isHero) {
            ctx.translate(cx, cy);
            strokeThenFill(ctx, text, -tokenWidth / 2, 0, color, 0, config.strokeColor);
            ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
            break;
          }

          const rotateDeg = (1 - enter) * 40;
          const radius = roleFontSize * 1.9;
          const chars = Array.from(text);

          ctx.translate(cx, cy);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          ctx.fillStyle = color;
          ctx.textAlign = "center";

          // Manual per-character placement around the same arc the DOM's SVG
          // `textPath` follows — see `spiralCharAngleDeg`'s doc comment for
          // why the two aren't pixel-identical.
          chars.forEach((ch, i) => {
            const angleRad = (spiralCharAngleDeg(i, chars.length) * Math.PI) / 180;
            const px = Math.sin(angleRad) * radius;
            const py = -Math.cos(angleRad) * radius;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angleRad);
            ctx.fillText(ch, 0, 0);
            ctx.restore();
          });

          ctx.textAlign = "left";
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "bigGrand": {
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const isSpoken = timing.fromFrame <= frame;
          if (!isSpoken) break;

          const role = bigGrandRole(index, heroIndex);
          const isHero = role === "hero";
          const isTopLine = role === "top";
          const isDeva = hasDevanagari(text);

          const { translateX, translateY, scale, blurPx } = bigGrandTransform(
            role,
            enter,
            pageSeed,
          );

          const scaleFactor = canvasScale({ width, height });
          const opacity = entrance * Math.min(1, enter);

          const fontId = config.fontId || "montserrat";
          const specialFontId = config.specialFontId || fontId;
          const heroColor = config.accentColor || "#38bdf8";

          let sizePx = config.fontSizePx || 120;
          let fontFam = resolveFontFamily(fontId);
          
          if (isHero) {
            sizePx = config.specialFontSizePx ? config.specialFontSizePx : sizePx;
            fontFam = resolveFontFamily(specialFontId);
          } else if (isTopLine) {
            sizePx = config.secondaryFontSizePx ? config.secondaryFontSizePx : sizePx * 0.52;
            if (!isDeva) ctx.letterSpacing = `${sizePx * 0.04}px`;
          } else {
            sizePx = config.secondaryFontSizePx ? config.secondaryFontSizePx * 0.8 : sizePx * 0.40;
            if (!isDeva) ctx.letterSpacing = `${sizePx * 0.18}px`;
          }

          ctx.font = canvasFont(isHero ? 900 : 800, sizePx, fontFam);
          ctx.globalAlpha = opacity;
          
          ctx.translate(cx + translateX * scaleFactor, cy + translateY * scaleFactor);
          ctx.scale(scale, scale);
          if (blurPx * scaleFactor > 0.3) ctx.filter = `blur(${blurPx * scaleFactor}px)`;
          
          if (isHero) {
            if (config.glowEnabled) {
              drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, heroColor, 1);
            }
            // Dark backing for maximum high contrast against any video
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = 8 * scaleFactor;
            ctx.shadowOffsetY = 2 * scaleFactor;
            ctx.fillStyle = heroColor;
            ctx.fillText(text, -tokenWidth / 2, 0);
          } else {
            if (config.glowEnabled) {
              drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, config.strokeColor, 0.3);
            }
            ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
            ctx.shadowBlur = 8 * scaleFactor;
            ctx.shadowOffsetY = 2 * scaleFactor;
            ctx.fillStyle = "#ffffff";
            ctx.fillText(text, -tokenWidth / 2, 0);
          }
          
          clearShadow(ctx);
          ctx.filter = "none";
          ctx.letterSpacing = `${config.letterSpacingPx}px`;
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "grandCaption": {
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const isUp = index % 2 === 0;
          const travel = (1 - enter) * (isUp ? 40 : -40);
          const scaleFactor = canvasScale({ width, height });
          const blurPx = (1 - enter) * 4 * scaleFactor;
          const color = token.color ?? config.baseColor;
          
          ctx.globalAlpha = entrance * enter;
          
          // Apply translation and scale
          ctx.translate(cx, cy + travel * scaleFactor);
          const scale = 0.9 + enter * 0.1;
          ctx.scale(scale, scale);
          
          if (blurPx > 0.3) {
            ctx.filter = `blur(${blurPx}px)`;
          }

          if (config.glowEnabled) {
            drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, color, 1);
          }

          strokeThenFill(
            ctx,
            text,
            -tokenWidth / 2,
            0,
            color,
            config.strokeWidthPx,
            config.strokeColor,
          );
          
          clearShadow(ctx);
          ctx.filter = "none";
          break;
        }


        case "floatingBubble": {
          const role = token.role ?? "normal";
          const roleFontSize = config.fontSizePx * floatingBubbleFontScale(role);
          const enter = tokenEnter({ frame, fps, fromFrame: timing.fromFrame }, ENTER_BOUNCY);
          const scaleFactor = canvasScale({ width, height });
          const drift = floatingBubbleOffset(token.text, index, frame, fps);
          const tint = floatingBubbleTint(token.text);
          const color = token.color ?? "#ffffff";

          ctx.font = canvasFont(config.fontWeight, roleFontSize, family);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx + drift.x * scaleFactor, cy + (drift.y - (1 - enter) * 24) * scaleFactor);

          const padX = roleFontSize * 0.42;
          const padY = roleFontSize * 0.28;
          const bubbleW = tokenWidth + padX * 2;
          const bubbleH = roleFontSize + padY * 2;

          ctx.fillStyle = withOpacity(tint, 0.28);
          ctx.strokeStyle = withOpacity(tint, 0.55);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, bubbleH / 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);

          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }

        case "dualLine": {
          const splitIndex = Math.ceil(page.tokens.length / 2);
          const isTopLine = index < splitIndex;
          const isScript = !isTopLine && !hasDevanagari(text);
          const enter = tokenEnter(timing, ENTER_SMOOTH);
          const scaleFactor = canvasScale({ width, height });

          const travel = isTopLine ? (1 - enter) * -28 * scaleFactor : (1 - enter) * 28 * scaleFactor;
          const color = isTopLine
            ? (token.color ?? config.accentColor ?? "#FF2A2A")
            : (token.color ?? config.baseColor ?? "#FFFFFF");
          const fam = isTopLine
            ? family
            : isScript
              ? resolveFontFamily(config.specialFontId ?? config.secondaryFontId ?? "kaushanScript")
              : family;
          const weight = isTopLine ? Math.max(800, config.fontWeight) : 700;
          const fontSize = config.fontSizePx * (isTopLine ? 1 : 1.25);
          ctx.font = canvasFont(weight, fontSize, fam, isScript ? "italic" : "normal");
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + travel);

          if (isTopLine) {
            if (config.glowEnabled) {
              drawGlowPass(ctx, text, -tokenWidth / 2, 0, config, config.glowColor ?? config.accentColor ?? "#FF2A2A", 0.5);
            }
            // Base shadow for contrast
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4 * scaleFactor;
            ctx.shadowOffsetY = 2 * scaleFactor;
            ctx.fillStyle = color;
            ctx.fillText(text, -tokenWidth / 2, 0);
          } else {
            // Cursive bottom line: clean white, zero glow, zero outline
            ctx.shadowColor = "rgba(0,0,0,0.6)";
            ctx.shadowBlur = 6 * scaleFactor;
            ctx.shadowOffsetY = 2 * scaleFactor;
            ctx.fillStyle = color;
            ctx.fillText(text, -tokenWidth / 2, 0);
          }

          clearShadow(ctx);
          ctx.font = canvasFont(config.fontWeight, config.fontSizePx, family);
          break;
        }
      }

      ctx.restore();
      x += tokenWidth + config.wordGapPx;
    }

    y += line.height + gapY;
  }

  ctx.restore();
};
