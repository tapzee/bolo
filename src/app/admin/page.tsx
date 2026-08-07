import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin",
  // Not that this is security — the API routes are what enforce access — but
  // there is no reason for this page to be indexed.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Transcription spend, ElevenLabs account status, and user credits.
        </p>
        <div className="mt-8">
          <AdminDashboard />
        </div>
      </div>
    </AppShell>
  );
}
