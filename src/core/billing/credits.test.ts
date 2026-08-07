import { describe, expect, it } from "vitest";
import {
  PLAN_MONTHLY_CREDITS,
  creditShortfall,
  creditsForSeconds,
  hasEnoughCredits,
  secondsForCredits,
} from "./credits";
import { SECONDS_PER_CREDIT } from "../video/constants";

describe("creditsForSeconds", () => {
  it("rounds up, so a partial credit is never free", () => {
    expect(creditsForSeconds(SECONDS_PER_CREDIT)).toBe(1);
    expect(creditsForSeconds(SECONDS_PER_CREDIT + 1)).toBe(2);
    expect(creditsForSeconds(13)).toBe(2);
  });

  it("treats nonsense as costing nothing rather than throwing", () => {
    expect(creditsForSeconds(0)).toBe(0);
    expect(creditsForSeconds(-5)).toBe(0);
    expect(creditsForSeconds(Number.NaN)).toBe(0);
  });
});

describe("creditShortfall", () => {
  /**
   * The case this was written for, in the units the user experiences it in: a
   * 3-minute video against a balance just under it. Before the pre-flight
   * check, this combination downloaded a 31MB wasm core and decoded the whole
   * video before the server refused it.
   */
  it("refuses a 3 min video on a 2 min 59 sec balance", () => {
    const balance = creditsForSeconds(179) - 1; // 14 credits — 2:48, under 2:59
    const shortfall = creditShortfall(balance, 180);

    expect(shortfall).not.toBeNull();
    expect(shortfall!.requiredCredits).toBe(15);
    expect(shortfall!.availableCredits).toBe(14);
    expect(shortfall!.requiredSeconds).toBe(180);
  });

  it("passes a video the balance exactly covers", () => {
    expect(creditShortfall(15, 180)).toBeNull();
    expect(creditShortfall(PLAN_MONTHLY_CREDITS.free, 180)).toBeNull();
  });

  it("refuses by one second over an exact balance", () => {
    // 15 credits buys exactly 180s. 181s costs 16, so this must refuse — the
    // boundary where a round-up and a floor could disagree.
    expect(creditShortfall(15, 181)).not.toBeNull();
  });

  it("agrees with hasEnoughCredits at every boundary", () => {
    for (let credits = 0; credits <= 20; credits += 1) {
      for (let seconds = 0; seconds <= 200; seconds += 7) {
        expect(creditShortfall(credits, seconds) === null).toBe(
          hasEnoughCredits(credits, seconds),
        );
      }
    }
  });

  it("never reports a negative balance as available", () => {
    // A balance cannot go negative through the ledger, but a stale or partial
    // read can produce one, and "you have −3 credits" is not a sentence to show
    // anyone.
    const shortfall = creditShortfall(-3, 60);
    expect(shortfall!.availableCredits).toBe(0);
  });
});

describe("secondsForCredits", () => {
  it("round-trips a whole number of credits", () => {
    expect(secondsForCredits(creditsForSeconds(180))).toBe(180);
  });

  it("never returns time a fractional or negative balance cannot buy", () => {
    expect(secondsForCredits(2.9)).toBe(2 * SECONDS_PER_CREDIT);
    expect(secondsForCredits(-4)).toBe(0);
  });
});
