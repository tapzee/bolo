"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PlayerRef } from "@remotion/player";
import {
  SAMPLE_CAPTIONS,
  SAMPLE_DURATION_MS,
  VIDEO_FPS,
  canvasSize,
  msToFrames,
  resolveTemplate,
  templateById,
  type CaptionStyleConfig,
} from "@/core";
import { buildCaptionPages } from "@/remotion/captions/build-pages";
import { CaptionDragLayer } from "@/components/editor/CaptionDragLayer";

// Same reason as everywhere else the Player is used: it touches `window` during
// module init and cannot be server-rendered.
const PlayerStage = dynamic(() => import("@/components/studio/PlayerStage"), {
  ssr: false,
  loading: () => <div className="aspect-[9/16] w-full rounded-xl bg-muted" />,
});

/**
 * Live harness for `CaptionDragLayer`, outside the `/create` auth gate.
 *
 * Deliberately runs the *real* Player and the real overlay rather than a mock:
 * the box works by measuring `[data-bolo-caption-block]` out of the rendered
 * caption tree, so a stand-in would verify nothing about the part that can
 * actually break.
 *
 * `hero` is the default template because its stacked layout is the case the
 * previous arithmetic box got wrong — a headline row plus supporting rows is
 * exactly where a predicted height stops matching the text.
 */
export function CaptionBoxHarness() {
  const [config, setConfig] = useState<CaptionStyleConfig>(() => {
    const template = templateById("blockbuster");
    return resolveTemplate(template!);
  });

  const canvas = useMemo(() => canvasSize("reel", "1080p"), []);
  const pages = useMemo(
    () =>
      buildCaptionPages(SAMPLE_CAPTIONS, {
        styleId: config.styleId,
        combineWithinMs: config.combineWithinMs,
        maxWordsPerPage: config.maxWordsPerPage,
        linesPerPage: config.linesPerPage,
        fontSizePx: config.fontSizePx,
        letterSpacingPx: config.letterSpacingPx,
        wordGapPx: config.wordGapPx,
        lineHeight: config.lineHeight,
        maxLineWidthPct: config.maxLineWidthPct,
        maxBlockHeightPct: config.maxBlockHeightPct,
        annotationSizeRatio: config.annotationSizeRatio,
      }),
    [
      config.styleId,
      config.combineWithinMs,
      config.maxWordsPerPage,
      config.linesPerPage,
      config.fontSizePx,
      config.letterSpacingPx,
      config.wordGapPx,
      config.lineHeight,
      config.maxLineWidthPct,
      config.maxBlockHeightPct,
      config.annotationSizeRatio,
    ],
  );

  const patch = (next: Partial<CaptionStyleConfig>) =>
    setConfig((prev) => ({ ...prev, ...next }));

  /**
   * Park the playhead on a frame that actually has a caption.
   *
   * The Player mounts paused at frame 0, and the sample transcript does not
   * start until 240ms — so at rest there is no caption block on screen and
   * nothing for the box to measure. Retried because the Player mounts through
   * a dynamic import and the ref is null for the first few ticks.
   */
  const playerRef = useRef<PlayerRef>(null);
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (playerRef.current !== null) {
        playerRef.current.seekTo(msToFrames(2700, VIDEO_FPS));
        clearInterval(id);
      } else if (tries > 60) {
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-6 space-y-4">
      {/* The aspect box is the parent's job — `PlayerStage` fills its parent
          rather than sizing itself. Without an explicit ratio this collapses to
          zero height, `overflow-hidden` clips the whole overlay away, and every
          handle stops being hit-testable while still looking correct. */}
      <div
        className="relative mx-auto w-[320px] overflow-hidden rounded-xl bg-black"
        style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
      >
        <PlayerStage
          pages={pages}
          config={config}
          canvasWidth={canvas.width}
          canvasHeight={canvas.height}
          durationInFrames={msToFrames(SAMPLE_DURATION_MS, VIDEO_FPS)}
          backdrop="busy"
          controls={false}
          playerRef={playerRef}
        />
        <CaptionDragLayer
          config={config}
          enabled
          onMove={(horizontalOffsetPct, verticalOffsetPct) =>
            patch({ horizontalOffsetPct, verticalOffsetPct })
          }
          onResize={({ fontSizePx, maxLineWidthPct }) =>
            patch({ fontSizePx, maxLineWidthPct })
          }
        />
      </div>

      <pre
        data-box-state
        className="mx-auto w-fit rounded-lg border bg-card/50 px-3 py-2 font-mono text-[11px]"
      >
        {`fontSizePx=${config.fontSizePx} maxLineWidthPct=${config.maxLineWidthPct.toFixed(0)} hOff=${config.horizontalOffsetPct.toFixed(1)} vOff=${config.verticalOffsetPct.toFixed(1)}`}
      </pre>
    </div>
  );
}
