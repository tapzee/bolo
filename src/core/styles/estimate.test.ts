import { describe, expect, it } from "vitest";

import {
  estimateBlockHeightPx,
  estimateMaxBlockHeightPx,
  estimateMaxLineWidthPx,
  estimateWordWidthPx,
} from "./estimate";
import { getStyleDefaults } from "./registry";

const config = getStyleDefaults("bold-yellow");

describe("estimateWordWidthPx", () => {
  it("grows with font size", () => {
    const small = estimateWordWidthPx("hello", 40, 0, false);
    const large = estimateWordWidthPx("hello", 80, 0, false);
    expect(large).toBeGreaterThan(small);
  });

  it("grows with character count", () => {
    const short = estimateWordWidthPx("hi", 60, 0, false);
    const long = estimateWordWidthPx("hello there friend", 60, 0, false);
    expect(long).toBeGreaterThan(short);
  });

  it("estimates Devanagari wider than equivalent-length Latin", () => {
    const latin = estimateWordWidthPx("namaste", 60, 0, false);
    const devanagari = estimateWordWidthPx("नमस्ते!", 60, 0, true);
    // Same rough character count; Devanagari's ratio is deliberately higher.
    expect(devanagari).toBeGreaterThan(latin);
  });

  it("is zero for empty text", () => {
    expect(estimateWordWidthPx("   ", 60, 0, false)).toBe(0);
  });
});

describe("estimateBlockHeightPx", () => {
  it("is zero for no tokens", () => {
    expect(estimateBlockHeightPx([], config)).toBe(0);
  });

  it("grows when tokens no longer fit on one row", () => {
    const maxWidth = estimateMaxLineWidthPx(config);
    const oneRow = estimateBlockHeightPx(
      [{ width: maxWidth * 0.3, height: 80 }],
      config,
    );
    const twoRows = estimateBlockHeightPx(
      [
        { width: maxWidth * 0.7, height: 80 },
        { width: maxWidth * 0.7, height: 80 },
      ],
      config,
    );
    expect(twoRows).toBeGreaterThan(oneRow);
  });

  it("a row's height is driven by its tallest token, mirroring layoutLines' rowHeight", () => {
    const maxWidth = estimateMaxLineWidthPx(config);
    const height = estimateBlockHeightPx(
      [
        { width: maxWidth * 0.2, height: 40 },
        { width: maxWidth * 0.2, height: 200 },
      ],
      config,
    );
    expect(height).toBe(200);
  });
});

describe("estimateMaxBlockHeightPx", () => {
  it("scales with maxBlockHeightPct", () => {
    const small = estimateMaxBlockHeightPx({ ...config, maxBlockHeightPct: 20 });
    const large = estimateMaxBlockHeightPx({ ...config, maxBlockHeightPct: 40 });
    expect(large).toBeGreaterThan(small);
  });
});
