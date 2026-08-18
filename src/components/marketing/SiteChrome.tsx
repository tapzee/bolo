"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Menu, X, ArrowRight, Wand2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/create", label: "Create" },
  { href: "/styles", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

const PRODUCT = [
  { href: "/create", label: "Video Studio" },
  { href: "/styles", label: "Caption Templates" },
  { href: "/pricing", label: "Pricing Plans" },
  { href: "/faq", label: "Supported Languages" },
];

const COMPANY = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Support" },
  { href: "/help", label: "Help Center" },
  { href: "/faq", label: "FAQ" },
];

/**
 * Legal pages are linked from every page footer on purpose.
 *
 * Payment gateways check that Terms, Privacy, Refund/Cancellation and Contact
 * are reachable from anywhere on the site — a policy that only exists at a
 * direct URL is a common reason merchant onboarding is rejected.
 */
const LEGAL = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/delivery", label: "Delivery Policy" },
];

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
      <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-md shadow-orange-500/20">
        <span className="block size-2.5 rounded-[3px] bg-white" />
        <span className="absolute -bottom-0.5 left-1.5 size-2 rotate-45 rounded-[2px] bg-orange-600" />
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-extrabold tracking-tight text-foreground">
          bolo
        </span>
        <span className="rounded-full bg-brand-soft px-1.5 py-0.2 text-[10px] font-bold text-brand uppercase tracking-wider">
          AI
        </span>
      </div>
    </Link>
  );
}

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Wordmark />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA / Action Area */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/signin"
            className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/create"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition-all duration-200 hover:opacity-95 hover:shadow-lg hover:shadow-orange-500/35 active:scale-95"
          >
            <Sparkles className="size-3.5" />
            <span>Try free</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground md:hidden"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card/95 px-5 py-6 shadow-xl backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <span>{link.label}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
            <div className="my-2 h-px bg-border/60" />
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>Sign in</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-brand-foreground shadow-md"
            >
              <Wand2 className="size-4" />
              <span>Create Captions Free</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/80 bg-card/40 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand Column */}
        <div className="space-y-4 lg:col-span-2">
          <Wordmark />
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            The high-precision AI caption generator crafted for Indian creators.
            Flawless Hindi & Hinglish sync, 30+ viral templates, and 100% private in-browser video processing.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-inset px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              ⚡ 100% Client-Side Render
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-inset px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              🇮🇳 Made for Creators
            </span>
          </div>
        </div>

        {/* Product Links */}
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-foreground">
            Product
          </p>
          <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
            {PRODUCT.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-foreground">
            Company
          </p>
          <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
            {COMPANY.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-foreground">
            Legal
          </p>
          <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Bolo AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-brand selection:text-white">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

/** Shared shell for prose pages (legal, about, help). */
export function ContentPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <MarketingPage>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">{title}</h1>
        {updated ? (
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            Last updated: {updated}
          </p>
        ) : null}
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-2">
          {children}
        </div>
      </article>
    </MarketingPage>
  );
}
