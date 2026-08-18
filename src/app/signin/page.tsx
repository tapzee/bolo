import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Bolo to keep your caption projects across devices.",
};

import Image from "next/image";

function Wordmark() {
  return (
    <Link href="/" className="mx-auto flex w-fit items-center gap-3 transition-transform hover:scale-105">
      <div className="relative size-12 overflow-hidden rounded-2xl shadow-lg shadow-brand/20 border border-brand/30">
        <Image
          src="/logo.png"
          alt="Desi Auto-Caption Logo"
          fill
          sizes="48px"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-foreground">
          Desi
        </span>
        <span className="text-2xl font-medium tracking-tight text-foreground">
          Auto-Caption
        </span>
      </div>
    </Link>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm space-y-8">
          <Wordmark />
          {/* SignInForm reads the redirect target from the URL on the client,
              so it needs a Suspense boundary to prerender. */}
          <Suspense
            fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
          >
            <SignInForm />
          </Suspense>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-sm items-center justify-center gap-4 px-5 py-5 text-[11px] text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/help" className="hover:text-foreground">
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
}
