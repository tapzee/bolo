"use client";

import { useMemo } from "react";
import { Thumbnail } from "@remotion/player";
import {
  CAPTION_STYLE_LIST,
  SAMPLE_CAPTIONS,
  SAMPLE_DURATION_MS,
  VIDEO_FPS,
  canvasSize,
  getStyleDefaults,
  msToFrames,
  type AspectRatioId,
} from "@/core";
import { buildCaptionPages } from "@/remotion/captions/build-pages";
import { CaptionScene } from "@/remotion/compositions/CaptionScene";
import type { BackdropId } from "@/remotion/compositions/PreviewBackdrop";

export interface FrameGridProps {
  aspect: AspectRatioId;
  backdrop: BackdropId;
  /** Playhead positions to sample, in ms. */
  timesMs: readonly number[];
  /**
   * On-screen tile width. Matters more than it looks: the text stroke is
   * specified in composition pixels, so a 1080-wide composition shown in a
   * 200px tile renders its 3px stroke at 0.55px and the readability guarantee
   * cannot be judged. Review legibility at 480+.
   */
  tileWidth?: number;
}

/**
 * Deterministic single-frame render of every style, for visual QA.
 *
 * Uses `Thumbnail` rather than `Player` so a given time always produces exactly
 * the same pixels. Screenshotting a playing Player instead would sample
 * whatever frame the clock happened to land on, which is useless as a
 * regression baseline — a spring that fires one frame late would pass or fail
 * at random.
 */
export default function FrameGridClient({
  aspect,
  backdrop,
  timesMs,
  tileWidth: tileWidthOverride,
}: FrameGridProps) {
  const size = useMemo(() => canvasSize(aspect, "1080p"), [aspect]);
  const durationInFrames = useMemo(
    () => Math.max(1, msToFrames(SAMPLE_DURATION_MS, VIDEO_FPS)),
    [],
  );

  const tileWidth =
    tileWidthOverride ??
    (aspect === "landscape" ? 340 : aspect === "square" ? 250 : 200);

  return (
    <div className="space-y-8">
      {timesMs.map((timeMs) => (
        <section key={timeMs} className="space-y-3">
          <h2 className="font-mono text-xs text-muted-foreground">
            t = {timeMs}ms · frame {msToFrames(timeMs, VIDEO_FPS)}
          </h2>
          <div className="flex flex-wrap gap-4">
            {CAPTION_STYLE_LIST.map((definition) => {
              const config = getStyleDefaults(definition.id);
              const pages = buildCaptionPages(SAMPLE_CAPTIONS, {
                combineWithinMs: config.combineWithinMs,
                maxWordsPerPage: config.maxWordsPerPage,
              });

              return (
                <figure key={definition.id} className="space-y-1.5">
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
                  <figcaption className="text-[11px] text-muted-foreground">
                    {definition.label}
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
