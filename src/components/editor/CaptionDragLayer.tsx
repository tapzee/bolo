"use client";

import { useCallback, useRef, useState } from "react";
import { Move } from "lucide-react";
import type { CaptionStyleConfig } from "@/core";
import { anchorFraction, clampAnchor, horizontalFraction } from "@/core";
import { cn } from "@/lib/utils";

/**
 * Bounds for the two things the box edits.
 *
 * Font size is against the 1080x1920 reference canvas, so 24px is genuinely
 * small on a phone and 220px is about four characters to a line — past either
 * end the control stops producing captions anyone would ship.
 */
const MIN_FONT_PX = 24;
const MAX_FONT_PX = 220;
const MIN_WIDTH_PCT = 30;
const MAX_WIDTH_PCT = 100;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export interface CaptionDragLayerProps {
  config: CaptionStyleConfig;
  onMove: (horizontalOffsetPct: number, verticalOffsetPct: number) => void;
  /**
   * Commits a resize. Optional so the layer still works as a pure move handle
   * where no resize target is wired up.
   */
  onResize?: (next: { fontSizePx: number; maxLineWidthPct: number }) => void;
  enabled: boolean;
}

type Handle = "nw" | "ne" | "sw" | "se" | "w" | "e";

const CORNER_CURSOR: Record<Handle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  w: "ew-resize",
  e: "ew-resize",
};

/**
 * Move-and-resize box for the caption block.
 *
 * Sits over the Player as an absolutely positioned overlay. It deliberately
 * does NOT capture pointer events except on the box and its handles — the
 * Player's own click-to-play and the video underneath must keep working.
 *
 * WHAT THE BOX REPRESENTS: the caption *area*, not a pixel-tight bounding box
 * around the glyphs. Its width is `maxLineWidthPct` — the real wrap boundary,
 * so that edge is exact. Its height is a band proportional to `fontSizePx`,
 * which tracks the text size faithfully but does not try to predict how many
 * lines a given page will wrap to. Measuring the rendered text instead would
 * mean reaching into the Player's DOM every frame, and the box would then jump
 * on every page change, which is worse than a stable guide.
 *
 * Every handle maps to something real, which is why there are six and not
 * eight: corners scale the text, the side handles set the wrap width, and there
 * is no vertical-only property for a top or bottom handle to edit. A handle
 * that did nothing would be worse than a missing one.
 *
 * Offsets and sizes are committed in percentages and reference px, never in
 * preview px: the preview is a few hundred px wide while the export is
 * 1080–2160px, so anything measured in screen pixels would land somewhere else
 * entirely in the exported file.
 *
 * Live drags write `style` straight to the DOM and only commit to React state
 * on release. Routing every pointermove through state would rebuild the caption
 * pages on every frame of the drag.
 */
export function CaptionDragLayer({
  config,
  onMove,
  onResize,
  enabled,
}: CaptionDragLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const moveRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    rectW: number;
    rectH: number;
    nextX: number;
    nextY: number;
  } | null>(null);

  const sizeRef = useRef<{
    handle: Handle;
    startX: number;
    rectW: number;
    originFont: number;
    originWidth: number;
    nextFont: number;
    nextWidth: number;
  } | null>(null);

  const x = horizontalFraction(config.horizontalOffsetPct);
  const y = clampAnchor(
    anchorFraction(config.placement, config.verticalOffsetPct),
  );

  // Reference-canvas units → percentage of the frame, so the box is correct at
  // any preview size and any aspect ratio.
  const boxWidthPct = config.maxLineWidthPct;
  const boxHeightPct = ((config.fontSizePx * config.lineHeight * 2) / 1920) * 100;

  // ---- move ---------------------------------------------------------------

  const beginMove = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      const container = containerRef.current;
      if (container === null) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = container.getBoundingClientRect();
      moveRef.current = {
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

  const onMovePointer = useCallback(
    (event: React.PointerEvent) => {
      const drag = moveRef.current;
      if (drag === null) return;

      const dx = ((event.clientX - drag.startX) / drag.rectW) * 100;
      const dy = ((event.clientY - drag.startY) / drag.rectH) * 100;

      drag.nextX = drag.originX + dx;
      drag.nextY = drag.originY + dy;

      const box = boxRef.current;
      if (box !== null) {
        box.style.left = `${horizontalFraction(drag.nextX) * 100}%`;
        box.style.top = `${clampAnchor(anchorFraction(config.placement, drag.nextY)) * 100}%`;
      }
    },
    [config.placement],
  );

  const endMove = useCallback(() => {
    const drag = moveRef.current;
    moveRef.current = null;
    setDragging(false);
    if (drag === null) return;

    if (drag.nextX !== drag.originX || drag.nextY !== drag.originY) {
      onMove(drag.nextX, drag.nextY);
    }
  }, [onMove]);

  // ---- resize -------------------------------------------------------------

  const beginResize = useCallback(
    (handle: Handle) => (event: React.PointerEvent) => {
      if (!enabled || onResize === undefined) return;
      const container = containerRef.current;
      if (container === null) return;

      event.preventDefault();
      event.stopPropagation();

      sizeRef.current = {
        handle,
        startX: event.clientX,
        rectW: container.getBoundingClientRect().width,
        originFont: config.fontSizePx,
        originWidth: config.maxLineWidthPct,
        nextFont: config.fontSizePx,
        nextWidth: config.maxLineWidthPct,
      };

      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setResizing(true);
    },
    [enabled, onResize, config.fontSizePx, config.maxLineWidthPct],
  );

  const onResizePointer = useCallback((event: React.PointerEvent) => {
    const size = sizeRef.current;
    if (size === null) return;

    // Outward drag grows, inward shrinks — so the left-side handles read their
    // delta inverted. Without this, dragging the west edge left would shrink
    // the caption, which is the opposite of every editor anyone has used.
    const raw = (event.clientX - size.startX) / size.rectW;
    const outward =
      size.handle === "nw" || size.handle === "sw" || size.handle === "w"
        ? -raw
        : raw;

    const box = boxRef.current;

    if (size.handle === "w" || size.handle === "e") {
      size.nextWidth = clamp(
        size.originWidth + outward * 200,
        MIN_WIDTH_PCT,
        MAX_WIDTH_PCT,
      );
      if (box !== null) box.style.width = `${size.nextWidth}%`;
      return;
    }

    // Corners scale the type. Proportional rather than additive, so the same
    // drag distance feels the same at 40px and at 160px.
    size.nextFont = clamp(
      Math.round(size.originFont * (1 + outward * 2.2)),
      MIN_FONT_PX,
      MAX_FONT_PX,
    );
    if (box !== null) {
      box.style.height = `${((size.nextFont * config.lineHeight * 2) / 1920) * 100}%`;
    }
  }, [config.lineHeight]);

  const endResize = useCallback(() => {
    const size = sizeRef.current;
    sizeRef.current = null;
    setResizing(false);
    if (size === null || onResize === undefined) return;

    if (
      size.nextFont !== size.originFont ||
      size.nextWidth !== size.originWidth
    ) {
      onResize({
        fontSizePx: size.nextFont,
        maxLineWidthPct: size.nextWidth,
      });
    }
  }, [onResize]);

  if (!enabled) return null;

  const active = dragging || resizing;
  const handles: Handle[] =
    onResize === undefined ? [] : ["nw", "ne", "sw", "se", "w", "e"];

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20"
    >
      <div
        ref={boxRef}
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: `${boxWidthPct}%`,
          height: `${boxHeightPct}%`,
        }}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2",
          "rounded-[3px] border border-dashed transition-colors",
          active ? "border-white/80" : "border-white/40 hover:border-white/70",
        )}
      >
        {/* Grab area for moving. Fills the box so the caption can be dragged
            from anywhere inside it, not only from the chip. */}
        <div
          onPointerDown={beginMove}
          onPointerMove={onMovePointer}
          onPointerUp={endMove}
          onPointerCancel={endMove}
          className="pointer-events-auto absolute inset-0 cursor-move"
          title="Drag to move captions"
        />

        {handles.map((handle) => {
          const vertical = handle === "w" || handle === "e";
          const north = handle === "nw" || handle === "ne";
          const west = handle === "nw" || handle === "sw" || handle === "w";

          return (
            <div
              key={handle}
              onPointerDown={beginResize(handle)}
              onPointerMove={onResizePointer}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              style={{
                cursor: CORNER_CURSOR[handle],
                left: west ? 0 : undefined,
                right: west ? undefined : 0,
                top: vertical ? "50%" : north ? 0 : undefined,
                bottom: vertical || north ? undefined : 0,
                transform: `translate(${west ? "-50%" : "50%"}, ${
                  vertical ? "-50%" : north ? "-50%" : "50%"
                })`,
              }}
              className={cn(
                "pointer-events-auto absolute size-2.5 rounded-[2px]",
                "border border-black/40 bg-white shadow-sm",
                "transition-transform hover:scale-125",
              )}
              title={
                vertical ? "Drag to set line width" : "Drag to resize text"
              }
            />
          );
        })}

        <div
          className={cn(
            "pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2",
            "flex items-center gap-1 rounded-full px-2 py-0.5",
            "text-[10px] font-medium whitespace-nowrap select-none",
            "border border-white/25 bg-black/60 text-white/90 backdrop-blur-sm",
            active ? "opacity-100" : "opacity-70",
          )}
        >
          <Move className="size-3" />
          {resizing
            ? `${sizeRef.current?.nextFont ?? config.fontSizePx}px`
            : "Drag · resize"}
        </div>
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
