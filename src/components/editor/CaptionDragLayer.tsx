"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Breathing room between the glyphs and the dashed edge, in preview px. */
const BOX_PAD = 6;

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

const HANDLE_CURSOR: Record<Handle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  w: "ew-resize",
  e: "ew-resize",
};

const HANDLES: readonly Handle[] = ["nw", "ne", "sw", "se", "w", "e"];

/**
 * Move-and-resize box around the caption block.
 *
 * Sits over the Player as an absolutely positioned overlay. It deliberately
 * does NOT capture pointer events except on the box and its handles — the
 * Player's own click-to-play and the video underneath must keep working.
 *
 * WHAT THE BOX IS: the measured bounds of the caption block itself. The
 * overlay finds `[data-bolo-caption-block]` inside the Player and copies its
 * rectangle every frame, so the text is inside the box by construction rather
 * than by a prediction that drifts. An earlier version derived the height from
 * `fontSizePx` arithmetic and was wrong the moment a page wrapped to three
 * lines or the `hero` engine stacked a headline — which is exactly the case
 * where a user reaches for the box.
 *
 * Reading layout in a rAF loop is the cost of that correctness. It is one
 * `getBoundingClientRect` on one small element, it runs only while the editor
 * is open, and it never touches the export path. Styles are written straight to
 * the DOM — routing a rectangle through React state 60 times a second would
 * re-render the caption tree for something no other component reads.
 *
 * DURING A DRAG the loop pauses and the box follows the pointer as a preview of
 * the size being chosen, because the config is only committed on release.
 * Committing live would rebuild every caption page on every pointer frame.
 *
 * Six handles, not eight: corners scale the type, the side handles set the wrap
 * width, and there is no vertical-only property for a top or bottom handle to
 * edit. A handle that did nothing would be worse than a missing one.
 *
 * Offsets and sizes are committed in percentages and reference px, never in
 * preview px: the preview is a few hundred px wide while the export is
 * 1080–2160px, so anything measured in screen pixels would land somewhere else
 * entirely in the exported file.
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
  const [liveFont, setLiveFont] = useState<number | null>(null);

  /** True while a pointer gesture owns the box, so measuring must stand down. */
  const gestureRef = useRef(false);

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
    box: { left: number; top: number; width: number; height: number };
    originFont: number;
    originWidth: number;
    nextFont: number;
    nextWidth: number;
  } | null>(null);

  // ---- measurement --------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      const container = containerRef.current;
      const box = boxRef.current;
      if (container === null || box === null) return;
      // A gesture owns the geometry until it commits.
      if (gestureRef.current) return;

      const block = container.parentElement?.querySelector(
        "[data-bolo-caption-block]",
      );

      if (!(block instanceof HTMLElement)) {
        // No active page at this playhead. Hidden rather than frozen at the
        // last rectangle, which would sit over empty video looking like a bug.
        box.style.opacity = "0";
        box.style.pointerEvents = "none";
        return;
      }

      const outer = container.getBoundingClientRect();

      /**
       * Union of the words, not the block's own rectangle.
       *
       * The block is a flex container and its rect is a *layout* box, which is
       * not where the ink is. A single word longer than `maxLineWidthPct` has
       * nowhere to wrap and simply overflows, and every engine scales its
       * spoken word — transforms do not grow the parent. Measuring the
       * container alone therefore drew a box with the headline sticking out of
       * both sides, which is precisely the thing the box exists to prevent.
       */
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for (const node of block.querySelectorAll("*")) {
        const r = node.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.left < left) left = r.left;
        if (r.top < top) top = r.top;
        if (r.right > right) right = r.right;
        if (r.bottom > bottom) bottom = r.bottom;
      }

      // No measurable words yet — fall back to the container so the box does
      // not collapse to a dot on the first frame of a page.
      if (left === Infinity) {
        const r = block.getBoundingClientRect();
        left = r.left;
        top = r.top;
        right = r.right;
        bottom = r.bottom;
      }

      box.style.opacity = "1";
      box.style.pointerEvents = "";
      box.style.left = `${left - outer.left - BOX_PAD}px`;
      box.style.top = `${top - outer.top - BOX_PAD}px`;
      box.style.width = `${right - left + BOX_PAD * 2}px`;
      box.style.height = `${bottom - top + BOX_PAD * 2}px`;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

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

      gestureRef.current = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [enabled, config.horizontalOffsetPct, config.verticalOffsetPct],
  );

  const onMovePointer = useCallback((event: React.PointerEvent) => {
    const drag = moveRef.current;
    const box = boxRef.current;
    if (drag === null || box === null) return;

    const dxPx = event.clientX - drag.startX;
    const dyPx = event.clientY - drag.startY;

    drag.nextX = drag.originX + (dxPx / drag.rectW) * 100;
    drag.nextY = drag.originY + (dyPx / drag.rectH) * 100;

    // Nudged by the raw pointer delta rather than recomputed from the anchor
    // fractions: the box is now measured in px off the real caption block, and
    // mixing the two coordinate systems mid-drag makes it jump on grab.
    box.style.translate = `${dxPx}px ${dyPx}px`;
  }, []);

  const endMove = useCallback(() => {
    const drag = moveRef.current;
    const box = boxRef.current;
    moveRef.current = null;
    gestureRef.current = false;
    setDragging(false);

    if (box !== null) box.style.translate = "";
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
      const box = boxRef.current;
      if (container === null || box === null) return;

      event.preventDefault();
      event.stopPropagation();

      sizeRef.current = {
        handle,
        startX: event.clientX,
        rectW: container.getBoundingClientRect().width,
        box: {
          left: box.offsetLeft,
          top: box.offsetTop,
          width: box.offsetWidth,
          height: box.offsetHeight,
        },
        originFont: config.fontSizePx,
        originWidth: config.maxLineWidthPct,
        nextFont: config.fontSizePx,
        nextWidth: config.maxLineWidthPct,
      };

      gestureRef.current = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setResizing(true);
      setLiveFont(config.fontSizePx);
    },
    [enabled, onResize, config.fontSizePx, config.maxLineWidthPct],
  );

  const onResizePointer = useCallback((event: React.PointerEvent) => {
    const size = sizeRef.current;
    const box = boxRef.current;
    if (size === null || box === null) return;

    // Outward drag grows, inward shrinks — so the left-side handles read their
    // delta inverted. Without this, dragging the west edge left would shrink
    // the caption, which is the opposite of every editor anyone has used.
    const raw = (event.clientX - size.startX) / size.rectW;
    const outward =
      size.handle === "nw" || size.handle === "sw" || size.handle === "w"
        ? -raw
        : raw;

    if (size.handle === "w" || size.handle === "e") {
      size.nextWidth = clamp(
        size.originWidth + outward * 200,
        MIN_WIDTH_PCT,
        MAX_WIDTH_PCT,
      );
      // Preview grows about its centre, matching the caption block, which is
      // centred on its anchor rather than pinned to the dragged edge.
      const factor = size.nextWidth / size.originWidth;
      const width = size.box.width * factor;
      box.style.left = `${size.box.left - (width - size.box.width) / 2}px`;
      box.style.width = `${width}px`;
      return;
    }

    // Corners scale the type. Proportional rather than additive, so the same
    // drag distance feels the same at 40px and at 160px.
    size.nextFont = clamp(
      Math.round(size.originFont * (1 + outward * 2.2)),
      MIN_FONT_PX,
      MAX_FONT_PX,
    );
    setLiveFont(size.nextFont);

    const factor = size.nextFont / size.originFont;
    const width = size.box.width * factor;
    const height = size.box.height * factor;
    box.style.left = `${size.box.left - (width - size.box.width) / 2}px`;
    box.style.top = `${size.box.top - (height - size.box.height) / 2}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
  }, []);

  const endResize = useCallback(() => {
    const size = sizeRef.current;
    sizeRef.current = null;
    gestureRef.current = false;
    setResizing(false);
    setLiveFont(null);
    if (size === null || onResize === undefined) return;

    if (
      size.nextFont !== size.originFont ||
      size.nextWidth !== size.originWidth
    ) {
      onResize({ fontSizePx: size.nextFont, maxLineWidthPct: size.nextWidth });
    }
  }, [onResize]);

  if (!enabled) return null;

  const active = dragging || resizing;
  const handles = onResize === undefined ? [] : HANDLES;

  // Only used for the first paint, before the measuring loop has run once.
  const fallbackX = horizontalFraction(config.horizontalOffsetPct) * 100;
  const fallbackY =
    clampAnchor(anchorFraction(config.placement, config.verticalOffsetPct)) *
    100;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={boxRef}
        style={{
          left: `${fallbackX}%`,
          top: `${fallbackY}%`,
          width: `${config.maxLineWidthPct}%`,
          height: "12%",
          opacity: 0,
        }}
        className={cn(
          "absolute rounded-[3px] border border-dashed",
          "transition-colors duration-150",
          active ? "border-white/85" : "border-white/45 hover:border-white/75",
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
          const side = handle === "w" || handle === "e";
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
                cursor: HANDLE_CURSOR[handle],
                left: west ? 0 : undefined,
                right: west ? undefined : 0,
                top: side ? "50%" : north ? 0 : undefined,
                bottom: side || north ? undefined : 0,
                transform: `translate(${west ? "-50%" : "50%"}, ${
                  side || north ? "-50%" : "50%"
                })`,
              }}
              className={cn(
                "pointer-events-auto absolute size-2.5 rounded-[2px]",
                "border border-black/40 bg-white shadow-sm",
                "transition-transform hover:scale-125",
              )}
              title={side ? "Drag to set line width" : "Drag to resize text"}
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
          {liveFont !== null
            ? `${liveFont}px`
            : resizing
              ? `${config.maxLineWidthPct.toFixed(0)}%`
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
