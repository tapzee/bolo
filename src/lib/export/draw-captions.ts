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
} from "@/remotion/captions/animation";
import {
  HERO_SMALL_RATIO,
  getSplashWordRole,
  heroWordIndex,
} from "@/remotion/captions/primitives";
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
    const text = getRenderText(token, config, index, page.tokens.length, heroIndex);
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
    } else if (config.styleId === "hero" && index !== heroIndex) {
      fontSize = config.fontSizePx * heroSmallRatio;
      ctx.font = canvasFont(
        config.annotationWeight > 0 ? config.annotationWeight : 500,
        fontSize,
        family,
      );
      fontToRestore = canvasFont(config.fontWeight, config.fontSizePx, family);
    }

    const width = ctx.measureText(text).width;
    if (fontToRestore) ctx.font = fontToRestore;

    const measured: Measured = { token, index, width, fontSize };

    // The hero owns its row, exactly as `flexBasis: 100%` does in the DOM:
    // close whatever was accumulating, emit the hero alone, and let the
    // remaining words start a fresh row beneath it.
    if (config.styleId === "hero" && index === heroIndex) {
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
  fill: string,
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
  const lines = layoutLines(ctx, page, config, maxWidth, family, heroIndex);

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
      }

      ctx.restore();
      x += tokenWidth + config.wordGapPx;
    }

    y += line.height + gapY;
  }

  ctx.restore();
};
