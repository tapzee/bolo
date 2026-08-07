"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import {
  PLAN_MONTHLY_CREDITS,
  PLAN_PRICE_PAISE,
  TOPUP_CREDITS,
  TOPUP_PRICE_PAISE,
  formatAllowance,
  formatPaise,
  nextPlanUp,
  secondsForCredits,
  upgradeQuote,
} from "@/core";
import type { CreditShortfall } from "@/lib/elevenlabs/types";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/lib/credits/use-credits";

export interface CreditWallProps {
  shortfall: CreditShortfall;
  /** Re-sends the audio already held by the pipeline. No re-upload. */
  onRetry: () => void;
  /** False once the held audio is gone — then the file has to be dropped again. */
  canRetry: boolean;
}

/**
 * What a user sees when the balance runs out mid-video.
 *
 * This moment used to be a dead end: the API returned 402, the message went
 * through the generic error slot, and there was nothing to click. Someone who
 * had already paid for a plan and hit the wall on day twelve had no way to
 * continue and no reason to stay.
 *
 * Two things make it recoverable. The pipeline still holds the extracted audio,
 * so continuing costs one request and no re-upload. And the balance here is a
 * live Firestore subscription, so the moment credits actually land — from a
 * payment webhook, or an admin grant — this switches to "continue" on its own.
 * Nothing polls, and there is no success-callback to lose.
 */
export function CreditWall({ shortfall, onRetry, canRetry }: CreditWallProps) {
  const credits = useCredits();

  const { requiredCredits, requiredSeconds } = shortfall;
  // The live balance, not the one from the failed response — that number is
  // already stale if anything has topped up since.
  const available = credits.creditsRemaining;
  const covered = available >= requiredCredits;

  const missing = Math.max(0, requiredCredits - available);
  const topupsNeeded = Math.ceil(missing / TOPUP_CREDITS);
  const upgradeTo = nextPlanUp(credits.plan);
  const quote = upgradeTo === null ? null : upgradeQuote(credits.plan, upgradeTo);

  // Coming off free is a first subscription, not a mid-cycle upgrade: the price
  // is the whole plan, and there is no renewal date to reassure anyone about.
  // Offering "pay only the difference — ₹299" to a free user is both wrong and
  // slightly insulting, since the "difference" is the entire price.
  const subscribing = credits.plan === "free";
  const offerPaise =
    upgradeTo === null
      ? 0
      : subscribing
        ? PLAN_PRICE_PAISE[upgradeTo]
        : (quote?.amountPaise ?? 0);
  const offerSeconds =
    upgradeTo === null
      ? 0
      : secondsForCredits(
          subscribing
            ? PLAN_MONTHLY_CREDITS[upgradeTo]
            : (quote?.creditsGranted ?? 0),
        );

  if (covered) {
    return (
      <div className="space-y-3 rounded-xl border border-success/30 bg-success/5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Check className="size-4 shrink-0 text-success" />
          You have {formatAllowance(credits.secondsRemaining)} — enough for
          this video.
        </p>
        <Button onClick={onRetry} disabled={!canRetry} className="w-full">
          {canRetry ? "Continue transcribing" : "Add the video again"}
          <ArrowRight className="size-4" />
        </Button>
        {canRetry ? (
          <p className="text-[11px] text-muted-foreground">
            Picks up where it stopped — your video never left this browser, so
            there is nothing to upload again.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">You&apos;re out of transcription time</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          This video needs{" "}
          <span className="font-medium text-foreground">
            {formatAllowance(requiredSeconds)}
          </span>
          . You have{" "}
          <span className="font-medium text-foreground">
            {formatAllowance(secondsForCredits(available))}
          </span>{" "}
          left on {credits.plan}.
        </p>
      </div>

      <div className="space-y-2">
        {quote !== null && upgradeTo !== null ? (
          <Link
            href={`/pricing?upgrade=${upgradeTo}`}
            className="flex items-center gap-3 rounded-lg border border-brand/40 bg-brand-soft/40 p-3 transition-colors hover:bg-brand-soft"
          >
            <Sparkles className="size-4 shrink-0 text-brand" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">
                {subscribing ? "Get" : "Upgrade to"}{" "}
                <span className="capitalize">{upgradeTo}</span> —{" "}
                {formatPaise(offerPaise)}
                {subscribing ? "/mo" : ""}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {subscribing
                  ? `${formatAllowance(offerSeconds)} of transcription a month, and no watermark.`
                  : `Pay only the difference. ${formatAllowance(offerSeconds)} more, added now. Renewal date stays the same.`}
              </span>
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ) : null}

        <Link
          href="/pricing?topup=1"
          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
        >
          <Zap className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">
              Add {formatAllowance(secondsForCredits(TOPUP_CREDITS))} —{" "}
              {formatPaise(TOPUP_PRICE_PAISE)}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              One-time, no subscription.
              {topupsNeeded > 1
                ? ` You need ${topupsNeeded} for this video.`
                : " Enough for this video."}
            </span>
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Your video is still here — nothing to upload again once you&apos;re
        topped up.
      </p>
    </div>
  );
}
