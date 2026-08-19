"use client";

import type { CanvasSize } from "@/core";
import { cn } from "@/lib/utils";

import { motion } from "motion/react";

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
    <div className="flex flex-1 items-center justify-between sm:justify-start gap-4 min-w-0">
      <div className="relative flex items-center gap-1 rounded-full bg-black/40 p-1 ring-1 ring-white/10 shadow-inner overflow-x-auto hide-scrollbar">
        {CROP_MODES.map((value) => {
          const isActive = mode === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(value)}
              className={cn(
                "relative z-10 rounded-full px-3.5 py-1 text-[11px] font-bold capitalize transition-colors duration-300 whitespace-nowrap",
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCropMode"
                  className="absolute inset-0 -z-10 rounded-full bg-white/15 ring-1 ring-white/20 shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-20">{value}</span>
            </button>
          );
        })}
      </div>
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/5">
        <span className="font-mono text-[10px] font-medium tracking-widest text-white/40">
          {canvas.width}×{canvas.height}
        </span>
      </div>
    </div>
  );
}
