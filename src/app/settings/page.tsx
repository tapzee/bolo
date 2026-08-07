import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Account, plan and usage, storage on this device, and appearance.
        </p>
        <div className="mt-8">
          <SettingsPanel />
        </div>
      </div>
    </AppShell>
  );
}
