"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  Play,
  Pause,
  ShieldCheck,
  Zap,
  Flame,
  ArrowRight,
  Wand2,
  CheckCircle2,
  Sliders,
  Palette,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Music2,
} from "lucide-react";

interface SamplePhrase {
  id: string;
  label: string;
  lang: string;
  badge: string;
  words: { text: string; highlight?: boolean; color?: string; accent?: boolean }[];
}

const PHRASES: SamplePhrase[] = [
  {
    id: "hinglish",
    label: "Hinglish Viral Hook",
    lang: "Hinglish (Latin)",
    badge: "🔥 Trending",
    words: [
      { text: "Yeh" },
      { text: "simple" },
      { text: "trick" },
      { text: "aapke", highlight: true, color: "#10b981" },
      { text: "reels" },
      { text: "ko" },
      { text: "10X", highlight: true, color: "#34d399", accent: true },
      { text: "viral" },
      { text: "karegi!" },
    ],
  },
  {
    id: "hindi",
    label: "हिन्दी (Devanagari)",
    lang: "Hindi",
    badge: "🇮🇳 Native",
    words: [
      { text: "अगर" },
      { text: "आप" },
      { text: "भी" },
      { text: "कंटेंट", highlight: true, color: "#f59e0b" },
      { text: "बनाते" },
      { text: "हैं," },
      { text: "तो", highlight: true, color: "#10b981" },
      { text: "यह" },
      { text: "सुनिए!" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Growth",
    lang: "Hinglish",
    badge: "💰 High Impact",
    words: [
      { text: "Never" },
      { text: "save" },
      { text: "money" },
      { text: "in", highlight: true, color: "#06b6d4" },
      { text: "saving" },
      { text: "account," },
      { text: "always", highlight: true, color: "#10b981", accent: true },
      { text: "invest!" },
    ],
  },
  {
    id: "creator",
    label: "Comedy & Storytelling",
    lang: "Hinglish",
    badge: "⚡ Fast Pace",
    words: [
      { text: "Bhai" },
      { text: "sach" },
      { text: "bata" },
      { text: "raha", highlight: true, color: "#ec4899" },
      { text: "hoon," },
      { text: "aaj", highlight: true, color: "#38bdf8" },
      { text: "secret" },
      { text: "reveal" },
      { text: "hoga!" },
    ],
  },
];

interface DemoStyle {
  id: string;
  name: string;
  tag: string;
  fontFamily: string;
  bgGrad: string;
  renderWord: (
    word: { text: string; highlight?: boolean; color?: string; accent?: boolean },
    isActive: boolean,
    isPast: boolean
  ) => React.ReactNode;
}

const DEMO_STYLES: DemoStyle[] = [
  {
    id: "dynamic",
    name: "Dynamic Glow",
    tag: "Viral",
    fontFamily: "var(--bolo-font-montserrat), sans-serif",
    bgGrad: "from-emerald-950/70 via-slate-950 to-black",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <motion.span
            layout
            key={word.text}
            initial={{ scale: 0.9, y: 4 }}
            animate={{ scale: 1.15, y: -2 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="inline-block px-3 py-1 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.8),0_4px_12px_rgba(0,0,0,0.5)] border border-emerald-300/40"
            style={{ fontFamily: "var(--bolo-font-montserrat), sans-serif" }}
          >
            {word.text}
          </motion.span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1.5 py-0.5 font-bold transition-all duration-200 ${
            isPast ? "text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : "text-white/35"
          }`}
          style={{ fontFamily: "var(--bolo-font-montserrat), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "design-walla",
    name: "Design Walla",
    tag: "Hot 🔥",
    fontFamily: "var(--bolo-font-anton), sans-serif",
    bgGrad: "from-amber-950/70 via-zinc-950 to-black",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <motion.span
            layout
            key={word.text}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1.18, rotate: -2 }}
            transition={{ type: "spring", stiffness: 450, damping: 22 }}
            className="inline-block px-3 py-0.5 rounded-md uppercase font-black text-black bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_24px_rgba(251,191,36,0.85)] tracking-wider border-2 border-black"
            style={{ fontFamily: "var(--bolo-font-anton), sans-serif" }}
          >
            {word.text}
          </motion.span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1.5 uppercase font-bold tracking-wider transition-opacity duration-150 ${
            isPast ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" : "text-white/30"
          }`}
          style={{ fontFamily: "var(--bolo-font-anton), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "editorial",
    name: "Editorial Serif",
    tag: "Minimal",
    fontFamily: "var(--bolo-font-playfair), serif",
    bgGrad: "from-stone-950 via-neutral-950 to-black",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <motion.span
            layout
            key={word.text}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1.1 }}
            className="inline-block px-2.5 py-0.5 italic font-normal text-emerald-400 bg-black/80 rounded-lg underline decoration-emerald-400/80 decoration-2 underline-offset-4 shadow-lg border border-emerald-500/30"
            style={{ fontFamily: "var(--bolo-font-playfair), serif" }}
          >
            {word.text}
          </motion.span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1.5 font-medium transition-opacity duration-150 ${
            isPast ? "text-white/90" : "text-white/35"
          }`}
          style={{ fontFamily: "var(--bolo-font-playfair), serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    tag: "Neon",
    fontFamily: "var(--bolo-font-bebas), sans-serif",
    bgGrad: "from-cyan-950/70 via-indigo-950 to-black",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <motion.span
            layout
            key={word.text}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1.2 }}
            className="inline-block px-2.5 py-0.5 rounded font-black text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,1)] tracking-widest uppercase bg-cyan-950/60 border border-cyan-400"
            style={{ fontFamily: "var(--bolo-font-bebas), sans-serif" }}
          >
            {word.text}
          </motion.span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-bold tracking-widest uppercase transition-opacity duration-150 ${
            isPast ? "text-white opacity-85" : "text-white/25"
          }`}
          style={{ fontFamily: "var(--bolo-font-bebas), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
];

export function Hero3DSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stage3DRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [selectedPhrase, setSelectedPhrase] = useState<SamplePhrase>(PHRASES[0]!);
  const [selectedStyle, setSelectedStyle] = useState<DemoStyle>(DEMO_STYLES[0]!);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(450);

  // Decoupled silky mouse 3D tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !stage3DRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    stage3DRef.current.style.transform = `translate3d(${x * 14}px, ${y * 14}px, 0) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  };

  const handleMouseLeave = () => {
    if (!stage3DRef.current) return;
    stage3DRef.current.style.transform = `translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg)`;
  };

  // Playhead interval loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % selectedPhrase.words.length);
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, selectedPhrase, playbackSpeed]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[92vh] w-full overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-16 lg:pb-24 transition-colors duration-300"
      style={{ perspective: "1400px" }}
    >
      {/* Dynamic Background Mesh Gradients (Theme-aware with flowing pulse) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Glowing Emerald Aurora Mesh */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-400/15 to-transparent blur-[120px] dark:from-emerald-600/25 dark:via-teal-500/20 dark:to-transparent animate-pulse" style={{ animationDuration: "8s" }} />
        
        {/* Subtle Warm Amber Raycast Aura */}
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-[140px]" />
        
        {/* Violet Tech Aura */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[140px]" />

        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===================================================================
         * 1. HERO HEADLINE & ACTIONS (DESKTOP & MOBILE OPTIMIZED)
         * =================================================================== */}
        <div className="mx-auto max-w-3xl text-center space-y-6">
          {/* Top Pill Chip */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm backdrop-blur-md"
          >
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            <Sparkles className="size-3.5 text-emerald-500" />
            <span>AI Captions Built for Hindi & Hinglish Creators</span>
            <span className="hidden sm:inline-block rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              100% In-Browser Privacy
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground text-balance leading-[1.12]"
          >
            Turn spoken words into{" "}
            <span className="relative inline-block whitespace-nowrap">
              {/* Soft ambient atmospheric glow behind the phrase */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-x-3 -inset-y-1.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-400/20 to-amber-400/20 blur-xl -z-10 opacity-75 dark:opacity-90"
              />
              <span className="relative z-10 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-400 bg-clip-text text-transparent font-black tracking-tight">
                viral reel captions
              </span>
              {/* Crisp, flowing Figma-grade curved accent underline */}
              <svg
                aria-hidden="true"
                viewBox="0 0 300 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute -bottom-2.5 left-0 w-full h-3 sm:h-3.5 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                preserveAspectRatio="none"
              >
                <path
                  d="M4 11.5C80 3.5 210 3 296 10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            in seconds.
          </motion.h1>

          {/* Subtitle Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Exact millisecond word sync tuned for Indian accents and slang. Export crisp 1080p MP4s directly on your GPU — <strong className="text-foreground font-semibold">zero video uploads</strong> to any server.
          </motion.p>

          {/* High-Converting CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Link
              href="/create"
              className="group relative flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-600/40 hover:scale-105 active:scale-95"
            >
              <Wand2 className="size-5 transition-transform group-hover:rotate-12" />
              <span>Create Captions Free</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/styles"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/60 px-6 py-4 text-sm font-bold text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-card hover:border-border hover:shadow-md"
            >
              <Palette className="size-4 text-emerald-500" />
              <span>Explore 40+ Templates</span>
            </Link>
          </motion.div>

          {/* Micro Trust Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-muted-foreground font-medium"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" /> No signup required
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" /> 100% Private in-browser decode
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-amber-500" /> Instant 60FPS WebCodecs
            </span>
          </motion.div>
        </div>

        {/* ===================================================================
         * 2. INTERACTIVE 3D LIVE CAPTION STAGE & PLAYGROUND
         * =================================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 sm:mt-16 lg:mt-20 max-w-5xl mx-auto"
        >
          {/* Controls Bar Above Stage (Phrases & Templates) */}
          <div className="rounded-3xl border border-border/70 bg-card/75 dark:bg-card/70 p-3 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
            
            {/* Top Toolbar: Quick Sample Hooks */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Flame className="size-4" />
                </span>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Test Indian Audio Phrases:
                </span>
              </div>

              {/* Phrase Pills Selector */}
              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                {PHRASES.map((phrase) => (
                  <button
                    key={phrase.id}
                    onClick={() => {
                      setSelectedPhrase(phrase);
                      setActiveWordIndex(0);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      selectedPhrase.id === phrase.id
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                        : "bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{phrase.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      selectedPhrase.id === phrase.id ? "bg-white/20 text-white" : "bg-card text-muted-foreground"
                    }`}>
                      {phrase.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Section: 3D Smartphone Device Mockup */}
            <div
              ref={stage3DRef}
              className="relative mx-auto w-full max-w-[320px] sm:max-w-[340px] rounded-[44px] border-[7px] border-neutral-900 bg-black p-3 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5),0_0_40px_rgba(16,185,129,0.2)] transition-transform duration-300 ease-out will-change-transform my-6"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-neutral-950 z-30 border border-neutral-800 flex items-center justify-end px-2">
                <div className="size-2 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
              </div>

              {/* Inner Phone Screen */}
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[34px] bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 flex flex-col justify-between p-4 shadow-inner">
                {/* Dynamic Video Gradient Backdrop */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 opacity-40 bg-gradient-to-br ${selectedStyle.bgGrad} transition-all duration-500`}
                />

                {/* Top Waveform Audio Bar Pill */}
                <div className="relative z-20 flex items-center justify-between gap-2 pt-5">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current ml-0.5" />}
                  </button>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 backdrop-blur-md">
                    <span className="flex size-1.5 rounded-full bg-red-500 animate-ping" />
                    <div className="flex items-center gap-0.5 h-3 ml-1">
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

                {/* Center Live Caption Renderer */}
                <div className="relative z-20 my-auto text-left py-4 max-w-[85%]">
                  <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-2 text-2xl font-black tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                    {selectedPhrase.words.map((word, idx) => {
                      const isActive = idx === activeWordIndex;
                      const isPast = idx <= activeWordIndex;
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
                <div className="relative z-20 text-left pb-2 pr-16">
                  <p className="text-xs font-bold text-white">@indiancreator</p>
                  <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                    Viral Hinglish reel made with CutXflow ⚡
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/60 mt-1">
                    <Music2 className="size-3" />
                    <span>Original Audio · {selectedPhrase.lang} Voice</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Speed & Try Style Controls (below phone) */}
            <div className="flex flex-wrap items-center justify-center gap-3 pb-4 pt-1">
              <div className="flex items-center gap-1.5 bg-card/60 dark:bg-card/40 border border-border/50 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
                <span className="text-muted-foreground">Speed:</span>
                <button
                  onClick={() => setPlaybackSpeed(playbackSpeed === 450 ? 300 : 450)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-colors ${
                    playbackSpeed === 300 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "border-border/50 text-foreground"
                  }`}
                >
                  {playbackSpeed === 300 ? "1.5x (Fast)" : "1.0x (Normal)"}
                </button>
              </div>

              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <Wand2 className="size-3.5 text-emerald-500" />
                <span>Use This Style</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Bottom Style Bar: Live Caption Style Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="size-3.5 text-emerald-500" />
                Switch Kinetic Motion Engine:
              </span>

              <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                {DEMO_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      selectedStyle.id === style.id
                        ? "bg-foreground text-background shadow-lg ring-2 ring-emerald-500"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{style.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">({style.tag})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
