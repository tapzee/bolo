import { describe, expect, it } from "vitest";
import {
  beginIdempotent,
  completeIdempotent,
  isValidIdempotencyKey,
  releaseIdempotent,
} from "./idempotency";

// Unique per test so cases cannot bleed into each other through the shared
// module-level store.
let counter = 0;
const freshKey = (): string =>
  `${(counter++).toString(16).padStart(4, "0")}${"a".repeat(60)}`;

describe("beginIdempotent", () => {
  it("lets the first request through", () => {
    expect(beginIdempotent(freshKey())).toEqual({ status: "fresh" });
  });

  it("reports a concurrent duplicate as in_flight rather than running twice", () => {
    const key = freshKey();
    expect(beginIdempotent(key).status).toBe("fresh");
    expect(beginIdempotent(key).status).toBe("in_flight");
  });

  it("replays the cached result once complete, so credits are charged once", () => {
    const key = freshKey();
    beginIdempotent(key);
    completeIdempotent(key, { ok: true, creditsCharged: 3 });

    const replay = beginIdempotent<{ ok: boolean; creditsCharged: number }>(key);
    expect(replay).toEqual({
      status: "replay",
      result: { ok: true, creditsCharged: 3 },
    });
  });

  it("keeps replaying — a third submit must not reach the API either", () => {
    const key = freshKey();
    beginIdempotent(key);
    completeIdempotent(key, { value: 1 });

    expect(beginIdempotent(key).status).toBe("replay");
    expect(beginIdempotent(key).status).toBe("replay");
  });
});

describe("releaseIdempotent", () => {
  it("frees a failed request so the user's retry is not blocked", () => {
    const key = freshKey();
    beginIdempotent(key);
    releaseIdempotent(key);

    // Without the release this would be `in_flight` for ten minutes, which
    // would look to the user like the app had wedged.
    expect(beginIdempotent(key).status).toBe("fresh");
  });

  it("never discards a completed result", () => {
    const key = freshKey();
    beginIdempotent(key);
    completeIdempotent(key, { value: 7 });
    releaseIdempotent(key);

    expect(beginIdempotent(key).status).toBe("replay");
  });

  it("is safe to call for a key that was never claimed", () => {
    expect(() => releaseIdempotent(freshKey())).not.toThrow();
  });
});

describe("isValidIdempotencyKey", () => {
  it("accepts a SHA-256 hex digest", () => {
    expect(isValidIdempotencyKey("a".repeat(64))).toBe(true);
  });

  it("rejects junk so the store cannot be used as free storage", () => {
    expect(isValidIdempotencyKey("")).toBe(false);
    expect(isValidIdempotencyKey("short")).toBe(false);
    expect(isValidIdempotencyKey("../../etc/passwd")).toBe(false);
    expect(isValidIdempotencyKey("g".repeat(64))).toBe(false);
    expect(isValidIdempotencyKey("a".repeat(200))).toBe(false);
  });
});
