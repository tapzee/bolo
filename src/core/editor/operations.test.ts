import { describe, expect, it } from "vitest";
import type { CaptionWord } from "../captions/types";
import {
  MIN_WORD_MS,
  deleteWord,
  insertWordAfter,
  lowConfidenceIndices,
  mergePageAt,
  splitPageAt,
  timingBoundsFor,
  updateWordColor,
  updateWordText,
  updateWordTiming,
} from "./operations";

const word = (
  text: string,
  startMs: number,
  endMs: number,
  confidence: number | null = 0.9,
): CaptionWord => ({
  text,
  startMs,
  endMs,
  timestampMs: Math.round((startMs + endMs) / 2),
  confidence,
});

const SAMPLE: readonly CaptionWord[] = [
  word("नमस्ते", 0, 400),
  word("दोस्तों", 500, 900),
  word("income", 1000, 1400, 0.42),
];

describe("updateWordText", () => {
  it("replaces the text and leaves everything else alone", () => {
    const next = updateWordText(SAMPLE, 1, "यारों");
    expect(next[1]?.text).toBe("यारों");
    expect(next[1]?.startMs).toBe(500);
    expect(next[1]?.endMs).toBe(900);
  });

  it("does not mutate the input", () => {
    updateWordText(SAMPLE, 1, "यारों");
    expect(SAMPLE[1]?.text).toBe("दोस्तों");
  });

  it("ignores an empty edit rather than creating an invisible word", () => {
    expect(updateWordText(SAMPLE, 1, "   ")[1]?.text).toBe("दोस्तों");
  });

  it("ignores an out-of-range index", () => {
    expect(updateWordText(SAMPLE, 99, "x")).toHaveLength(SAMPLE.length);
  });
});

describe("updateWordTiming", () => {
  it("recomputes the midpoint timestamp", () => {
    const next = updateWordTiming(SAMPLE, 1, 600, 800);
    expect(next[1]).toMatchObject({ startMs: 600, endMs: 800, timestampMs: 700 });
  });

  it("clamps the start so it cannot overlap the previous word", () => {
    // Dragging back past 400 would light two words on the same frame.
    const next = updateWordTiming(SAMPLE, 1, 100, 900);
    expect(next[1]?.startMs).toBe(400);
  });

  it("clamps the end so it cannot overlap the next word", () => {
    const next = updateWordTiming(SAMPLE, 1, 500, 5000);
    expect(next[1]?.endMs).toBe(1000);
  });

  it("keeps a usable span even when squeezed to nothing", () => {
    const next = updateWordTiming(SAMPLE, 1, 900, 900);
    expect((next[1]?.endMs ?? 0) - (next[1]?.startMs ?? 0)).toBeGreaterThanOrEqual(
      MIN_WORD_MS,
    );
  });

  it("lets the first word reach 0 and the last run past the others", () => {
    expect(timingBoundsFor(SAMPLE, 0).minStartMs).toBe(0);
    expect(timingBoundsFor(SAMPLE, 2).maxEndMs).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("updateWordColor", () => {
  it("sets and clears the override", () => {
    const coloured = updateWordColor(SAMPLE, 0, "#ff0000");
    expect(coloured[0]?.color).toBe("#ff0000");

    const cleared = updateWordColor(coloured, 0, undefined);
    expect(cleared[0]).not.toHaveProperty("color");
  });
});

describe("page break overrides", () => {
  it("marks a forced break", () => {
    expect(splitPageAt(SAMPLE, 1)[1]?.pageBreak).toBe("force");
  });

  it("marks a merge", () => {
    expect(mergePageAt(SAMPLE, 2)[2]?.pageBreak).toBe("never");
  });

  it("refuses to split at the first word, where a page already starts", () => {
    expect(splitPageAt(SAMPLE, 0)[0]).not.toHaveProperty("pageBreak");
  });
});

describe("deleteWord", () => {
  it("removes the word and leaves neighbour timings untouched", () => {
    const next = deleteWord(SAMPLE, 1);
    expect(next.map((w) => w.text)).toEqual(["नमस्ते", "income"]);
    // Stretching neighbours into the gap would desync them from the audio.
    expect(next[0]?.endMs).toBe(400);
    expect(next[1]?.startMs).toBe(1000);
  });

  it("ignores an out-of-range index", () => {
    expect(deleteWord(SAMPLE, 42)).toHaveLength(3);
  });
});

describe("insertWordAfter", () => {
  it("fills the gap between two words", () => {
    const next = insertWordAfter(SAMPLE, 0, "यार");
    expect(next).toHaveLength(4);
    expect(next[1]).toMatchObject({ text: "यार", startMs: 400, endMs: 500 });
  });

  it("borrows from the anchor when there is no gap", () => {
    const tight = [word("a", 0, 400), word("b", 400, 800)];
    const next = insertWordAfter(tight, 0, "c");

    expect(next).toHaveLength(3);
    const inserted = next[1];
    expect(inserted?.text).toBe("c");
    expect((inserted?.endMs ?? 0) - (inserted?.startMs ?? 0)).toBeGreaterThanOrEqual(
      MIN_WORD_MS,
    );
    // The anchor was shortened rather than overlapped.
    expect(next[0]?.endMs).toBeLessThanOrEqual(inserted?.startMs ?? 0);
  });

  it("marks a manually typed word as having no model confidence", () => {
    expect(insertWordAfter(SAMPLE, 0, "यार")[1]?.confidence).toBeNull();
  });

  it("ignores empty text", () => {
    expect(insertWordAfter(SAMPLE, 0, "  ")).toHaveLength(3);
  });
});

describe("lowConfidenceIndices", () => {
  it("finds words below the threshold", () => {
    expect(lowConfidenceIndices(SAMPLE)).toEqual([2]);
  });

  it("does not flag words with no reported confidence", () => {
    expect(lowConfidenceIndices([word("x", 0, 100, null)])).toEqual([]);
  });
});
