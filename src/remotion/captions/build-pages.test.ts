import { describe, expect, it } from "vitest";
import type { CaptionWord } from "@/core";
import { buildCaptionPages } from "./build-pages";

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
      combineWithinMs: 1200,
      maxWordsPerPage: 4,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]?.tokens).toMatchObject([
      { text: "charge", emphasis: "supporting" },
      { text: "LIMITED", color: "#E5C400", emphasis: "important" },
    ]);
  });
});
