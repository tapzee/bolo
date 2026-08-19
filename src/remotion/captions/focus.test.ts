import { describe, expect, it } from "vitest";
import {
  focusTier,
  focusFontScale,
  focusWordOpacity,
  focusWordMotion,
  focusActiveGlowShadow,
  FOCUS_SPOKEN_OPACITY,
} from "./primitives";

describe("Focus caption animation & typography", () => {
  it("assigns appropriate tiers to word roles", () => {
    expect(focusTier("critical")).toBe("hero");
    expect(focusTier("number")).toBe("hero");
    expect(focusTier("emphasis")).toBe("script");
    expect(focusTier("special")).toBe("script");
    expect(focusTier("keyword")).toBe("body");
    expect(focusTier("cta")).toBe("body");
    expect(focusTier("normal")).toBe("support");
  });

  it("scales font appropriately by tier", () => {
    expect(focusFontScale("hero")).toBe(1);
    expect(focusFontScale("script")).toBe(0.62);
    expect(focusFontScale("body")).toBe(0.5);
    expect(focusFontScale("support")).toBe(0.38);
  });

  it("computes smooth opacity curve across lifecycle", () => {
    const upcoming = 0.55;
    // Before onset
    expect(focusWordOpacity(0, 0, upcoming)).toBeCloseTo(upcoming);
    // Actively spoken
    expect(focusWordOpacity(1, 0, upcoming)).toBeCloseTo(1.0);
    // Post-spoken settlement
    expect(focusWordOpacity(1, 1, upcoming)).toBeCloseTo(FOCUS_SPOKEN_OPACITY);
  });

  it("produces clean resting alignment for upcoming words", () => {
    const motion = focusWordMotion(0, 0, "hero", 100, true);
    expect(motion.yOffset).toBe(0);
    expect(motion.scale).toBe(1);
    expect(motion.blurPx).toBe(0);
    expect(motion.activeProgress).toBe(0);
  });

  it("executes blur-up-to-down kinetic drop on onset", () => {
    // Right at speech start (started ~0.05)
    const atStart = focusWordMotion(0.05, 0, "hero", 100, false);
    expect(atStart.yOffset).toBeLessThan(0); // Offset above
    expect(atStart.blurPx).toBeGreaterThan(10); // Rich optical blur
    expect(atStart.scale).toBeGreaterThanOrEqual(1.0);

    // Midway through onset (started = 0.5)
    const midOnset = focusWordMotion(0.5, 0, "hero", 100, false);
    expect(midOnset.yOffset).toBeGreaterThan(atStart.yOffset); // Dropping down towards 0
    expect(midOnset.blurPx).toBeLessThan(atStart.blurPx); // Resolving blur

    // Landed & actively spoken (started = 1, ended = 0)
    const active = focusWordMotion(1.0, 0, "hero", 100, false);
    expect(active.blurPx).toBe(0); // Pin sharp
    expect(active.scale).toBeCloseTo(1.08); // Hero scale boost
    expect(active.activeProgress).toBe(1.0);

    // Spoken ended (started = 1, ended = 1)
    const settled = focusWordMotion(1.0, 1.0, "hero", 100, false);
    expect(settled.yOffset).toBe(0); // Settled at baseline
    expect(settled.blurPx).toBe(0); // Sharp
    expect(settled.scale).toBe(1.0); // Rest scale
    expect(settled.activeProgress).toBe(0);
  });

  it("generates radiant bloom shadow for active words", () => {
    const inactiveShadow = focusActiveGlowShadow(100, "#ffd400", 0);
    expect(inactiveShadow).not.toContain("255, 212, 0");

    const activeShadow = focusActiveGlowShadow(100, "#ffd400", 1.0);
    expect(activeShadow).toContain("255, 212, 0");
  });
});
