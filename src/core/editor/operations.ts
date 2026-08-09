import type { CaptionWord } from "../captions/types";

/**
 * Pure editing operations over a word list.
 *
 * Every function returns a new array and never mutates its input — that is what
 * makes the undo stack in `history.ts` work by simply holding references to
 * previous versions, with no cloning and no snapshot cost.
 *
 * Dependency-free on purpose: the same operations back the web editor today and
 * any future PWA or Android shell unchanged.
 */

/** Below this a word cannot register as active on a 30fps timeline. */
export const MIN_WORD_MS = 40;

const withTimestamp = (word: CaptionWord): CaptionWord => ({
  ...word,
  timestampMs: Math.round((word.startMs + word.endMs) / 2),
});

const replaceAt = (
  words: readonly CaptionWord[],
  index: number,
  next: CaptionWord,
): CaptionWord[] => {
  const out = [...words];
  out[index] = next;
  return out;
};

const inRange = (words: readonly CaptionWord[], index: number): boolean =>
  index >= 0 && index < words.length;

/**
 * Replaces a word's text.
 *
 * Empty text is rejected rather than allowed and filtered later: a zero-length
 * word still occupies its slice of the timeline, so it would render as an
 * invisible gap the user cannot select to fix. Deleting is a separate,
 * explicit operation.
 */
export const updateWordText = (
  words: readonly CaptionWord[],
  index: number,
  text: string,
): CaptionWord[] => {
  const word = words[index];
  if (word === undefined) return [...words];

  const trimmed = text.trim();
  if (trimmed.length === 0) return [...words];

  return replaceAt(words, index, { ...word, text: trimmed });
};

export const updateWordColor = (
  words: readonly CaptionWord[],
  index: number,
  color: string | undefined,
): CaptionWord[] => {
  const word = words[index];
  if (word === undefined) return [...words];

  const next = { ...word };
  if (color === undefined) {
    delete next.color;
  } else {
    next.color = color;
  }
  return replaceAt(words, index, next);
};

export const updateWordEmphasis = (
  words: readonly CaptionWord[],
  index: number,
  emphasis: CaptionWord["emphasis"] | undefined,
): CaptionWord[] => {
  const word = words[index];
  if (word === undefined) return [...words];

  const next = { ...word };
  if (emphasis === undefined) {
    delete next.emphasis;
  } else {
    next.emphasis = emphasis;
  }
  return replaceAt(words, index, next);
};

export interface TimingBounds {
  minStartMs: number;
  maxEndMs: number;
}

/**
 * How far a word may be dragged before it would collide with its neighbours.
 *
 * Exposed so the UI can clamp the drag itself and show the handle stopping at
 * the limit, rather than letting the user drag freely and silently snapping the
 * value back on release.
 */
export const timingBoundsFor = (
  words: readonly CaptionWord[],
  index: number,
): TimingBounds => {
  const previous = words[index - 1];
  const next = words[index + 1];
  return {
    minStartMs: previous === undefined ? 0 : previous.endMs,
    maxEndMs: next === undefined ? Number.POSITIVE_INFINITY : next.startMs,
  };
};

/**
 * Retimes a word, clamped so it can never overlap a neighbour.
 *
 * Overlap is not a cosmetic problem: two words active on the same frame means
 * two highlighted words, which reads as a rendering bug.
 */
export const updateWordTiming = (
  words: readonly CaptionWord[],
  index: number,
  startMs: number,
  endMs: number,
): CaptionWord[] => {
  const word = words[index];
  if (word === undefined) return [...words];

  const { minStartMs, maxEndMs } = timingBoundsFor(words, index);

  const clampedStart = Math.max(minStartMs, Math.round(startMs));
  const clampedEnd = Math.min(maxEndMs, Math.round(endMs));

  // Guarantee a usable span even when the neighbours leave almost no room.
  const safeEnd = Math.max(clampedEnd, clampedStart + MIN_WORD_MS);
  const safeStart = Math.min(clampedStart, safeEnd - MIN_WORD_MS);

  return replaceAt(
    words,
    index,
    withTimestamp({ ...word, startMs: safeStart, endMs: safeEnd }),
  );
};

/** Forces a caption page to begin at this word. */
export const splitPageAt = (
  words: readonly CaptionWord[],
  index: number,
): CaptionWord[] => {
  const word = words[index];
  // Splitting at the first word is a no-op — a page already starts there.
  if (word === undefined || index === 0) return [...words];
  return replaceAt(words, index, { ...word, pageBreak: "force" });
};

/** Pulls this word onto the previous page, removing the break before it. */
export const mergePageAt = (
  words: readonly CaptionWord[],
  index: number,
): CaptionWord[] => {
  const word = words[index];
  if (word === undefined || index === 0) return [...words];
  return replaceAt(words, index, { ...word, pageBreak: "never" });
};

/** Returns this word to automatic grouping. */
export const clearPageOverride = (
  words: readonly CaptionWord[],
  index: number,
): CaptionWord[] => {
  const word = words[index];
  if (word === undefined) return [...words];

  const next = { ...word };
  delete next.pageBreak;
  return replaceAt(words, index, next);
};

/**
 * Removes a word — the common fix for a filler ("umm") or a hallucinated token.
 *
 * The freed time is deliberately left as a gap rather than redistributed to the
 * neighbours: stretching them would desync those words from the audio, and the
 * whole value of word-level captions is that they match what is being said.
 */
export const deleteWord = (
  words: readonly CaptionWord[],
  index: number,
): CaptionWord[] => {
  if (!inRange(words, index)) return [...words];
  return words.filter((_, i) => i !== index);
};

/**
 * Inserts a word after `index`, for speech the model missed entirely.
 *
 * Takes its time from the gap to the next word when there is one, otherwise it
 * borrows the tail of the word it follows — so the new word is always visible
 * and selectable rather than collapsing to zero width.
 */
export const insertWordAfter = (
  words: readonly CaptionWord[],
  index: number,
  text: string,
): CaptionWord[] => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [...words];

  const anchor = words[index];
  if (anchor === undefined) return [...words];

  const next = words[index + 1];
  const gapStart = anchor.endMs;
  const gapEnd = next === undefined ? anchor.endMs + 400 : next.startMs;

  let startMs: number;
  let endMs: number;

  if (gapEnd - gapStart >= MIN_WORD_MS * 2) {
    startMs = gapStart;
    endMs = gapEnd;
  } else {
    // No usable gap: take the back half of the anchor and shorten it.
    const midpoint = Math.max(
      anchor.startMs + MIN_WORD_MS,
      Math.round((anchor.startMs + anchor.endMs) / 2),
    );
    startMs = midpoint;
    endMs = Math.max(anchor.endMs, midpoint + MIN_WORD_MS);
  }

  const inserted: CaptionWord = withTimestamp({
    text: trimmed,
    startMs,
    endMs,
    timestampMs: null,
    // Manually typed, so there is no model confidence to report. Null keeps it
    // out of the low-confidence review list rather than faking certainty.
    confidence: null,
  });

  const out = [...words];
  if (startMs < anchor.endMs) {
    out[index] = withTimestamp({ ...anchor, endMs: startMs });
  }
  out.splice(index + 1, 0, inserted);
  return out;
};

/** Words the model was least sure about — what the editor surfaces for review. */
export const lowConfidenceIndices = (
  words: readonly CaptionWord[],
  threshold = 0.6,
): number[] =>
  words.reduce<number[]>((acc, word, index) => {
    if (word.confidence !== null && word.confidence < threshold) acc.push(index);
    return acc;
  }, []);
