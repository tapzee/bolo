import type { CaptionPage, CaptionToken, TokenPhase } from "./types";

/**
 * Pure caption page lookup helpers.
 *
 * Everything here is deterministic and dependency-free: same input, same
 * output, no clock, no randomness.
 *
 * Page *construction* lives in `src/remotion/captions/build-pages.ts`, which
 * owns the interaction between automatic gap grouping, the word-count cap and
 * the editor's manual break overrides.
 */

/**
 * Index of the page that should be on screen at `timeMs`, or -1 for none.
 *
 * Binary search rather than a linear scan because this runs on every rendered
 * frame, and a 60s reel is easily 400+ pages.
 *
 * `holdMs` keeps a page on screen briefly past its last word so captions do not
 * blink off during natural pauses. A page is never held past the start of the
 * next one.
 */
export const findActivePageIndex = (
  pages: readonly CaptionPage[],
  timeMs: number,
  holdMs = 0,
): number => {
  let lo = 0;
  let hi = pages.length - 1;
  let candidate = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const page = pages[mid];
    if (page === undefined) break;

    if (page.startMs <= timeMs) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (candidate === -1) return -1;

  const page = pages[candidate];
  if (page === undefined) return -1;

  const next = pages[candidate + 1];
  const hardEnd =
    next === undefined
      ? page.startMs + page.durationMs + holdMs
      : Math.min(page.startMs + page.durationMs + holdMs, next.startMs);

  return timeMs < hardEnd ? candidate : -1;
};

export const getTokenPhase = (
  token: CaptionToken,
  timeMs: number,
): TokenPhase => {
  if (timeMs < token.fromMs) return "upcoming";
  if (timeMs >= token.toMs) return "spoken";
  return "active";
};

/** Total timeline length implied by the captions themselves. */
export const captionsDurationMs = (pages: readonly CaptionPage[]): number => {
  const last = pages[pages.length - 1];
  return last === undefined ? 0 : last.startMs + last.durationMs;
};
