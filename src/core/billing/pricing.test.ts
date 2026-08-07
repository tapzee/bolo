import { describe, expect, it } from "vitest";
import {
  PASS_CREDITS,
  PASS_PRICE_PAISE,
  PLAN_PRICE_PAISE,
  TOPUP_CREDITS,
  TOPUP_PRICE_PAISE,
  formatPaise,
  nextPlanUp,
  pricePerMinutePaise,
  upgradeQuote,
} from "./pricing";
import { PLAN_MONTHLY_CREDITS, PLAN_ORDER, secondsForCredits } from "./credits";

/** ElevenLabs Scribe, ~$0.25/hr at ₹88/USD. Paise per minute. */
const COST_PER_MINUTE_PAISE = 37;

describe("the ladder holds together", () => {
  /**
   * The advertised allowances, in minutes.
   *
   * Pinned because these are a commercial promise, not an implementation
   * detail: they are printed on the pricing page, in the settings panel and in
   * the credit wall, and a credit figure edited by hand is very easy to get
   * wrong by a factor of five. Changing a number here should be a deliberate
   * act with a price decision behind it.
   */
  it("grants the advertised minutes", () => {
    const minutes = (credits: number) => secondsForCredits(credits) / 60;

    expect(minutes(PLAN_MONTHLY_CREDITS.free)).toBe(3);
    expect(minutes(PLAN_MONTHLY_CREDITS.starter)).toBe(90); // 1h 30m
    expect(minutes(PLAN_MONTHLY_CREDITS.editor)).toBe(240); // 4h
    expect(minutes(PLAN_MONTHLY_CREDITS.pro)).toBe(600); // 10h
    expect(minutes(PASS_CREDITS.week)).toBe(20);
    expect(minutes(TOPUP_CREDITS)).toBe(10);
  });

  it("gets cheaper per minute as you go up", () => {
    const paid = PLAN_ORDER.filter((plan) => plan !== "free");
    const rates = paid.map((plan) =>
      pricePerMinutePaise(PLAN_PRICE_PAISE[plan], PLAN_MONTHLY_CREDITS[plan]),
    );
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i]!).toBeLessThan(rates[i - 1]!);
    }
  });

  it("prices the top-up above every plan, or nobody would ever upgrade", () => {
    // This is the invariant that keeps subscriptions alive. If a top-up were
    // the cheaper way to buy minutes, the rational move would be to sit on the
    // cheapest plan forever and top up, and MRR would quietly flatten.
    const topupRate = pricePerMinutePaise(TOPUP_PRICE_PAISE, TOPUP_CREDITS);
    for (const plan of PLAN_ORDER.filter((p) => p !== "free")) {
      const planRate = pricePerMinutePaise(
        PLAN_PRICE_PAISE[plan],
        PLAN_MONTHLY_CREDITS[plan],
      );
      expect(topupRate).toBeGreaterThan(planRate);
    }
  });

  it("stays profitable on every SKU", () => {
    const skus = [
      [PLAN_PRICE_PAISE.starter, PLAN_MONTHLY_CREDITS.starter],
      [PLAN_PRICE_PAISE.editor, PLAN_MONTHLY_CREDITS.editor],
      [PLAN_PRICE_PAISE.pro, PLAN_MONTHLY_CREDITS.pro],
      [PASS_PRICE_PAISE.week, PASS_CREDITS.week],
      [TOPUP_PRICE_PAISE, TOPUP_CREDITS],
    ] as const;

    for (const [paise, credits] of skus) {
      const minutes = secondsForCredits(credits) / 60;
      const cost = minutes * COST_PER_MINUTE_PAISE;
      // Transcription must never eat more than half of a SKU's price. It
      // currently eats 8–18%; this catches an allowance raised without a
      // matching price, which is the direction the mistake goes.
      expect(cost).toBeLessThan(paise * 0.5);
    }
  });
});

describe("upgradeQuote", () => {
  it("charges the difference and grants the difference", () => {
    const quote = upgradeQuote("starter", "editor");
    expect(quote).not.toBeNull();
    expect(quote!.amountPaise).toBe(20_000); // ₹499 − ₹299
    expect(quote!.creditsGranted).toBe(750); // 1200 − 450, i.e. +150 min
  });

  it("refuses a sideways or downward move", () => {
    expect(upgradeQuote("pro", "starter")).toBeNull();
    expect(upgradeQuote("editor", "editor")).toBeNull();
  });

  it("is always worth more than it costs, at every step", () => {
    for (let i = 0; i < PLAN_ORDER.length - 1; i += 1) {
      const quote = upgradeQuote(PLAN_ORDER[i]!, PLAN_ORDER[i + 1]!)!;
      expect(quote.creditsGranted).toBeGreaterThan(0);
      expect(quote.amountPaise).toBeGreaterThan(0);
    }
  });
});

describe("nextPlanUp", () => {
  it("steps one rung, and stops at the top", () => {
    expect(nextPlanUp("free")).toBe("starter");
    expect(nextPlanUp("starter")).toBe("editor");
    expect(nextPlanUp("pro")).toBeNull();
  });
});

describe("formatPaise", () => {
  it("drops the decimals on whole rupees", () => {
    expect(formatPaise(29_900)).toBe("₹299");
    expect(formatPaise(900)).toBe("₹9");
    expect(formatPaise(1_050)).toBe("₹10.50");
  });
});
