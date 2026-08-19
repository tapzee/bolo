"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileVideo, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectSnapshot } from "@/lib/storage/project-store";
import { getCachedVideo, listCachedVideoIds } from "@/lib/storage/video-cache";
import { storeForUser } from "@/lib/firebase/project-store";
import { useAuth } from "@/lib/firebase/auth-context";

const MAX_RECENT = 5;

const relative = (timestamp: number): string => {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
};

/**
 * Grabs a frame from the cached video blob to use as a preview image.
 *
 * Nothing in the storage layer persists a poster frame — video and audio are
 * deliberately never kept anywhere but IndexedDB (see video-cache.ts) — so a
 * thumbnail only ever exists as a throwaway data URL generated on the fly.
 */
const generateThumbnail = (blob: Blob): Promise<string | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    const fail = () => {
      cleanup();
      resolve(null);
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2 || 0);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx === null || canvas.width === 0) {
        fail();
        return;
      }
      ctx.drawImage(video, 0, 0);
      cleanup();
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    video.onerror = fail;
  });

/**
 * Recent-projects strip on the /create landing screen. A quieter, thumbnail-led
 * echo of the full list at /projects — enough to jump back into the last few
 * clips without leaving the upload screen.
 */
export function RecentProjects() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectSnapshot[] | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    void (async () => {
      const store = storeForUser(user?.uid ?? null);
      const [list, ids] = await Promise.all([store.list(), listCachedVideoIds()]);
      if (cancelled) return;

      const recent = list.filter(p => ids.includes(p.id)).slice(0, MAX_RECENT);
      setProjects(recent);
      setCachedIds(new Set(ids));

      for (const project of recent) {
        if (!ids.includes(project.id)) continue;
        const cached = await getCachedVideo(project.id);
        if (cancelled || cached === null) continue;
        const dataUrl = await generateThumbnail(cached.blob);
        if (cancelled || dataUrl === null) continue;
        setThumbnails((prev) => ({ ...prev, [project.id]: dataUrl }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid]);

  if (projects === null || projects.length === 0) return null;

  return (
    <div className="mt-14">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Recent projects</h2>
        <Link
          href="/projects"
          className="text-xs font-medium text-brand hover:opacity-80"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/create?project=${encodeURIComponent(project.id)}`}
            className="group overflow-hidden rounded-2xl border bg-card/60 shadow-sm transition-all hover:bg-card hover:shadow-md"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {thumbnails[project.id] ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image can't optimize it anyway
                <img
                  src={thumbnails[project.id]}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <FileVideo className="size-6 text-muted-foreground" />
                </div>
              )}

              {cachedIds.has(project.id) && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success backdrop-blur">
                  <HardDrive className="size-2.5" />
                  Video ready
                </span>
              )}
            </div>

            <div className="p-2.5">
              <p className="truncate text-xs font-semibold text-foreground">
                {project.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="size-2.5" />
                {relative(project.updatedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
