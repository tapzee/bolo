"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { CaptionStyleConfig, CaptionTemplate } from "@/core";
import { BOX_RADIUS_RATIO, GLOW_RADII } from "@/core";
import { FONT_FAMILY } from "@/remotion/fonts";
import { cn } from "@/lib/utils";

/**
 * Static preview of a template with rich badges, active checkmarks, and instant pure DOM typography.
 *
 * Renders real Devanagari next to real Latin in the template's own font,
 * weight, casing and colours — matching the visual signature shown in the studio template picker.
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
  const previewSize = Math.max(14, Math.min(22, config.fontSizePx * 0.22));
  const isBox = template.engine === "box";
  const isGlow = template.engine === "glow";
  const isSplash = template.engine === "splash";
  const isDual = template.engine === "dual";
  const isHero = template.engine === "hero" || template.engine === "heroMixed";
  const isStack = template.engine === "stack";
  const isFocus = template.engine === "focus";
  const isBigGrand = template.engine === "bigGrand";
  const isDesignWalla = template.engine === "designWalla";
  const isDesignWallaEditorial =
    template.engine === "designWallaEditorial" ||
    template.engine === "designWallaEditorialYellow";
  const isDesignWallaPro =
    template.engine.startsWith("designWallaPro");
  const isDualLine = template.engine === "dualLine";
  const isPopWord = template.engine === "popWord" || template.engine === "pop";
  const isGrandCaption = template.engine === "grandCaption";
  const isDynamicHighlight = template.engine === "dynamicHighlight";

  const previewStroke =
    config.strokeWidthPx > 0
      ? `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}`
      : undefined;

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
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
            "absolute top-2 right-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-sm transition-transform group-hover:scale-105",
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
        <span className="absolute top-2 left-2 z-10 flex size-5 items-center justify-center rounded-full bg-brand text-white shadow-md">
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
        className="flex h-[94px] items-center justify-center px-3 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at center, #2e3440 0%, #171a21 70%, #111317 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-3 pt-3 z-0">
          {isFocus ? (
            /* Focus: Dimmed line, one spoken word bright, one italic serif accent */
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: config.fontWeight,
                  fontSize: previewSize,
                  letterSpacing: config.letterSpacingPx * 0.15,
                  color: config.baseColor,
                  opacity: 0.5,
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: config.fontWeight,
                  fontSize: previewSize,
                  letterSpacing: config.letterSpacingPx * 0.15,
                  color: config.baseColor,
                  textShadow: "0 3px 12px rgba(0,0,0,0.7)",
                }}
              >
                Bolo
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.specialFontId ?? "playfair"],
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: previewSize,
                  color: config.accentColor || "#FFE600",
                  textShadow: "0 3px 12px rgba(0,0,0,0.7)",
                }}
              >
                premium
              </span>
            </div>
          ) : isStack ? (
            /* Stack: Three rows, bold headline anchor, italic serif accent */
            <div className="flex w-full flex-col items-center justify-center leading-none">
              <div className="flex flex-col items-center" style={{ gap: previewSize * 0.08 }}>
                <span
                  style={{
                    alignSelf: "flex-start",
                    fontFamily: FONT_FAMILY[config.secondaryFontId ?? "inter"],
                    fontWeight: 600,
                    fontSize: previewSize * 0.45,
                    color: config.baseColor,
                    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  }}
                >
                  बोलो
                </span>
                <span
                  style={{
                    fontFamily: FONT_FAMILY[config.fontId],
                    fontWeight: config.fontWeight,
                    fontSize: previewSize * 1.15,
                    letterSpacing: config.letterSpacingPx * 0.15,
                    textTransform: "uppercase",
                    color: config.accentColor || "#FFE600",
                    textShadow: "0 4px 16px rgba(0,0,0,0.7)",
                  }}
                >
                  BOLO
                </span>
                <span
                  style={{
                    alignSelf: "flex-end",
                    fontFamily: FONT_FAMILY[config.specialFontId ?? "playfair"],
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: previewSize * 0.55,
                    color: config.baseColor,
                    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  }}
                >
                  bolo
                </span>
              </div>
            </div>
          ) : isBigGrand ? (
            /* Big Grand: 3-tier bold cyan glow typography */
            <div className="flex flex-col items-center justify-center leading-tight gap-0.5">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId || "montserrat"],
                  fontWeight: 800,
                  fontSize: previewSize * 0.55,
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.specialFontId || config.fontId || "montserrat"],
                  fontWeight: 900,
                  fontSize: previewSize * 1.15,
                  color: config.accentColor || "#38bdf8",
                  textTransform: "uppercase",
                  textShadow: `0 0 12px ${config.accentColor || "#38bdf8"}a0, 0 2px 10px rgba(0,0,0,0.9)`,
                }}
              >
                BOLO
              </span>
            </div>
          ) : isDesignWallaEditorial ? (
            /* Design Walla Editorial: Yellow punch + Playfair italic serif */
            <div className="flex flex-col items-center justify-center leading-none">
              <div className="flex flex-col items-center gap-0.5">
                <span
                  style={{
                    fontFamily: FONT_FAMILY[config.fontId ?? "anton"],
                    fontWeight: 900,
                    fontSize: previewSize * 1.05,
                    textTransform: "uppercase",
                    color: config.accentColor || "#FFE600",
                    textShadow: "0 3px 12px rgba(0,0,0,0.8)",
                  }}
                >
                  बोलो
                </span>
                <span
                  style={{
                    fontFamily: FONT_FAMILY[config.specialFontId ?? "playfair"],
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: previewSize * 0.85,
                    color: "#FFFFFF",
                    textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                  }}
                >
                  Bolo
                </span>
              </div>
            </div>
          ) : isDesignWallaPro ? (
            /* Design Walla Pro: 3 rows with neon glow accent */
            <div className="flex flex-col items-center justify-center leading-tight gap-0.5">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.secondaryFontId ?? "montserrat"],
                  fontWeight: 700,
                  fontSize: previewSize * 0.6,
                  color: config.baseColor || "#FFFFFF",
                  textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: 900,
                  fontSize: previewSize * 1.1,
                  color: config.accentColor || "#FFE600",
                  textTransform: "uppercase",
                  textShadow: `0 0 10px ${config.accentColor || "#FFE600"}80, 0 2px 10px rgba(0,0,0,0.8)`,
                }}
              >
                BOLO
              </span>
            </div>
          ) : isDesignWalla ? (
            /* Design Walla: Yellow hero sandwich */
            <div className="flex flex-col items-center justify-center leading-tight">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.secondaryFontId ?? "montserrat"],
                  fontWeight: 700,
                  fontSize: previewSize * 0.6,
                  color: config.baseColor || "#FFFFFF",
                  textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: 900,
                  fontSize: previewSize * 1.1,
                  color: config.accentColor || "#FFE600",
                  textTransform: "uppercase",
                  textShadow: "0 3px 12px rgba(0,0,0,0.85)",
                }}
              >
                BOLO
              </span>
            </div>
          ) : isDualLine ? (
            /* Dual Line: Sans-serif header with cursive script overlay */
            <div className="flex flex-col items-center justify-center leading-none">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId ?? "anton"],
                  fontWeight: Math.max(800, config.fontWeight),
                  fontSize: previewSize * 1.05,
                  textTransform: "uppercase",
                  color: config.accentColor ?? "#FF2A2A",
                  textShadow: `0 0 ${previewSize * 0.15}px ${config.accentColor ?? "#FF2A2A"}cc, 0 2px 6px rgba(0,0,0,0.5)`,
                  zIndex: 1,
                  lineHeight: 0.9,
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.specialFontId ?? config.secondaryFontId ?? "kaushanScript"],
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: previewSize * 1.2,
                  color: config.baseColor ?? "#FFFFFF",
                  textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                  marginTop: `-${previewSize * 0.3}px`,
                  zIndex: 2,
                  lineHeight: 0.9,
                }}
              >
                Bolo
              </span>
            </div>
          ) : isSplash ? (
            /* Splash: Kinetic bounce with Playfair italic */
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: Math.max(800, config.fontWeight),
                  fontSize: previewSize * 1.1,
                  textTransform: "uppercase",
                  color: config.accentColor || "#FFE600",
                  WebkitTextStroke: `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}`,
                  paintOrder: "stroke fill",
                  textShadow: "0 3px 10px rgba(0,0,0,0.8)",
                  transform: "rotate(-2deg)",
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.specialFontId ?? "playfair"],
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: previewSize * 1.05,
                  color: config.baseColor,
                  textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                Bolo
              </span>
            </div>
          ) : isPopWord ? (
            /* Pop Word: Pill / Vibrant Pop text */
            <span
              style={{
                fontFamily: FONT_FAMILY[config.fontId],
                fontWeight: 900,
                fontSize: previewSize * 1.1,
                color: config.accentColor || "#f97316",
                textShadow: "0 3px 10px rgba(0,0,0,0.8)",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              बोलो Bolo
            </span>
          ) : isGrandCaption ? (
            /* Grand Caption: Bold stroke typography */
            <span
              style={{
                fontFamily: FONT_FAMILY[config.fontId],
                fontWeight: 900,
                fontSize: previewSize * 1.1,
                color: config.activeColor || "#FFFFFF",
                WebkitTextStroke: `${Math.max(1, previewSize * 0.1)}px ${config.strokeColor || "#000000"}`,
                paintOrder: "stroke fill",
                textShadow: "0 4px 14px rgba(0,0,0,0.9)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              बोलो Bolo
            </span>
          ) : isDynamicHighlight ? (
            /* Dynamic Highlight: Keyword emphasis */
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: 600,
                  fontSize: previewSize * 0.9,
                  color: config.baseColor || "#FFFFFF",
                }}
              >
                बोलो
              </span>
              <span
                style={{
                  fontFamily: FONT_FAMILY[config.fontId],
                  fontWeight: 900,
                  fontSize: previewSize * 1.15,
                  color: config.activeColor || "#FFE600",
                  textShadow: `0 0 10px ${config.activeColor || "#FFE600"}80`,
                }}
              >
                BOLO
              </span>
            </div>
          ) : (
            /* Standard / Base template typography */
            <span
              style={{
                fontFamily: FONT_FAMILY[config.fontId],
                fontWeight: config.fontWeight,
                fontSize: previewSize,
                letterSpacing: config.letterSpacingPx * 0.15,
                textTransform: config.uppercase ? "uppercase" : "none",
                color: config.activeColor || config.baseColor,
                WebkitTextStroke: previewStroke,
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
