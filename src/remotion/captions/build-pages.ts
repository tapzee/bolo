import { createTikTokStyleCaptions } from "@remotion/captions";
import type { CaptionPage, CaptionToken, CaptionWord } from "@/core";
import { analyzeWordRoles } from "@/core";

/**
 * The settings that affect page *grouping*.
 *
 * Narrower than `CaptionStyleConfig` so callers can memoise on exactly these
 * fields. Passing the whole style config would rebuild every page on each tick
 * of the font-size slider, which changes nothing about how words are grouped.
 * `CaptionStyleConfig` satisfies this shape structurally.
 */
export interface PageLayoutOptions {
  combineWithinMs: number;
  maxWordsPerPage: number;
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
 * Three inputs decide where a page starts, in priority order:
 *
 *  1. The word's manual `pageBreak` override, set by split/merge in the editor.
 *     The user's explicit decision always wins.
 *  2. The word-count cap. Gap analysis has no upper bound, so a fast unbroken
 *     Hindi sentence would otherwise collapse into one 15-word page that
 *     overflows the canvas.
 *  3. Automatic gap analysis.
 *
 * `never` is honoured even against the word cap — if the user explicitly merged
 * a word onto the previous page, silently splitting it again would look broken.
 */
export const buildCaptionPages = (
  words: readonly CaptionWord[],
  options: PageLayoutOptions,
): CaptionPage[] => {
  if (words.length === 0) return [];

  const autoBreaks = autoBreakFlags(words, options.combineWithinMs);
  const maxWords = Math.max(1, Math.floor(options.maxWordsPerPage));

  const pages: CaptionPage[] = [];
  let current: CaptionToken[] = [];
  let pageStartIndex = 0;

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

  words.forEach((word, index) => {
    const atCap = current.length >= maxWords;
    const wantsBreak = index > 0 && (autoBreaks[index] === true || atCap);

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
      pageStartIndex = index;
    }

    current.push(toToken(word));
  });

  flush();
  void pageStartIndex;

  return pages;
};
