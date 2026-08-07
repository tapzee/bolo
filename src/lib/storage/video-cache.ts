"use client";

/**
 * Local video cache, backed by IndexedDB.
 *
 * WHY INDEXEDDB AND NOT THE SERVER: the whole architecture rests on the video
 * never leaving the device. Uploading it to make projects re-openable would
 * throw that away and add real storage cost per user. IndexedDB keeps the file
 * on the user's own machine, so reopening a project is instant, free, and still
 * private.
 *
 * WHY NOT localStorage: it is a synchronous string store with a ~5MB quota.
 * A video is tens or hundreds of megabytes of binary — IndexedDB is the only
 * browser store that can hold a Blob of that size without blocking the main
 * thread.
 *
 * Browsers may evict this under storage pressure. That is acceptable and
 * expected: captions live in Firestore, so an evicted video costs the user a
 * re-drop of the same file, never their edits.
 */

const DB_NAME = "bolo";
const DB_VERSION = 1;
const STORE = "videos";

export interface CachedVideo {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  width: number;
  height: number;
  durationSeconds: number;
  savedAt: number;
}

const openDb = (): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    // Private browsing and some locked-down profiles refuse IndexedDB entirely.
    // Caching is an enhancement, so a failure degrades to "no cache", never to
    // a broken editor.
    request.onerror = () => resolve(null);
  });

const tx = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> => {
  const db = await openDb();
  if (db === null) return null;

  return new Promise((resolve) => {
    try {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

/**
 * Stores a video against a project id.
 *
 * Deliberately not awaited by callers on the hot path — a 200MB write takes a
 * moment and must never delay the editor becoming interactive.
 */
export const cacheVideo = async (video: CachedVideo): Promise<boolean> => {
  const result = await tx("readwrite", (store) => store.put(video));
  return result !== null;
};

export const getCachedVideo = async (
  id: string,
): Promise<CachedVideo | null> => {
  const result = await tx<CachedVideo | undefined>("readonly", (store) =>
    store.get(id) as IDBRequest<CachedVideo | undefined>,
  );
  return result ?? null;
};

export const removeCachedVideo = async (id: string): Promise<void> => {
  await tx("readwrite", (store) => store.delete(id));
};

export const listCachedVideoIds = async (): Promise<string[]> => {
  const keys = await tx<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
  return (keys ?? []).map(String);
};

/**
 * Rebuilds a `File` from the cache so a restored project can go straight back
 * through the normal pipeline — including export, which needs a real `File`.
 */
export const cachedVideoToFile = (cached: CachedVideo): File =>
  new File([cached.blob], cached.name, { type: cached.type });

/**
 * Stable id for a file, so re-dropping the same clip finds its existing project
 * instead of creating a duplicate. Name plus size plus mtime is enough to
 * identify a local file and costs nothing — hashing hundreds of megabytes would
 * take seconds and buy nothing here.
 */
export const projectIdForFile = (file: File): string =>
  `v-${file.name}-${file.size}-${file.lastModified}`;

/** Rough total bytes held, for a storage indicator in settings. */
export const cacheUsageBytes = async (): Promise<number> => {
  const all = await tx<CachedVideo[]>("readonly", (store) => store.getAll());
  return (all ?? []).reduce((sum, entry) => sum + (entry.blob?.size ?? 0), 0);
};

/**
 * Empties the video cache.
 *
 * Only touches cached *videos*. Captions, styles and saved projects live
 * elsewhere and survive — which is what makes this safe to offer as a
 * one-click action when someone is short on disk space.
 */
export const clearVideoCache = async (): Promise<void> => {
  await tx("readwrite", (store) => store.clear());
};

/**
 * What the browser will actually let us keep.
 *
 * `navigator.storage.estimate()` reports the origin's quota and current usage
 * across all storage types. Worth surfacing because IndexedDB eviction is
 * silent — a user near their quota should know before their videos disappear
 * rather than after.
 */
export const storageEstimate = async (): Promise<{
  usedBytes: number;
  quotaBytes: number;
} | null> => {
  if (typeof navigator === "undefined" || navigator.storage?.estimate === undefined) {
    return null;
  }
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return { usedBytes: usage ?? 0, quotaBytes: quota ?? 0 };
  } catch {
    return null;
  }
};
