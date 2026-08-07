"use client";

import { useMemo } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { CaptionPage, CaptionStyleConfig } from "@/core";
import { VIDEO_FPS } from "@/core";
import { CaptionScene } from "@/remotion/compositions/CaptionScene";
import type { BackdropId } from "@/remotion/compositions/backdrop-options";
import { useFontsReady } from "@/lib/hooks/use-fonts-ready";
import { cn } from "@/lib/utils";

export interface PlayerStageProps {
  pages: readonly CaptionPage[];
  config: CaptionStyleConfig;
  /** Composition canvas, in pixels. */
  canvasWidth: number;
  canvasHeight: number;
  durationInFrames: number;
  videoSrc?: string | null;
  backdrop?: BackdropId;
  /**
   * Exposes the Player so the timeline can seek it and subscribe to
   * `frameupdate`. The playhead is driven off that event and written straight
   * to the DOM — routing the current frame through React state would re-render
   * the editor 30 times a second.
   */
  playerRef?: React.Ref<PlayerRef>;
  /** Remotion's built-in transport. Off where a custom TransportBar replaces it. */
  controls?: boolean;
}

/**
 * The live Remotion preview.
 *
 * Default-exported and loaded through `next/dynamic({ ssr: false })` by its
 * callers: the Player touches `window` during module init, so rendering it on
 * the server throws before hydration ever runs.
 *
 * Fills its parent rather than sizing itself — the page owns the aspect box so
 * the skeleton and the mounted Player occupy identical space, which is what
 * keeps CLS at zero across the dynamic import.
 */
export default function PlayerStage({
  pages,
  config,
  canvasWidth,
  canvasHeight,
  durationInFrames,
  videoSrc = null,
  backdrop = "studio",
  playerRef,
  controls = true,
}: PlayerStageProps) {
  const fontsReady = useFontsReady();

  // Remotion re-renders the composition whenever `inputProps` changes identity,
  // so this must be memoised or the preview would thrash on every parent render.
  const inputProps = useMemo(
    () => ({ pages, config, videoSrc, backdrop }),
    [pages, config, videoSrc, backdrop],
  );

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black">
      <Player
        ref={playerRef}
        component={CaptionScene}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        fps={VIDEO_FPS}
        compositionWidth={canvasWidth}
        compositionHeight={canvasHeight}
        controls={controls}
        loop
        doubleClickToFullscreen
        acknowledgeRemotionLicense
        style={{ width: "100%", height: "100%" }}
        className={cn(
          "transition-opacity duration-300",
          fontsReady ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Held until webfonts resolve so captions never paint in a fallback face
          and then visibly reflow. Matches the stage exactly, so no layout shift. */}
      {!fontsReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
            <p className="text-xs text-white/45">Loading fonts…</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
