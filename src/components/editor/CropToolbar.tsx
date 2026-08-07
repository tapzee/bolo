"use client";

import type { CanvasSize } from "@/core";
import { cn } from "@/lib/utils";

export const CROP_MODES = ["original", "9:16", "1:1", "4:5", "16:9"] as const;
export type CropMode = (typeof CROP_MODES)[number];

const RATIOS: Readonly<Record<Exclude<CropMode, "original">, number>> = {
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

/**
 * Output canvas for a crop choice, at roughly the source's pixel budget.
 *
 * The video fills this canvas with `object-fit: cover`, so choosing a narrower
 * ratio than the source genuinely crops rather than letterboxing — which is the
 * point: a landscape clip reframed to 9:16 should fill a phone screen, not sit
 * in black bars.
 *
 * The long edge is capped at the source's long edge so reframing never
 * upscales.
 */
export const cropCanvas = (source: CanvasSize, mode: CropMode): CanvasSize => {
  if (mode === "original") return source;

  const ratio = RATIOS[mode];
  const budget = Math.max(source.width, source.height);

  const even = (n: number): number => Math.round(n / 2) * 2;

  return ratio >= 1
    ? { width: even(budget), height: even(budget / ratio) }
    : { width: even(budget * ratio), height: even(budget) };
};

export function CropToolbar({
  mode,
  onChange,
  canvas,
}: {
  mode: CropMode;
  onChange: (mode: CropMode) => void;
  canvas: CanvasSize;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
        {CROP_MODES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onChange(value)}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-medium capitalize",
              mode === value
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <span className="font-mono text-[10px] text-muted-foreground/60">
        {canvas.width}×{canvas.height}
      </span>
    </div>
  );
}
