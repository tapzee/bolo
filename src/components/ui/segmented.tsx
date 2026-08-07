"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Must be unique per rendered group. Framer Motion matches the sliding pill
   * across siblings by this id, so two groups sharing one would animate the
   * pill between them across the page.
   */
  layoutId: string;
  label: string;
  className?: string;
}

/**
 * Segmented control with a pill that slides to the selection.
 *
 * The pill is a single shared element moved by Framer Motion's layout
 * animation, which resolves to a `transform` — so the movement is composited
 * and never triggers layout on the surrounding panel. Animating each button's
 * own background instead would repaint the whole row on every change.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex gap-1 rounded-xl bg-muted p-1 ring-hairline",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 rounded-lg px-3 py-1.5 text-sm font-medium",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-card shadow-soft"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 34,
                  mass: 0.7,
                }}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
