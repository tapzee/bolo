import { describe, expect, it } from "vitest";

import { hasDevanagari, romanizeDevanagari } from "./romanize";

const cases: ReadonlyArray<readonly [string, string]> = [
  // The sentence the user asked for, word by word.
  ["क्या", "kya"],
  ["कर", "kar"],
  ["रहे", "rahe"],
  ["हो", "ho"],
  ["कहीं", "kahin"],
  ["चलो", "chalo"],
  ["आज", "aaj"],

  // Schwa deletion — the rules that make this readable at all.
  ["नमक", "namak"],
  ["लड़का", "ladka"],
  ["करना", "karna"],
  ["समझ", "samajh"],
  ["समझना", "samajhna"],
  // Cascade: द keeps its schwa (र् has none), which frees र to lose its own.
  ["सिरदर्द", "sirdard"],
  ["दर्द", "dard"],
  ["घूमने", "ghoomne"],
  ["कमरा", "kamra"],
  ["अपना", "apna"],

  // A single syllable keeps its vowel — "n" would be unpronounceable.
  ["न", "na"],
  ["से", "se"],

  // Conjuncts.
  ["प्यार", "pyaar"],
  ["स्कूल", "skool"],

  // Nukta letters.
  ["ज़रा", "zara"],
  ["मज़ा", "maza"],

  // Nasals.
  ["हैं", "hain"],
  ["मैं", "main"],
];

describe("romanizeDevanagari", () => {
  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      expect(romanizeDevanagari(input)).toBe(expected);
    });
  }

  it("does not delete the first syllable's schwa", () => {
    // Without the first-syllable guard this collapses to "bhut".
    expect(romanizeDevanagari("बहुत")).toBe("bahut");
  });

  it("leaves non-Devanagari text untouched", () => {
    expect(romanizeDevanagari("Hello friends!")).toBe("Hello friends!");
    expect(romanizeDevanagari("2024 — ok?")).toBe("2024 — ok?");
    expect(romanizeDevanagari("")).toBe("");
  });

  it("handles code-mixed text, transliterating only the Devanagari runs", () => {
    expect(romanizeDevanagari("Hello friends क्या कर रहे हो?")).toBe(
      "Hello friends kya kar rahe ho?",
    );
  });

  it("spells common English loanwords rather than transliterating them", () => {
    // Phonetic output would be "sabskraib" / "phrends", which reads as a bug.
    expect(romanizeDevanagari("सब्सक्राइब")).toBe("subscribe");
    expect(romanizeDevanagari("फ्रेंड्स")).toBe("friends");
  });

  it("never emits Devanagari or IAST diacritics", () => {
    const out = romanizeDevanagari(
      "यह रोग अचानक तीव्र ज्वर के साथ शुरू होता है। मांसपेशियों में दर्द होता है।",
    );
    expect(hasDevanagari(out)).toBe(false);
    expect(out).toMatch(/^[\x20-\x7E]*$/);
  });

  it("is idempotent on already-romanized text", () => {
    const once = romanizeDevanagari("क्या कर रहे हो");
    expect(romanizeDevanagari(once)).toBe(once);
  });
});

describe("hasDevanagari", () => {
  it("distinguishes the two scripts", () => {
    expect(hasDevanagari("क्या")).toBe(true);
    expect(hasDevanagari("kya")).toBe(false);
  });
});
