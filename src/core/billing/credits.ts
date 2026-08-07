import { SECONDS_PER_CREDIT } from "../video/constants";

/**
 * Credit maths. Pure, so the same rules can back the web app, a future PWA and
 * the server route without drifting apart — a client and server that disagree
 * on what an export costs is a support ticket every time.
 */

/**
 * Credits required for a given audio length.
 *
 * Rounds up: a 13-second clip costs 2 credits, not 1.08. Partial credits would
 * make the balance impossible to display honestly.
 */
export const creditsForSeconds = (seconds: number): number => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.ceil(seconds / SECONDS_PER_CREDIT);
};

export const secondsForCredits = (credits: number): number =>
  Math.max(0, Math.floor(credits)) * SECONDS_PER_CREDIT;

export const hasEnoughCredits = (
  creditsRemaining: number,
  seconds: number,
): boolean => creditsRemaining >= creditsForSeconds(seconds);

/**
 * What a balance is short by for a video of `seconds`, or null if it covers it.
 *
 * The numbers travel together because every place that reports a shortage needs
 * all three: the wall prices the exact top-up from `requiredCredits`, and talks
 * to the user in minutes from `requiredSeconds` — nobody thinks in credits.
 *
 * Defined here, rather than at the two call sites that produce one, so the
 * server's 402 response and the client's pre-flight check cannot disagree about
 * what "enough" means. A pre-flight that is more generous than the server would
 * let a user through extraction only to be refused; one that is stricter would
 * block a video the server would happily have transcribed.
 */
export interface CreditShortfall {
  requiredCredits: number;
  availableCredits: number;
  /** Length being charged for, so a wall can talk in minutes not credits. */
  requiredSeconds: number;
}

export const creditShortfall = (
  creditsRemaining: number,
  seconds: number,
): CreditShortfall | null => {
  const requiredCredits = creditsForSeconds(seconds);
  if (creditsRemaining >= requiredCredits) return null;
  return {
    requiredCredits,
    availableCredits: Math.max(0, Math.floor(creditsRemaining)),
    requiredSeconds: Math.round(seconds),
  };
};

export type Plan = "free" | "starter" | "editor" | "pro";

/** Plans weakest to strongest. Order is load-bearing — see `isAtLeast`. */
export const PLAN_ORDER: readonly Plan[] = ["free", "starter", "editor", "pro"];

export const isAtLeast = (plan: Plan, floor: Plan): boolean =>
  PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(floor);

/**
 * Monthly transcription allowance, in credits.
 *
 * At 12 seconds a credit these are 3 min / 1h 30m / 4h / 10h. Transcription
 * costs roughly ₹0.37 a minute, so even the top plan spends only about 22% of
 * its price on API cost — the allowances are deliberately generous because the
 * scarce thing here is not minutes, it is the entitlements in
 * `./entitlements`. Rationing something that costs us nothing only stops
 * people using the product.
 *
 * `pricing.test.ts` pins the two properties these numbers must keep: the
 * per-minute rate falls at every rung, and no SKU spends more than half its
 * price on transcription.
 */
export const PLAN_MONTHLY_CREDITS: Readonly<Record<Plan, number>> = {
  free: 15, // 3 min
  starter: 450, // 90 min — 1h 30m
  editor: 1200, // 240 min — 4h
  pro: 3000, // 600 min — 10h
};

/**
 * Ceiling on a rolled-over balance, as a multiple of the monthly allowance.
 *
 * Credits are granted rather than reset, so an idle month carries forward. The
 * cap stops an unused year from accumulating into a liability we would have to
 * honour all at once.
 */
export const CREDIT_ROLLOVER_MULTIPLE = 3;

export const creditCeiling = (plan: Plan): number =>
  PLAN_MONTHLY_CREDITS[plan] * CREDIT_ROLLOVER_MULTIPLE;
