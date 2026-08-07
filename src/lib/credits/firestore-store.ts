import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { PLAN_MONTHLY_CREDITS, type Plan } from "@/core";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { InsufficientCreditsError, type CreditStore } from "./store";
import { recordLedgerEntry } from "./ledger";

/**
 * Firestore-backed credit ledger.
 *
 * This is the real implementation the in-memory placeholder was designed
 * against. Two properties matter and neither is optional:
 *
 * 1. It runs through the Admin SDK on the server, so a client can never write
 *    its own balance. Security rules additionally make the `users/{uid}` credit
 *    fields read-only from the browser.
 *
 * 2. The deduction happens inside a Firestore transaction. Without one, two
 *    concurrent exports on the same account both read the old balance and both
 *    write `balance - n`, and the user gets a free transcription every time
 *    they double-click. A transaction makes the read-modify-write atomic.
 */
export class FirestoreCreditStore implements CreditStore {
  private ref(userId: string) {
    const db = adminDb();
    if (db === null) throw new Error("Firebase Admin is not configured.");
    return db.collection("users").doc(userId);
  }

  async getBalance(userId: string): Promise<number> {
    const snap = await this.ref(userId).get();

    if (!snap.exists) {
      // First sight of this user — seed the free allowance.
      const plan: Plan = "free";
      const credits = PLAN_MONTHLY_CREDITS[plan];
      await this.ref(userId).set(
        {
          plan,
          creditsRemaining: credits,
          creditsResetAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // Opens the user's history with the grant that put the credits there, so
      // the first thing they see in Settings explains the balance rather than
      // presenting it as having appeared from nowhere.
      void recordLedgerEntry({
        uid: userId,
        kind: "signup",
        credits,
        balanceAfter: credits,
        note: "Free plan allowance",
      });

      return credits;
    }

    const value = snap.data()?.creditsRemaining;
    return typeof value === "number" ? value : 0;
  }

  async charge(userId: string, credits: number): Promise<number> {
    if (credits <= 0) return this.getBalance(userId);

    const db = adminDb();
    if (db === null) throw new Error("Firebase Admin is not configured.");

    const ref = this.ref(userId);

    return db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);

      const plan: Plan = "free";
      const current = snap.exists
        ? typeof snap.data()?.creditsRemaining === "number"
          ? (snap.data()?.creditsRemaining as number)
          : 0
        : PLAN_MONTHLY_CREDITS[plan];

      if (current < credits) {
        throw new InsufficientCreditsError(credits, current);
      }

      const next = current - credits;

      transaction.set(
        ref,
        {
          plan: snap.exists ? (snap.data()?.plan ?? plan) : plan,
          creditsRemaining: next,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return next;
    });
  }
}

/**
 * The ledger to use for a request.
 *
 * Anonymous callers (`userId === null`) get the in-memory limiter, which is a
 * cost guardrail rather than a real balance — there is no durable identity to
 * bill. Signed-in callers get the transactional Firestore ledger.
 */
export const creditStoreFor = (
  userId: string | null,
): CreditStore | null =>
  userId !== null && isAdminConfigured() ? new FirestoreCreditStore() : null;
