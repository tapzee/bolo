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
  centerPunchScale,
  splitEntrance,
  letterStagger,
  layeredDepthDrift,
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
} from "@/remotion/captions/primitives";
import { resolveEmphasis } from "@/remotion/styles/DynamicHighlight";
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
): string => {
  const text = token.text.trim();
  if (config.styleId === "splash") {
    const role = getSplashWordRole(text, index, totalTokens);
    if (role === "accent" || role === "base") {
      return text.toUpperCase();
    }
    return text;
  }
  if (config.styleId === "hero") {
    // Only the headline is forced upper. The supporting text keeps whatever the
    // template asked for, which is what makes the contrast read as deliberate
    // typography rather than as one shouted line.
    return index === heroIndex
      ? text.toUpperCase()
      : applyTextCase(text, resolveTextCase(config));
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
  if (config.styleId === "dynamicHighlight") {
    const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
    if (emphasis === "supporting") return text.toLowerCase();
    if (emphasis === "important") return text.toUpperCase();
    if (emphasis === "special") return text;
    return applyTextCase(text, resolveTextCase(config));
  }
  // Canvas has no `text-transform`, so casing is applied to the string itself.
  // Must go through `resolveTextCase` for parity with the DOM renderer.
  return applyTextCase(text, resolveTextCase(config));
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
): Line[] => {
  const lines: Line[] = [];
  let current: Measured[] = [];
  let currentWidth = 0;

  const rowHeight = (items: readonly Measured[]): number =>
    items.reduce((tallest, item) => Math.max(tallest, item.fontSize), 0) *
    config.lineHeight;

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
    const text = getRenderText(token, config, index, page.tokens.length, heroIndex, heroMixedBackdrop, specialIndex);
    let fontSize = config.fontSizePx;
    let fontToRestore: string | null = null;

    if (config.styleId === "splash") {
      const role = getSplashWordRole(text, index, page.tokens.length);
      if (role === "accent") {
        fontSize = config.fontSizePx * 1.15;
        ctx.font = canvasFont(Math.max(800, config.fontWeight), fontSize, family);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (role === "script") {
        let scriptFamily = family;
        if (!family.toLowerCase().includes("playfair") && !family.toLowerCase().includes("caveat")) {
          scriptFamily = resolveFontFamily("playfair");
        }
        fontSize = config.fontSizePx * 1.05;
        ctx.font = canvasFont(config.fontWeight, fontSize, scriptFamily, "italic");
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      }
    } else if (config.styleId === "heroMixed" && heroMixedBackdrop) {
      // Poster scene: the hero is drawn separately as a full-bleed backdrop
      // (see the block above the lines loop), so it takes no space in flow.
      // Everything else draws bold, not the thin annotation size — this text
      // is what actually gets read, not a caption for the giant word.
      if (index === heroIndex) return;
      fontSize = config.fontSizePx * 0.52;
      ctx.font = canvasFont(800, fontSize, family);
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if ((config.styleId === "hero" || config.styleId === "heroMixed") && index !== heroIndex) {
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

      fontSize = config.fontSizePx * heroSmallRatio * fitScale;
      // Mirrors HeroMixed.tsx: heroMixed's annotation alternates between two
      // condensed sans faces per word; `hero` (HeroStack) keeps the
      // template's own font — this multi-font treatment wasn't asked for
      // there.
      const annotationFamily =
        config.styleId === "heroMixed" ? resolveFontFamily(annotationFontId(text)) : family;
      ctx.font = canvasFont(
        config.annotationWeight > 0 ? config.annotationWeight : 500,
        fontSize,
        annotationFamily,
      );
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    } else if (config.styleId === "heroMixed" && index === heroIndex) {
      // Mirrors HeroMixed.tsx's `heroFontStyle` — measured at the same face
      // it will actually be drawn in, or the row would wrap against a width
      // that doesn't match what ends up on screen.
      const style = heroFontStyle(text);
      if (style === "cursive") {
        ctx.font = canvasFont(700, config.fontSizePx, resolveFontFamily("caveat"));
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (style === "impact") {
        ctx.font = canvasFont(400, config.fontSizePx, resolveFontFamily("anton"));
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (style === "serif") {
        ctx.font = canvasFont(700, config.fontSizePx, resolveFontFamily("playfair"), "italic");
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      }
    } else if (config.styleId === "dynamicHighlight") {
      const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
      const primaryFontFamily = family;
      const secondaryFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : primaryFontFamily;
      const specialFontFamily = config.specialFontId ? resolveFontFamily(config.specialFontId) : primaryFontFamily;

      if (emphasis === "supporting") {
        fontSize = config.fontSizePx * 0.4;
        ctx.font = canvasFont(400, fontSize, secondaryFontFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (emphasis === "normal") {
        fontSize = config.fontSizePx * 0.6;
        ctx.font = canvasFont(600, fontSize, secondaryFontFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (emphasis === "important") {
        fontSize = config.fontSizePx * 1.1;
        ctx.font = canvasFont(900, fontSize, primaryFontFamily);
        fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
      } else if (emphasis === "special") {
        fontSize = config.fontSizePx * 0.9;
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
      fontSize = config.fontSizePx * editorialStackFontScale(role, isDevanagariWord);
      const fam = isDevanagariWord
        ? resolveFontFamily("notoSerifDevanagari")
        : isEditorialStackKeyword(role)
          ? family
          : config.secondaryFontId
            ? resolveFontFamily(config.secondaryFontId)
            : family;
      ctx.font = canvasFont(isDevanagariWord ? 600 : 500, fontSize, fam);
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

    const measured: Measured = { token, index, width, fontSize };

    // The hero owns its row, exactly as `flexBasis: 100%` does in the DOM:
    // close whatever was accumulating, emit the hero alone, and let the
    // remaining words start a fresh row beneath it.
    if ((config.styleId === "hero" || config.styleId === "heroMixed") && index === heroIndex) {
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

/**
 * Paints text with an outward-only stroke.
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
): void => {
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
  const lines = layoutLines(ctx, page, config, maxWidth, family, heroIndex, heroMixedBackdrop, specialIndex, frame, fps);

  const gapY = lineGapPx(config.lineHeight, config.fontSizePx);
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
    const pulse = tokenPulse(timing, ENTER_BOUNCY);
    
    const scale = 0.92 + enterBouncy * 0.08 + pulse * 0.03;
    const color = heroToken.color ?? config.activeColor;
    
    ctx.save();
    ctx.font = canvasFont(config.fontWeight || 500, config.fontSizePx * 2.2, family);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const scaleFactor = canvasScale({ width, height });
    ctx.translate(anchorX, anchorY);
    ctx.translate((1 - enterBouncy) * 20 * scaleFactor, 0);
    ctx.scale(scale, scale);
    
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
    const pulse = tokenPulse(timing, ENTER_BOUNCY);

    const scale = 0.94 + pulse * 0.04;
    const color = highlight > 0.01 ? config.activeColor : config.baseColor;
    const scaleFactor = canvasScale({ width, height });
    const backdropSize = config.fontSizePx * 2.1;

    ctx.save();
    ctx.font = canvasFont(config.fontWeight, backdropSize, family);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = `${backdropSize * -0.02}px`;

    ctx.translate(anchorX, anchorY);
    ctx.scale(scale, scale);

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
          const boost = 1 + highlight * 0.07 * config.emphasisScale;
          ctx.translate(cx, cy - lift);
          ctx.scale(boost, boost);
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
          const popScale = 1 + pulse * 0.3 * config.emphasisScale;
          ctx.scale(popScale, popScale);
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
          const grow = Math.max(0, tokenPulse(timing, ENTER_SUBTLE));
          const colour = interpolateColors(
            highlight,
            [0, 1],
            [config.baseColor, config.activeColor],
          );

          if (highlight > 0.01 && grow > 0) {
            const padX = config.fontSizePx * BOX_PAD_X_RATIO;
            const padY = config.fontSizePx * BOX_PAD_Y_RATIO;
            const boxW = tokenWidth + padX * 2;
            const boxH = config.fontSizePx + padY * 2;

            ctx.save();
            ctx.globalAlpha = entrance * highlight;
            ctx.translate(cx, cy);
            ctx.scale(grow, grow);
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
          const glowScale = 1 + highlight * 0.22 * config.emphasisScale;
          ctx.scale(glowScale, glowScale);

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

        case "splash": {
          const enter = tokenEnter(timing, ENTER_BOUNCY);
          const highlight = tokenHighlight(timing, ENTER_SMOOTH);
          const pulse = tokenPulse(timing, ENTER_BOUNCY);

          const role = getSplashWordRole(text, index, page.tokens.length);
          const inactiveOpacity = config.upcomingOpacity ?? 0.45;
          const isSpokenOrPast = timing.fromFrame <= frame;
          const alpha = isSpokenOrPast ? (highlight > 0.01 ? 1 : Math.max(0.65, inactiveOpacity)) : inactiveOpacity;
          ctx.globalAlpha = entrance * alpha;

          let roleFontFamily = family;
          let roleFontSize = config.fontSizePx;
          let roleColor = token.color ?? config.baseColor;
          let roleWeight = config.fontWeight;
          let roleStyle = "normal";

          if (role === "accent") {
            roleColor = token.color ?? config.accentColor;
            roleFontSize = config.fontSizePx * 1.15;
            roleWeight = Math.max(800, config.fontWeight);
          } else if (role === "script") {
            if (!roleFontFamily.toLowerCase().includes("playfair") && !roleFontFamily.toLowerCase().includes("caveat")) {
              roleFontFamily = resolveFontFamily("playfair");
            }
            roleStyle = "italic";
            roleFontSize = config.fontSizePx * 1.05;
          }

          ctx.font = canvasFont(roleWeight, roleFontSize, roleFontFamily, roleStyle);

          const scale = (role === "accent" ? 1.08 : 1.0) * (1 + pulse * 0.22 + highlight * 0.08);
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
          ctx.scale(scale, scale);

          if (highlight > 0.01) {
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
          const pulse = tokenPulse(timing, ENTER_BOUNCY);
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

            ctx.globalAlpha = entrance * smallAlpha;
            const smallSize = config.fontSizePx * smallRatio;
            ctx.font = canvasFont(
              config.annotationWeight > 0 ? config.annotationWeight : 500,
              smallSize,
              family,
            );
            ctx.letterSpacing = `${smallSize * 0.02}px`;
            ctx.shadowColor = "rgba(0,0,0,0.55)";
            ctx.shadowBlur = 10 * scaleFactor;
            ctx.shadowOffsetY = 2 * scaleFactor;

            ctx.translate(cx, cy + (1 - enter) * 6 * scaleFactor);
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

          const heroScale =
            1 + pulse * 0.16 * config.emphasisScale + highlight * 0.04;
          const heroLift = (1 - enter) * 14 * scaleFactor;

          ctx.shadowColor = "rgba(0,0,0,0.72)";
          ctx.shadowBlur = (highlight > 0.01 ? 32 : 16) * scaleFactor;
          ctx.shadowOffsetY = (highlight > 0.01 ? 8 : 4) * scaleFactor;

          ctx.translate(cx, cy - heroLift);
          ctx.scale(heroScale, heroScale);
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
          const pulse = tokenPulse(timing, ENTER_BOUNCY);

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
              resolveFontFamily(annotationFontId(text)),
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
          const scale = 1 + pulse * 0.2 * config.emphasisScale + highlight * 0.05;
          ctx.translate(cx, cy + (1 - enter) * -10);
          ctx.scale(scale, scale);

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
            ctx.font = canvasFont(700, config.fontSizePx, resolveFontFamily("caveat"));
            // The template's accent color, not a hardcoded white — otherwise
            // a template's `accentColor` had nowhere in this engine it ever
            // rendered.
            colour = token.color ?? config.accentColor;
            strokeWidth = Math.max(2, config.strokeWidthPx * 0.5);
            displayTextStr = text.toLowerCase();
          } else if (style === "impact") {
            ctx.font = canvasFont(400, config.fontSizePx, resolveFontFamily("anton"));
          } else if (style === "serif") {
            ctx.font = canvasFont(700, config.fontSizePx, resolveFontFamily("playfair"), "italic");
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

          if (config.dropShadow) {
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

        case "dynamicHighlight": {
          const emphasis = resolveEmphasis(token, index, heroIndex, specialIndex);
          const enterSmooth = tokenEnter(timing, ENTER_SMOOTH);
          const enterSubtle = tokenEnter(timing, ENTER_SUBTLE);
          const pulse = tokenPulse(timing, ENTER_BOUNCY);

          const primaryFontFamily = family;
          const secondaryFontFamily = config.secondaryFontId ? resolveFontFamily(config.secondaryFontId) : primaryFontFamily;
          const specialFontFamily = config.specialFontId ? resolveFontFamily(config.specialFontId) : primaryFontFamily;

          let scale = 1;
          let alpha = 1;
          let yOffset = 0;
          let blurPx = 0;

          if (emphasis === "important") {
            // Mirrors DynamicHighlight.tsx: a slide-and-focus entrance
            // instead of a bouncy scale pop. `yOffset` is scaled by the
            // shared `ctx.translate` call below, like every other role here.
            yOffset = (1 - enterSmooth) * 22;
            blurPx = (1 - enterSmooth) * 7 * canvasScale({ width, height });
            scale = 1 + pulse * 0.04;
            alpha = enterSmooth;
          } else if (emphasis === "supporting") {
            yOffset = (1 - enterSmooth) * 15;
            alpha = enterSmooth;
          } else if (emphasis === "special") {
            scale = 0.95 + enterSubtle * 0.05;
            yOffset = (1 - enterSubtle) * 8;
            alpha = enterSubtle;
          } else {
            alpha = enterSmooth;
          }

          ctx.globalAlpha = entrance * alpha;
          ctx.translate(cx, cy + yOffset * canvasScale({ width, height }));
          ctx.scale(scale, scale);

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
            // Lighting effect: mirrors DynamicHighlight.tsx's layered bloom —
            // repeated fills at growing shadow radii read as real light
            // rather than a flat blur. Same breathing sine of the absolute
            // clock, so the DOM preview and this export glow in sync.
            const breathe = 0.55 + 0.45 * Math.sin((frame / fps) * Math.PI * 1.2);
            const glowStrength = enterSmooth * (0.7 + 0.3 * breathe);
            if (glowStrength > 0.02) {
              ctx.shadowColor = "#ffffff";
              ctx.shadowBlur = roleFontSize * 0.1 * glowStrength;
              ctx.fillStyle = fill;
              ctx.fillText(displayText, -tokenWidth / 2, 0);

              ctx.shadowColor = fill;
              for (const radius of GLOW_RADII) {
                ctx.shadowBlur = roleFontSize * radius * 1.35 * glowStrength;
                ctx.fillStyle = fill;
                ctx.fillText(displayText, -tokenWidth / 2, 0);
              }
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
          const popScale = shouldAnimate
            ? 1 + pulse * 0.28 * config.emphasisScale
            : 1 + pulse * 0.08 * config.emphasisScale;
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
          ctx.scale(popScale, popScale);

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
          const pulse = tokenPulse(timing, ENTER_BOUNCY);
          const scaleFactor = canvasScale({ width, height });
          const isSpoken = timing.fromFrame <= frame;

          const variant = kineticVariant(text, index);
          const isAccent = isKineticAccentWord(text);

          const settle = enter < 0 ? 0 : enter > 1 ? 1 : enter;
          const arrive = 1 - settle;

          let dx = 0;
          let dy = 0;
          let wordScale = 1;
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
              wordScale = 0.72 + settle * 0.28;
              blurPx = arrive * 14;
              break;
            case "blurOut":
              wordScale = 1.4 - settle * 0.4;
              blurPx = arrive * 14;
              break;
          }
          wordScale += pulse * 0.05;

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
          ctx.scale(wordScale, wordScale);
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
          let wordScale = 1;

          if (isKeyword) {
            // See `centerPunchScale`'s doc comment: unclamped enter-only
            // spring, so the punch settles at rest and holds — mirrors
            // `MixedWeightToken`'s DOM version exactly.
            const punch = centerPunchScale(timing, ENTER_BOUNCY);
            wordScale = 0.75 + punch * 0.25;
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
          ctx.scale(wordScale, wordScale);
          ctx.fillStyle = token.color ?? config.baseColor;
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

          let punchScale = 1;
          if (isCritical && state !== "buildup") {
            // See `centerPunchScale`'s doc comment for why this is a bare
            // enter-only spring rather than `tokenPulse`.
            const punch = centerPunchScale(timing, ENTER_BOUNCY);
            punchScale = state === "punch" ? 0.7 + punch * 0.3 : 1 + punch * 0.02;
          }

          const color = isCritical ? (token.color ?? config.accentColor) : (token.color ?? "#ffffff");
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          ctx.scale(punchScale, punchScale);
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
            const color = token.color ?? config.baseColor;

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
          const roleFontSize = config.fontSizePx * editorialStackFontScale(role, isDevanagariWord);
          const scaleFactor = canvasScale({ width, height });
          const fam = isDevanagariWord
            ? resolveFontFamily("notoSerifDevanagari")
            : isKeyword
              ? family
              : config.secondaryFontId
                ? resolveFontFamily(config.secondaryFontId)
                : family;
          ctx.font = canvasFont(isDevanagariWord ? 600 : 500, roleFontSize, fam);

          let enter: number;
          let punchScale = 1;
          let yOffset = 0;
          let color: string;

          if (isDevanagariWord) {
            enter = tokenEnter(timing, ENTER_SUBTLE);
            punchScale = 0.95 + enter * 0.05;
            color = token.color ?? config.accentColor;
          } else if (isKeyword) {
            enter = tokenEnter(timing, ENTER_SMOOTH);
            punchScale = 0.94 + enter * 0.08;
            color = token.color ?? config.baseColor;
          } else {
            enter = tokenEnter(timing, ENTER_SMOOTH);
            yOffset = (1 - enter) * 10 * scaleFactor;
            color = token.color ?? "#ffffff";
          }

          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy + yOffset);
          ctx.scale(punchScale, punchScale);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);

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
            ctx.fillStyle = token.color ?? config.baseColor;
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
          const isKeyword = role === "critical" || role === "keyword";
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
            ctx.globalAlpha = entrance * 0.14 * enter;
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
          const color = isCritical
            ? (token.color ?? config.baseColor)
            : (token.color ?? (isDevanagariWord ? config.accentColor : config.baseColor));

          ctx.font = canvasFont(500, roleFontSize, fam);
          ctx.globalAlpha = entrance * enter;
          ctx.translate(cx, cy);
          ctx.fillStyle = color;
          ctx.fillText(text, -tokenWidth / 2, 0);

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
