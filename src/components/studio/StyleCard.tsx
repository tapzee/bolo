"use client";

import { motion } from "motion/react";
import type { CaptionStyleDefinition } from "@/core";
import { FONT_FAMILY } from "@/remotion/fonts";
import { cn } from "@/lib/utils";

/**
 * A style option, previewed in its own typeface.
 *
 * The swatch renders real Devanagari next to real Latin ("बोलो Bolo") in the
 * style's own font, weight, casing and colours. That is deliberate: it doubles
 * as an at-a-glance check that Anton and Bebas Neue — neither of which ships
 * Devanagari — are correctly falling through to Noto Sans Devanagari for the
 * Hindi half while keeping their own face for the Latin half.
 */
export function StyleCard({
  definition,
  selected,
  onSelect,
}: {
  definition: CaptionStyleDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const s = definition.defaults;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-xl p-3 text-left",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {selected ? (
        <motion.span
          layoutId="style-card-selection"
          className="absolute inset-0 rounded-xl bg-brand-soft ring-2 ring-brand"
          transition={{ type: "spring", stiffness: 400, damping: 34, mass: 0.7 }}
        />
      ) : (
        <span className="absolute inset-0 rounded-xl ring-hairline transition-colors group-hover:bg-accent" />
      )}

      <div className="relative z-10 flex items-center gap-3">
        <div
          className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{
            // Mid-grey rather than the app surface: light and dark styles both
            // have to prove they read against footage, not against the panel.
            background:
              "linear-gradient(135deg, #3a3f4a 0%, #14161c 55%, #2a2f3a 100%)",
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY[s.fontId],
              fontWeight: s.fontWeight,
              color: s.activeColor,
              textTransform: s.uppercase ? "uppercase" : "none",
              WebkitTextStroke: "1.25px #000000",
              paintOrder: "stroke fill",
              fontSize: 15,
              letterSpacing: s.letterSpacingPx * 0.2,
              lineHeight: 1,
              backgroundColor:
                s.styleId === "box" ? s.accentColor : "transparent",
              padding: s.styleId === "box" ? "3px 6px" : 0,
              borderRadius: s.styleId === "box" ? 5 : 0,
              textShadow:
                s.styleId === "glow"
                  ? `0 0 6px ${s.accentColor}, 0 0 14px ${s.accentColor}`
                  : "none",
              whiteSpace: "nowrap",
            }}
          >
            बोलो Bolo
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium">{definition.label}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {definition.description}
          </p>
        </div>
      </div>
    </button>
  );
}
