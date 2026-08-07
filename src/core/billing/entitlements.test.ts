import { describe, expect, it } from "vitest";
import {
  PASS_ENTITLEMENTS,
  PLAN_ENTITLEMENTS,
  effectiveEntitlements,
  isPassActive,
  isResolutionAllowed,
  mergeEntitlements,
  planForResolution,
} from "./entitlements";
import { PLAN_ORDER, isAtLeast } from "./credits";

const NOW = 1_700_000_000_000;
const activePass = { tier: "week" as const, expiresAt: NOW + 1000 };
const deadPass = { tier: "week" as const, expiresAt: NOW - 1000 };

describe("plan entitlements", () => {
  it("puts the watermark only on free", () => {
    expect(PLAN_ENTITLEMENTS.free.watermarkFree).toBe(false);
    for (const plan of PLAN_ORDER.filter((p) => p !== "free")) {
      expect(PLAN_ENTITLEMENTS[plan].watermarkFree).toBe(true);
    }
  });

  it("never weakens as the ladder goes up", () => {
    for (let i = 1; i < PLAN_ORDER.length; i += 1) {
      const lower = PLAN_ENTITLEMENTS[PLAN_ORDER[i - 1]!];
      const upper = PLAN_ENTITLEMENTS[PLAN_ORDER[i]!];
      expect(upper.customFonts).toBeGreaterThanOrEqual(lower.customFonts);
      expect(upper.maxDevices).toBeGreaterThanOrEqual(lower.maxDevices);
      expect(
        isResolutionAllowed(lower.maxResolution, upper.maxResolution),
      ).toBe(true);
    }
  });
});

describe("effectiveEntitlements", () => {
  it("ignores a pass that has expired", () => {
    expect(effectiveEntitlements("free", deadPass, NOW)).toEqual(
      PLAN_ENTITLEMENTS.free,
    );
  });

  it("lifts a free account while the pass is live", () => {
    const result = effectiveEntitlements("free", activePass, NOW);
    expect(result.watermarkFree).toBe(true);
    expect(result.srtDownload).toBe(true);
  });

  it("expires exactly on the boundary, not after it", () => {
    const edge = { tier: "week" as const, expiresAt: NOW };
    expect(isPassActive(edge, NOW)).toBe(false);
    expect(effectiveEntitlements("free", edge, NOW).watermarkFree).toBe(false);
  });

  it("never downgrades a paid plan that also holds a pass", () => {
    // The pass caps at 1080p; Pro must keep its 4K and its plugin.
    const result = effectiveEntitlements("pro", activePass, NOW);
    expect(result.maxResolution).toBe("4k");
    expect(result.plugin).toBe("full");
  });

  it("takes the best of each side rather than a winning tier", () => {
    // Starter has the plugin but 5 fonts; the pass has unlimited fonts but no
    // plugin. Someone holding both paid for both.
    const result = mergeEntitlements(
      PLAN_ENTITLEMENTS.starter,
      PASS_ENTITLEMENTS.week,
    );
    expect(result.plugin).toBe("burnin");
    expect(result.customFonts).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("resolution gating", () => {
  it("keeps 4K off free and Starter", () => {
    expect(isResolutionAllowed("4k", PLAN_ENTITLEMENTS.free.maxResolution)).toBe(
      false,
    );
    expect(
      isResolutionAllowed("4k", PLAN_ENTITLEMENTS.starter.maxResolution),
    ).toBe(false);
    expect(
      isResolutionAllowed("4k", PLAN_ENTITLEMENTS.editor.maxResolution),
    ).toBe(true);
  });

  it("names the cheapest plan that unlocks a tier", () => {
    expect(planForResolution("1080p")).toBe("free");
    expect(planForResolution("4k")).toBe("editor");
  });
});

describe("isAtLeast", () => {
  it("orders the ladder", () => {
    expect(isAtLeast("editor", "starter")).toBe(true);
    expect(isAtLeast("starter", "editor")).toBe(false);
    expect(isAtLeast("pro", "pro")).toBe(true);
  });
});
