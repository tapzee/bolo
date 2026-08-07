import "server-only";

/**
 * Idempotency for the transcription route.
 *
 * The failure this prevents is concrete: a user double-clicks, or the response
 * is lost to a flaky mobile connection and the client resubmits. Without
 * dedup we call ElevenLabs twice for identical audio and charge the user's
 * credits twice for one video.
 *
 * Keys are content-addressed — the client sends SHA-256(audio bytes + language)
 * — so a replay is recognised even across a page reload, and two genuinely
 * different videos can never collide.
 *
 * SAME CAVEAT AS THE RATE LIMITER: this store is in-memory and per-instance.
 * On serverless, two concurrent requests landing on different instances will
 * both miss. It closes the common double-submit case, not the distributed one.
 * Phase 6 moves this to Firestore, where a transactional create on the key
 * makes the guarantee real. The interface below is what that swap targets.
 */

type Entry<T> =
  | { state: "pending"; startedAt: number }
  | { state: "complete"; completedAt: number; result: T };

const entries = new Map<string, Entry<unknown>>();

/** Long enough to cover a retry, short enough to allow a deliberate redo. */
const COMPLETED_TTL_MS = 60 * 60 * 1000;
/** A pending entry this old means the request died; let a retry through. */
const PENDING_TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 5_000;

const isExpired = (entry: Entry<unknown>, now: number): boolean =>
  entry.state === "pending"
    ? now - entry.startedAt > PENDING_TTL_MS
    : now - entry.completedAt > COMPLETED_TTL_MS;

const sweep = (now: number): void => {
  for (const [key, entry] of entries) {
    if (isExpired(entry, now)) entries.delete(key);
  }
  // Still over budget after sweeping — drop everything rather than grow without
  // bound. Worst case a replay is missed and the user is charged once more.
  if (entries.size > MAX_ENTRIES) entries.clear();
};

export type BeginResult<T> =
  | { status: "fresh" }
  | { status: "replay"; result: T }
  | { status: "in_flight" };

/**
 * Claims a key before doing expensive work.
 *
 * `fresh` means proceed. `replay` means return the cached result and do not
 * call the API or charge again. `in_flight` means an identical request is
 * already running — the caller should tell the client to wait rather than
 * starting a second transcription.
 */
export const beginIdempotent = <T>(key: string): BeginResult<T> => {
  const now = Date.now();
  if (entries.size > MAX_ENTRIES / 2) sweep(now);

  const existing = entries.get(key);

  if (existing !== undefined && !isExpired(existing, now)) {
    return existing.state === "complete"
      ? { status: "replay", result: existing.result as T }
      : { status: "in_flight" };
  }

  entries.set(key, { state: "pending", startedAt: now });
  return { status: "fresh" };
};

/** Caches the successful result so a replay can be served without an API call. */
export const completeIdempotent = <T>(key: string, result: T): void => {
  entries.set(key, { state: "complete", completedAt: Date.now(), result });
};

/**
 * Releases a claimed key after a failure.
 *
 * Critical that this runs on every failure path: a key left pending would make
 * the user's legitimate retry return `in_flight` for ten minutes.
 */
export const releaseIdempotent = (key: string): void => {
  const existing = entries.get(key);
  if (existing?.state === "pending") entries.delete(key);
};

/** Rejects malformed keys so a client cannot use this map as free storage. */
export const isValidIdempotencyKey = (value: string): boolean =>
  /^[a-f0-9]{32,128}$/i.test(value);
