import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { MarketingPage } from "@/components/marketing/SiteChrome";
import { PLANS, TOPUP_LINE } from "../legal-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for Bolo. Free to try with a watermark; ₹59 for a 7-day pass, or from ₹299/month.",
};

export default function PricingPage() {
  return (
    <MarketingPage>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple pricing
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Try everything free — upload, transcribe, edit and export. Free
            exports carry a small watermark. Pay only when you want it gone.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5",
                plan.highlight
                  ? "border-brand bg-brand-soft shadow-lift"
                  : "bg-card/50",
              )}
            >
              {plan.highlight ? (
                <span className="mb-3 w-fit rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground uppercase">
                  Most popular
                </span>
              ) : null}

              <h2 className="text-sm font-semibold">{plan.name}</h2>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.cadence}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {plan.blurb}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 size-3 shrink-0 text-success" />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/create"
                className={cn(
                  "mt-5 rounded-lg py-2 text-center text-xs font-medium transition-opacity hover:opacity-90",
                  plan.highlight
                    ? "bg-brand text-brand-foreground"
                    : "border",
                )}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          {TOPUP_LINE}
        </p>

        <div className="mx-auto mt-10 max-w-2xl space-y-3 rounded-xl border bg-card/40 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-success" />
            Before you pay, please know
          </p>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              • Export needs a recent <strong>Chrome or Edge on desktop</strong>{" "}
              (WebCodecs). 4K is desktop-only. Test a free export first.
            </li>
            <li>
              • Transcription is automated and accuracy varies with audio
              quality, accent and background noise. Try the free tier on your own
              footage before subscribing.
            </li>
            <li>
              • Used transcription minutes are not refundable — see our{" "}
              <Link href="/refund" className="underline underline-offset-4">
                Refund Policy
              </Link>
              .
            </li>
            <li>• All prices are in Indian Rupees and include applicable taxes.</li>
          </ul>
        </div>
      </section>
    </MarketingPage>
  );
}
