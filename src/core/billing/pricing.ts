import { SECONDS_PER_CREDIT } from "../video/constants";
import { PLAN_MONTHLY_CREDITS, PLAN_ORDER, type Plan } from "./credits";
import type { PassTier } from "./entitlements";

/**
 * Everything purchasable, priced in paise.
 *
 * Integers throughout. Money in floats accumulates rounding error the moment it
 * is divided — and every one of these is divided, to compare per-minute rates.
 */

export const PLAN_PRICE_PAISE: Readonly<Record<Plan, number>> = {
  free: 0,
  starter: 29_900,
  editor: 49_900,
  pro: 99_900,
};

export const PASS_PRICE_PAISE: Readonly<Record<PassTier, number>> = {
  week: 5_900,
};

export const PASS_CREDITS: Readonly<Record<PassTier, number>> = {
  week: 100, // 20 min
};

export const PASS_DURATION_MS: Readonly<Record<PassTier, number>> = {
  week: 7 * 24 * 60 * 60 * 1000,
};

/**
 * The mid-cycle top-up.
 *
 * One SKU on purpose. A user who has just been told they are out of minutes is
 * not in the mood to compare three packs, and every extra option is another
 * chance to close the tab.
 *
 * Priced *above* every plan's per-minute rate, and that is load-bearing: if a
 * top-up were the cheaper way to buy minutes, nobody would ever upgrade and the
 * subscription ladder would quietly collapse into one-off purchases. Its job is
 * to be a way out, not a good deal. `pricing.test.ts` pins this.
 */
export const TOPUP_PRICE_PAISE = 5_900;
export const TOPUP_CREDITS = 50; // 10 min

/** Rupees per minute of transcription, for comparing SKUs. */
export const pricePerMinutePaise = (
  paise: number,
  credits: number,
): number => {
  const minutes = (credits * SECONDS_PER_CREDIT) / 60;
  return minutes === 0 ? 0 : paise / minutes;
};

export interface UpgradeQuote {
  from: Plan;
  to: Plan;
  /** Difference in price, charged once. The renewal date does not move. */
  amountPaise: number;
  /** Extra credits granted immediately on payment. */
  creditsGranted: number;
}

/**
 * Mid-cycle upgrade, priced as the plain difference between the two plans.
 *
 * Deliberately not day-weighted. Daily proration is fairer by a few rupees and
 * far harder to explain, and this quote is shown to someone who has just hit a
 * wall — "pay ₹200, get 120 more minutes, same renewal date" converts, while a
 * prorated ₹163.87 invites a support ticket. The user is also strictly better
 * off than they would be under proration for the rest of the cycle, so the
 * simplification never costs them anything.
 *
 * Returns null when `to` is not above `from` — downgrades are a billing-cycle
 * change, not a purchase.
 */
export const upgradeQuote = (from: Plan, to: Plan): UpgradeQuote | null => {
  if (PLAN_ORDER.indexOf(to) <= PLAN_ORDER.indexOf(from)) return null;
  return {
    from,
    to,
    amountPaise: PLAN_PRICE_PAISE[to] - PLAN_PRICE_PAISE[from],
    creditsGranted: PLAN_MONTHLY_CREDITS[to] - PLAN_MONTHLY_CREDITS[from],
  };
};

/** The tier we push first when someone runs dry — one step up, never the top. */
export const nextPlanUp = (plan: Plan): Plan | null => {
  const next = PLAN_ORDER[PLAN_ORDER.indexOf(plan) + 1];
  return next ?? null;
};

export const formatPaise = (paise: number): string =>
  paise % 100 === 0
    ? `₹${paise / 100}`
    : `₹${(paise / 100).toFixed(2)}`;
