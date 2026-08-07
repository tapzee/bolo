"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

/**
 * Gates a surface behind sign-in.
 *
 * THIS IS NOT THE SECURITY BOUNDARY. Anyone can POST directly at
 * `/api/transcribe`, so that route independently rejects unauthenticated
 * callers — which is what actually protects the API spend. This component
 * exists so a signed-out person gets a clear prompt instead of uploading a
 * video, waiting through extraction, and only then hitting a 401.
 *
 * When Firebase is not configured at all, the gate opens rather than locking
 * everyone out of a self-hosted deployment that never intended to use auth.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();

  if (!configured) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user !== null) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft">
          <LogIn className="size-5 text-brand" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to add captions
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            An account keeps your projects and tracks your transcription
            credits.
          </p>
        </div>

        <Link
          href={`/signin?next=${encodeURIComponent(pathname)}`}
          className="block rounded-xl bg-brand py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          Sign in or create an account
        </Link>

        <p className="flex items-start justify-center gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3 shrink-0 text-success" />
          Your video still never leaves your browser. Only the extracted audio is
          sent for transcription.
        </p>
      </div>
    </div>
  );
}
