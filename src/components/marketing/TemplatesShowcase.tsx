"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Play, Wand2, Flame, Layers, Star, Zap } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { CAPTION_TEMPLATES } from "@/core";

interface TemplateShowcaseItem {
  id: string;
  name: string;
  category: "Trending" | "High Energy" | "Minimal" | "Neon Glow" | "Indian Viral";
  tag?: string;
  fontFamily: string;
  accentColor: string;
  bgGrad: string;
  sampleWords: { text: string; highlight?: boolean; color?: string; accent?: boolean }[];
}

const FEATURED_TEMPLATES: TemplateShowcaseItem[] = [
  {
    id: "design-walla",
    name: "Design Walla",
    category: "Trending",
    tag: "Hot 🔥",
    fontFamily: "var(--bolo-font-anton), sans-serif",
    accentColor: "#ffe600",
    bgGrad: "from-amber-950/70 via-zinc-950 to-black",
    sampleWords: [
      { text: "Viral" },
      { text: "reels" },
      { text: "banane", highlight: true, color: "#ffe600" },
      { text: "ka" },
      { text: "secret" },
      { text: "formula!" },
    ],
  },
  {
    id: "focus",
    name: "Focus Minimal",
    category: "Minimal",
    tag: "Aesthetic",
    fontFamily: "var(--bolo-font-playfair), serif",
    accentColor: "#10b981",
    bgGrad: "from-emerald-950/60 via-neutral-950 to-black",
    sampleWords: [
      { text: "Consistency" },
      { text: "is" },
      { text: "the", highlight: true },
      { text: "superpower", highlight: true, color: "#10b981" },
      { text: "in" },
      { text: "2026." },
    ],
  },
  {
    id: "pop-word",
    name: "Pop Word Kinetic",
    category: "High Energy",
    tag: "Viral",
    fontFamily: "var(--bolo-font-montserrat), sans-serif",
    accentColor: "#f97316",
    bgGrad: "from-orange-950/60 via-slate-950 to-black",
    sampleWords: [
      { text: "Don't" },
      { text: "stop" },
      { text: "until", highlight: true, color: "#f97316" },
      { text: "you're" },
      { text: "proud." },
    ],
  },
  {
    id: "cyber-blue",
    name: "Cyber Neon Glow",
    category: "Neon Glow",
    tag: "Cyber",
    fontFamily: "var(--bolo-font-bebas), sans-serif",
    accentColor: "#00e5ff",
    bgGrad: "from-cyan-950/70 via-slate-950 to-black",
    sampleWords: [
      { text: "NEXT" },
      { text: "LEVEL" },
      { text: "AI", highlight: true, color: "#00e5ff" },
      { text: "CREATIVE" },
    ],
  },
  {
    id: "festival-pink",
    name: "Festival Pink",
    category: "Indian Viral",
    tag: "New ✨",
    fontFamily: "var(--bolo-font-poppins), sans-serif",
    accentColor: "#ec4899",
    bgGrad: "from-pink-950/70 via-stone-950 to-black",
    sampleWords: [
      { text: "Aapke" },
      { text: "content" },
      { text: "mein", highlight: true, color: "#ec4899" },
      { text: "dum" },
      { text: "hai!" },
    ],
  },
  {
    id: "bold-yellow",
    name: "Bold Yellow Snap",
    category: "High Energy",
    tag: "Popular",
    fontFamily: "var(--bolo-font-archivo-black), sans-serif",
    accentColor: "#fbbf24",
    bgGrad: "from-yellow-950/60 via-zinc-950 to-black",
    sampleWords: [
      { text: "10X" },
      { text: "Watch" },
      { text: "Time", highlight: true, color: "#fbbf24" },
      { text: "Guaranteed" },
    ],
  },
];

const CATEGORIES = ["All", "Trending", "Indian Viral", "High Energy", "Minimal", "Neon Glow"] as const;

export function TemplatesShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filtered = activeCategory === "All"
    ? FEATURED_TEMPLATES
    : FEATURED_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-3.5" />
            Viral Kinetic Typography
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            40+ Pro Templates made for Reels & Shorts
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every template is engineered for high retention. Fully customizable fonts, neon glow, custom strokes, and multi-tier word emphasis.
          </p>
        </div>

        <Link
          href="/styles"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-5 py-3 text-xs sm:text-sm font-bold text-foreground shadow-sm hover:bg-card hover:border-emerald-500/40 hover:shadow-md transition-all group"
        >
          <span>View All 40+ Styles</span>
          <ArrowRight className="size-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Category Pills Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 -mx-2 px-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
              activeCategory === cat
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-105"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid with Micro-Animations */}
      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filtered.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:bg-card/90"
            >
              {/* Preview Stage Box */}
              <div
                className={`relative flex h-48 sm:h-52 w-full items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-br ${item.bgGrad} p-4 shadow-inner border border-white/10`}
              >
                {/* Floating Category Badge */}
                {item.tag && (
                  <span className="absolute top-3 right-3 z-10 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/10">
                    {item.tag}
                  </span>
                )}

                {/* Animated Simulated Kinetic Words */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-center px-3 z-10">
                  {item.sampleWords.map((word, i) => {
                    const isAcc = word.highlight;
                    return (
                      <span
                        key={word.text}
                        className={`text-xl sm:text-2xl font-extrabold transition-all duration-200 ${
                          isAcc
                            ? "scale-110 px-2 py-0.5 rounded-lg shadow-lg"
                            : "text-white/80"
                        }`}
                        style={{
                          fontFamily: item.fontFamily,
                          backgroundColor: isAcc && item.id.includes("walla") ? item.accentColor : "transparent",
                          color: isAcc && item.id.includes("walla") ? "#000000" : isAcc ? (word.color || item.accentColor) : "#ffffff",
                          textShadow: isAcc && !item.id.includes("walla") ? `0 0 16px ${item.accentColor}cc` : "0 2px 8px rgba(0,0,0,0.8)",
                        }}
                      >
                        {word.text}
                      </span>
                    );
                  })}
                </div>

                {/* Glow Overlay when Hovered */}
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              {/* Card Meta & Action Footer */}
              <div className="mt-4 flex items-center justify-between pt-1">
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.category} Engine
                  </p>
                </div>

                <Link
                  href="/create"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-muted/80 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-emerald-600 hover:text-white"
                >
                  <Wand2 className="size-3.5" />
                  <span>Use Style</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
