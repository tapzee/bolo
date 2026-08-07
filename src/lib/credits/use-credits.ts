"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PLAN_MONTHLY_CREDITS,
  effectiveEntitlements,
  secondsForCredits,
  type Entitlements,
  type Pass,
  type Plan,
} from "@/core";
import { firestoreDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";

export interface CreditsState {
  loading: boolean;
  plan: Plan;
  creditsRemaining: number;
  /** Allowance for the plan, so the UI can show progress rather than a number. */
  monthlyCredits: number;
  /**
   * Transcription time left, in seconds. Deliberately not pre-rounded to
   * minutes — one credit is only 12 seconds, so whole minutes cannot represent
   * a balance honestly. Format at the call site with `formatAllowance`.
   */
  secondsRemaining: number;
  /**
   * What this account can do — watermark, resolution, fonts, plugin.
   *
   * Display only, exactly like the balance above. Every one of these is also
   * checked where it actually matters (the export path, the API route); a
   * client that could assert its own entitlements could unlock the paid tiers
   * from a console.
   */
  entitlements: Entitlements;
  /** The active pass, or null. Exposed so Settings can show when it expires. */
  pass: Pass | null;
  /** Lifetime transcription count and seconds, as recorded by the server. */
  totalTranscriptions: number;
  totalSecondsTranscribed: number;
  error: string | null;
  refresh: () => void;
}

/** Reads a stored pass, tolerating a document written before passes existed. */
const readPass = (raw: unknown): Pass | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const value = raw as { tier?: unknown; expiresAt?: unknown };
  return value.tier === "week" && typeof value.expiresAt === "number"
    ? { tier: "week", expiresAt: value.expiresAt }
    : null;
};

/**
 * Live credit balance, read from Firestore.
 *
 * Subscribed rather than fetched once: the server deducts credits inside a
 * transaction when a transcription completes, so a one-shot read would show a
 * stale balance immediately after the user's own upload finishes.
 *
 * This is display only. The balance that governs whether a transcription may
 * run is read and decremented server-side — a client that could assert its own
 * balance could mint free transcription.
 */
export const useCredits = (): CreditsState => {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [pass, setPass] = useState<Pass | null>(null);
  const [credits, setCredits] = useState(0);
  const [usage, setUsage] = useState({ transcriptions: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (authLoading) return;

    if (user === null) {
      setLoading(false);
      setCredits(0);
      setPass(null);
      setUsage({ transcriptions: 0, seconds: 0 });
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      const db = await firestoreDb();
      if (db === null || cancelled) {
        setLoading(false);
        return;
      }

      const { doc, onSnapshot } = await import("firebase/firestore");
      if (cancelled) return;

      unsubscribe = onSnapshot(
        doc(db, "users", user.uid),
        (snap) => {
          const data = snap.data();
          setPlan(
            typeof data?.plan === "string" ? (data.plan as Plan) : "free",
          );
          setPass(readPass(data?.pass));
          // A missing document means the server has not seen this user yet.
          // Showing the free allowance matches what they will actually get on
          // their first transcription, when the document is created.
          setCredits(
            typeof data?.creditsRemaining === "number"
              ? data.creditsRemaining
              : PLAN_MONTHLY_CREDITS.free,
          );
          setUsage({
            transcriptions:
              typeof data?.totalTranscriptions === "number"
                ? data.totalTranscriptions
                : 0,
            seconds:
              typeof data?.totalSecondsTranscribed === "number"
                ? data.totalSecondsTranscribed
                : 0,
          });
          setLoading(false);
          setError(null);
        },
        () => {
          // Almost always a security-rules denial. Surfaced rather than
          // swallowed, because silently showing 0 credits looks like the
          // account was drained.
          setError("Couldn't read your credit balance.");
          setLoading(false);
        },
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user, authLoading, nonce]);

  return {
    loading: authLoading || loading,
    plan,
    creditsRemaining: credits,
    monthlyCredits: PLAN_MONTHLY_CREDITS[plan],
    secondsRemaining: secondsForCredits(credits),
    // Recomputed every render rather than memoised: the only input that moves
    // on its own is the clock, and a memo keyed on `pass` would keep reporting
    // a pass as live for as long as the component stayed mounted past expiry.
    entitlements: effectiveEntitlements(plan, pass, Date.now()),
    pass,
    totalTranscriptions: usage.transcriptions,
    totalSecondsTranscribed: usage.seconds,
    error,
    refresh,
  };
};
