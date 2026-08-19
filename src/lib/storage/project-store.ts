"use client";

import type { CaptionStyleConfig, CaptionWord } from "@/core";
import { removeCachedVideo } from "./video-cache";

/**
 * Project persistence.
 *
 * The interface is the point: Phase 6 swaps the localStorage implementation for
 * a Firestore-backed one writing to `users/{uid}/projects/{projectId}`, and
 * nothing above this line changes.
 *
 * Only caption JSON and settings are ever stored — never video, never audio.
 * That is a hard rule from the architecture, not an optimisation: keeping media
 * out of persistence is what keeps storage costs near zero and the privacy
 * promise true.
 */
export interface ProjectSnapshot {
  id: string;
  title: string;
  words: readonly CaptionWord[];
  styleConfig: CaptionStyleConfig;
  durationSeconds: number;
  sourceWidth: number;
  sourceHeight: number;
  updatedAt: number;
}

export interface ProjectStore {
  save(snapshot: ProjectSnapshot): Promise<void>;
  load(id: string): Promise<ProjectSnapshot | null>;
  list(): Promise<ProjectSnapshot[]>;
  remove(id: string): Promise<void>;
}

const KEY_PREFIX = "bolo:project:";

class LocalProjectStore implements ProjectStore {
  async save(snapshot: ProjectSnapshot): Promise<void> {
    try {
      const key = `${KEY_PREFIX}${snapshot.id}`;

      // Same defensive dedupe as FirestoreProjectStore.save — only worth
      // doing the first time this id is written, since every later autosave
      // to the same id is just an update. See the Firestore version for why
      // the id can drift across drops or reopens of what is really the same
      // clip.
      if (localStorage.getItem(key) === null) {
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const otherKey = localStorage.key(i);
          if (otherKey === null || otherKey === key || !otherKey.startsWith(KEY_PREFIX)) {
            continue;
          }
          const raw = localStorage.getItem(otherKey);
          if (raw === null) continue;
          try {
            const other = JSON.parse(raw) as ProjectSnapshot;
            if (
              other.title === snapshot.title &&
              other.durationSeconds === snapshot.durationSeconds &&
              other.sourceWidth === snapshot.sourceWidth &&
              other.sourceHeight === snapshot.sourceHeight
            ) {
              localStorage.removeItem(otherKey);
              void removeCachedVideo(other.id);
            }
          } catch {
            // Corrupt entry — leave it for `list()`'s own parse guard.
          }
        }
      }

      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch (error) {
      // Quota is ~5MB. A 600-word transcript is well under 200KB, so this
      // realistically only fires in private mode or with storage disabled.
      // Autosave failing must never interrupt editing, so it is reported
      // upward as a status rather than thrown at the user.
      throw new Error(
        error instanceof Error && error.name === "QuotaExceededError"
          ? "Not enough browser storage to autosave."
          : "Autosave is unavailable in this browser.",
      );
    }
  }

  async load(id: string): Promise<ProjectSnapshot | null> {
    try {
      const raw = localStorage.getItem(`${KEY_PREFIX}${id}`);
      return raw === null ? null : (JSON.parse(raw) as ProjectSnapshot);
    } catch {
      // Corrupt or partially written entry — treat as absent rather than
      // crashing the editor on load.
      return null;
    }
  }

  async list(): Promise<ProjectSnapshot[]> {
    const out: ProjectSnapshot[] = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key === null || !key.startsWith(KEY_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        try {
          out.push(JSON.parse(raw) as ProjectSnapshot);
        } catch {
          // Skip the bad entry, keep the rest.
        }
      }
    } catch {
      return [];
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async remove(id: string): Promise<void> {
    try {
      localStorage.removeItem(`${KEY_PREFIX}${id}`);
    } catch {
      // Nothing useful to do — the entry is unreachable either way.
    }
  }
}

export const projectStore: ProjectStore = new LocalProjectStore();
