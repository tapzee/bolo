"use client";

import { memo } from "react";
import type { CaptionStyleConfig, CaptionTemplate } from "@/core";
import { BOX_RADIUS_RATIO, GLOW_RADII } from "@/core";
import { FONT_FAMILY } from "@/remotion/fonts";
import { cn } from "@/lib/utils";

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
  const previewSize = Math.max(12, Math.min(19, config.fontSizePx * 0.2));
  const isBox = template.engine === "box";
  const isGlow = template.engine === "glow";
  const isSplash = template.engine === "splash";
  const isDual = template.engine === "dual";
  const isHero = template.engine === "hero";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl text-left transition-all duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring hover:scale-[1.02] hover:shadow-lg",
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
        <span className="absolute top-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
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
        className="flex h-[76px] items-center justify-center px-3"
        style={{
          background:
            "radial-gradient(circle at center, #2e3440 0%, #171a21 70%, #111317 100%)",
        }}
      >
        {isSplash ? (
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span
              style={{
                fontFamily: FONT_FAMILY[config.fontId],
                fontWeight: Math.max(800, config.fontWeight),
                fontSize: previewSize * 1.15,
                textTransform: "uppercase",
                color: config.accentColor,
                WebkitTextStroke: `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}`,
                paintOrder: "stroke fill",
                textShadow: "0 3px 10px rgba(0,0,0,0.8)",
                transform: "rotate(-2deg)",
              }}
            >
              FREE
            </span>
            <span
              style={{
                fontFamily:
                  config.fontId === "playfair"
                    ? FONT_FAMILY.playfair
                    : config.fontId === "caveat"
                      ? FONT_FAMILY.caveat
                      : "var(--bolo-font-playfair)",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: previewSize * 1.1,
                color: config.baseColor,
                textShadow: "0 2px 8px rgba(0,0,0,0.7)",
              }}
            >
              demo
            </span>
            <span
              style={{
                fontFamily: FONT_FAMILY.devanagari,
                fontWeight: 700,
                fontSize: previewSize * 1.05,
                color: config.activeColor || config.baseColor,
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
              }}
            >
              के लिए
            </span>
          </div>
        ) : isHero ? (
          <div className="flex flex-col items-center justify-center leading-none gap-0.5">
            <span
              style={{
                fontSize: previewSize * (config.annotationSizeRatio || 0.3),
                color: config.annotationColor || config.baseColor,
                fontWeight: config.annotationWeight || 500,
                fontFamily: FONT_FAMILY[config.fontId],
                textTransform: config.uppercase ? "uppercase" : "none",
                letterSpacing: previewSize * (config.annotationSizeRatio || 0.3) * 0.02,
                textShadow: "0 2px 8px rgba(0,0,0,0.55)",
                WebkitTextStroke: `${Math.max(previewSize * (config.annotationSizeRatio || 0.3) * 0.085, config.strokeWidthPx * (config.annotationSizeRatio || 0.3) * 1.4)}px ${config.strokeColor}`,
                paintOrder: "stroke fill",
              }}
            >
              FREE
            </span>
            <span
              style={{
                fontSize: previewSize,
                color: config.activeColor,
                WebkitTextStroke: `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}`,
                paintOrder: "stroke fill",
                fontWeight: config.fontWeight,
                fontFamily: FONT_FAMILY[config.fontId],
                textTransform: config.uppercase ? "uppercase" : "none",
                letterSpacing: config.letterSpacingPx * 0.1,
                textShadow: "0 4px 16px rgba(0,0,0,0.72)",
              }}
            >
              DEMO
            </span>
            <span
              style={{
                fontSize: previewSize * (config.annotationSizeRatio || 0.3),
                color: config.annotationColor || config.baseColor,
                fontWeight: config.annotationWeight || 500,
                fontFamily: FONT_FAMILY.devanagari,
                letterSpacing: previewSize * (config.annotationSizeRatio || 0.3) * 0.02,
                textShadow: "0 2px 8px rgba(0,0,0,0.55)",
                WebkitTextStroke: `${Math.max(previewSize * (config.annotationSizeRatio || 0.3) * 0.085, config.strokeWidthPx * (config.annotationSizeRatio || 0.3) * 1.4)}px ${config.strokeColor}`,
                paintOrder: "stroke fill",
              }}
            >
              के लिए
            </span>
          </div>
        ) : isDual ? (
          <div className="relative flex flex-col items-center justify-center w-full mt-1">
            <span
              style={{
                fontSize: previewSize * (config.annotationSizeRatio || 0.3),
                color: config.annotationColor || "#ffffff",
                fontWeight: config.annotationWeight || 300,
                fontFamily: FONT_FAMILY.poppins,
                textTransform: config.uppercase ? "uppercase" : "none",
                marginBottom: `-${previewSize * 0.55}px`,
                zIndex: 1,
                letterSpacing: "0.04em",
                WebkitTextStroke: `${Math.max(1, config.strokeWidthPx * 0.4)}px ${config.strokeColor}`,
                paintOrder: "stroke fill",
              }}
            >
              BOLO
            </span>
            <span
              style={{
                fontSize: previewSize,
                color: config.activeColor,
                WebkitTextStroke: `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}`,
                paintOrder: "stroke fill",
                fontWeight: config.fontWeight,
                fontFamily: FONT_FAMILY[config.fontId],
                textTransform: config.uppercase ? "uppercase" : "none",
                zIndex: 2,
                letterSpacing: config.letterSpacingPx * 0.15,
                textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
              }}
            >
              बोलो BOLO
            </span>
          </div>
        ) : (
          <span
            style={{
              fontFamily: FONT_FAMILY[config.fontId],
              fontWeight: config.fontWeight,
              fontSize: previewSize,
              letterSpacing: config.letterSpacingPx * 0.15,
              textTransform: config.uppercase ? "uppercase" : "none",
              color: isBox ? config.activeColor : config.activeColor,
              WebkitTextStroke: `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}`,
              paintOrder: "stroke fill",
              backgroundColor: isBox ? config.accentColor : "transparent",
              padding: isBox
                ? `${previewSize * 0.14}px ${previewSize * 0.3}px`
                : 0,
              borderRadius: isBox ? previewSize * BOX_RADIUS_RATIO : 0,
              textShadow: isGlow
                ? GLOW_RADII.map(
                    (r) => `0 0 ${previewSize * r * 1.4}px ${config.accentColor}`,
                  ).join(", ")
                : "0 2px 8px rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
              lineHeight: 1.1,
            }}
          >
            बोलो Bolo
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/20 bg-card/95 px-3 py-2">
        <span className="truncate text-xs font-semibold text-foreground group-hover:text-brand transition-colors">
          {template.name}
        </span>
        <span className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
          {template.engine === "bold-yellow"
            ? "snap"
            : template.engine === "splash"
              ? "kinetic"
              : template.engine}
        </span>
      </div>
    </button>
  );
});
