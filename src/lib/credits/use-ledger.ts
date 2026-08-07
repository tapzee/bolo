"use client";

import { useEffect, useState } from "react";
import type { LedgerEntry, LedgerEntryKind } from "@/core";
import { firestoreDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";

/**
 * The signed-in account's credit history, newest first.
 *
 * Capped rather than paged. The list answers "where did my minutes go" and a
 * few dozen rows answer it completely; someone who genuinely needs their full
 * history is asking a support question, not a UI question, and paging would add
 * a control that almost nobody would ever press.
 */
export const LEDGER_PAGE_SIZE = 50;

export interface LedgerState {
  loading: boolean;
  entries: readonly LedgerEntry[];
  error: string | null;
}

const KINDS: readonly LedgerEntryKind[] = [
  "spend",
  "purchase",
  "adjustment",
  "signup",
];

const isKind = (value: unknown): value is LedgerEntryKind =>
  typeof value === "string" && KINDS.includes(value as LedgerEntryKind);

/**
 * Narrows a raw document, tolerating anything unexpected.
 *
 * Entries written by an older build are still in the collection and will be
 * forever — the ledger is append-only, so there is no migration that removes
 * them. A row this cannot read is dropped rather than rendered as `undefined`.
 */
const toEntry = (id: string, data: Record<string, unknown>): LedgerEntry | null => {
  if (!isKind(data.kind)) return null;
  if (typeof data.credits !== "number") return null;

  // `serverTimestamp()` resolves to null on the local echo of a write that has
  // not yet round-tripped. Falling back to now keeps the row in order rather
  // than sending it to 1970 at the bottom of the list.
  const at = data.at as { toMillis?: () => number } | null | undefined;
  const millis = typeof at?.toMillis === "function" ? at.toMillis() : Date.now();

  return {
    id,
    kind: data.kind,
    at: millis,
    credits: data.credits,
    balanceAfter:
      typeof data.balanceAfter === "number" ? data.balanceAfter : null,
    amountPaise: typeof data.amountPaise === "number" ? data.amountPaise : 0,
    note: typeof data.note === "string" ? data.note : null,
  };
};

export const useLedger = (): LedgerState => {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<readonly LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (user === null) {
      setEntries([]);
      setLoading(false);
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

      const { collection, limit, onSnapshot, orderBy, query } = await import(
        "firebase/firestore"
      );
      if (cancelled) return;

      // Subscribed rather than fetched once, so a transcription finishing in
      // another tab shows up here without a reload — the same reason the
      // balance itself is a subscription.
      unsubscribe = onSnapshot(
        query(
          collection(db, "users", user.uid, "ledger"),
          orderBy("at", "desc"),
          limit(LEDGER_PAGE_SIZE),
        ),
        (snap) => {
          setEntries(
            snap.docs
              .map((doc) => toEntry(doc.id, doc.data()))
              .filter((entry): entry is LedgerEntry => entry !== null),
          );
          setLoading(false);
          setError(null);
        },
        () => {
          setError("Couldn't load your history.");
          setLoading(false);
        },
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user, authLoading]);

  return { loading: authLoading || loading, entries, error };
};
