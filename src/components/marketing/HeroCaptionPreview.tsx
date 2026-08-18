"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Sparkles,
  Volume2,
  Sliders,
  Wand2,
} from "lucide-react";
import Link from "next/link";

interface SamplePhrase {
  id: string;
  label: string;
  lang: string;
  words: { text: string; highlight?: boolean; accent?: boolean }[];
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
      { text: "aapke", highlight: true },
      { text: "reels" },
      { text: "ko" },
      { text: "10X", highlight: true, accent: true },
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
      { text: "कंटेंट", highlight: true },
      { text: "बनाते" },
      { text: "हैं," },
      { text: "तो", highlight: true },
      { text: "यह" },
      { text: "सुनिए!" },
    ],
  },
  {
    id: "creator",
    label: "Creator Hook",
    lang: "Hinglish",
    words: [
      { text: "Stop" },
      { text: "scrolling" },
      { text: "bhai," },
      { text: "aaj", highlight: true },
      { text: "secret", highlight: true, accent: true },
      { text: "reveal" },
      { text: "hoga!" },
    ],
  },
];

interface DemoTemplate {
  id: string;
  name: string;
  category: string;
  badge?: string;
  renderWord: (
    word: { text: string; highlight?: boolean; accent?: boolean },
    isActive: boolean,
    isPast: boolean
  ) => React.ReactNode;
}

const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "dynamic",
    name: "Dynamic Glow",
    category: "Trending",
    badge: "Most Popular",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block transform scale-110 px-2.5 py-0.5 rounded-lg font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_24px_rgba(232,65,15,0.6)] transition-all duration-200"
            style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-bold transition-opacity duration-200 ${
            isPast ? "text-foreground opacity-90" : "text-muted-foreground opacity-40"
          }`}
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "editorial",
    name: "Editorial Serif",
    category: "Aesthetic",
    badge: "New",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block px-2.5 py-0.5 italic font-normal text-brand bg-brand-soft rounded-md underline decoration-brand/50 decoration-2 underline-offset-4 scale-105 transition-all duration-200"
            style={{ fontFamily: "var(--font-instrument-serif), var(--font-playfair), serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-medium transition-opacity duration-200 ${
            isPast ? "text-foreground opacity-95" : "text-muted-foreground opacity-35"
          }`}
          style={{ fontFamily: "var(--font-instrument-serif), var(--font-playfair), serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "neon",
    name: "Cyber Neon",
    category: "High Energy",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block px-2.5 py-0.5 rounded uppercase font-black text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-110 tracking-wider transition-all duration-200"
            style={{ fontFamily: "var(--font-anton), sans-serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 uppercase font-bold tracking-wider transition-opacity duration-200 ${
            isPast ? "text-foreground opacity-80" : "text-muted-foreground opacity-30"
          }`}
          style={{ fontFamily: "var(--font-anton), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
  {
    id: "dual",
    name: "Dual Line Pop",
    category: "Reels Viral",
    renderWord: (word, isActive, isPast) => {
      if (isActive) {
        return (
          <span
            key={word.text}
            className="inline-block px-2.5 py-0.5 rounded font-black text-black bg-amber-400 shadow-md scale-110 transition-all duration-200"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            {word.text}
          </span>
        );
      }
      return (
        <span
          key={word.text}
          className={`inline-block px-1 font-semibold transition-opacity duration-200 ${
            isPast ? "text-foreground opacity-85" : "text-muted-foreground opacity-40"
          }`}
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          {word.text}
        </span>
      );
    },
  },
];

export function HeroCaptionPreview() {
  const [selectedPhrase, setSelectedPhrase] = useState<SamplePhrase>(PHRASES[0]!);
  const [selectedTemplate, setSelectedTemplate] = useState<DemoTemplate>(DEMO_TEMPLATES[0]!);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const handlePhraseChange = (phrase: SamplePhrase) => {
    setSelectedPhrase(phrase);
    setActiveWordIndex(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
      {/* Glow aura behind stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-40 dark:opacity-60 blur-3xl transition-all duration-700"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--brand-soft) 0%, rgba(232, 65, 15, 0.05) 50%, transparent 80%)",
        }}
      />

      {/* Main interactive showcase card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 p-5 sm:p-8 shadow-2xl backdrop-blur-xl transition-all">
        {/* Top Control Bar: Audio visualizer pill + Phrase switcher */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Waveform pill badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
              className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Audio Waveform Pill (Inspired by reference design) */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-inset/80 px-3.5 py-1.5 shadow-inner">
              <Volume2 className="size-3.5 text-brand" />
              <div className="flex items-center gap-[3px] h-4">
                {[12, 24, 16, 28, 20, 14, 26, 18, 10, 22, 16].map((height, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-brand transition-all duration-200"
                    style={{
                      height: isPlaying ? `${Math.max(4, (height * ((i + activeWordIndex) % 4 + 1)) / 4)}px` : "4px",
                      opacity: isPlaying ? 0.9 : 0.4,
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium tracking-tight text-muted-foreground ml-1">
                {isPlaying ? "Syncing speech..." : "Paused"}
              </span>
            </div>
          </div>

          {/* Phrase select chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline-block">
              Sample:
            </span>
            {PHRASES.map((phrase) => {
              const active = selectedPhrase.id === phrase.id;
              return (
                <button
                  key={phrase.id}
                  onClick={() => handlePhraseChange(phrase)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {phrase.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Stage: Simulated Video Frame with Active Captions */}
        <div className="relative my-6 flex min-h-[220px] sm:min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/30 via-background to-card/60 p-6 text-center shadow-inner">
          {/* Subtle grid pattern background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(var(--foreground) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Floating dynamic speech ribbon tape (Inspired by reference design) */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-md">
            <Sparkles className="size-2.5 text-brand" />
            <span>AI Hinglish Speech-to-Word</span>
          </div>

          {/* Active Live Caption Display */}
          <div className="relative z-10 mx-auto max-w-2xl px-2 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {selectedPhrase.words.map((word, index) => {
                const isActive = index === activeWordIndex;
                const isPast = index <= activeWordIndex;
                return selectedTemplate.renderWord(word, isActive, isPast);
              })}
            </div>
          </div>

          {/* Progress bar tracker */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-border/40">
            <div
              className="h-full bg-brand transition-all duration-200"
              style={{
                width: `${((activeWordIndex + 1) / selectedPhrase.words.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Bottom Style Switcher Strip */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Style:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DEMO_TEMPLATES.map((tmpl) => {
              const active = selectedTemplate.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`group relative flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "border-brand bg-brand-soft text-brand shadow-sm font-semibold"
                      : "border-border/80 bg-card/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <span>{tmpl.name}</span>
                  {tmpl.badge && (
                    <span className="rounded-md bg-brand/15 px-1.5 py-0.2 text-[9px] font-semibold text-brand">
                      {tmpl.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Link
            href="/create"
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-md transition-all hover:opacity-90 sm:mt-0"
          >
            <Wand2 className="size-3.5" />
            Try with your video
          </Link>
        </div>
      </div>
    </div>
  );
}
