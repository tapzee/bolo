"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { VIDEO_FPS } from "@/core";
import { cn } from "@/lib/utils";

const formatTimecode = (frame: number): string => {
  const totalSeconds = Math.max(0, frame) / VIDEO_FPS;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export interface TransportBarProps {
  player: PlayerRef | null;
  durationInFrames: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

/**
 * Custom playback transport with interactive scrubber timeline, zoom & grid controls.
 */
export function TransportBar({
  player,
  durationInFrames,
  onToggleFullscreen,
  isFullscreen = false,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid = false,
  onToggleGrid,
}: TransportBarProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const timecodeRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateScrubberVisuals = useCallback(
    (frame: number) => {
      if (timecodeRef.current !== null) {
        timecodeRef.current.textContent = formatTimecode(frame);
      }
      const ratio = durationInFrames <= 1 ? 0 : Math.min(1, Math.max(0, frame / (durationInFrames - 1)));
      if (progressRef.current !== null) {
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (thumbRef.current !== null) {
        thumbRef.current.style.left = `${ratio * 100}%`;
      }
    },
    [durationInFrames],
  );

  useEffect(() => {
    if (player === null) return;

    const onFrame = (event: { detail: { frame: number } }): void => {
      // Don't fight manual pointer scrubbing
      if (isScrubbing) return;
      updateScrubberVisuals(event.detail.frame);
    };

    const onPlay = (): void => setPlaying(true);
    const onPause = (): void => setPlaying(false);

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);

    setPlaying(player.isPlaying());
    updateScrubberVisuals(player.getCurrentFrame());

    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [player, durationInFrames, isScrubbing, updateScrubberVisuals]);

  const seekFromPointer = useCallback(
    (clientX: number) => {
      if (player === null || trackRef.current === null || durationInFrames <= 1) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const targetFrame = Math.round(ratio * (durationInFrames - 1));
      player.seekTo(targetFrame);
      updateScrubberVisuals(targetFrame);
    },
    [player, durationInFrames, updateScrubberVisuals],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (player === null || durationInFrames <= 1) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsScrubbing(true);
      seekFromPointer(e.clientX);
    },
    [player, durationInFrames, seekFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isScrubbing) {
        seekFromPointer(e.clientX);
      }
      if (trackRef.current !== null && durationInFrames > 1) {
        const rect = trackRef.current.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const hoverFrame = Math.round(ratio * (durationInFrames - 1));
        setHoverTime(formatTimecode(hoverFrame));
        setHoverX(ratio * 100);
      }
    },
    [isScrubbing, durationInFrames, seekFromPointer],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isScrubbing) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if capture was already released
        }
        setIsScrubbing(false);
      }
    },
    [isScrubbing],
  );

  const step = useCallback(
    (frames: number) => {
      if (player === null) return;
      player.pause();
      const next = Math.min(
        durationInFrames - 1,
        Math.max(0, player.getCurrentFrame() + frames),
      );
      player.seekTo(next);
      updateScrubberVisuals(next);
    },
    [player, durationInFrames, updateScrubberVisuals],
  );

  const toggle = useCallback(() => {
    if (player === null) return;
    player.toggle();
  }, [player]);

  // Space to play/pause, arrows to step
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(event.shiftKey ? -VIDEO_FPS : -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(event.shiftKey ? VIDEO_FPS : 1);
      } else if (event.key === "f" || event.key === "F") {
        if (onToggleFullscreen) {
          event.preventDefault();
          onToggleFullscreen();
        }
      } else if (event.key === "g" || event.key === "G") {
        if (onToggleGrid) {
          event.preventDefault();
          onToggleGrid();
        }
      } else if (event.key === "+" || event.key === "=") {
        if (onZoomIn) {
          event.preventDefault();
          onZoomIn();
        }
      } else if (event.key === "-" || event.key === "_") {
        if (onZoomOut) {
          event.preventDefault();
          onZoomOut();
        }
      } else if (event.key === "0") {
        if (onResetZoom) {
          event.preventDefault();
          onResetZoom();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, step, onToggleFullscreen, onToggleGrid, onZoomIn, onZoomOut, onResetZoom]);

  const buttonClass =
    "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="flex w-full items-center gap-1.5 sm:gap-2 rounded-2xl border bg-card/95 p-1.5 sm:p-2 shadow-sm backdrop-blur-xl">
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={buttonClass}
        title="Go to start"
        disabled={player === null}
        onClick={() => {
          player?.seekTo(0);
          updateScrubberVisuals(0);
        }}
      >
        <SkipBack className="size-4" />
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={buttonClass}
        title="Previous frame (←)"
        disabled={player === null}
        onClick={() => step(-1)}
      >
        <ChevronLeft className="size-4.5" />
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        disabled={player === null}
        title={playing ? "Pause (Space)" : "Play (Space)"}
        className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md shadow-brand/20 transition-colors hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/30 disabled:opacity-40 disabled:pointer-events-none"
      >
        {playing ? (
          <Pause className="size-4 sm:size-4.5 fill-current" />
        ) : (
          <Play className="size-4 sm:size-4.5 translate-x-px fill-current" />
        )}
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={buttonClass}
        title="Next frame (→)"
        disabled={player === null}
        onClick={() => step(1)}
      >
        <ChevronRight className="size-4.5" />
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={buttonClass}
        title="Go to end"
        disabled={player === null}
        onClick={() => {
          const endFrame = Math.max(0, durationInFrames - 1);
          player?.seekTo(endFrame);
          updateScrubberVisuals(endFrame);
        }}
      >
        <SkipForward className="size-4" />
      </motion.button>

      <div className="mx-1 h-5 w-px bg-border/50 shrink-0" />

      <span className="font-mono text-xs sm:text-sm shrink-0 tabular-nums text-foreground select-none flex items-center justify-center min-w-[70px]">
        <span ref={timecodeRef} className="font-semibold text-brand">
          0:00
        </span>
        <span className="mx-1.5 text-muted-foreground/40">/</span>
        <span className="text-muted-foreground/80 font-medium">
          {formatTimecode(durationInFrames - 1)}
        </span>
      </span>

      {/* Interactive Drag & Click Timeline Scrubber */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={() => {
          setHoverTime(null);
          setHoverX(null);
        }}
        className="group relative mx-2 sm:mx-3 flex h-10 min-w-[60px] flex-1 cursor-pointer items-center select-none touch-none"
        title="Click or drag to seek anywhere in the video"
      >
        {/* Hover timestamp tooltip */}
        {hoverTime !== null && hoverX !== null ? (
          <div
            className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded-md bg-foreground/95 backdrop-blur-sm px-2 py-1 font-mono text-[10px] font-bold text-background shadow-lg transition-all"
            style={{ left: `${hoverX}%` }}
          >
            {hoverTime}
          </div>
        ) : null}

        {/* Track groove */}
        <div className="relative h-1.5 w-full overflow-visible rounded-full bg-muted/80 transition-all duration-200 group-hover:h-2">
          {/* Active progress fill */}
          <div
            ref={progressRef}
            className="h-full w-full origin-left rounded-full bg-brand shadow-sm will-change-transform"
            style={{ transform: "scaleX(0)" }}
          />

          {/* Interactive thumb handle */}
          <div
            ref={thumbRef}
            className={cn(
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3.5 rounded-full bg-white border border-border shadow-md transition-all pointer-events-none ring-2 ring-transparent",
              isScrubbing ? "scale-125 opacity-100 ring-brand/30 border-brand" : "opacity-0 group-hover:opacity-100 group-hover:scale-110",
            )}
            style={{ left: "0%" }}
          />
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(buttonClass, muted && "text-destructive hover:text-destructive hover:bg-destructive/10")}
        title={muted ? "Unmute" : "Mute"}
        disabled={player === null}
        onClick={() => {
          if (player === null) return;
          const next = !muted;
          setMuted(next);
          if (next) player.mute();
          else player.unmute();
        }}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </motion.button>

      {/* Zoom controls: [-] 100% [+] */}
      {onZoomIn !== undefined && onZoomOut !== undefined ? (
        <div className="flex items-center shrink-0">
          <div className="mx-1 h-5 w-px bg-border/50" />

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={buttonClass}
            title="Zoom out (-)"
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="size-4" />
          </motion.button>

          <button
            type="button"
            className="px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground tabular-nums select-none transition-colors min-w-[44px] text-center"
            title="Click to reset zoom to 100% (0)"
            onClick={onResetZoom}
          >
            {Math.round(zoom * 100)}%
          </button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={buttonClass}
            title="Zoom in (+)"
            onClick={onZoomIn}
            disabled={zoom >= 2.5}
          >
            <ZoomIn className="size-4" />
          </motion.button>
        </div>
      ) : null}

      {/* Grid & Safe-Zone overlay toggle */}
      {onToggleGrid !== undefined ? (
        <div className="flex items-center shrink-0">
          <div className="mx-1 h-5 w-px bg-border/50" />

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              showGrid
                ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/40 shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            title={showGrid ? "Hide rule-of-thirds & safe-zone grid (G)" : "Show rule-of-thirds & safe-zone grid (G)"}
            onClick={onToggleGrid}
          >
            <Grid className="size-4" />
          </motion.button>
        </div>
      ) : null}

      {onToggleFullscreen !== undefined ? (
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(buttonClass, "ml-1")}
          title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </motion.button>
      ) : null}
    </div>
  );
}

