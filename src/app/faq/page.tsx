import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { FAQS } from "../legal-content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about Bolo — privacy, languages, editing, export and billing.",
};

export default function FaqPage() {
  return (
    <ContentPage title="Frequently asked questions">
      <div className="space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border bg-card/50 p-4 open:bg-card"
          >
            <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
              <span className="flex items-start justify-between gap-3">
                {item.q}
                <span className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
