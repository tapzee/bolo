"use client";

import { useEffect, useMemo, useRef } from "react";
import { Thumbnail } from "@remotion/player";
import {
  CAPTION_STYLE_LIST,
  SAMPLE_CAPTIONS,
  SAMPLE_DURATION_MS,
  VIDEO_FPS,
  canvasSize,
  getStyleDefaults,
  isStyleId,
  msToFrames,
  type AspectRatioId,
  type CaptionStyleConfig,
  type StyleId,
} from "@/core";
import { buildCaptionPages } from "@/remotion/captions/build-pages";
import { CaptionScene } from "@/remotion/compositions/CaptionScene";
import type { BackdropId } from "@/remotion/compositions/PreviewBackdrop";
import { drawCaptions } from "@/lib/export/draw-captions";
import { FONT_FAMILY } from "@/remotion/fonts";
import { ensureCaptionFontLoaded, resolveFontFamily } from "@/lib/export/fonts";

export interface ExportFrameGridProps {
  aspect: AspectRatioId;
  /** Playhead positions to sample, in ms. */
  timesMs: readonly number[];
  /** Styles to compare; empty means every style in the catalogue. */
  styleIds: readonly string[];
  /** Backdrop behind the DOM tile — `bright` and `busy` are the legibility tests. */
  backdrop: BackdropId;
  tileWidth?: number;
}

/**
 * Preview-vs-export parity grid.
 *
 * `/dev/frames` renders only the DOM styles, which is half the renderer: the
 * MP4 a user downloads is drawn by `lib/export/draw-captions.ts` against a 2D
 * context, and a divergence between the two is this project's worst class of
 * bug — silent, and permanent in the delivered file. This surface puts both
 * renderers on the same page at the same playhead so the difference is visible
 * rather than inferred.
 *
 * Left tile is the DOM (what the editor shows), right tile is Canvas2D (what
 * gets encoded). The backdrops differ on purpose — a flat fill behind the
 * canvas keeps attention on glyph position, size, case and colour, which are
 * the things that actually drift.
 */
export default function ExportFrameGrid({
  aspect,
  timesMs,
  styleIds,
  backdrop,
  tileWidth: tileWidthOverride,
}: ExportFrameGridProps) {
  const size = useMemo(() => canvasSize(aspect, "1080p"), [aspect]);
  const durationInFrames = useMemo(
    () => Math.max(1, msToFrames(SAMPLE_DURATION_MS, VIDEO_FPS)),
    [],
  );

  const definitions = useMemo(() => {
    if (styleIds.length === 0) return CAPTION_STYLE_LIST;
    const wanted = new Set(styleIds.filter(isStyleId));
    return CAPTION_STYLE_LIST.filter((definition) => wanted.has(definition.id));
  }, [styleIds]);

  const tileWidth = tileWidthOverride ?? (aspect === "landscape" ? 420 : 300);

  return (
    <div className="space-y-8">
      {timesMs.map((timeMs) => (
        <section key={timeMs} className="space-y-3">
          <h2 className="font-mono text-xs text-muted-foreground">
            t = {timeMs}ms · frame {msToFrames(timeMs, VIDEO_FPS)}
          </h2>
          <div className="flex flex-wrap gap-6">
            {definitions.map((definition) => {
              const config = getStyleDefaults(definition.id);
              const pages = buildCaptionPages(SAMPLE_CAPTIONS, config);

              return (
                <figure key={definition.id} className="space-y-1.5">
                  <div className="flex gap-1">
                    <div
                      className="overflow-hidden rounded-lg bg-black ring-hairline"
                      style={{ width: tileWidth }}
                    >
                      <Thumbnail
                        component={CaptionScene}
                        inputProps={{ pages, config, backdrop }}
                        compositionWidth={size.width}
                        compositionHeight={size.height}
                        frameToDisplay={msToFrames(timeMs, VIDEO_FPS)}
                        durationInFrames={durationInFrames}
                        fps={VIDEO_FPS}
                        style={{ width: tileWidth }}
                      />
                    </div>
                    <ExportTile
                      styleId={definition.id}
                      config={config}
                      timeMs={timeMs}
                      width={size.width}
                      height={size.height}
                      tileWidth={tileWidth}
                    />
                  </div>
                  <figcaption className="text-[11px] text-muted-foreground">
                    {definition.label} · <span className="opacity-60">DOM | export</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ExportTile({
  styleId,
  config,
  timeMs,
  width,
  height,
  tileWidth,
}: {
  styleId: StyleId;
  config: CaptionStyleConfig;
  timeMs: number;
  width: number;
  height: number;
  tileWidth: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const draw = async (): Promise<void> => {
      const canvas = ref.current;
      if (canvas === null) return;
      const ctx = canvas.getContext("2d");
      if (ctx === null) return;

      // The faces this style will ask for must be loaded before the first
      // measureText, or every width is measured against a fallback — the same
      // preload the real export does in `export-video.ts`.
      const faces = [config.fontId, config.secondaryFontId, config.specialFontId, "devanagari" as const];
      await Promise.all(
        faces
          .filter((id): id is NonNullable<typeof id> => id !== undefined)
          .map((id) =>
            ensureCaptionFontLoaded(config.fontWeight, config.fontSizePx, resolveFontFamily(id)),
          ),
      );
      if (cancelled) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#1c2027";
      ctx.fillRect(0, 0, width, height);
      // A single mid-grey band stands in for footage, so a white caption is
      // judged against something other than a flat dark field.
      ctx.fillStyle = "#3a4150";
      ctx.fillRect(0, height * 0.42, width, height * 0.16);

      const pages = buildCaptionPages(SAMPLE_CAPTIONS, config);
      drawCaptions(ctx, { pages, config, timeMs, width, height, fps: VIDEO_FPS });
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [styleId, config, timeMs, width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className="rounded-lg ring-hairline"
      style={{ width: tileWidth, height: (tileWidth * height) / width, fontFamily: FONT_FAMILY.montserrat }}
    />
  );
}
