"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FAQS } from "@/app/legal-content";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative mx-auto max-w-4xl px-5 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <HelpCircle className="size-3.5" />
          Got Questions?
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Everything you need to know about Bolo, privacy, pricing, and video exports.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.q}
              className={`rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? "border-brand/40 bg-card shadow-md"
                  : "border-border/70 bg-card/50 hover:bg-card/90"
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold text-sm sm:text-base text-foreground"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isOpen
                        ? "bg-brand text-brand-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{item.q}</span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-brand" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-muted-foreground border-t border-border/40 mt-1">
                  <p className="pl-9">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline underline-offset-4"
        >
          View complete Help & FAQ guide
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
