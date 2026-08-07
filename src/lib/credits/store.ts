import "server-only";

import { PLAN_MONTHLY_CREDITS, creditsForSeconds } from "@/core";

/**
 * Credit ledger.
 *
 * The interface is the point. Credit balance must be authoritative on the
 * server — a client that reports its own balance can mint free transcriptions —
 * so every consumer talks to this, never to a number sent in a request body.
 *
 * The in-memory implementation below is a Phase 3 placeholder: it does not
 * survive a restart and is not shared across serverless instances. Phase 6
 * replaces it with a Firestore-backed implementation using a transaction so
 * concurrent requests cannot double-spend. Nothing else has to change.
 */
export interface CreditStore {
  getBalance(userId: string): Promise<number>;
  /** Deducts and returns the new balance. Throws if the balance is short. */
  charge(userId: string, credits: number): Promise<number>;
}

export class InsufficientCreditsError extends Error {
  readonly required: number;
  readonly available: number;

  constructor(required: number, available: number) {
    super(`Requires ${required} credits, ${available} available`);
    this.name = "InsufficientCreditsError";
    this.required = required;
    this.available = available;
  }
}

class InMemoryCreditStore implements CreditStore {
  private readonly balances = new Map<string, number>();

  async getBalance(userId: string): Promise<number> {
    const existing = this.balances.get(userId);
    if (existing !== undefined) return existing;

    // Unknown identity gets the free-tier allowance. Phase 6 reads this from
    // `users/{uid}.creditsRemaining` instead of assuming.
    const seeded = PLAN_MONTHLY_CREDITS.free;
    this.balances.set(userId, seeded);
    return seeded;
  }

  async charge(userId: string, credits: number): Promise<number> {
    const balance = await this.getBalance(userId);
    if (balance < credits) {
      throw new InsufficientCreditsError(credits, balance);
    }
    const next = balance - credits;
    this.balances.set(userId, next);
    return next;
  }
}

export const creditStore: CreditStore = new InMemoryCreditStore();

/**
 * Whether a request can proceed, checked *before* spending money at the API.
 *
 * The actual charge happens only after a successful transcription — a failed
 * call must never cost the user credits.
 */
export const canAfford = async (
  userId: string,
  seconds: number,
  store: CreditStore = creditStore,
): Promise<{ ok: boolean; required: number; available: number }> => {
  const required = creditsForSeconds(seconds);
  const available = await store.getBalance(userId);
  return { ok: available >= required, required, available };
};
