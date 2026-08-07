"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn } from "@/lib/utils";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-3l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.2a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l3.9-3.2Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l3.9 3a7.2 7.2 0 0 1 6.7-4.8Z"
      />
    </svg>
  );
}

/**
 * Full sign-in surface.
 *
 * A page rather than a dropdown: the previous sign-in lived in a header popover
 * that stopped being rendered when the app moved to a sidebar layout, leaving
 * no way to sign in at all. A route cannot silently disappear like that, and it
 * can be linked to, redirected to, and bookmarked.
 *
 * Auth stays optional — the whole upload → transcribe → edit → export flow works
 * signed out. This page says so, because a wall that looks mandatory when it is
 * not costs more users than the saved projects are worth.
 */
export function SignInForm({
  redirectTo: fallback = "/create",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // Only same-origin paths are honoured. Redirecting to an arbitrary `next`
  // value is an open-redirect: an attacker sends a link to our real sign-in
  // page and lands the user on their own site immediately after login.
  const requested = params.get("next");
  const redirectTo =
    requested !== null && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : fallback;

  const {
    user,
    loading,
    configured,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in — nothing to do here.
  useEffect(() => {
    if (!loading && user !== null) router.replace(redirectTo);
  }, [loading, user, router, redirectTo]);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await action();
        router.replace(redirectTo);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Something went wrong.",
        );
      } finally {
        setBusy(false);
      }
    },
    [router, redirectTo],
  );

  const submitEmail = useCallback(() => {
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }
    void run(() =>
      mode === "signin"
        ? signInWithEmail(email, password)
        : registerWithEmail(email, password),
    );
  }, [mode, email, password, run, signInWithEmail, registerWithEmail]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 size-5 text-warning" />
        <p className="text-sm font-medium">Sign-in isn&apos;t configured</p>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Firebase keys are missing on this deployment. Everything else still
          works — your projects are kept in this browser.
        </p>
        <Link
          href="/create"
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2 text-xs font-medium text-brand-foreground"
        >
          Continue without an account
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in to Bolo" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Keeps your projects and credits across devices.
        </p>
      </div>

      <Button
        variant="outline"
        className="h-11 w-full"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
      >
        <GoogleMark />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] tracking-wide text-muted-foreground/60 uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2.5">
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-xl border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="password"
            value={password}
            placeholder={
              mode === "register" ? "At least 6 characters" : "Password"
            }
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            disabled={busy}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitEmail();
            }}
            className="h-11 w-full rounded-xl border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {error !== null ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs leading-relaxed text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          {error}
        </p>
      ) : null}

      <Button
        className="h-11 w-full"
        disabled={busy || email.length === 0 || password.length === 0}
        onClick={submitEmail}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode((v) => (v === "signin" ? "register" : "signin"));
          setError(null);
        }}
        className={cn(
          "w-full text-center text-xs text-muted-foreground",
          "underline-offset-4 hover:text-foreground hover:underline",
        )}
      >
        {mode === "signin"
          ? "New to Bolo? Create an account"
          : "Already have an account? Sign in"}
      </button>

      <div className="space-y-3 border-t pt-5">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3 shrink-0 text-success" />
          Your video never leaves your browser, signed in or not. An account only
          stores captions and settings.
        </p>
        <Link
          href="/create"
          className="block text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Continue without an account
        </Link>
      </div>
    </div>
  );
}
