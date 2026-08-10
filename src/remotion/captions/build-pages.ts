import { createTikTokStyleCaptions } from "@remotion/captions";
import type { CaptionPage, CaptionToken, CaptionWord, StyleId } from "@/core";
import {
  analyzeWordRoles,
  estimateBlockHeightPx,
  estimateMaxBlockHeightPx,
} from "@/core";
import { resolveTokenBoxes } from "./page-fit";

/**
 * The settings that affect page *grouping*.
 *
 * Narrower than `CaptionStyleConfig` so callers can memoise on exactly these
 * fields — passing the whole config would rebuild every page on a pure color
 * edit, which changes nothing about how words are grouped. `CaptionStyleConfig`
 * satisfies this shape structurally.
 *
 * Widened beyond the original `combineWithinMs`/`maxWordsPerPage` to cover
 * everything `resolveTokenBoxes`/`estimateBlockHeightPx` need for box-fit
 * grouping (see `buildCaptionPages`) — grouping is now style-aware, so
 * switching template can change *where* a page breaks, not just how it looks.
 */
export interface PageLayoutOptions {
  styleId: StyleId;
  combineWithinMs: number;
  maxWordsPerPage: number;
  fontSizePx: number;
  letterSpacingPx: number;
  wordGapPx: number;
  lineHeight: number;
  maxLineWidthPct: number;
  maxBlockHeightPct: number;
  annotationSizeRatio: number;
}

/**
 * Derives, for each word, whether automatic grouping wants a page to start
 * there.
 *
 * `createTikTokStyleCaptions` does the gap analysis — it is what makes captions
 * break on natural speech pauses rather than on an arbitrary word count. We
 * only need its *boundaries*, because the editor's manual overrides and the
 * word-count cap are applied on top.
 *
 * Grouping never drops or reorders words, so a running index maps its tokens
 * back onto the source list exactly.
 */
const autoBreakFlags = (
  words: readonly CaptionWord[],
  combineWithinMs: number,
): boolean[] => {
  const { pages } = createTikTokStyleCaptions({
    captions: words.map((word) => ({
      text: word.text,
      startMs: word.startMs,
      endMs: word.endMs,
      timestampMs: word.timestampMs,
      confidence: word.confidence,
    })),
    combineTokensWithinMilliseconds: combineWithinMs,
  });

  const flags = new Array<boolean>(words.length).fill(false);
  let cursor = 0;

  for (const page of pages) {
    flags[cursor] = true;
    cursor += page.tokens.length;
  }

  return flags;
};

const toToken = (word: CaptionWord): CaptionToken => {
  const token: CaptionToken = {
    text: word.text,
    fromMs: word.startMs,
    toMs: word.endMs,
  };
  // Only set when present, so untouched words produce a minimal object.
  if (word.color !== undefined) token.color = word.color;
  if (word.emphasis !== undefined) token.emphasis = word.emphasis;
  if (word.role !== undefined) token.role = word.role;
  return token;
};

/**
 * Words → on-screen pages.
 *
 * Five inputs decide where a page starts, in priority order:
 *
 *  1. The word's manual `pageBreak` override, set by split/merge in the editor.
 *     The user's explicit decision always wins — honoured even against a full
 *     box, because silently overriding what the user asked for looks broken.
 *  2. Automatic gap analysis — a natural speech pause starts a new page even
 *     if the box still has room.
 *  3. Box-fit: would adding this word overflow the style's fixed caption box
 *     (`maxBlockHeightPct`)? If so, the page closes *before* this word rather
 *     than growing the box to fit it — this is the primary cap now, in place
 *     of a flat word count. A page can never be empty, so the very first word
 *     added to a fresh page is always accepted even if it alone overflows.
 *  4. `maxWordsPerPage` — kept as a hard ceiling backstop for pathological
 *     cases (many very short words that would otherwise keep technically
 *     fitting), no longer the primary cap.
 */
export const buildCaptionPages = (
  words: readonly CaptionWord[],
  options: PageLayoutOptions,
): CaptionPage[] => {
  if (words.length === 0) return [];

  const autoBreaks = autoBreakFlags(words, options.combineWithinMs);
  const maxWords = Math.max(1, Math.floor(options.maxWordsPerPage));
  const maxBlockHeightPx = estimateMaxBlockHeightPx(options);

  const pages: CaptionPage[] = [];
  let current: CaptionToken[] = [];

  const flush = (): void => {
    const first = current[0];
    const last = current[current.length - 1];
    if (first === undefined || last === undefined) return;

    // Role analysis runs per-page, not over the whole transcript: the
    // "critical" salience comparison (see `analyzeWordRoles`) is meant to
    // pick the standout word *of this on-screen group*, not of the video.
    // Words that already carry a manual role are left untouched.
    const roles = analyzeWordRoles(current);
    current.forEach((token, i) => {
      if (token.role === undefined) token.role = roles[i];
    });

    pages.push({
      id: `p${pages.length}-${Math.round(first.fromMs)}`,
      text: current.map((token) => token.text).join(" "),
      startMs: first.fromMs,
      durationMs: Math.max(1, last.toMs - first.fromMs),
      tokens: current,
    });
    current = [];
  };

  // Would adding `candidate` to the current page overflow its fixed box?
  // Re-resolves the page-scoped size signal (hero index, role, emphasis —
  // whichever the active style uses) fresh over the candidate list each
  // time, because which word is "the big one" isn't known until the page's
  // membership is — exactly what this function is deciding as it goes.
  const overflowsBox = (candidate: readonly CaptionToken[]): boolean => {
    const boxes = resolveTokenBoxes(candidate, options.styleId, options);
    return estimateBlockHeightPx(boxes, options) > maxBlockHeightPx;
  };

  words.forEach((word, index) => {
    const candidateToken = toToken(word);
    const atWordCap = current.length >= maxWords;
    const overflows = current.length > 0 && overflowsBox([...current, candidateToken]);
    const wantsBreak =
      index > 0 && (autoBreaks[index] === true || overflows || atWordCap);

    const shouldBreak =
      index === 0
        ? false
        : word.pageBreak === "force"
          ? true
          : word.pageBreak === "never"
            ? false
            : wantsBreak;

    if (shouldBreak) {
      flush();
    }

    current.push(candidateToken);
  });

  flush();

  return pages;
};
