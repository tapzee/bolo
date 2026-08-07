import type { ExportResolution } from "../video/constants";
import type { Plan } from "./credits";

/**
 * What a plan unlocks, as opposed to what it meters.
 *
 * Bolo has exactly one resource with a marginal cost: transcription, at roughly
 * ₹0.37 a minute. Everything in this file costs nothing per use — export
 * rendering happens on the user's own device, fonts and styles are static, and
 * the plugin is a fixed development cost. So none of it is metered in credits.
 *
 * That split is deliberate. Charging credits for a 4K export would ration
 * something that is free for us to give: the user weighs the cost, exports at
 * 1080p instead, and we have saved nothing while shipping a worse result.
 * Credits meter cost; entitlements gate value.
 */
export interface Entitlements {
  /** Free exports carry a burned-in watermark; every paid tier removes it. */
  watermarkFree: boolean;
  /** Highest resolution the export panel will offer. */
  maxResolution: ExportResolution;
  srtDownload: boolean;
  /** Fonts beyond the always-available Google set. */
  customFonts: number;
  plugin: "none" | "burnin" | "full";
  /** Concurrent signed-in devices. Not yet enforced — see AGENTS.md. */
  maxDevices: number;
}

/**
 * A time-boxed purchase that lifts entitlements without starting a
 * subscription. Bought outright, expires on its own, never auto-renews — which
 * is the point, since UPI Autopay is the only workable auto-renew rail in India
 * and plenty of users will not set one up.
 */
export type PassTier = "week";

export interface Pass {
  tier: PassTier;
  /** Epoch ms. */
  expiresAt: number;
}

export const PLAN_ENTITLEMENTS: Readonly<Record<Plan, Entitlements>> = {
  free: {
    watermarkFree: false,
    maxResolution: "1080p",
    srtDownload: false,
    customFonts: 0,
    plugin: "none",
    maxDevices: 1,
  },
  starter: {
    watermarkFree: true,
    maxResolution: "1080p",
    srtDownload: true,
    customFonts: 5,
    plugin: "burnin",
    maxDevices: 1,
  },
  editor: {
    watermarkFree: true,
    maxResolution: "4k",
    srtDownload: true,
    customFonts: 10,
    plugin: "burnin",
    maxDevices: 2,
  },
  pro: {
    watermarkFree: true,
    maxResolution: "4k",
    srtDownload: true,
    customFonts: 30,
    plugin: "full",
    maxDevices: 3,
  },
};

export const PASS_ENTITLEMENTS: Readonly<Record<PassTier, Entitlements>> = {
  week: {
    watermarkFree: true,
    maxResolution: "1080p",
    srtDownload: true,
    // A pass is a taste of the product, so styling is unrestricted — the thing
    // it deliberately does not include is the plugin.
    customFonts: Number.POSITIVE_INFINITY,
    plugin: "none",
    maxDevices: 1,
  },
};

const RESOLUTION_RANK: readonly ExportResolution[] = ["720p", "1080p", "4k"];

const PLUGIN_RANK: readonly Entitlements["plugin"][] = [
  "none",
  "burnin",
  "full",
];

const strongerOf = <T,>(rank: readonly T[], a: T, b: T): T =>
  rank.indexOf(a) >= rank.indexOf(b) ? a : b;

/**
 * The best of two entitlement sets, field by field.
 *
 * Taken per field rather than picking a winning tier outright, because the two
 * sets do not dominate each other: a week pass grants unlimited fonts but no
 * plugin, while Starter grants the plugin but only five fonts. Someone holding
 * both paid for both, and should get both.
 */
export const mergeEntitlements = (
  a: Entitlements,
  b: Entitlements,
): Entitlements => ({
  watermarkFree: a.watermarkFree || b.watermarkFree,
  maxResolution: strongerOf(RESOLUTION_RANK, a.maxResolution, b.maxResolution),
  srtDownload: a.srtDownload || b.srtDownload,
  customFonts: Math.max(a.customFonts, b.customFonts),
  plugin: strongerOf(PLUGIN_RANK, a.plugin, b.plugin),
  maxDevices: Math.max(a.maxDevices, b.maxDevices),
});

/**
 * What this account can actually do right now.
 *
 * `now` is passed in rather than read from the clock so the result stays pure —
 * the same inputs must give the same answer on the client, on the server and in
 * a test, or a user sees one thing and gets billed for another.
 */
export const effectiveEntitlements = (
  plan: Plan,
  pass: Pass | null,
  now: number,
): Entitlements => {
  const base = PLAN_ENTITLEMENTS[plan];
  if (pass === null || pass.expiresAt <= now) return base;
  return mergeEntitlements(base, PASS_ENTITLEMENTS[pass.tier]);
};

export const isPassActive = (pass: Pass | null, now: number): boolean =>
  pass !== null && pass.expiresAt > now;

/**
 * Whether a resolution is within an entitlement ceiling.
 *
 * Composes with — never replaces — the device capability check in the export
 * panel. A plan can permit 4K on a phone that cannot encode it, and a phone
 * that can encode 4K does not thereby earn the tier.
 */
export const isResolutionAllowed = (
  tier: ExportResolution,
  ceiling: ExportResolution,
): boolean => RESOLUTION_RANK.indexOf(tier) <= RESOLUTION_RANK.indexOf(ceiling);

/** Lowest plan whose entitlements include `tier`, for an upgrade prompt. */
export const planForResolution = (tier: ExportResolution): Plan | null =>
  (["free", "starter", "editor", "pro"] as const).find((plan) =>
    isResolutionAllowed(tier, PLAN_ENTITLEMENTS[plan].maxResolution),
  ) ?? null;
