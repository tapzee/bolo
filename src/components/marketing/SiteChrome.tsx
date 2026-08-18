"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Menu, X, ArrowRight, Wand2, ChevronRight } from "lucide-react";
import { CAPTION_TEMPLATES } from "@/core";

const NAV_LINKS = [
  { href: "/create", label: "Create" },
  { href: "/styles", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

const PRODUCT = [
  { href: "/create", label: "Video Studio" },
  { href: "/styles", label: "Caption Presets" },
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
      <div className="relative size-8 overflow-hidden rounded-xl shadow-md shadow-brand/20 border border-brand/30">
        <Image
          src="/logo.png"
          alt="Desi Auto-Caption Logo"
          fill
          sizes="32px"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-extrabold tracking-tight text-foreground">
          Desi
        </span>
        <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider border border-brand/20">
          <span className="size-1 rounded-full bg-brand animate-pulse" />
          Auto-Caption
        </span>
      </div>
    </Link>
  );
}

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setMobileMenuOpen(false);
      } else {
        setIsVisible(true);
      }
      
      setIsScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`fixed top-3 sm:top-5 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none transition-transform duration-500 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-24"}`}>
      <div className={`pointer-events-auto mx-auto max-w-5xl rounded-full border transition-all duration-500 flex items-center justify-between gap-4 ${
        isScrolled 
          ? "border-white/60 dark:border-white/10 bg-card/80 dark:bg-card/85 p-2 px-3 sm:px-5 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.12),0_0_24px_rgba(36,184,108,0.12)] backdrop-blur-2xl" 
          : "border-transparent bg-transparent p-3 px-3 sm:px-5 shadow-none"
      }`}>
        {/* Wordmark Logo */}
        <Wordmark />

        {/* Center Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-muted/50 p-1 border border-border/40">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-card hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link
            href="/signin"
            className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
          >
            Sign in
          </Link>

          <Link
            href="/create"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-brand via-brand-secondary to-brand bg-[length:200%_auto] px-4 sm:px-5 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(36,184,108,0.35)] transition-all duration-300 hover:bg-[position:right_center] hover:shadow-[0_6px_20px_rgba(36,184,108,0.5)] hover:scale-105 active:scale-95 border-t border-white/40"
          >
            {/* Shimmer light sheen */}
            <span className="absolute -inset-x-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 transition-all duration-1000 group-hover:translate-x-[400%]" />
            <Sparkles className="size-3.5" />
            <span>Try free</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground md:hidden transition-transform active:scale-95"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-sm rounded-3xl border border-white/60 dark:border-white/10 bg-card/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
            <div className="my-1.5 h-px bg-border/60" />
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>Sign in</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand via-brand-secondary to-brand py-3 text-xs font-bold text-white shadow-md shadow-brand/25"
            >
              <Wand2 className="size-3.5" />
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
            Flawless Hindi & Hinglish sync, {CAPTION_TEMPLATES.length}+ viral templates, and 100% private in-browser video processing.
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
          <span>© {new Date().getFullYear()} Desi Auto-Caption. All rights reserved.</span>
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
    <div className="min-h-dvh bg-background text-foreground selection:bg-brand selection:text-white pt-16 sm:pt-20">
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
