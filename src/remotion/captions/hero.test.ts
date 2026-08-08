import { describe, expect, it } from "vitest";
import { heroWordIndex } from "./primitives";

/**
 * `heroWordIndex` is the one decision the two renderers must agree on.
 *
 * The DOM preview and the Canvas2D export both call it, so agreement is
 * structural rather than a coincidence to be tested — what these pin is that
 * the choice is *sensible*, because the hero is printed three times larger than
 * everything else and picking "को" over "बताऊंगा" would emphasise a
 * postposition at 124px in a file the user has already approved.
 */
describe("heroWordIndex", () => {
  it("picks the longest word", () => {
    expect(heroWordIndex(["मैं", "आपको", "बताऊंगा"])).toBe(2);
    expect(heroWordIndex(["the", "biggest", "of"])).toBe(1);
  });

  it("prefers numbers and money over any longer word", () => {
    // "opportunity" is far longer, but the figure is what the line is about.
    expect(heroWordIndex(["a", "₹50,000", "opportunity"])).toBe(1);
    expect(heroWordIndex(["grew", "10X", "consistently"])).toBe(1);
    expect(heroWordIndex(["saved", "40%", "immediately"])).toBe(1);
  });

  it("breaks ties toward the later word", () => {
    // A page builds to its point, so the second of two equals is the payload.
    expect(heroWordIndex(["cash", "flow"])).toBe(1);
    expect(heroWordIndex(["aaa", "bbb", "ccc"])).toBe(2);
  });

  it("ignores the leading space words carry by Remotion convention", () => {
    expect(heroWordIndex([" mai", " powerpoint", " bhool"])).toBe(1);
  });

  it("handles the degenerate pages without throwing", () => {
    expect(heroWordIndex([])).toBe(-1);
    expect(heroWordIndex(["solo"])).toBe(0);
    expect(heroWordIndex(["", "  "])).toBe(1);
  });

  it("is stable — the same page always yields the same hero", () => {
    const page = ["तुम", "PowerPoint", "बनाना", "भूल"];
    const first = heroWordIndex(page);
    for (let i = 0; i < 20; i += 1) {
      expect(heroWordIndex(page)).toBe(first);
    }
    expect(first).toBe(1); // "PowerPoint"
  });
});
