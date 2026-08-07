import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CreateFlow } from "@/components/create/CreateFlow";

export const metadata: Metadata = {
  title: "Add captions",
  description:
    "Upload a video and get word-level Hindi and Hinglish captions. Your video never leaves your browser.",
};

export default function CreatePage() {
  return (
    <AppShell>
      <main>
        {/* The gate here is UX; `/api/transcribe` enforces the same rule
            server-side, which is what actually protects API spend. */}
        <RequireAuth>
          <CreateFlow />
        </RequireAuth>
      </main>
    </AppShell>
  );
}
