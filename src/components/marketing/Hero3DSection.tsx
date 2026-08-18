"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
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
import { CAPTION_TEMPLATES, MAX_TRANSCRIBABLE_SECONDS } from "@/core";
import { HeroCaptionPreview } from "@/components/marketing/HeroCaptionPreview";

export function Hero3DSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax 3D tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const maxMinutes = Math.floor(MAX_TRANSCRIBABLE_SECONDS / 60);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28"
      style={{ perspective: "1400px" }}
    >
      {/* 3D Atmospheric Background Glow & Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 24}px, ${mousePos.y * 24}px, 0)`,
        }}
      >
        {/* Central Core Ambient Glow */}
        <div
          className="absolute left-1/2 top-10 -translate-x-1/2 size-[650px] sm:size-[850px] rounded-full opacity-45 dark:opacity-65 blur-[120px] transition-all duration-1000"
          style={{
            background:
              "radial-gradient(circle, rgba(232, 65, 15, 0.35) 0%, rgba(245, 158, 11, 0.18) 45%, transparent 70%)",
          }}
        />

        {/* 3D Perspective Grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px),
                              linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 65% 55% at 50% 30%, black 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 55% at 50% 30%, black 20%, transparent 80%)",
          }}
        />
      </div>

      {/* Main Container with generous width to hold side-floating cards cleanly */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* ===================================================================
            DESKTOP FLOATING 3D CARDS (Positioned in side margins without overlap)
           =================================================================== */}

        {/* Floating Card 1: Top-Left Flank */}
        <motion.div
          className="hidden xl:flex absolute left-2 2xl:left-8 top-12 items-center gap-3 rounded-2xl border border-white/40 dark:border-white/10 bg-card/80 p-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:scale-105 z-20"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 30px) rotateY(${mousePos.x * 10}deg)`,
            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 20px rgba(232, 65, 15, 0.1)",
          }}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md">
            <Mic className="size-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">Hinglish Sync</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Word-level accurate timing
            </p>
          </div>
        </motion.div>

        {/* Floating Card 2: Top-Right Flank */}
        <motion.div
          className="hidden xl:flex absolute right-2 2xl:right-8 top-12 items-center gap-3 rounded-2xl border border-white/40 dark:border-white/10 bg-card/80 p-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:scale-105 z-20"
          animate={{ y: [5, -5, 5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * 25}px, 30px) rotateY(${mousePos.x * -10}deg)`,
            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 20px rgba(245, 158, 11, 0.1)",
          }}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
            <Zap className="size-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">Zero Video Upload</span>
              <span className="rounded bg-brand-soft px-1 text-[9px] font-bold text-brand">
                WASM
              </span>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">
              100% In-Browser Privacy
            </p>
          </div>
        </motion.div>

        {/* Floating Card 3: Lower-Left Flank */}
        <motion.div
          className="hidden xl:flex absolute left-4 2xl:left-12 top-64 items-center gap-3 rounded-2xl border border-border/80 bg-card/75 p-3 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-105 z-20"
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            transform: `translate3d(${mousePos.x * -20}px, ${mousePos.y * -20}px, 20px) rotateZ(-2deg)`,
          }}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-brand">
            <Languages className="size-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-foreground">15+ Indian Scripts</span>
            <p className="text-[10px] text-muted-foreground">Devanagari fallback</p>
          </div>
        </motion.div>

        {/* Floating Card 4: Lower-Right Flank */}
        <motion.div
          className="hidden xl:flex absolute right-4 2xl:right-12 top-64 items-center gap-3 rounded-2xl border border-border/80 bg-card/75 p-3 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-105 z-20"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 20px) rotateZ(2deg)`,
          }}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Film className="size-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-foreground">1080p 60FPS Lossless</span>
            <p className="text-[10px] text-muted-foreground">WebCodecs GPU Export</p>
          </div>
        </motion.div>

        {/* ===================================================================
            CENTER HEADLINE & CALL TO ACTION (Bounded container, 100% unobstructed)
           =================================================================== */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Top 3D Pill Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-gradient-to-r from-brand-soft/90 via-card to-brand-soft/90 p-1 pr-3.5 shadow-lg shadow-brand/10 backdrop-blur-xl transition-transform hover:scale-105">
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              <Sparkles className="size-3" />
              BOLO AI
            </span>
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Built for Indian Creators & Reels Makers
            </span>
          </div>

          {/* Unobstructed, Crystal-Clear Headline with 3D Floating Word */}
          <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl text-balance text-foreground leading-[1.12]">
            Captions that actually get{" "}
            <motion.span
              className="relative inline-block whitespace-nowrap cursor-default select-none pt-1"
              animate={{
                y: [-6, 6, -6],
                rotate: [-0.75, 0.75, -0.75],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.05 }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Floating Sparkle Pill */}
              <motion.span
                className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 size-6 sm:size-7 flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/40 z-20"
                animate={{ scale: [1, 1.15, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="size-3.5 sm:size-4" />
              </motion.span>

              {/* 3D Floating Word Text with Deep Multi-Layer Shadow */}
              <span
                className="relative z-10 italic font-serif font-normal bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_16px_32px_rgba(232,65,15,0.45)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                style={{
                  fontFamily:
                    "var(--font-instrument-serif), var(--font-playfair), serif",
                }}
              >
                Hinglish right.
              </span>

              {/* 3D Floating Ambient Light Pool Under-Plate */}
              <span
                aria-hidden
                className="absolute -bottom-1 sm:-bottom-2.5 inset-x-1 h-[8px] sm:h-[12px] -z-0 rounded-full bg-gradient-to-r from-orange-500/90 via-amber-400 to-orange-500/90 blur-[6px] opacity-85 shadow-[0_10px_20px_rgba(232,65,15,0.4)]"
              />

              {/* 3D Floating Curved Ribbon */}
              <svg
                className="absolute -bottom-2 sm:-bottom-4 inset-x-0 w-full text-brand drop-shadow-[0_6px_12px_rgba(232,65,15,0.4)]"
                height="10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 6C20 1 30 9 50 5C70 1 80 9 100 4"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </motion.span>
          </h1>

          {/* Accurate Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-muted-foreground">
            Animated word-level captions for Instagram Reels and Shorts. Accurate Hindi & Hinglish recognition, {CAPTION_TEMPLATES.length}+ templates, and export up to {maxMinutes} minutes — <span className="font-semibold text-foreground">all without your video file ever leaving your browser.</span>
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

          {/* Responsive Feature Badges on Tablets & Mobile (<1280px) */}
          <div className="xl:hidden mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 p-2.5 shadow-sm">
              <Mic className="size-4 text-brand shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">Hinglish Sync</p>
                <p className="text-[9px] text-muted-foreground truncate">Word timing</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 p-2.5 shadow-sm">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">Zero Upload</p>
                <p className="text-[9px] text-muted-foreground truncate">100% Private</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 p-2.5 shadow-sm">
              <Languages className="size-4 text-brand shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">15+ Scripts</p>
                <p className="text-[9px] text-muted-foreground truncate">Indian languages</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 p-2.5 shadow-sm">
              <Film className="size-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">60FPS HD</p>
                <p className="text-[9px] text-muted-foreground truncate">WebCodecs</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Elevated Stage for Live Caption Visualizer */}
        <div
          className="mt-14 sm:mt-18 transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(0, 0, 20px) rotateX(${mousePos.y * -4}deg) rotateY(${mousePos.x * 4}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <HeroCaptionPreview />
        </div>
      </div>
    </section>
  );
}
