"use client";

import { memo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import type { CaptionStyleConfig, CaptionTemplate } from "@/core";
import { BOX_RADIUS_RATIO, GLOW_RADII } from "@/core";
import { FONT_FAMILY } from "@/remotion/fonts";
import { cn } from "@/lib/utils";

const TemplatePreviewPlayer = dynamic(
  () => import("./TemplatePreviewPlayer"),
  { ssr: false }
);

/**
 * Static preview of a template with rich badges, active checkmarks, and kinetic previews.
 *
 * Renders real Devanagari next to real Latin in the template's own font,
 * weight, casing and colours — proving contrast and font fallback capabilities.
 */
export const TemplateCard = memo(function TemplateCard({
  template,
  config,
  selected,
  onSelect,
}: {
  template: CaptionTemplate;
  config: CaptionStyleConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      style={{ transformOrigin: "center" }}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl text-left transition-shadow duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-lg",
        selected
          ? "ring-2 ring-brand ring-offset-1 ring-offset-background shadow-md"
          : "ring-1 ring-border/60 hover:ring-border-strong",
      )}
    >
      {/* Top right status badge */}
      {template.tag ? (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-sm transition-transform group-hover:scale-105",
            template.tag === "Popular" &&
              "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold",
            template.tag === "Viral" &&
              "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold",
            template.tag === "Trending" &&
              "bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold",
            template.tag === "Hot" &&
              "bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold",
            template.tag === "New" &&
              "bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold",
          )}
        >
          {template.tag}
        </span>
      ) : null}

      {/* Top left selected indicator checkmark */}
      {selected ? (
        <span className="absolute top-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-brand text-white shadow-md">
          <svg
            className="size-3 stroke-[2.5]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      ) : null}

      <div
        className="flex h-[94px] items-center justify-center relative overflow-hidden bg-black"
      >
        <div className={cn("absolute inset-0 z-0 transition-opacity duration-300", isHovered ? "opacity-0" : "opacity-100 pointer-events-none")}>
           <TemplatePreviewPlayer config={config} staticThumbnail />
        </div>

        <div className={cn("absolute inset-0 z-10 pointer-events-none transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")}>
          {isHovered && <TemplatePreviewPlayer config={config} />}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/20 bg-card/95 px-3 py-2 relative">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="truncate text-xs font-semibold text-foreground group-hover:text-brand transition-colors">
            {template.name}
          </span>
        </div>
        <span className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
          {template.engine === "bold-yellow"
            ? "snap"
            : template.engine === "splash"
              ? "kinetic"
              : template.engine}
        </span>
      </div>
    </motion.button>
  );
});
