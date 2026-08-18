"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic,
  Languages,
  Film,
  CheckCircle2,
} from "lucide-react";
import { CAPTION_TEMPLATES } from "@/core";
import { HeroCaptionPreview } from "@/components/marketing/HeroCaptionPreview";

export function Hero3DSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Parallax 3D tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28"
      style={{ perspective: "1400px" }}
    >
      {/* 3D Atmospheric Background Layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 0)`,
        }}
      >
        {/* Central Core Ambient Glow */}
        <div
          className="absolute left-1/2 top-10 -translate-x-1/2 size-[650px] sm:size-[850px] rounded-full opacity-45 dark:opacity-65 blur-[120px] transition-all duration-1000"
          style={{
            background:
              "radial-gradient(circle, rgba(232, 65, 15, 0.35) 0%, rgba(245, 158, 11, 0.2) 40%, transparent 70%)",
          }}
        />

        {/* Secondary Accent Aura */}
        <div
          className="absolute left-1/4 top-1/3 size-[400px] rounded-full opacity-25 dark:opacity-40 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, transparent 70%)",
          }}
        />

        {/* 3D Horizon Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px),
                              linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 30%, black 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 50% at 50% 30%, black 20%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 text-center">
        {/* Floating 3D Badge 1 (Desktop Top Left) */}
        <div
          className="hidden lg:flex absolute -left-4 top-16 items-center gap-3 rounded-2xl border border-white/30 dark:border-white/10 bg-card/75 p-3.5 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ease-out hover:scale-105"
          style={{
            transform: `translate3d(${mousePos.x * -35}px, ${mousePos.y * -35}px, 40px) rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 12}deg)`,
            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 20px rgba(232, 65, 15, 0.12)",
          }}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md">
            <Mic className="size-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">99.8% Accuracy</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Hinglish Code-Mixing Sync
            </p>
          </div>
        </div>

        {/* Floating 3D Badge 2 (Desktop Top Right) */}
        <div
          className="hidden lg:flex absolute -right-4 top-14 items-center gap-3 rounded-2xl border border-white/30 dark:border-white/10 bg-card/75 p-3.5 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ease-out hover:scale-105"
          style={{
            transform: `translate3d(${mousePos.x * 40}px, ${mousePos.y * 40}px, 50px) rotateY(${mousePos.x * -14}deg) rotateX(${-mousePos.y * 14}deg)`,
            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 20px rgba(245, 158, 11, 0.12)",
          }}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
            <Zap className="size-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">Zero Cloud Wait</span>
              <span className="rounded bg-brand-soft px-1 text-[9px] font-extrabold text-brand">
                GPU
              </span>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Instant WebCodecs Render
            </p>
          </div>
        </div>

        {/* Floating 3D Badge 3 (Desktop Mid-Left) */}
        <div
          className="hidden xl:flex absolute -left-10 top-72 items-center gap-2.5 rounded-xl border border-border/80 bg-card/65 px-3 py-2 shadow-xl backdrop-blur-xl transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 20px) rotateZ(-3deg)`,
          }}
        >
          <Languages className="size-4 text-brand" />
          <span className="text-[11px] font-bold text-foreground">
            15+ Native Indian Scripts
          </span>
        </div>

        {/* Floating 3D Badge 4 (Desktop Mid-Right) */}
        <div
          className="hidden xl:flex absolute -right-10 top-72 items-center gap-2.5 rounded-xl border border-border/80 bg-card/65 px-3 py-2 shadow-xl backdrop-blur-xl transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * 25}px, 20px) rotateZ(3deg)`,
          }}
        >
          <Film className="size-4 text-amber-500" />
          <span className="text-[11px] font-bold text-foreground">
            1080p 60FPS Lossless
          </span>
        </div>

        {/* Top 3D Pill Tag with Shimmer Effect */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-gradient-to-r from-brand-soft/90 via-card to-brand-soft/90 p-1 pr-3.5 shadow-lg shadow-brand/10 backdrop-blur-xl transition-transform hover:scale-105">
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            <Sparkles className="size-3" />
            BOLO AI v2.4
          </span>
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Built for Indian Creators & Reels Makers
          </span>
        </div>

        {/* Billion-Dollar Editorial Headline */}
        <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl text-balance text-foreground leading-[1.08]">
          Captions that actually get{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span
              className="relative z-10 italic font-serif font-normal bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(232,65,15,0.3)]"
              style={{
                fontFamily:
                  "var(--font-instrument-serif), var(--font-playfair), serif",
              }}
            >
              Hinglish right.
            </span>
            {/* Glowing 3D light underline accent */}
            <span
              aria-hidden
              className="absolute -bottom-1 sm:-bottom-2 inset-x-0 h-[6px] sm:h-[10px] -z-0 rounded-full bg-gradient-to-r from-orange-500/80 via-amber-400 to-orange-500/80 blur-[4px] opacity-75"
            />
            <svg
              className="absolute -bottom-2 sm:-bottom-3.5 inset-x-0 w-full text-brand/70"
              height="8"
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 5C20 1 30 7 50 4C70 1 80 7 100 3"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg lg:text-xl font-normal leading-relaxed text-muted-foreground">
          Turn spoken Hindi, Hinglish & 15+ regional audio into synchronized, viral animated captions. Edit every word with sub-second precision, apply 30+ trending templates, and export in 1080p 60fps — <span className="font-semibold text-foreground">100% privately in your browser.</span>
        </p>

        {/* 3D Tactile Buttons */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/create"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-[length:200%_auto] px-8 py-4 text-sm sm:text-base font-bold text-white shadow-[0_12px_32px_-4px_rgba(232,65,15,0.45),0_4px_12px_rgba(232,65,15,0.3)] transition-all duration-300 hover:bg-[position:right_center] hover:shadow-[0_18px_44px_-4px_rgba(232,65,15,0.6),0_6px_16px_rgba(232,65,15,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-95 border-t border-white/40"
          >
            {/* Shimmer light sweep */}
            <span className="absolute -inset-x-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 transition-all duration-1000 group-hover:translate-x-[400%]" />
            <Wand2 className="size-5" />
            <span>Try free now</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/styles"
            className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/40 dark:border-white/10 bg-card/80 px-7 py-4 text-sm sm:text-base font-bold text-foreground shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:bg-card hover:border-brand/40 hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>Browse {CAPTION_TEMPLATES.length} templates</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-extrabold text-foreground group-hover:bg-brand group-hover:text-white transition-colors">
              ⚡
            </span>
          </Link>
        </div>

        {/* 3D Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 shadow-sm backdrop-blur-md">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>No card required</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 shadow-sm backdrop-blur-md">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>100% In-browser privacy</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 shadow-sm backdrop-blur-md">
            <Zap className="size-3.5 text-amber-500" />
            <span>1080p 60fps WebCodecs</span>
          </div>
        </div>

        {/* 3D Elevated Stage for Live Caption Visualizer */}
        <div
          className="mt-14 sm:mt-18 transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(0, 0, 30px) rotateX(${mousePos.y * -6}deg) rotateY(${mousePos.x * 6}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <HeroCaptionPreview />
        </div>
      </div>
    </section>
  );
}
