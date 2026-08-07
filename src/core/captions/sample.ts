import type { CaptionWord } from "./types";

/**
 * Phase 1 fixture: a realistic Hinglish reel script with word-level timings.
 *
 * Deliberately exercises the hard cases the renderer has to survive before any
 * real transcription exists:
 *  - pure Devanagari words (conjuncts, matras above and below the baseline)
 *  - Latin words inline in the same line ("income", "double", "consistency")
 *  - a long conjunct word (बताऊंगा) that stresses line wrapping
 *  - two low-confidence words, so the editor's review affordance has something
 *    to flag in Phase 4
 */

/** `[text, durationMs, gapAfterMs, confidence?]` */
type ScriptEntry = readonly [string, number, number, number?];

const SCRIPT: readonly ScriptEntry[] = [
  ["नमस्ते", 420, 60],
  ["दोस्तों", 480, 320],

  ["आज", 260, 40],
  ["मैं", 220, 30],
  ["आपको", 300, 40],
  ["बताऊंगा", 520, 60],
  ["कि", 180, 30],
  ["सिर्फ", 320, 40],
  ["तीन", 280, 30],
  ["महीने", 340, 40],
  ["में", 200, 30],
  ["अपनी", 300, 40],
  ["income", 420, 40, 0.71],
  ["कैसे", 300, 30],
  ["double", 400, 40],
  ["करें", 320, 380],

  ["पहला", 320, 40],
  ["step", 300, 30],
  ["है", 200, 220],
  ["अपना", 300, 40],
  ["skill", 320, 30],
  ["upgrade", 460, 40],
  ["करो", 300, 400],

  ["दूसरा", 380, 200],
  ["network", 440, 40],
  ["बनाओ", 380, 420],

  ["और", 220, 40],
  ["तीसरा", 400, 60],
  ["सबसे", 300, 40],
  ["important", 520, 200],
  ["consistency", 620, 60, 0.68],
  ["मत", 220, 30],
  ["छोड़ो", 420, 460],

  ["अगर", 280, 40],
  ["ये", 180, 30],
  ["video", 320, 40],
  ["helpful", 420, 40],
  ["लगी", 260, 40],
  ["तो", 180, 30],
  ["follow", 360, 40],
  ["करो", 380, 0],
];

const buildSample = (): CaptionWord[] => {
  const words: CaptionWord[] = [];
  let cursor = 240; // small lead-in so captions don't start on frame 0

  SCRIPT.forEach(([text, durationMs, gapAfterMs, confidence], index) => {
    const startMs = cursor;
    const endMs = startMs + durationMs;

    words.push({
      text,
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      // Deterministic spread in the 0.82–0.99 band so the fixture looks like
      // real ASR output instead of a wall of 1.0.
      confidence: confidence ?? Number((0.82 + ((index * 37) % 17) / 100).toFixed(2)),
    });

    cursor = endMs + gapAfterMs;
  });

  return words;
};

export const SAMPLE_CAPTIONS: readonly CaptionWord[] = buildSample();

export const SAMPLE_DURATION_MS: number = (() => {
  const last = SAMPLE_CAPTIONS[SAMPLE_CAPTIONS.length - 1];
  return last === undefined ? 0 : last.endMs + 600;
})();
