import { describe, expect, it } from "vitest";

import { analyzeWordRoles } from "./roles";
import type { CaptionWord, WordRole } from "./types";

const words = (texts: readonly string[]): CaptionWord[] =>
  texts.map((text, index) => ({
    text,
    startMs: index * 300,
    endMs: index * 300 + 250,
    timestampMs: index * 300 + 125,
    confidence: 1,
  }));

const rolesFor = (texts: readonly string[]): WordRole[] =>
  analyzeWordRoles(words(texts));

describe("analyzeWordRoles", () => {
  it("never overwrites a word's existing role", () => {
    const input = words(["आपको", "customers", "चाहिए"]);
    input[1]!.role = "supporting"; // deliberately "wrong" so the test can tell
    const roles = analyzeWordRoles(input);
    expect(roles[1]).toBe("supporting");
  });

  it("classifies the spec's own worked example sensibly", () => {
    // "Instagram से सिर्फ likes मिलते हैं"
    const roles = rolesFor(["Instagram", "से", "सिर्फ", "likes", "मिलते", "हैं"]);
    expect(roles[1]).toBe("connector"); // से
    expect(roles[2]).toBe("emphasis"); // सिर्फ
    expect(roles[3]).toBe("keyword"); // likes
    expect(roles[5]).toBe("connector"); // हैं
    // Instagram is the single longest open-class word on the page.
    expect(roles[0]).toBe("critical");
  });

  it("detects English connectors in a plain English sentence", () => {
    // "Your business needs more customers"
    const roles = rolesFor(["Your", "business", "needs", "more", "customers"]);
    expect(roles).toContain("critical");
    expect(roles.filter((r) => r === "critical")).toHaveLength(1);
  });

  it("detects Hindi connectors and a CTA verb", () => {
    // "आपको ज्यादा customers चाहिए"
    const roles = rolesFor(["आपको", "ज्यादा", "customers", "चाहिए"]);
    expect(roles[1]).toBe("emphasis"); // ज्यादा
    expect(roles[3]).toBe("cta"); // चाहिए
  });

  it("handles Hinglish + Devanagari mixed lines", () => {
    // "Free में website बनाना आसान है"
    const roles = rolesFor(["Free", "में", "website", "बनाना", "आसान", "है"]);
    expect(roles[1]).toBe("connector"); // में
    expect(roles[5]).toBe("connector"); // है
  });

  it("treats long content words as keyword/critical, never connector or supporting", () => {
    const roles = rolesFor(["Entrepreneurship", "International", "Customization"]);
    for (const role of roles) {
      expect(["keyword", "critical"]).toContain(role);
    }
  });

  it("treats short acronyms as keywords, not filler", () => {
    expect(rolesFor(["AI"])[0]).toBe("keyword");
    expect(rolesFor(["SEO"])[0]).toBe("keyword");
  });

  it("routes short question/negation words correctly instead of as filler", () => {
    expect(rolesFor(["WHY"])[0]).toBe("question");
    expect(rolesFor(["NO"])[0]).toBe("emphasis");
  });

  it("detects numbers, currency and multipliers", () => {
    expect(rolesFor(["100+", "clients"])[0]).toBe("number");
    expect(rolesFor(["₹999"])[0]).toBe("number");
    expect(rolesFor(["3X"])[0]).toBe("number");
  });

  it("detects a trailing question mark on the last word", () => {
    // "Why do customers leave?"
    const roles = rolesFor(["Why", "do", "customers", "leave?"]);
    expect(roles[0]).toBe("question"); // dictionary hit
    expect(roles[3]).toBe("question"); // trailing "?" on the last word
  });

  it("bridges the legacy emphasis field when no dictionary rule applies", () => {
    const input = words(["Zephyrine"]);
    input[0]!.emphasis = "important";
    expect(analyzeWordRoles(input)[0]).toBe("critical");

    const input2 = words(["Zephyrine"]);
    input2[0]!.emphasis = "special";
    expect(analyzeWordRoles(input2)[0]).toBe("special");
  });

  it("returns one role per word, always", () => {
    const texts = ["Free", "में", "website", "बनाना", "आसान", "है", "100+", "AI"];
    expect(rolesFor(texts)).toHaveLength(texts.length);
  });
});
