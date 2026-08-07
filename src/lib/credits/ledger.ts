import "server-only";

import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import type { LedgerEntryKind } from "@/core";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Writes to the per-user credit history at `users/{uid}/ledger`.
 *
 * Server-only, and the security rules make that stick — the subcollection is
 * readable by its owner and writable by nobody. A history a client could append
 * to would be worth less than no history at all, because it would look
 * authoritative while being forgeable.
 *
 * Every write is best-effort in the sense that a failure is logged and
 * swallowed rather than propagated: the balance itself lives on the user
 * document and is the thing that must be correct. Losing a history row is bad;
 * failing a transcription the user has already been charged for, to record that
 * they were charged, is worse.
 */

export interface LedgerWrite {
  uid: string;
  kind: LedgerEntryKind;
  /** Signed — negative for a spend, positive for anything granted. */
  credits: number;
  balanceAfter: number | null;
  amountPaise?: number;
  note?: string | null;
}

const payload = (entry: LedgerWrite) => ({
  kind: entry.kind,
  credits: Math.trunc(entry.credits),
  balanceAfter: entry.balanceAfter,
  amountPaise: Math.max(0, Math.trunc(entry.amountPaise ?? 0)),
  note: entry.note?.slice(0, 300) ?? null,
  at: FieldValue.serverTimestamp(),
});

const entryRef = (db: Firestore, uid: string) =>
  db.collection("users").doc(uid).collection("ledger").doc();

/** Appends one entry. Never throws. */
export const recordLedgerEntry = async (entry: LedgerWrite): Promise<void> => {
  const db = adminDb();
  if (db === null) return;

  try {
    await entryRef(db, entry.uid).set(payload(entry));
  } catch (error) {
    console.warn("[ledger] write failed", { uid: entry.uid, error });
  }
};

/**
 * Appends one entry inside a caller's transaction.
 *
 * Used where the balance change is itself transactional — an admin adjustment —
 * so the history row and the balance it describes commit together or not at
 * all. A row written outside the transaction can survive a rollback and claim a
 * grant that never landed.
 */
export const recordLedgerEntryIn = (
  tx: Transaction,
  db: Firestore,
  entry: LedgerWrite,
): void => {
  tx.set(entryRef(db, entry.uid), payload(entry));
};
