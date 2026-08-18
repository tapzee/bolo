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
} from "lucide-react";
import { CAPTION_TEMPLATES } from "@/core";
import { MarketingPage } from "@/components/marketing/SiteChrome";
import { Hero3DSection } from "@/components/marketing/Hero3DSection";
import { LanguageShowcase } from "@/components/marketing/LanguageShowcase";
import { TemplatesShowcase } from "@/components/marketing/TemplatesShowcase";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export const metadata: Metadata = {
  title: "Bolo — AI captions for Hindi & Hinglish reels",
  description:
    "Animated word-level captions for Reels and Shorts, built specifically for Hindi and Hinglish. Your video never leaves your browser.",
};

const PILLARS = [
  {
    icon: Languages,
    badge: "Accurate Transcription",
    title: "Hindi & Hinglish, perfectly synced",
    body: "Tuned specifically for code-mixed speech, slang, and Indian accents. Every font falls back cleanly to Noto Sans Devanagari so Hindi never renders as broken tofu boxes.",
  },
  {
    icon: ShieldCheck,
    badge: "100% Private",
    title: "Your video never leaves your browser",
    body: "Audio is extracted locally on your device and only a tiny audio snippet is sent for transcription. Your high-res video files remain completely private.",
  },
  {
    icon: MousePointerClick,
    badge: "Precision Editor",
    title: "Edit every word & drag timing",
    body: "Fix any word with one click, drag timestamps against the audio waveform, recolour individual accent words, adjust font size, stroke widths, and neon glow.",
  },
  {
    icon: Zap,
    badge: "Hardware Accelerated",
    title: "Instant WebCodecs export",
    body: "Render crisp 1080p and 4K MP4s right on your device's GPU with WebCodecs. No cloud queues, no server upload delays, and zero rendering lag.",
  },
];

const WORKFLOW_STEPS = [
  {
    n: "01",
    icon: Video,
    title: "Drop your video",
    desc: "Import MP4, MOV, WebM or MKV up to 2GB directly in your browser.",
  },
  {
    n: "02",
    icon: Cpu,
    title: "AI word-level sync",
    desc: "Speech is recognized with exact millisecond timestamps per word.",
  },
  {
    n: "03",
    icon: SlidersHorizontal,
    title: "Style & customize",
    desc: `Choose from ${CAPTION_TEMPLATES.length}+ viral templates, customize fonts, glow, and colors.`,
  },
  {
    n: "04",
    icon: Wand2,
    title: "Export MP4 instantly",
    desc: "Hardware-accelerated rendering on your device, ready to post on Instagram & Shorts.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Bolo is the first caption tool that actually understands Hinglish properly. I don't have to spend 20 minutes manually fixing Devanagari spellings anymore.",
    name: "Aman Sharma",
    role: "Tech Creator · 240K Followers",
    metric: "Saved 45 min per reel",
  },
  {
    quote:
      "The fact that my 4K video never uploads to any server is insane. It generates captions in 5 seconds and exports directly in 1080p 60fps.",
    name: "Priya Varma",
    role: "Finance & Lifestyle Creator",
    metric: "10x faster workflow",
  },
  {
    quote:
      "The 'Design Walla' and 'Neon Glow' templates made my Reels engagement jump by 3x. The captions look exactly like top viral creators.",
    name: "Rohan Mehta",
    role: "Comedy & Vlogs",
    metric: "3.2x higher watch time",
  },
];

export default function LandingPage() {
  return (
    <MarketingPage>
      {/* 1. 3D Masterpiece Hero Section */}
      <Hero3DSection />

      {/* 2. Numbers / Key Highlights Bar */}
      <section className="border-y border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            <div className="space-y-1">
              <p className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary sm:text-4xl">
                15+
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Indian Languages
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary sm:text-4xl">
                0 MB
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Server Video Uploads
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary sm:text-4xl">
                {CAPTION_TEMPLATES.length}+
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reel Templates
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary sm:text-4xl">
                60 FPS
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Full HD WebCodecs Export
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Pillars / Features Grid */}
      <section className="relative mx-auto max-w-6xl px-5 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            <Flame className="size-3.5" />
            Built for High-Growth Creators
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for viral video captions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Bolo handles speech nuances, multi-language transliteration, and GPU-powered video export seamlessly in your browser.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, badge, title, body }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-brand/40 hover:shadow-xl hover:bg-card/90"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-6" />
                </div>
                <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Interactive Language Showcase */}
      <div className="border-t border-border/60 bg-card/20">
        <LanguageShowcase />
      </div>

      {/* 6. How it Works (Visual 4-Step Timeline) */}
      <section className="border-y border-border/60 bg-card/40 backdrop-blur-sm py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <Layers className="size-3.5" />
              Effortless Workflow
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From raw video to captioned reel in 4 steps
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              No complex timelines, no bloated cloud render queues. Quick, clean, and intuitive.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="relative rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm flex flex-col justify-between transition-all hover:border-brand/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-black text-brand bg-brand-soft px-2.5 py-1 rounded-lg">
                        {step.n}
                      </span>
                      <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Trending Caption Templates Gallery */}
      <TemplatesShowcase />

      {/* 8. Creator Testimonials / Social Proof */}
      <section className="border-t border-border/60 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <Star className="size-3.5 fill-brand" />
              Creator Loved
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Trusted by creators making viral reels daily
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              See how Indian creators are saving hours every week while boosting their video engagement.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {t.role}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                    {t.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Interactive FAQ Section */}
      <div className="border-t border-border/60">
        <FaqAccordion />
      </div>

      {/* 10. Bottom High-Converting Call to Action */}
      <section className="relative mx-auto max-w-5xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-card via-card to-brand-soft/60 p-8 sm:p-14 text-center shadow-2xl">
          {/* Subtle decorative circles */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-brand/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-amber-500/10 blur-3xl"
          />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles className="size-3.5" />
            Get Started in Seconds
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground text-balance">
            Caption your next viral reel{" "}
            <span className="italic font-serif font-normal text-brand">
              in under a minute.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Join thousands of creators using Bolo to turn spoken audio into eye-catching animated captions. 100% free to try.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:opacity-95 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95"
            >
              <Wand2 className="size-4" />
              <span>Create captions free</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground font-medium">
            No signup required · Works directly in your browser
          </p>
        </div>
      </section>
    </MarketingPage>
  );
}
