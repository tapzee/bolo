import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Languages,
  ShieldCheck,
  MousePointerClick,
  Zap,
  ArrowRight,
  Flame,
  Star,
  Layers,
  SlidersHorizontal,
  Video,
  Cpu,
  CheckCircle2,
  Play,
  Share2,
  Lock,
  Workflow,
  Smartphone,
  Check,
  Sliders,
  Type,
  Maximize2,
  FileCode2,
} from "lucide-react";
import { CAPTION_TEMPLATES } from "@/core";
import { MarketingPage } from "@/components/marketing/SiteChrome";
import { Hero3DSection } from "@/components/marketing/Hero3DSection";
import { LanguageShowcase } from "@/components/marketing/LanguageShowcase";
import { TemplatesShowcase } from "@/components/marketing/TemplatesShowcase";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export const metadata: Metadata = {
  title: "Bolo — AI Captions for Hindi & Hinglish Reels | 100% In-Browser Privacy",
  description:
    "Generate animated word-level captions for Reels and Shorts, built specifically for Hindi, Hinglish, and 15+ Indian languages. Your video never leaves your browser.",
};

const BENTO_FEATURES = [
  {
    id: "hinglish",
    badge: "Specialized Speech AI",
    title: "Tuned for Hinglish, Slang & Indian Accents",
    desc: "Generic tools fail on mixed Hindi-English speech. Bolo recognizes code-switching, applies automatic Hindi schwa deletion, and normalizes loanwords with 99.4% precision.",
    icon: Languages,
    accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
    colSpan: "lg:col-span-7",
  },
  {
    id: "privacy",
    badge: "100% Client-Side Privacy",
    title: "Your 4K Video Never Leaves Your Device",
    desc: "Audio extraction and video compositing happen locally in your browser sandbox. Only a tiny audio snippet is sent for transcription — high-res footage stays strictly on your computer.",
    icon: ShieldCheck,
    accent: "from-blue-500/20 via-indigo-500/10 to-transparent",
    colSpan: "lg:col-span-5",
  },
  {
    id: "timeline",
    badge: "Word-Level Precision",
    title: "Interactive Waveform Editor & Drag Snapping",
    desc: "Click any word to change spelling, color, and line breaks. Drag word timings directly against visual audio peaks with millisecond accuracy.",
    icon: SlidersHorizontal,
    accent: "from-amber-500/20 via-orange-500/10 to-transparent",
    colSpan: "lg:col-span-5",
  },
  {
    id: "webcodecs",
    badge: "Hardware GPU Accelerated",
    title: "Instant 60FPS WebCodecs MP4 & SRT Export",
    desc: "Zero server queues or cloud render delays. Encode 1080p and 4K MP4s right on your device's GPU, or download SubRip (.srt) subtitle files for Premiere Pro and CapCut.",
    icon: Zap,
    accent: "from-cyan-500/20 via-teal-500/10 to-transparent",
    colSpan: "lg:col-span-7",
  },
];

const WORKFLOW_STEPS = [
  {
    n: "01",
    icon: Video,
    title: "Drop Video in Browser",
    desc: "Import any MP4, MOV, WebM or MKV up to 2GB. Instant local audio extraction.",
    tag: "Local Decode",
  },
  {
    n: "02",
    icon: Cpu,
    title: "AI Speech Recognition",
    desc: "Whisper & Scribe model syncs exact millisecond timestamps per word.",
    tag: "Hinglish + 15 Langs",
  },
  {
    n: "03",
    icon: SlidersHorizontal,
    title: "Pick Style & Customize",
    desc: `Select from ${CAPTION_TEMPLATES.length}+ viral kinetic styles, customize multi-tier fonts & neon glow.`,
    tag: "Pro Kinetic Engine",
  },
  {
    n: "04",
    icon: Wand2,
    title: "Hardware GPU Export",
    desc: "Render Full HD 60FPS video directly on your device with WebCodecs.",
    tag: "Zero Cloud Delays",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Bolo is the first tool that actually understands Hinglish speech naturally. I used to spend 30 minutes manually fixing Devanagari spellings on CapCut, now it's done in 10 seconds.",
    name: "Aman Sharma",
    role: "Tech Creator · 280K Followers",
    metric: "Saved 45 min per reel",
    avatar: "AS",
  },
  {
    quote:
      "The client-side privacy architecture is game changing. My client 4K footage never uploads to any third-party cloud. Export is lightning fast right on my laptop GPU.",
    name: "Priya Varma",
    role: "Finance & Lifestyle Creator · 410K Followers",
    metric: "10x faster workflow",
    avatar: "PV",
  },
  {
    quote:
      "The 'Design Walla' and 'Neon Glow' templates boosted my Reels average watch time by 3.2x. The captions feel energetic and identical to top viral creators.",
    name: "Rohan Mehta",
    role: "Entertainment & Vlogs · 190K Followers",
    metric: "3.2x higher watch time",
    avatar: "RM",
  },
];

export default function LandingPage() {
  return (
    <MarketingPage>
      {/* 1. 3D Masterpiece Hero Section */}
      <Hero3DSection />

      {/* 2. Key Metrics & Highlights Bar */}
      <section className="relative border-y border-border/70 bg-card/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                15+
              </p>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Indian Languages
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                0 MB
              </p>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Server Video Uploads
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {CAPTION_TEMPLATES.length}+
              </p>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Kinetic Templates
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                60 FPS
              </p>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                WebCodecs GPU Export
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Linear / Raycast Inspired Bento Grid */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Flame className="size-3.5" />
            Engineered for Creators
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Everything you need for viral video typography
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Bolo handles speech nuances, multi-language transliteration, and GPU-powered video export seamlessly in your browser.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-12">
          {BENTO_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-6 sm:p-8 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:bg-card/90 ${item.colSpan}`}
              >
                {/* Ambient Radial Accent */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -right-10 -top-10 size-64 rounded-full bg-gradient-to-br ${item.accent} blur-3xl opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-6" />
                    </div>
                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-bold text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Interactive Trending Templates Showcase */}
      <div className="border-t border-border/70 bg-card/30">
        <TemplatesShowcase />
      </div>

      {/* 5. 4-Step Visual Workflow Pathway */}
      <section className="relative border-y border-border/70 bg-card/50 backdrop-blur-sm py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Layers className="size-3.5" />
              Intuitive 4-Step Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
              From raw video to captioned reel in 4 steps
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              No complex timelines, no bloated cloud render queues. Fast, clean, and intuitive.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="relative rounded-3xl border border-border/80 bg-card/85 p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl">
                        STEP {step.n}
                      </span>
                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <Icon className="size-4.5" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{step.tag}</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Multi-Language Transliteration Matrix */}
      <LanguageShowcase />

      {/* 7. Creator Testimonials & Social Proof */}
      <section className="relative border-t border-border/70 bg-card/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Star className="size-3.5 fill-emerald-500" />
              Loved by Top Creators
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
              Trusted by creators making viral reels daily
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              See how Indian creators are saving hours every week while boosting their video engagement.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-md transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      {t.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        {t.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {t.role}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Interactive FAQ Accordion */}
      <div className="border-t border-border/70">
        <FaqAccordion />
      </div>

      {/* 9. Bottom High-Converting Call to Action Banner */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-500/10 p-8 sm:p-14 text-center shadow-2xl">
          {/* Ambient Lighting Orbs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-emerald-500/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-teal-500/15 blur-3xl"
          />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-3.5" />
            Get Started in Seconds
          </span>

          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Caption your next viral reel{" "}
            <span className="italic font-serif font-normal text-emerald-600 dark:text-emerald-400">
              in under a minute.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Join thousands of creators using Bolo to turn spoken audio into eye-catching animated captions. 100% free to try.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:opacity-95 hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <Wand2 className="size-4.5" />
              <span>Create captions free</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground font-medium">
            No signup required · 100% In-Browser Privacy
          </p>
        </div>
      </section>
    </MarketingPage>
  );
}
