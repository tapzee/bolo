"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { VIDEO_FPS } from "@/core";

const formatTimecode = (frame: number): string => {
  const totalSeconds = Math.max(0, frame) / VIDEO_FPS;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export interface TransportBarProps {
  player: PlayerRef | null;
  durationInFrames: number;
}

/**
 * Custom playback transport.
 *
 * Replaces Remotion's built-in controls for two reasons: they cannot be styled
 * to match the editor, and they offer no frame stepping — which is the whole
 * point of a word-level caption tool, where getting a word onset right means
 * nudging one frame at a time.
 *
 * The timecode is driven by the player's `frameupdate` event written straight
 * into a ref'd DOM node, not React state. At 30fps a state update per frame
 * would re-render this bar 30 times a second, next to a live video preview.
 * Only play/pause — which changes at human speed — lives in state.
 */
export function TransportBar({ player, durationInFrames }: TransportBarProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (player === null) return;

    const onFrame = (event: { detail: { frame: number } }): void => {
      const frame = event.detail.frame;

      if (timecodeRef.current !== null) {
        timecodeRef.current.textContent = formatTimecode(frame);
      }
      if (progressRef.current !== null) {
        const ratio = durationInFrames <= 1 ? 0 : frame / (durationInFrames - 1);
        // scaleX rather than width: stays on the compositor.
        progressRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
      }
    };

    const onPlay = (): void => setPlaying(true);
    const onPause = (): void => setPlaying(false);

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);

    setPlaying(player.isPlaying());

    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [player, durationInFrames]);

  const step = useCallback(
    (frames: number) => {
      if (player === null) return;
      player.pause();
      const next = Math.min(
        durationInFrames - 1,
        Math.max(0, player.getCurrentFrame() + frames),
      );
      player.seekTo(next);
    },
    [player, durationInFrames],
  );

  const toggle = useCallback(() => {
    if (player === null) return;
    player.toggle();
  }, [player]);

  // Space to play/pause, arrows to step. Skipped while typing, or editing a
  // caption would toggle playback on every space character.
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
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, step]);

  const buttonClass =
    "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40";

  return (
    <div className="flex w-full items-center gap-2 rounded-xl border bg-card/60 px-2 py-1.5">
      <button
        type="button"
        className={buttonClass}
        title="Go to start"
        disabled={player === null}
        onClick={() => player?.seekTo(0)}
      >
        <SkipBack className="size-3.5" />
      </button>

      <button
        type="button"
        className={buttonClass}
        title="Previous frame (←)"
        disabled={player === null}
        onClick={() => step(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggle}
        disabled={player === null}
        title={playing ? "Pause (Space)" : "Play (Space)"}
        className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground transition-transform hover:scale-105 disabled:opacity-40"
      >
        {playing ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 translate-x-px fill-current" />
        )}
      </button>

      <button
        type="button"
        className={buttonClass}
        title="Next frame (→)"
        disabled={player === null}
        onClick={() => step(1)}
      >
        <ChevronRight className="size-4" />
      </button>

      <button
        type="button"
        className={buttonClass}
        title="Go to end"
        disabled={player === null}
        onClick={() => player?.seekTo(durationInFrames - 1)}
      >
        <SkipForward className="size-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      <span className="font-mono text-xs tabular-nums text-foreground">
        <span ref={timecodeRef}>0:00</span>
        <span className="mx-1 text-muted-foreground/50">/</span>
        <span className="text-muted-foreground">
          {formatTimecode(durationInFrames - 1)}
        </span>
      </span>

      <div className="mx-1 h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          ref={progressRef}
          className="h-full w-full origin-left rounded-full bg-brand will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <button
        type="button"
        className={buttonClass}
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
        {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
      </button>
    </div>
  );
}
