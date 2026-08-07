import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CaptionStudio } from "@/components/studio/CaptionStudio";

export const metadata: Metadata = {
  title: "Caption styles",
  description:
    "All five Bolo caption styles rendering hardcoded Hindi and Hinglish captions, across 9:16, 1:1 and 16:9.",
};

export default function StylesPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader phase="Phase 1 · Caption style preview" />
      <main>
        <CaptionStudio />
      </main>
    </div>
  );
}
