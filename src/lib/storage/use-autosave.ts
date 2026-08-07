"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { storeForUser } from "@/lib/firebase/project-store";
import type { ProjectSnapshot } from "./project-store";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;

/**
 * Debounced autosave.
 *
 * Debounced rather than throttled because the meaningful unit is "the user
 * stopped changing things" — dragging a word edge fires dozens of updates a
 * second, and every intermediate position is worthless to persist.
 *
 * The snapshot is held in a ref and read at flush time, so a change arriving
 * mid-timer does not need to restart anything and the latest value always wins.
 */
export const useAutosave = (
  snapshot: ProjectSnapshot | null,
  enabled: boolean,
): { status: SaveStatus; savedAt: number | null; error: string | null } => {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Firestore once signed in, localStorage otherwise. Signing in mid-session
  // moves subsequent saves to the cloud without interrupting the edit.
  const { user } = useAuth();
  const store = useMemo(() => storeForUser(user?.uid ?? null), [user?.uid]);

  const latest = useRef<ProjectSnapshot | null>(snapshot);
  latest.current = snapshot;

  // Serialised once per change so the effect can skip identical writes — the
  // parent rebuilds the snapshot object on every render, so identity alone
  // would retrigger the timer forever.
  const fingerprint =
    snapshot === null || !enabled
      ? null
      : JSON.stringify({
          w: snapshot.words,
          s: snapshot.styleConfig,
          t: snapshot.title,
        });

  useEffect(() => {
    if (fingerprint === null) return;

    setStatus("pending");
    const timer = setTimeout(() => {
      const current = latest.current;
      if (current === null) return;

      setStatus("saving");
      store
        .save({ ...current, updatedAt: Date.now() })
        .then(() => {
          setStatus("saved");
          setSavedAt(Date.now());
          setError(null);
        })
        .catch((cause: unknown) => {
          setStatus("error");
          setError(
            cause instanceof Error ? cause.message : "Couldn't autosave.",
          );
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [fingerprint, store]);

  return { status, savedAt, error };
};
