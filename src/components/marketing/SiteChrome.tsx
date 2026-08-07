import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const PRODUCT = [
  { href: "/create", label: "Create" },
  { href: "/pricing", label: "Pricing" },
  { href: "/styles", label: "Templates" },
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/help", label: "Help" },
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
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refunds" },
  { href: "/delivery", label: "Delivery" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative flex size-7 items-center justify-center rounded-lg bg-brand">
        <span className="block size-2.5 rounded-[3px] bg-brand-foreground" />
        <span className="absolute -bottom-0.5 left-1.5 size-2 rotate-45 rounded-[2px] bg-brand" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">bolo</span>
    </Link>
  );
}

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <Wordmark />
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
          {PRODUCT.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/signin"
            className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/create"
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            Try free
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Word-level animated captions for Hindi and Hinglish reels. Your video
            never leaves your browser.
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide uppercase">
            Product
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {PRODUCT.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide uppercase">
            Company
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {COMPANY.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide uppercase">
            Legal
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bolo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
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
      <article className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {updated ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Last updated: {updated}
          </p>
        ) : null}
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-2">
          {children}
        </div>
      </article>
    </MarketingPage>
  );
}
