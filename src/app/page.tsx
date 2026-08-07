import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  Languages,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { CAPTION_TEMPLATES } from "@/core";
import { MarketingPage } from "@/components/marketing/SiteChrome";
import { FAQS } from "./legal-content";

export const metadata: Metadata = {
  title: "Bolo — AI captions for Hindi & Hinglish reels",
  description:
    "Animated word-level captions for Reels and Shorts, built for Hindi and Hinglish. Your video never leaves your browser.",
};

const FEATURES = [
  {
    icon: Languages,
    title: "Hindi & Hinglish, properly",
    body: "Code-mixed speech transcribed accurately, and every font falls back to Noto Sans Devanagari so Hindi never renders as empty boxes.",
  },
  {
    icon: ShieldCheck,
    title: "Your video never uploads",
    body: "Audio is extracted on your own device and only that is sent — a few hundred KB. Rendering and export run locally too.",
  },
  {
    icon: MousePointerClick,
    title: "Edit every single word",
    body: "Fix text, drag timing against a waveform, recolour a word, split lines, and place captions anywhere on the frame.",
  },
  {
    icon: Sparkles,
    title: `${CAPTION_TEMPLATES.length} templates`,
    body: "Trending, bold, neon, highlight, clean and festive presets — or save your own and reuse it across every video.",
  },
];

const STEPS = [
  { n: "1", t: "Drop your video", d: "MP4, MOV, WebM and more. Up to 2GB." },
  { n: "2", t: "Captions appear", d: "Word-level timing in seconds." },
  { n: "3", t: "Edit and style", d: "Fix any word, pick a template." },
  { n: "4", t: "Export MP4", d: "Rendered on your device, ready to post." },
];

export default function LandingPage() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, var(--brand-soft) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-brand" />
            Built for Indian creators
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Captions that actually get Hinglish right
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Animated word-level captions for Reels and Shorts. Upload a video,
            get accurate Hindi and Hinglish captions, edit every word, and export
            — all without your video ever leaving your browser.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              <Wand2 className="size-4" />
              Try free
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              See pricing
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No card needed · Free exports carry a small watermark
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card/50 p-6">
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-brand-soft">
                <Icon className="size-4 text-brand" />
              </div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-card/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Four steps, about a minute
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="space-y-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                  {step.n}
                </span>
                <h3 className="text-sm font-medium">{step.t}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          15 Indian languages, 36 more worldwide
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          हिन्दी · বাংলা · தமிழ் · తెలుగు · मराठी · ગુજરાતી · ಕನ್ನಡ · മലയാളം ·
          ਪੰਜਾਬੀ · ଓଡ଼ିଆ · অসমীয়া · اردو · नेपाली · සිංහල · سنڌي
        </p>
      </section>

      {/* FAQ preview */}
      <section className="border-t bg-card/30">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Questions people ask
          </h2>
          <div className="mt-6 space-y-3">
            {FAQS.slice(0, 4).map((item) => (
              <div key={item.q} className="rounded-xl border bg-card/60 p-4">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {item.q}
                </p>
                <p className="mt-2 pl-5.5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/faq"
            className="mt-5 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Read all questions
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          Caption your next reel in a minute
        </h2>
        <Link
          href="/create"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          <Wand2 className="size-4" />
          Start free
        </Link>
      </section>
    </MarketingPage>
  );
}
