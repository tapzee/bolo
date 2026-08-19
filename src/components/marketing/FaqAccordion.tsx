"use client";

import { useState } from "react";
import { ChevronDown, ArrowRight, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { FAQS } from "@/app/legal-content";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <MessageCircleQuestion className="size-3.5" />
          Got Questions?
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
          Frequently Asked Questions
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Everything you need to know about Bolo, privacy, pricing, and video exports.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3.5">
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.q}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "border-emerald-500/40 bg-card shadow-lg ring-1 ring-emerald-500/20"
                  : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left font-bold text-sm sm:text-base text-foreground"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3.5">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                      isOpen
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{item.q}</span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-emerald-500" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-sm leading-relaxed text-muted-foreground border-t border-border/40 mt-1">
                      <p className="pl-10 sm:pl-10.5">{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="mt-10 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
        >
          <span>View Complete FAQ & Help Documentation</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
