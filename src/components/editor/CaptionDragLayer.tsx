"use client";

import { useCallback, useRef, useState } from "react";
import { Move } from "lucide-react";
import type { CaptionStyleConfig } from "@/core";
import { anchorFraction, clampAnchor, horizontalFraction } from "@/core";
import { cn } from "@/lib/utils";

export interface CaptionDragLayerProps {
  config: CaptionStyleConfig;
  onMove: (horizontalOffsetPct: number, verticalOffsetPct: number) => void;
  enabled: boolean;
}

/**
 * Drag handle for positioning captions anywhere on the frame.
 *
 * Sits over the Player as an absolutely positioned overlay. It deliberately
 * does NOT capture pointer events except on the handle itself — the Player's
 * own click-to-play and the video underneath must keep working.
 *
 * Offsets are committed in percentages, not pixels: the preview is a few
 * hundred px wide while the export is 1080–2160px, so a pixel offset would put
 * the caption somewhere else entirely in the exported file.
 *
 * The live drag writes `transform` straight to the DOM and only commits to
 * React state on release. Routing every pointermove through state would rebuild
 * the caption pages on each frame of the drag.
 */
export function CaptionDragLayer({
  config,
  onMove,
  enabled,
}: CaptionDragLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    rectW: number;
    rectH: number;
    nextX: number;
    nextY: number;
  } | null>(null);

  const x = horizontalFraction(config.horizontalOffsetPct);
  const y = clampAnchor(
    anchorFraction(config.placement, config.verticalOffsetPct),
  );

  const begin = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      const container = containerRef.current;
      if (container === null) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = container.getBoundingClientRect();
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: config.horizontalOffsetPct,
        originY: config.verticalOffsetPct,
        rectW: rect.width,
        rectH: rect.height,
        nextX: config.horizontalOffsetPct,
        nextY: config.verticalOffsetPct,
      };

      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [enabled, config.horizontalOffsetPct, config.verticalOffsetPct],
  );

  const move = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag === null) return;

    // Pointer delta converted to a fraction of the *preview* box, which is the
    // same fraction of the export canvas.
    const dx = ((event.clientX - drag.startX) / drag.rectW) * 100;
    const dy = ((event.clientY - drag.startY) / drag.rectH) * 100;

    drag.nextX = drag.originX + dx;
    drag.nextY = drag.originY + dy;

    const handle = handleRef.current;
    if (handle !== null) {
      const nx = horizontalFraction(drag.nextX) * 100;
      const ny =
        clampAnchor(
          anchorFraction(config.placement, drag.nextY),
        ) * 100;
      handle.style.left = `${nx}%`;
      handle.style.top = `${ny}%`;
    }
  }, [config.placement]);

  const end = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (drag === null) return;

    if (drag.nextX !== drag.originX || drag.nextY !== drag.originY) {
      onMove(drag.nextX, drag.nextY);
    }
  }, [onMove]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      // Transparent to pointer events so the Player keeps working; only the
      // handle below opts back in.
      className="pointer-events-none absolute inset-0 z-20"
    >
      <div
        ref={handleRef}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        className={cn(
          "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2",
          "flex cursor-move items-center gap-1 rounded-full px-2 py-1",
          "text-[10px] font-medium whitespace-nowrap select-none",
          "border border-white/25 bg-black/55 text-white/90 backdrop-blur-sm",
          "transition-opacity",
          dragging ? "opacity-100" : "opacity-60 hover:opacity-100",
        )}
        title="Drag to move captions anywhere"
      >
        <Move className="size-3" />
        Drag
      </div>

      {/* Centre guides, shown only while dragging, so a caption can be snapped
          back to visually centred without hunting for 0.0%. */}
      {dragging ? (
        <>
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/25" />
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        </>
      ) : null}
    </div>
  );
}
