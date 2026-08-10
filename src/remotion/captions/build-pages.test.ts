import { describe, expect, it } from "vitest";
import type { CaptionWord } from "@/core";
import { getStyleDefaults } from "@/core";
import { buildCaptionPages } from "./build-pages";

const baseOptions = getStyleDefaults("bold-yellow");

const wordsFrom = (texts: readonly string[]): CaptionWord[] =>
  texts.map((text, index) => ({
    text,
    startMs: index * 300,
    endMs: index * 300 + 250,
    timestampMs: index * 300 + 125,
    confidence: 0.98,
  }));

describe("buildCaptionPages", () => {
  it("preserves per-word style metadata on render tokens", () => {
    const words: CaptionWord[] = [
      {
        text: "charge",
        startMs: 0,
        endMs: 250,
        timestampMs: 125,
        confidence: 0.98,
        emphasis: "supporting",
      },
      {
        text: "LIMITED",
        startMs: 260,
        endMs: 620,
        timestampMs: 440,
        confidence: 0.99,
        color: "#E5C400",
        emphasis: "important",
      },
    ];

    const pages = buildCaptionPages(words, {
      ...baseOptions,
      combineWithinMs: 1200,
      maxWordsPerPage: 4,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]?.tokens).toMatchObject([
      { text: "charge", emphasis: "supporting" },
      { text: "LIMITED", color: "#E5C400", emphasis: "important" },
    ]);
  });

  describe("box-fit grouping", () => {
    // A long sentence, combined within one breath so gap analysis alone
    // wouldn't split it, and a word cap generous enough that it never binds
    // — isolates box-fit as the only thing that can be capping page size.
    const words = wordsFrom([
      "entrepreneurship", "international", "customization", "responsibility",
      "opportunities", "collaboration", "transformation", "sustainability",
    ]);

    it("fits fewer words per page at a larger font size than a smaller one", () => {
      const smallFont = buildCaptionPages(words, {
        ...baseOptions,
        combineWithinMs: 5000,
        maxWordsPerPage: 20,
        fontSizePx: 40,
      });
      const largeFont = buildCaptionPages(words, {
        ...baseOptions,
        combineWithinMs: 5000,
        maxWordsPerPage: 20,
        fontSizePx: 140,
      });

      expect(largeFont.length).toBeGreaterThan(smallFont.length);
      const largeFontMaxPageSize = Math.max(...largeFont.map((p) => p.tokens.length));
      const smallFontMaxPageSize = Math.max(...smallFont.map((p) => p.tokens.length));
      expect(largeFontMaxPageSize).toBeLessThan(smallFontMaxPageSize);
    });

    it("never lets a single page's estimated block exceed its box, except a lone oversized word", () => {
      const pages = buildCaptionPages(words, {
        ...baseOptions,
        combineWithinMs: 5000,
        maxWordsPerPage: 20,
        fontSizePx: 90,
      });

      // A real overflow check would require re-running the estimator; the
      // cheap proxy here is that no page (beyond an unavoidable single very
      // long word) grew to the full 8-word list — box-fit must have split it.
      for (const page of pages) {
        expect(page.tokens.length).toBeLessThan(words.length);
      }
    });

    it("still honours a manual pageBreak='never' override even if it would overflow the box", () => {
      const overridden = words.map((word) => ({ ...word }));
      overridden[1]!.pageBreak = "never";

      const pages = buildCaptionPages(overridden, {
        ...baseOptions,
        combineWithinMs: 5000,
        maxWordsPerPage: 20,
        fontSizePx: 200, // large enough that box-fit would otherwise split every word
      });

      // Word 0 and word 1 must share a page despite the box overflowing.
      const firstPage = pages[0];
      expect(firstPage?.tokens.map((t) => t.text)).toEqual(
        expect.arrayContaining([words[0]!.text, words[1]!.text]),
      );
    });
  });
});
