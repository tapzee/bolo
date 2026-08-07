import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { ProjectsList } from "@/components/projects/ProjectsList";

export const metadata: Metadata = { title: "My projects" };

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">My projects</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Caption edits are saved automatically. Video files are never stored —
          reopen a project and drop the same clip back in.
        </p>
        <div className="mt-8">
          <ProjectsList />
        </div>
      </div>
    </AppShell>
  );
}
