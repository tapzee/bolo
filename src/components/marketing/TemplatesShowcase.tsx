"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TemplateShowcaseItem {
  id: string;
  name: string;
  category: string;
  tag?: string;
  bgGrad: string;
  fontFamily: string;
  accentColor: string;
  textCase: "upper" | "lower" | "none";
  sampleWords: { text: string; highlight?: boolean; color?: string }[];
}

const FEATURED_TEMPLATES: TemplateShowcaseItem[] = [
  {
    id: "focus",
    name: "Focus Minimal",
    category: "Premium",
    tag: "Aesthetic",
    bgGrad: "from-stone-900 via-neutral-900 to-black",
    fontFamily: "var(--font-playfair), serif",
    accentColor: "#f97316",
    textCase: "none",
    sampleWords: [
      { text: "Consistency" },
      { text: "is" },
      { text: "the", highlight: true },
      { text: "superpower", highlight: true, color: "#f97316" },
      { text: "in" },
      { text: "2026." },
    ],
  },
  {
    id: "design-walla",
    name: "Design Walla",
    category: "Trending",
    tag: "Hot 🔥",
    bgGrad: "from-zinc-950 via-slate-900 to-black",
    fontFamily: "var(--font-montserrat), sans-serif",
    accentColor: "#ffe600",
    textCase: "none",
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
    id: "pop-word",
    name: "Pop Word",
    category: "High Energy",
    tag: "Viral",
    bgGrad: "from-orange-950/80 via-neutral-950 to-black",
    fontFamily: "var(--font-inter), sans-serif",
    accentColor: "#f97316",
    textCase: "lower",
    sampleWords: [
      { text: "don't" },
      { text: "stop" },
      { text: "until", highlight: true, color: "#f97316" },
      { text: "you're" },
      { text: "proud" },
    ],
  },
  {
    id: "design-walla-pro-blue",
    name: "Cyber Blue",
    category: "Neon Glow",
    tag: "Cyber",
    bgGrad: "from-cyan-950/70 via-slate-950 to-black",
    fontFamily: "var(--font-anton), sans-serif",
    accentColor: "#00e5ff",
    textCase: "upper",
    sampleWords: [
      { text: "NEXT" },
      { text: "LEVEL" },
      { text: "AI", highlight: true, color: "#00e5ff" },
      { text: "CREATIVE" },
    ],
  },
  {
    id: "design-walla-pro-pink",
    name: "Festival Pink",
    category: "Vibrant",
    tag: "New",
    bgGrad: "from-pink-950/70 via-stone-950 to-black",
    fontFamily: "var(--font-poppins), sans-serif",
    accentColor: "#ff1493",
    textCase: "none",
    sampleWords: [
      { text: "Aapke" },
      { text: "audio" },
      { text: "ko" },
      { text: "magic", highlight: true, color: "#ff1493" },
      { text: "banaye!" },
    ],
  },
  {
    id: "big-grand",
    name: "Big Grand",
    category: "Bold",
    tag: "Bold",
    bgGrad: "from-sky-950/70 via-zinc-950 to-black",
    fontFamily: "var(--font-bebas), sans-serif",
    accentColor: "#38bdf8",
    textCase: "upper",
    sampleWords: [
      { text: "GROW" },
      { text: "YOUR" },
      { text: "AUDIENCE", highlight: true, color: "#38bdf8" },
      { text: "NOW" },
    ],
  },
];

export function TemplatesShowcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles className="size-3.5" />
            30+ Viral Caption Styles
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Pick a style. <span className="italic font-serif font-normal text-brand">Make it iconic.</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
            From subtle editorial typography to high-energy glowing reels captions. Fully customizable fonts, strokes, highlights, and animations.
          </p>
        </div>

        <Link
          href="/styles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline underline-offset-4"
        >
          Browse full template library
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-xl flex flex-col justify-between"
          >
            {/* Template Header */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-sm text-foreground">{tmpl.name}</h3>
                <p className="text-xs text-muted-foreground">{tmpl.category}</p>
              </div>
              {tmpl.tag && (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-0.5 text-[10px] font-semibold text-brand">
                  {tmpl.tag}
                </span>
              )}
            </div>

            {/* Visual Canvas Box */}
            <div
              className={`relative flex min-h-[140px] items-center justify-center rounded-2xl bg-gradient-to-br ${tmpl.bgGrad} p-4 text-center overflow-hidden border border-white/10 shadow-inner`}
            >
              <div
                className="flex flex-wrap items-center justify-center gap-1.5 text-base sm:text-lg font-black tracking-tight"
                style={{ fontFamily: tmpl.fontFamily }}
              >
                {tmpl.sampleWords.map((word, i) => (
                  <span
                    key={i}
                    style={{
                      color: word.highlight ? word.color || tmpl.accentColor : "#ffffff",
                      textShadow: word.highlight
                        ? `0 0 16px ${word.color || tmpl.accentColor}`
                        : "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                    className={`transition-transform duration-200 group-hover:scale-105 ${
                      tmpl.textCase === "upper"
                        ? "uppercase"
                        : tmpl.textCase === "lower"
                        ? "lowercase"
                        : ""
                    }`}
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick action button */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Word-level timing
              </span>
              <Link
                href="/create"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:underline underline-offset-4"
              >
                Use this style
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
