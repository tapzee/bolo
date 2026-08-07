// Client-side: the wall takes an `onRetry` callback, and a server component
// cannot hand a function across the boundary.
"use client";

import { CreditWall } from "@/components/billing/CreditWall";
import { PLAN_MONTHLY_CREDITS, creditsForSeconds } from "@/core";

/**
 * Internal preview for the credit wall. Not linked from anywhere in the product.
 *
 * The wall only appears on a 402 from `/api/transcribe`, which needs a signed-in
 * account whose balance has actually run dry — not something you can reach by
 * clicking around, and not something worth draining a real account to look at.
 * Same purpose as `/dev/frames`: make a state that is hard to reach on demand
 * cheap to look at.
 *
 * Note the live-balance behaviour is *not* faked here. `CreditWall` subscribes
 * to the real balance, so signed out it reads zero and every case below shows
 * the "out of time" side. Sign in on an account with credits and the same
 * panels flip to "continue" — which is the behaviour worth checking.
 */
const CASES = [
  {
    label: "Free user, 3-minute video, nothing left",
    shortfall: {
      requiredCredits: creditsForSeconds(180),
      availableCredits: 0,
      requiredSeconds: 180,
    },
  },
  {
    label: "Ran dry mid-video — 96 seconds short",
    shortfall: {
      requiredCredits: creditsForSeconds(300),
      availableCredits: creditsForSeconds(204),
      requiredSeconds: 300,
    },
  },
  {
    label: "Long video, needs several top-ups",
    shortfall: {
      requiredCredits: creditsForSeconds(1500),
      availableCredits: PLAN_MONTHLY_CREDITS.free,
      requiredSeconds: 1500,
    },
  },
] as const;

export default function DevBillingPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 py-12">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Credit wall states</h1>
        <p className="text-xs text-muted-foreground">
          Internal preview. The retry button is inert here — there is no pipeline
          behind it.
        </p>
      </div>

      {CASES.map((testCase) => (
        <section key={testCase.label} className="space-y-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {testCase.label}
          </h2>
          <CreditWall
            shortfall={testCase.shortfall}
            onRetry={() => {}}
            canRetry
          />
        </section>
      ))}
    </main>
  );
}
