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
            className="inline-block transform scale-110 px-2.5 py-1 rounded-xl font-black text-white bg-gradient-to-r from-brand to-brand-secondary shadow-[0_0_24px_rgba(36,184,108,0.7)] transition-all duration-150"
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
            className="inline-block px-2.5 py-1 rounded uppercase font-black text-black bg-brand shadow-lg scale-110 tracking-wider transition-all duration-150"
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
            className="inline-block px-2 py-0.5 italic font-normal text-brand bg-black/60 rounded-md underline decoration-brand-secondary decoration-2 underline-offset-4 scale-105 transition-all duration-150"
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Live reel playback state
  const [selectedPhrase, setSelectedPhrase] = useState<SamplePhrase>(PHRASES[0]!);
  const [selectedStyle, setSelectedStyle] = useState<DemoStyle>(DEMO_STYLES[0]!);

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
      className="relative min-h-screen w-full overflow-hidden bg-[#FCFBF7] dark:bg-background pt-24 sm:pt-32 pb-20 selection:bg-brand/30"
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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-24 z-10">
        {/* Animated Wavy Text Ribbon SVG */}
        <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden flex items-start justify-center">
          <svg
            className="w-full max-w-[1400px] h-[600px] opacity-40 dark:opacity-20"
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              id="wavyRibbonPath"
              d="M -100 450 C 150 450, 100 100, 300 150 C 600 250, 600 450, 1100 350"
              fill="none"
              stroke="transparent"
            />
            <text className="fill-foreground font-medium text-[15px] tracking-wide">
              <textPath href="#wavyRibbonPath" startOffset="0%">
                <animate attributeName="startOffset" from="-100%" to="100%" dur="25s" repeatCount="indefinite" />
                the first part of the project, but I'm not totally sure. Also, I told the team the new timeline should be ready by tomorrow. We can review the final captions...
              </textPath>
            </text>
          </svg>
          {/* Floating Audio Pill overlay matching the reference image */}
          <div className="absolute top-[320px] left-[60%] -translate-x-1/2 -translate-y-1/2 rotate-[-5deg] z-0 pointer-events-none hidden lg:flex items-center gap-1 px-4 py-2 rounded-full bg-background border border-foreground/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-foreground rounded-full" 
                style={{ 
                  height: `${[4, 8, 14, 22, 12, 18, 6, 10, 16, 24, 14, 8, 20, 12, 6, 4][i]}px`,
                  opacity: i < 4 || i > 11 ? 0.3 : 0.8
                }} 
              />
            ))}
          </div>
        </div>
        {/* ===================================================================
            1. HERO HEADLINE & ACTIONS (Top Section)
           =================================================================== */}
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <h1 
            className="text-6xl sm:text-7xl lg:text-[100px] text-balance text-foreground leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-playfair), var(--font-instrument-serif), serif" }}
          >
            Captions that <br/> actually get Hinglish right.
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-8 max-w-md text-base sm:text-lg font-medium leading-relaxed text-muted-foreground/80">
            The voice-to-text AI that turns speech into clear, polished writing for every short-form video.
          </p>

          {/* Clean Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <Link
              href="/create"
              className="rounded-xl bg-brand/10 border-2 border-brand/40 text-brand px-8 py-3 text-sm font-bold hover:bg-brand/20 transition-colors shadow-sm"
            >
              Try free now
            </Link>
            
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold mt-1">
              No card required • 100% In-browser Privacy
            </p>

            <Link
              href="/styles"
              className="mt-6 rounded-full bg-brand text-white px-6 py-2 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Browse templates
            </Link>
          </div>
        </div>

        {/* ===================================================================
            2. THE 3D BILLION-DOLLAR INTERACTIVE STUDIO SHOWCASE
           =================================================================== */}
        <div
          className="relative mt-16 sm:mt-24 mx-auto max-w-5xl transition-transform duration-700 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * 18}px, ${mousePos.y * 18}px, 0) rotateX(${-mousePos.y * 8}deg) rotateY(${mousePos.x * 8}deg)`,
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
            className="hidden lg:flex absolute -left-4 xl:-left-12 top-20 flex-col gap-3 rounded-3xl border border-brand/20 bg-card/85 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 z-10 max-w-[220px]"
            style={{
              animation: "floatLeftCard 6s ease-in-out infinite",
              transformOrigin: "right center",
              boxShadow:
                "0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 24px rgba(16, 185, 129, 0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-brand-secondary text-white shadow-md">
                <Mic className="size-5" />
              </div>
              <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
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
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-secondary to-brand text-white shadow-md">
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
              <div className="size-2 rounded-full bg-brand/20 border border-brand/50" />
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
                  className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-brand-secondary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
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
                        className="w-[2px] rounded-full bg-gradient-to-b from-brand to-brand-secondary transition-all duration-150"
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
            className="relative mt-4 sm:mt-6 mx-auto max-w-lg z-50 px-4"
            style={{ animation: "ribbonFloat 4s ease-in-out infinite" }}
          >
            <div className="flex items-center justify-between gap-3 rounded-full border border-brand/30 bg-card/90 dark:bg-neutral-950/90 px-4 py-2.5 shadow-[0_16px_36px_-10px_rgba(36,184,108,0.25)] backdrop-blur-2xl text-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand animate-ping" />
                <span className="text-xs font-bold text-brand">Live AI Sync</span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground truncate">
                &ldquo;Yeh simple trick aapke reels ko 10X viral karegi!&rdquo;
              </p>
              <Link
                href="/create"
                className="shrink-0 rounded-full bg-gradient-to-r from-brand to-brand-secondary px-3 py-1 text-[11px] font-bold text-white hover:opacity-95 shadow-sm transition-opacity"
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
