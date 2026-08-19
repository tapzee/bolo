"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { ZoomIn } from "lucide-react";
import type { CaptionPage, CaptionWord } from "@/core";
import { VIDEO_FPS, timingBoundsFor } from "@/core";
import { cn } from "@/lib/utils";
import { WaveformStrip } from "./WaveformStrip";

/**
 * Zoom levels in px per millisecond.
 *
 * A single fixed scale cannot serve both ends of the range: 0.12 makes a 400ms
 * word a comfortable 48px target but turns a 30-minute transcript into a
 * 216,000px scroll, while a scale that fits a long video makes individual words
 * too narrow to grab. The starting level is picked from the clip's own duration
 * so short reels open zoomed in and long recordings open navigable.
 */
const ZOOM_LEVELS = [0.012, 0.03, 0.06, 0.12, 0.24] as const;
const ZOOM_LABELS = ["Fit", "S", "M", "L", "XL"] as const;

/** Words rendered beyond each edge of the viewport, to hide scroll pop-in. */
const OVERSCAN_PX = 600;
const MIN_DRAG_WIDTH_PX = 6;

const defaultZoomIndex = (durationMs: number): number => {
  const minutes = durationMs / 60_000;
  if (minutes <= 1) return 4;
  if (minutes <= 3) return 3;
  if (minutes <= 10) return 2;
  if (minutes <= 20) return 1;
  return 0;
};

export type TimelineMode = "word" | "line";

export interface WordTimelineProps {
  words: readonly CaptionWord[];
  /** Used by LINE mode, which shows whole caption pages instead of words. */
  pages: readonly CaptionPage[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onRetime: (index: number, startMs: number, endMs: number) => void;
  onSeekMs: (ms: number) => void;
  durationMs: number;
  /**
   * The live Player instance, passed by value rather than as a ref.
   *
   * A ref would be `null` on first render — the Player is behind a dynamic
   * import and mounts later — and because a ref object's identity never
   * changes, the effect below would never re-run once it populated. The
   * playhead simply never moved. Passing the instance makes it a real
   * dependency.
   */
  player: PlayerRef | null;
  peaks?: readonly number[];
  mode?: TimelineMode;
  onModeChange?: (mode: TimelineMode) => void;
}

type DragMode = "start" | "end";

/**
 * Scrubbable word timeline.
 *
 * Three deliberate performance decisions, because this sits next to a live
 * video preview and must not steal frames from it:
 *
 * 1. Only words intersecting the scroll viewport are mounted. A 30-minute
 *    transcript is thousands of words; rendering them all would cost far more
 *    than the 200-word threshold the brief allows.
 *
 * 2. The playhead is moved by writing `transform` on a ref inside the player's
 *    frameupdate event. Putting the current frame in React state would
 *    re-render this whole subtree 30 times a second.
 *
 * 3. Dragging a word edge mutates that one element's inline style directly and
 *    commits to React state only on pointerup. Round-tripping every pointermove
 *    through state would rebuild every caption page on every mouse movement.
 */
export function WordTimeline({
  words,
  pages,
  selectedIndex,
  onSelect,
  onRetime,
  onSeekMs,
  durationMs,
  player,
  peaks = [],
  mode = "word",
  onModeChange,
}: WordTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ left: 0, width: 1200 });
  const [zoomIndex, setZoomIndex] = useState(() => defaultZoomIndex(durationMs));

  const pxPerMs = ZOOM_LEVELS[zoomIndex] ?? 0.12;

  // The playhead and drag handlers run outside React's render cycle, so they
  // read the scale from a ref — a captured value would go stale on zoom.
  const pxPerMsRef = useRef(pxPerMs);
  pxPerMsRef.current = pxPerMs;

  const contentWidth = Math.max(600, durationMs * pxPerMs);

  // Maps each page to its first word index. Page building never drops or
  // reorders words, so a running cursor is exact.
  const pageOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cursor = 0;
    for (const page of pages) {
      offsets.push(cursor);
      cursor += page.tokens.length;
    }
    return offsets;
  }, [pages]);

  // --- Virtualisation window -------------------------------------------------
  const updateViewport = useCallback(() => {
    const el = scrollRef.current;
    if (el === null) return;
    setViewport({ left: el.scrollLeft, width: el.clientWidth });
  }, []);

  useEffect(() => {
    updateViewport();
    const el = scrollRef.current;
    if (el === null) return;

    const observer = new ResizeObserver(updateViewport);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateViewport]);

  const visible = useMemo(() => {
    const from = viewport.left - OVERSCAN_PX;
    const to = viewport.left + viewport.width + OVERSCAN_PX;

    const out: { word: CaptionWord; index: number }[] = [];
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      if (word === undefined) continue;
      const x = word.startMs * pxPerMs;
      const w = (word.endMs - word.startMs) * pxPerMs;
      if (x + w >= from && x <= to) out.push({ word, index: i });
    }
    return out;
  }, [words, viewport, pxPerMs]);

  // --- Playhead --------------------------------------------------------------
  useEffect(() => {
    if (player === null) return;

    const onFrame = (event: { detail: { frame: number } }): void => {
      const ms = (event.detail.frame / VIDEO_FPS) * 1000;
      const x = ms * pxPerMsRef.current;

      const head = playheadRef.current;
      if (head !== null) head.style.transform = `translateX(${x}px)`;

      // Keep the playhead inside a middle band rather than recentring on every
      // frame, which would make the track jitter continuously during playback.
      const el = scrollRef.current;
      if (el !== null) {
        const relative = x - el.scrollLeft;
        if (relative > el.clientWidth * 0.75 || relative < el.clientWidth * 0.1) {
          el.scrollLeft = Math.max(0, x - el.clientWidth * 0.35);
        }
      }
    };

    player.addEventListener("frameupdate", onFrame);
    return () => player.removeEventListener("frameupdate", onFrame);
  }, [player]);

  // --- Edge dragging ---------------------------------------------------------
  const dragRef = useRef<{
    index: number;
    mode: DragMode;
    startX: number;
    originalStartMs: number;
    originalEndMs: number;
    minStartMs: number;
    maxEndMs: number;
    element: HTMLElement;
    nextStartMs: number;
    nextEndMs: number;
    lastSeek: number;
  } | null>(null);

  const beginDrag = useCallback(
    (event: React.PointerEvent, index: number, mode: DragMode) => {
      const word = words[index];
      if (word === undefined) return;

      event.preventDefault();
      event.stopPropagation();
      
      if (player && typeof player.pause === "function") {
        player.pause();
      }

      const element = (event.currentTarget as HTMLElement).parentElement;
      if (element === null) return;

      const bounds = timingBoundsFor(words, index);
      dragRef.current = {
        index,
        mode,
        startX: event.clientX,
        originalStartMs: word.startMs,
        originalEndMs: word.endMs,
        minStartMs: bounds.minStartMs,
        maxEndMs:
          bounds.maxEndMs === Number.POSITIVE_INFINITY
            ? durationMs
            : bounds.maxEndMs,
        element,
        nextStartMs: word.startMs,
        nextEndMs: word.endMs,
        lastSeek: 0,
      };

      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [words, durationMs, player],
  );

  const moveDrag = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag === null) return;

    const scale = pxPerMsRef.current;
    const deltaMs = (event.clientX - drag.startX) / scale;
    const minSpanMs = MIN_DRAG_WIDTH_PX / scale;

    let startMs = drag.originalStartMs;
    let endMs = drag.originalEndMs;
    
    const now = Date.now();
    const shouldSeek = now - drag.lastSeek > 30;

    if (drag.mode === "start") {
      startMs = Math.min(
        Math.max(drag.minStartMs, drag.originalStartMs + deltaMs),
        drag.originalEndMs - minSpanMs,
      );
      if (shouldSeek) {
        onSeekMs(startMs);
        drag.lastSeek = now;
      }
    } else {
      endMs = Math.max(
        Math.min(drag.maxEndMs, drag.originalEndMs + deltaMs),
        drag.originalStartMs + minSpanMs,
      );
      if (shouldSeek) {
        onSeekMs(endMs);
        drag.lastSeek = now;
      }
    }

    drag.nextStartMs = startMs;
    drag.nextEndMs = endMs;

    // Written straight to the DOM: this is direct manipulation following the
    // pointer, not an animation, and it must not re-render the tree.
    drag.element.style.left = `${startMs * scale}px`;
    drag.element.style.width = `${(endMs - startMs) * scale}px`;
  }, [onSeekMs]);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag === null) return;

    if (
      Math.round(drag.nextStartMs) !== Math.round(drag.originalStartMs) ||
      Math.round(drag.nextEndMs) !== Math.round(drag.originalEndMs)
    ) {
      onRetime(drag.index, drag.nextStartMs, drag.nextEndMs);
    }
  }, [onRetime]);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            {(["word", "line"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => onModeChange?.(value)}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                  mode === value
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "word"
              ? `${words.length} words`
              : `${pages.length} lines`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted-foreground/60 lg:inline">
            {mode === "word"
              ? "Click to select · drag edges to retime"
              : "Click a line to jump to it"}
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <ZoomIn className="ml-1 size-3 text-muted-foreground/60" />
            {ZOOM_LEVELS.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={index === zoomIndex}
                aria-label={`Zoom ${ZOOM_LABELS[index]}`}
                onClick={() => setZoomIndex(index)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  index === zoomIndex
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {ZOOM_LABELS[index]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateViewport}
        onWheel={(event) => {
          // Translate vertical mouse wheel scrolling into horizontal scrolling
          // for standard desktop mice, unless holding shift (which some mice use natively).
          if (event.deltaY !== 0 && event.deltaX === 0 && !event.shiftKey) {
            const el = scrollRef.current;
            if (el) {
              el.scrollLeft += event.deltaY;
            }
          }
        }}
        // Tall enough that the word blocks and the waveform strip below them
        // occupy separate bands instead of overlapping.
        className="relative h-32 w-full overflow-x-auto overflow-y-hidden rounded-xl border bg-surface-inset"
      >
        <div
          className="relative h-full"
          style={{ width: contentWidth }}
          onPointerDown={(event) => {
            const el = scrollRef.current;
            if (el === null) return;
            // Only left clicks
            if (event.button !== 0) return;
            
            // Capture initial state for drag vs click detection
            const startX = event.clientX;
            const initialScrollLeft = el.scrollLeft;
            let isDragging = false;

            const onPointerMove = (moveEvent: PointerEvent) => {
              const deltaX = moveEvent.clientX - startX;
              // If moved more than 3 pixels, treat as a drag
              if (!isDragging && Math.abs(deltaX) > 3) {
                isDragging = true;
                el.style.cursor = "grabbing";
              }
              
              if (isDragging) {
                el.scrollLeft = initialScrollLeft - deltaX;
              }
            };

            const onPointerUp = (upEvent: PointerEvent) => {
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", onPointerUp);
              window.removeEventListener("pointercancel", onPointerUp);
              el.style.cursor = "";

              if (!isDragging) {
                // It was just a click, so seek
                const rect = el.getBoundingClientRect();
                const x = upEvent.clientX - rect.left + el.scrollLeft;
                onSeekMs(x / pxPerMs);
              }
            };

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointercancel", onPointerUp);
          }}
        >
          {/* Second gridlines, drawn as a repeating gradient so a 30-minute
              timeline costs one element rather than 1,800. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 100%)",
              backgroundSize: `${Math.max(2, 1000 * pxPerMs)}px 100%`,
            }}
          />

          <WaveformStrip
            peaks={peaks}
            durationMs={durationMs}
            pxPerMs={pxPerMs}
            viewportLeft={viewport.left}
            viewportWidth={viewport.width}
          />

          {mode === "line" &&
            pages.map((page, pageIndex) => {
              const firstWordIndex = pageOffsets[pageIndex] ?? 0;
              const containsSelection =
                selectedIndex !== null &&
                selectedIndex >= firstWordIndex &&
                selectedIndex < firstWordIndex + page.tokens.length;

              return (
                <div
                  key={page.id}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSelect(firstWordIndex);
                  }}
                  className={cn(
                    "absolute top-9 flex h-11 cursor-pointer items-center overflow-hidden rounded-md px-2 text-xs ring-1",
                    containsSelection
                      ? "z-10 bg-brand text-brand-foreground ring-brand"
                      : "bg-card text-foreground ring-border hover:bg-accent",
                  )}
                  style={{
                    left: page.startMs * pxPerMs,
                    width: Math.max(MIN_DRAG_WIDTH_PX, page.durationMs * pxPerMs),
                  }}
                  title={page.text}
                >
                  <span className="pointer-events-none truncate">
                    {page.text}
                  </span>
                </div>
              );
            })}

          {mode === "word" && visible.map(({ word, index }) => {
            const isSelected = index === selectedIndex;
            const isWeak = word.confidence !== null && word.confidence < 0.6;

            return (
              <div
                key={index}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onSelect(index);
                }}
                className={cn(
                  "group absolute top-1/2 flex h-11 -translate-y-1/2 cursor-pointer items-center rounded-md px-2 text-xs",
                  "ring-1 transition-colors",
                  isSelected
                    ? "z-10 bg-brand text-brand-foreground ring-brand"
                    : isWeak
                      ? "bg-warning/15 text-foreground ring-warning/40 hover:bg-warning/25"
                      : "bg-card text-foreground ring-border hover:bg-accent",
                )}
                style={{
                  left: word.startMs * pxPerMs,
                  width: Math.max(
                    MIN_DRAG_WIDTH_PX,
                    (word.endMs - word.startMs) * pxPerMs,
                  ),
                }}
                title={`${word.text} · ${word.startMs}–${word.endMs}ms${
                  word.confidence !== null
                    ? ` · ${(word.confidence * 100).toFixed(0)}%`
                    : ""
                }`}
              >
                <span className="pointer-events-none truncate">{word.text}</span>

                {(["start", "end"] as const).map((mode) => (
                  <span
                    key={mode}
                    role="slider"
                    aria-label={`${mode === "start" ? "Start" : "End"} of ${word.text}`}
                    aria-valuenow={mode === "start" ? word.startMs : word.endMs}
                    tabIndex={-1}
                    onPointerDown={(event) => beginDrag(event, index, mode)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className={cn(
                      "absolute inset-y-0 w-6 -mx-3 cursor-ew-resize touch-none rounded-sm",
                      mode === "start" ? "left-0" : "right-0",
                      "opacity-0 group-hover:opacity-100",
                      isSelected
                        ? "bg-brand-foreground/40 opacity-100"
                        : "bg-foreground/25",
                    )}
                  />
                ))}
              </div>
            );
          })}

          <div
            ref={playheadRef}
            className="absolute top-0 bottom-0 left-0 w-px bg-brand will-change-transform z-20 cursor-col-resize touch-none"
            onPointerDown={(event) => {
              event.stopPropagation();
              const el = scrollRef.current;
              if (el === null) return;
              
              if (player && typeof player.pause === "function") {
                player.pause();
              }
              
              const target = event.currentTarget as HTMLElement;
              target.setPointerCapture(event.pointerId);

              // Throttle seeks to ~30fps for smooth video scrubbing
              let lastSeek = 0;
              const onPointerMove = (moveEvent: Event) => {
                const me = moveEvent as PointerEvent;
                const x = me.clientX - el.getBoundingClientRect().left + el.scrollLeft;
                const now = Date.now();
                if (now - lastSeek > 30) {
                  onSeekMs(Math.max(0, x / pxPerMs));
                  lastSeek = now;
                }
              };

              const onPointerUp = () => {
                target.releasePointerCapture(event.pointerId);
                target.removeEventListener("pointermove", onPointerMove);
                target.removeEventListener("pointerup", onPointerUp);
                target.removeEventListener("pointercancel", onPointerUp);
              };

              target.addEventListener("pointermove", onPointerMove);
              target.addEventListener("pointerup", onPointerUp);
              target.addEventListener("pointercancel", onPointerUp);
            }}
          >
            {/* Invisible expanded hit area so users can grab the 1px line easily */}
            <div className="absolute -left-6 top-0 bottom-0 w-12" />
            <div className="absolute -top-px -left-[3px] size-[7px] rounded-full bg-brand" />
          </div>
        </div>
      </div>
    </div>
  );
}
