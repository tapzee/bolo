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

  const previewSize = Math.max(14, Math.min(22, config.fontSizePx * 0.22));
  const isBox = template.engine === "box";
  const isGlow = template.engine === "glow";
  const isSplash = template.engine === "splash";
  const isDual = template.engine === "dual";
  const isHero = template.engine === "hero";
  const isStack = template.engine === "stack";
  const isFocus = template.engine === "focus";
  const isSplitText = template.engine === "splitText";
  const isLiquidFlow = template.engine === "liquidFlow";
  const isLightSweep = template.engine === "lightSweep";
  const isPaperCut = template.engine === "paperCut";
  const isFlipCard = template.engine === "flipCard";
  const isRibbonSlide = template.engine === "ribbonSlide";
  const isSpiralReveal = template.engine === "spiralReveal";
  const isFloatingBubble = template.engine === "floatingBubble";
  const isEditorialStackHero = template.engine === "editorialStackHero";
  const isDualLine = template.engine === "dualLine";

  // Templates that deliberately carry no outline (the premium pair, and the
  // editorial engines) must not be previewed with one — the card is the only
  // thing a user sees before applying, so a stroke here promises a look the
  // template does not have.
  const previewStroke =
    config.strokeWidthPx > 0 ? `${Math.max(1, previewSize * 0.085)}px ${config.strokeColor}` : undefined;

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
        className="flex h-[94px] items-center justify-center px-3 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at center, #2e3440 0%, #171a21 70%, #111317 100%)",
        }}
      >
        <div className={cn("absolute inset-0 flex items-center justify-center px-3 z-0 transition-opacity duration-300", isHovered ? "opacity-0" : "opacity-100")}>
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
        ) : isStack ? (
          /* Three rows, alternating edges, one accent word — the real shape of
             the template rather than a single sample word. */
          <div className="flex w-full flex-col items-center justify-center leading-none">
            <div className="flex flex-col" style={{ gap: previewSize * 0.08 }}>
              <span
                style={{
                  alignSelf: "flex-start",
                  fontFamily: FONT_FAMILY[config.secondaryFontId ?? "inter"],
                  fontWeight: 600,
                  fontSize: previewSize * 0.38,
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
                  color: config.accentColor,
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
                  fontSize: previewSize * 0.5,
                  color: config.baseColor,
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                bolo
              </span>
            </div>
          </div>
        ) : isFocus ? (
          /* Dimmed line, one spoken word bright, one italic serif accent. */
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span
              style={{
                fontFamily: FONT_FAMILY[config.fontId],
                fontWeight: config.fontWeight,
                fontSize: previewSize,
                letterSpacing: config.letterSpacingPx * 0.15,
                color: config.baseColor,
                opacity: config.upcomingOpacity,
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
                color: config.accentColor,
                textShadow: "0 3px 12px rgba(0,0,0,0.7)",
              }}
            >
              premium
            </span>
          </div>
        ) : isSplitText ? (
          <div className="flex flex-col items-center leading-none">
            <span style={{ fontSize: previewSize, color: config.activeColor, clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)", marginBottom: "-0.5em", fontWeight: config.fontWeight, fontFamily: FONT_FAMILY[config.fontId] }}>बोलो</span>
            <span style={{ fontSize: previewSize, color: config.baseColor, clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)", transform: "translateX(4px)", fontWeight: config.fontWeight, fontFamily: FONT_FAMILY[config.fontId] }}>बोलो</span>
          </div>
        ) : isLiquidFlow ? (
          <span style={{ fontSize: previewSize, color: config.activeColor, fontFamily: FONT_FAMILY[config.fontId], fontWeight: config.fontWeight, filter: "drop-shadow(0 2px 2px rgba(0,255,255,0.5)) drop-shadow(0 -2px 2px rgba(255,0,255,0.5))" }}>बोलो Bolo</span>
        ) : isLightSweep ? (
          <span style={{ fontSize: previewSize, fontWeight: config.fontWeight, fontFamily: FONT_FAMILY[config.fontId], background: `linear-gradient(90deg, ${config.baseColor} 0%, #fff 50%, ${config.baseColor} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>बोलो Bolo</span>
        ) : isPaperCut ? (
          <span style={{ fontSize: previewSize, color: config.activeColor, fontFamily: FONT_FAMILY[config.fontId], fontWeight: config.fontWeight, textShadow: "2px 2px 0px #000, -1px -1px 0px #fff", transform: "rotate(-2deg)" }}>बोलो Bolo</span>
        ) : isFlipCard ? (
          <div style={{ perspective: "100px" }}>
            <span style={{ fontSize: previewSize, color: config.activeColor, fontFamily: FONT_FAMILY[config.fontId], fontWeight: config.fontWeight, transform: "rotateX(20deg)", display: "inline-block" }}>बोलो Bolo</span>
          </div>
        ) : isRibbonSlide ? (
          <span style={{ fontSize: previewSize, color: config.activeColor, fontFamily: FONT_FAMILY[config.fontId], fontWeight: config.fontWeight, backgroundColor: config.accentColor || "#ff007f", padding: "2px 8px", clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}>बोलो Bolo</span>
        ) : isSpiralReveal ? (
          <span style={{ fontSize: previewSize, color: config.activeColor, fontFamily: FONT_FAMILY[config.fontId], fontWeight: config.fontWeight, transform: "rotate(-10deg) scale(0.9)", display: "inline-block" }}>बोलो Bolo</span>
        ) : isFloatingBubble ? (
          <span style={{ fontSize: previewSize, color: config.activeColor, fontFamily: FONT_FAMILY[config.fontId], fontWeight: config.fontWeight, backgroundColor: "rgba(255,255,255,0.1)", border: `1px solid ${config.accentColor || "#fff"}`, borderRadius: "50%", padding: "4px 12px" }}>Bolo</span>
        ) : isEditorialStackHero ? (
          <div className="flex w-full flex-col items-center justify-center leading-none">
            <span style={{ fontSize: previewSize * 0.4, color: config.baseColor, fontFamily: FONT_FAMILY.inter, textTransform: "uppercase", letterSpacing: "0.1em" }}>THE NEW</span>
            <span style={{ fontSize: previewSize * 1.2, color: config.activeColor, fontFamily: FONT_FAMILY.playfair, fontStyle: "italic", fontWeight: 700 }}>Bolo</span>
          </div>
        ) : isDualLine ? (
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
              PAR EXTRA
            </span>
            <span
              style={{
                fontFamily: FONT_FAMILY[config.specialFontId ?? config.secondaryFontId ?? "kaushanScript"],
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: previewSize * 1.25,
                color: config.baseColor ?? "#FFFFFF",
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                marginTop: `-${previewSize * 0.36}px`,
                zIndex: 2,
                lineHeight: 0.9,
              }}
            >
              cost jiske
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

        {isHovered && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <TemplatePreviewPlayer config={config} />
          </div>
        )}
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
