import { SECONDS_PER_CREDIT } from "../video/constants";

/**
 * The account's own credit history — what it spent, what it bought, what an
 * admin adjusted.
 *
 * Separate from `src/lib/admin/usage.ts`, which aggregates spend across all
 * users for our cost reporting and is deliberately unreadable by clients. This
 * one is per-user and the user is meant to see it: "why do I have 40 minutes
 * left" has to be answerable, and a bare balance never answers it.
 *
 * Append-only. An entry is never edited or deleted, so a balance can always be
 * reconstructed by replaying the list — which is the only way to catch a
 * deduction that should not have happened.
 */

export type LedgerEntryKind =
  /** Credits consumed by a transcription. */
  | "spend"
  /** Credits added by a purchase — plan, pass or top-up. */
  | "purchase"
  /** Credits added or removed by an admin, e.g. a support refund. */
  | "adjustment"
  /** The free allowance granted when the account was first seen. */
  | "signup";

export interface LedgerEntry {
  id: string;
  kind: LedgerEntryKind;
  /** Epoch ms. */
  at: number;
  /**
   * Signed credit movement — negative for a spend, positive for anything
   * granted. Signed rather than a magnitude plus a direction, because the sum
   * of a list of signed numbers is the balance, and no reader has to know which
   * kinds count as which sign.
   */
  credits: number;
  /** Balance immediately after this entry, or null for older entries. */
  balanceAfter: number | null;
  /** Money paid, in paise. Zero for spends and for anything granted free. */
  amountPaise: number;
  /** Short line for the UI — the SKU bought, or an admin's stated reason. */
  note: string | null;
}

/** Audio length a spend entry covers, in seconds. Zero for anything else. */
export const ledgerEntrySeconds = (entry: LedgerEntry): number =>
  entry.credits < 0 ? -entry.credits * SECONDS_PER_CREDIT : 0;

/**
 * Whether an entry belongs under "purchases" rather than "usage".
 *
 * An admin adjustment counts as a purchase when it added credits — from the
 * user's side a support grant and a paid top-up are the same event, and
 * labelling one of them "adjustment" in their history invites a question we do
 * not want them to have to ask. A negative adjustment is a correction and stays
 * out of the purchases list.
 */
export const isCredit = (entry: LedgerEntry): boolean => entry.credits > 0;

export const LEDGER_KIND_LABEL: Readonly<Record<LedgerEntryKind, string>> = {
  spend: "Transcription",
  purchase: "Purchase",
  adjustment: "Adjustment",
  signup: "Free allowance",
};
