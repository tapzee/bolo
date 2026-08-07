"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { LogOut, Mail } from "lucide-react";
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
 * Sign-in control.
 *
 * Auth is deliberately optional. The whole flow — upload, transcribe, edit,
 * export — works signed out, with work kept in localStorage. Signing in adds
 * cloud-saved projects and a real credit balance. Gating the core product
 * behind a login would cost far more users than the saved projects are worth.
 */
export function AuthButton() {
  const {
    user,
    loading,
    configured,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    logout,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setOpen(false);
      setEmail("");
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!configured) return null;
  if (loading) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  }

  if (user !== null) {
    const label = user.displayName ?? user.email ?? "Account";
    const initial = label.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-2">
        <span
          title={label}
          className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground"
        >
          {initial}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          title="Sign out"
          className="text-muted-foreground"
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        Sign in
      </Button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full right-0 z-50 mt-2 w-72 space-y-3 rounded-xl border bg-popover p-4 shadow-lift"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {mode === "signin" ? "Sign in to Bolo" : "Create an account"}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Saves your projects and credits. Everything works without it too.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void run(signInWithGoogle)}
          >
            <GoogleMark />
            Continue with Google
          </Button>

          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] text-muted-foreground/60">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="password"
              value={password}
              placeholder="Password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || busy) return;
                void run(() =>
                  mode === "signin"
                    ? signInWithEmail(email, password)
                    : registerWithEmail(email, password),
                );
              }}
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error !== null ? (
            <p className="text-[11px] leading-relaxed text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={busy || email.length === 0 || password.length === 0}
            onClick={() =>
              void run(() =>
                mode === "signin"
                  ? signInWithEmail(email, password)
                  : registerWithEmail(email, password),
              )
            }
          >
            <Mail className="size-3.5" />
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode((v) => (v === "signin" ? "register" : "signin"));
              setError(null);
            }}
            className={cn(
              "w-full text-center text-[11px] text-muted-foreground",
              "underline-offset-4 hover:underline",
            )}
          >
            {mode === "signin"
              ? "No account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}
