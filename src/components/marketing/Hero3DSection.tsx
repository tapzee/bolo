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
  Play,
  Pause,
  Volume2,
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Sliders,
} from "lucide-react";
import { CAPTION_TEMPLATES, MAX_TRANSCRIBABLE_SECONDS } from "@/core";
import { TextParticle } from "@/components/ui/text-particle";

interface SamplePhrase {
  id: string;
  label: string;
  lang: string;
  words: { text: string; highlight?: boolean; color?: string }[];
}

const PHRASES: SamplePhrase[] = [
  {
    id: "hinglish",
    label: "Hinglish Viral",
    lang: "Hinglish",
    words: [
      { text: "Yeh" },
      { text: "simple" },
      { text: "trick" },
      { text: "aapke", highlight: true, color: "#10b981" },
      { text: "reels" },
      { text: "ko" },
      { text: "10X", highlight: true, color: "#34d399" },
      { text: "viral" },
      { text: "karegi!" },
    ],
  },
  {
    id: "hindi",
    label: "हिन्दी (Devanagari)",
    lang: "Hindi",
    words: [
      { text: "अगर" },
      { text: "आप" },
      { text: "भी" },
      { text: "कंटेंट", highlight: true, color: "#10b981" },
      { text: "बनाते" },
      { text: "हैं," },
      { text: "तो", highlight: true, color: "#34d399" },
      { text: "यह" },
      { text: "सुनिए!" },
    ],
  },
  {
    id: "hook",
    label: "Creator Hook",
    lang: "Hinglish",
    words: [
      { text: "Stop" },
      { text: "scrolling" },
      { text: "bhai," },
      { text: "aaj", highlight: true, color: "#10b981" },
      { text: "secret", highlight: true, color: "#06b6d4" },
      { text: "reveal" },
      { text: "hoga!" },
    ],
  },
];

interface DemoStyle {
  id: string;
  name: string;
  fontFamily: string;
  renderWord: (
    word: { text: string; highlight?: boolean; color?: string },
    isActive: boolean,
    isPast: boolean
  ) => React.ReactNode;
}

const DEMO_STYLES: DemoStyle[] = [
  {
    id: "dynamic",
    name: "Dynamic Glow",
    fontFamily: "var(--font-montserrat), sans-serif",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block transform scale-110 px-2.5 py-1 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_24px_rgba(16,185,129,0.7)] transition-all duration-150"
            style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-bold transition-opacity duration-150 ${
            isPast ? "text-white opacity-90" : "text-white/40"
          }`}
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "design-walla",
    name: "Design Walla",
    fontFamily: "var(--font-anton), sans-serif",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block px-2.5 py-1 rounded uppercase font-black text-black bg-emerald-400 shadow-lg scale-110 tracking-wider transition-all duration-150"
            style={{ fontFamily: "var(--font-anton), sans-serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 uppercase font-bold tracking-wider transition-opacity duration-150 ${
            isPast ? "text-white opacity-85" : "text-white/35"
          }`}
          style={{ fontFamily: "var(--font-anton), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "editorial",
    name: "Editorial Serif",
    fontFamily: "var(--font-playfair), serif",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block px-2 py-0.5 italic font-normal text-emerald-300 bg-black/60 rounded-md underline decoration-emerald-400 decoration-2 underline-offset-4 scale-105 transition-all duration-150"
            style={{ fontFamily: "var(--font-instrument-serif), var(--font-playfair), serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-medium transition-opacity duration-150 ${
            isPast ? "text-white opacity-95" : "text-white/40"
          }`}
          style={{ fontFamily: "var(--font-instrument-serif), var(--font-playfair), serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    fontFamily: "var(--font-bebas), sans-serif",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block px-2 py-0.5 rounded font-black text-cyan-300 drop-shadow-[0_0_16px_rgba(6,182,212,0.9)] scale-110 tracking-widest uppercase transition-all duration-150"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-bold tracking-widest uppercase transition-opacity duration-150 ${
            isPast ? "text-white opacity-80" : "text-white/30"
          }`}
          style={{ fontFamily: "var(--font-bebas), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
];

export function Hero3DSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particleMode, setParticleMode] = useState(false);

  // Live reel playback state
  const [selectedPhrase, setSelectedPhrase] = useState<SamplePhrase>(PHRASES[0]!);
  const [selectedStyle, setSelectedStyle] = useState<DemoStyle>(DEMO_STYLES[0]!);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Playhead animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % selectedPhrase.words.length);
    }, 420);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, selectedPhrase]);

  const maxMinutes = Math.floor(MAX_TRANSCRIBABLE_SECONDS / 60);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32"
      style={{ perspective: "1500px" }}
    >
      {/* 60FPS Hardware-Accelerated CSS Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes waveFrequency {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-7px) rotate(-1.5deg); }
          75% { transform: translateY(7px) rotate(1.5deg); }
        }
        @keyframes waveRibbon {
          0%, 100% { transform: translateY(0px) scaleX(1); opacity: 0.85; }
          50% { transform: translateY(4px) scaleX(1.05); opacity: 1; }
        }
        @keyframes phoneFloat3D {
          0%, 100% { transform: translateY(0px) rotateX(6deg) rotateY(0deg); }
          50% { transform: translateY(-12px) rotateX(8deg) rotateY(1.5deg); }
        }
        @keyframes ribbonFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes floatLeftCard {
          0%, 100% { transform: translateY(0px) rotateY(16deg) rotateX(-4deg); }
          50% { transform: translateY(-10px) rotateY(18deg) rotateX(-6deg); }
        }
        @keyframes floatRightCard {
          0%, 100% { transform: translateY(0px) rotateY(-16deg) rotateX(-4deg); }
          50% { transform: translateY(-10px) rotateY(-18deg) rotateX(-6deg); }
        }
      `}} />

      {/* Atmospheric 3D Lighting in Emerald-Teal Radiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 26}px, ${mousePos.y * 26}px, 0)`,
        }}
      >
        {/* Core Volumetric Sunburst */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 size-[700px] sm:size-[950px] rounded-full opacity-45 dark:opacity-65 blur-[140px] transition-all duration-1000"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(20, 184, 166, 0.2) 40%, transparent 70%)",
          }}
        />

        {/* 3D Perspective Grid Vanishing Plane */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px),
                              linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 30%, black 25%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 55% at 50% 30%, black 25%, transparent 85%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* ===================================================================
            1. HERO HEADLINE & ACTIONS (Top Section)
           =================================================================== */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Top 3D Pill Tag with Interactive Particle Toggle */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-brand/30 bg-gradient-to-r from-brand-soft/90 via-card to-brand-soft/90 p-1 pr-3 shadow-lg shadow-brand/10 backdrop-blur-xl transition-transform hover:scale-105">
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              <Sparkles className="size-3" />
              DESI AI
            </span>
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Desi Auto-Caption for Indian Creators
            </span>
            <button
              onClick={() => setParticleMode(!particleMode)}
              className={`ml-1 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                particleMode
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm animate-pulse"
                  : "bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-2.5" />
              <span>{particleMode ? "Particle FX Active ✨" : "Try Particle FX"}</span>
            </button>
          </div>

          {/* Letter-by-Letter Acoustic Wave Frequency OR Interactive TextParticle Headline */}
          <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl text-balance text-foreground leading-[1.1]">
            Captions that actually get{" "}
            {particleMode ? (
              <span className="relative inline-block w-full max-w-[420px] sm:max-w-[540px] h-20 sm:h-28 align-middle -my-2">
                <TextParticle
                  text="Hinglish right."
                  fontSize={85}
                  particleDensity={4}
                  particleSize={2.5}
                  particleColor="#10b981"
                  className="w-full h-full cursor-crosshair"
                />
              </span>
            ) : (
              <span className="relative inline-block whitespace-nowrap cursor-default select-none pt-1">
                {/* Every Letter Moves in a Frequency Wave */}
                <span
                  className="relative z-10 italic font-serif font-normal bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_16px_32px_rgba(16,185,129,0.35)] inline-flex"
                  style={{
                    fontFamily:
                      "var(--font-instrument-serif), var(--font-playfair), serif",
                  }}
                >
                  {"Hinglish right.".split("").map((char, i) => (
                    <span
                      key={i}
                      className="inline-block"
                      style={{
                        animation: "waveFrequency 2.2s ease-in-out infinite",
                        animationDelay: `${i * 0.12}s`,
                        willChange: "transform",
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </span>

                {/* Synchronized Flowing Ambient Light Pool & Curved Ribbon Line */}
                <div
                  className="absolute -bottom-2 sm:-bottom-3.5 inset-x-0 w-full pointer-events-none"
                  style={{
                    animation: "waveRibbon 2.2s ease-in-out infinite",
                    animationDelay: "0.36s",
                    willChange: "transform",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute -top-1 inset-x-1 h-[8px] sm:h-[12px] -z-0 rounded-full bg-gradient-to-r from-emerald-500/90 via-teal-400 to-emerald-500/90 blur-[6px] opacity-85 shadow-[0_10px_20px_rgba(16,185,129,0.4)]"
                  />
                  <svg
                    className="w-full text-brand drop-shadow-[0_6px_12px_rgba(16,185,129,0.4)]"
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
                </div>
              </span>
            )}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-muted-foreground">
            Generate animated, word-level captions for Instagram Reels & Shorts. Accurate Hindi & Hinglish recognition, {CAPTION_TEMPLATES.length}+ viral presets, and instant export up to {maxMinutes} minutes — <span className="font-semibold text-foreground">100% privately in your browser.</span>
          </p>

          {/* 3D Tactile Buttons in Emerald-Teal */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-[length:200%_auto] px-8 py-4 text-sm sm:text-base font-bold text-white shadow-[0_12px_32px_-4px_rgba(16,185,129,0.45),0_4px_12px_rgba(16,185,129,0.3)] transition-all duration-300 hover:bg-[position:right_center] hover:shadow-[0_18px_44px_-4px_rgba(16,185,129,0.6),0_6px_16px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-95 border-t border-white/40"
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

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              No card required
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              100% in-browser privacy
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-emerald-500" />
              1080p 60fps WebCodecs
            </span>
          </div>
        </div>

        {/* ===================================================================
            2. THE 3D BILLION-DOLLAR INTERACTIVE STUDIO SHOWCASE
           =================================================================== */}
        <div
          className="relative mt-16 sm:mt-24 mx-auto max-w-5xl transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * 18}px, ${mousePos.y * 18}px, 0)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Ambient Caustic Aura under the 3D Stage */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 rounded-[40px] opacity-60 dark:opacity-80 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.25) 0%, rgba(20, 184, 166, 0.12) 50%, transparent 80%)",
            }}
          />

          {/* Left Inward 3D Satellite Card */}
          <div
            className="hidden lg:flex absolute -left-4 xl:-left-12 top-20 flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-card/85 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 z-10 max-w-[220px]"
            style={{
              animation: "floatLeftCard 6s ease-in-out infinite",
              transformOrigin: "right center",
              boxShadow:
                "0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 24px rgba(16, 185, 129, 0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md">
                <Mic className="size-5" />
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">99.8% Sync Rate</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Code-mixed Hinglish speech recognized with sub-word precision.
              </p>
            </div>
          </div>

          {/* Right Inward 3D Satellite Card */}
          <div
            className="hidden lg:flex absolute -right-4 xl:-right-12 top-20 flex-col gap-3 rounded-3xl border border-teal-500/20 bg-card/85 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 z-10 max-w-[220px]"
            style={{
              animation: "floatRightCard 6.5s ease-in-out infinite",
              transformOrigin: "left center",
              boxShadow:
                "0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 24px rgba(20, 184, 166, 0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-md">
                <Zap className="size-5" />
              </div>
              <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                WASM
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Zero Video Upload</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                4K videos never leave your PC. Rendered locally on your GPU.
              </p>
            </div>
          </div>

          {/* 3D Smartphone Device Mockup / Centerpiece Stage */}
          <div
            className="relative z-40 mx-auto w-full max-w-[340px] sm:max-w-[370px] rounded-[44px] border-[7px] border-neutral-900 bg-black p-3 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5),0_0_40px_rgba(16,185,129,0.2)]"
            style={{
              animation: "phoneFloat3D 6s ease-in-out infinite",
              transformOrigin: "center center",
            }}
          >
            {/* Dynamic Island / Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-neutral-950 z-30 border border-neutral-800 flex items-center justify-end px-2">
              <div className="size-2 rounded-full bg-emerald-950 border border-emerald-800" />
            </div>

            {/* Inner Phone Screen */}
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[34px] bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 flex flex-col justify-between p-4 shadow-inner">
              {/* Dynamic Video Gradient Backdrop */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 50% 40%, rgba(16,185,129,0.3) 0%, rgba(20,184,166,0.15) 40%, transparent 80%)",
                }}
              />

              {/* Top Waveform Audio Bar Pill */}
              <div className="relative z-20 flex items-center justify-between gap-2 pt-5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="size-3.5 fill-current" />
                  ) : (
                    <Play className="size-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 backdrop-blur-md">
                  <Volume2 className="size-3 text-brand" />
                  <div className="flex items-center gap-0.5 h-3">
                    {[8, 16, 10, 18, 12, 16, 8, 14].map((h, i) => (
                      <span
                        key={i}
                        className="w-[2px] rounded-full bg-gradient-to-b from-emerald-500 to-teal-400 transition-all duration-150"
                        style={{
                          height: isPlaying ? `${Math.max(3, (h * ((i + activeWordIndex) % 4 + 1)) / 4)}px` : "3px",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-white/80 ml-1">
                    {isPlaying ? "Live Audio" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Center Live Caption Overlay with Safe Padding to Avoid Action Icon Collision */}
              <div className="relative z-20 my-auto text-left py-4 max-w-[76%] mr-auto">
                <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-2 text-xl sm:text-2xl font-black tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  {selectedPhrase.words.map((word, index) => {
                    const isActive = index === activeWordIndex;
                    const isPast = index <= activeWordIndex;
                    return selectedStyle.renderWord(word, isActive, isPast);
                  })}
                </div>
              </div>

              {/* Instagram Reels Action Icons Overlay */}
              <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4 z-20 text-white drop-shadow-md">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md hover:text-red-500 transition-colors">
                    <Heart className="size-5 fill-red-500 text-red-500" />
                  </div>
                  <span className="text-[10px] font-bold">42.8K</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                    <MessageCircle className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold">1,240</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex size-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                    <Share2 className="size-5" />
                  </div>
                  <span className="text-[10px] font-bold">Share</span>
                </div>
              </div>

              {/* Bottom Reel Footer Info */}
              <div className="relative z-20 text-left pb-2">
                <p className="text-xs font-bold text-white">@indiancreator</p>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                  Viral Hinglish reel made with Desi Auto-Caption ⚡
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-white/60 mt-1">
                  <Music2 className="size-3" />
                  <span>Original Audio · Hinglish Voice</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Speech Ribbon Dock below the phone */}
          <div
            className="relative -mt-6 sm:-mt-8 mx-auto max-w-lg z-40 px-4"
            style={{ animation: "ribbonFloat 4s ease-in-out infinite" }}
          >
            <div className="flex items-center justify-between gap-3 rounded-full border border-emerald-500/30 bg-card/90 dark:bg-neutral-950/90 px-4 py-2.5 shadow-[0_16px_36px_-10px_rgba(16,185,129,0.25)] backdrop-blur-2xl text-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Live AI Sync</span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground truncate">
                &ldquo;Yeh simple trick aapke reels ko 10X viral karegi!&rdquo;
              </p>
              <Link
                href="/create"
                className="shrink-0 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-1 text-[11px] font-bold text-white hover:opacity-95 shadow-sm transition-opacity"
              >
                Create
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Style & Sample Quick Selector Bar */}
        <div className="mt-16 sm:mt-20 mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card/80 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-brand" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Try Styles Live:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DEMO_STYLES.map((style) => {
              const active = selectedStyle.id === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "border-brand bg-brand-soft text-brand shadow-sm"
                      : "border-border/80 bg-card/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {style.name}
                </button>
              );
            })}
          </div>

          {/* Sample Selector */}
          <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto justify-end">
            {PHRASES.map((p) => {
              const active = selectedPhrase.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPhrase(p);
                    setActiveWordIndex(0);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    active
                      ? "bg-foreground text-background font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
