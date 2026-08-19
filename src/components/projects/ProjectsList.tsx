"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileVideo, HardDrive, Trash2, Wand2 } from "lucide-react";
import { formatDuration } from "@/core";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth-context";
import { storeForUser } from "@/lib/firebase/project-store";
import type { ProjectSnapshot } from "@/lib/storage/project-store";
import {
  listCachedVideoIds,
  removeCachedVideo,
} from "@/lib/storage/video-cache";

const relative = (timestamp: number): string => {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
};

export function ProjectsList() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectSnapshot[] | null>(null);

  // Which projects still have their video in this browser. Checked up front so
  // the card can say so *before* you click, rather than dropping you into the
  // editor and explaining there — which is how it read the first time.
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const store = storeForUser(user?.uid ?? null);
    const [list, ids] = await Promise.all([
      store.list(),
      listCachedVideoIds(),
    ]);
    setProjects(list.filter(p => ids.includes(p.id)));
    setCachedIds(new Set(ids));
  }, [user?.uid]);

  // Reloads when auth resolves, because the signed-out list (localStorage) and
  // the signed-in list (Firestore) are different sources.
  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const remove = useCallback(
    async (id: string) => {
      const store = storeForUser(user?.uid ?? null);
      await store.remove(id);
      // Drop the cached video too — otherwise deleting a project leaves
      // hundreds of megabytes of orphaned footage in IndexedDB forever.
      await removeCachedVideo(id);
      void load();
    },
    [user?.uid, load],
  );

  if (projects === null) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft">
          <FileVideo className="size-5 text-brand" />
        </div>
        <p className="text-sm font-medium">No projects yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {user === null
            ? "Projects you create are kept in this browser. Sign in to save them to your account instead."
            : "Caption a video and it will show up here automatically."}
        </p>
        <Link
          href="/create"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-medium text-brand-foreground"
        >
          <Wand2 className="size-3.5" />
          Create captions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {user === null ? (
        <p className="mb-4 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
          These are saved in this browser only. Sign in to keep them safe from a
          cleared cache.
        </p>
      ) : null}

      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-4 rounded-xl border bg-card/50 p-4 transition-colors hover:bg-card"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
            <FileVideo className="size-4 text-brand" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{project.title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              {relative(project.updatedAt)}
              <span className="opacity-40">·</span>
              {project.words.length} words
              <span className="opacity-40">·</span>
              {formatDuration(project.durationSeconds)}
              <span className="opacity-40">·</span>
              {project.sourceWidth}×{project.sourceHeight}
            </p>
          </div>

          {cachedIds.has(project.id) && (
            <span
              title="The video for this project is still cached in this browser"
              className="hidden shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success sm:flex"
            >
              <HardDrive className="size-2.5" />
              Video ready
            </span>
          )}

          <Link
            href={`/create?project=${encodeURIComponent(project.id)}`}
            className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            Open
          </Link>

          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${project.title}`}
            onClick={() => void remove(project.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
