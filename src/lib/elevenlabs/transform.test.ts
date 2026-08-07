import { describe, expect, it } from "vitest";
import { transformScribeResponse, transformScribeWords } from "./transform";
import type { ScribeResponse, ScribeWord } from "./types";

const word = (
  text: string,
  start: number,
  end: number,
  extra: Partial<ScribeWord> = {},
): ScribeWord => ({ text, start, end, type: "word", ...extra });

describe("transformScribeWords", () => {
  it("converts seconds to whole milliseconds", () => {
    const [first] = transformScribeWords([word("Yaar", 0.12, 0.48)]);

    expect(first).toMatchObject({ text: "Yaar", startMs: 120, endMs: 480 });
    expect(Number.isInteger(first?.startMs)).toBe(true);
    expect(Number.isInteger(first?.endMs)).toBe(true);
  });

  it("rounds rather than truncates, so timings do not drift early", () => {
    const [first] = transformScribeWords([word("aaj", 0.5266, 0.7891)]);
    expect(first).toMatchObject({ startMs: 527, endMs: 789 });
  });

  it("drops spacing and audio_event entries", () => {
    const result = transformScribeWords([
      word("Yaar", 0.1, 0.4),
      { text: " ", start: 0.4, end: 0.45, type: "spacing" },
      { text: "(laughter)", start: 0.45, end: 0.9, type: "audio_event" },
      word("aaj", 0.9, 1.2),
    ]);

    expect(result.map((w) => w.text)).toEqual(["Yaar", "aaj"]);
  });

  it("drops whitespace-only words typed as word", () => {
    const result = transformScribeWords([word("   ", 0.1, 0.2), word("ok", 0.3, 0.5)]);
    expect(result.map((w) => w.text)).toEqual(["ok"]);
  });

  it("sets timestampMs to the midpoint", () => {
    const [first] = transformScribeWords([word("x", 1, 2)]);
    expect(first?.timestampMs).toBe(1500);
  });

  it("gives zero-length spans a minimum duration so they can become active", () => {
    const [first] = transformScribeWords([word("x", 1.0, 1.0)]);
    expect(first?.endMs).toBeGreaterThan(first?.startMs ?? 0);
  });

  it("trims an overlapping previous word instead of shifting the next one", () => {
    // Shifting starts would desync captions from audio, and the error compounds.
    const result = transformScribeWords([
      word("पहला", 1.0, 1.6),
      word("दूसरा", 1.4, 2.0),
    ]);

    expect(result[0]?.endMs).toBe(1400);
    expect(result[1]?.startMs).toBe(1400);
    expect(result[0]?.timestampMs).toBe(1200);
  });

  it("exponentiates logprob into a 0-1 confidence", () => {
    const [first] = transformScribeWords([word("x", 0, 1, { logprob: Math.log(0.5) })]);
    expect(first?.confidence).toBeCloseTo(0.5, 6);
  });

  it("returns null confidence when the model reports none", () => {
    const [first] = transformScribeWords([word("x", 0, 1)]);
    expect(first?.confidence).toBeNull();
  });

  it("preserves Devanagari and mixed Hinglish text unchanged", () => {
    const result = transformScribeWords([
      word("बताऊंगा", 0.1, 0.6),
      word("income", 0.7, 1.1),
      word("छोड़ो", 1.2, 1.6),
    ]);

    expect(result.map((w) => w.text)).toEqual(["बताऊंगा", "income", "छोड़ो"]);
  });

  it("returns an empty array for an empty word list", () => {
    expect(transformScribeWords([])).toEqual([]);
  });
});

describe("transformScribeResponse", () => {
  const response = (words: ScribeWord[]): ScribeResponse => ({
    language_code: "hi",
    language_probability: 0.98,
    text: words.map((w) => w.text).join(" "),
    words,
  });

  it("derives duration from the last word's end", () => {
    const result = transformScribeResponse(
      response([word("a", 0.1, 0.5), word("b", 0.6, 2.25)]),
    );

    expect(result.durationSeconds).toBe(2.25);
    expect(result.languageCode).toBe("hi");
  });

  it("reports zero duration when nothing was transcribed", () => {
    const result = transformScribeResponse(response([]));
    expect(result.durationSeconds).toBe(0);
    expect(result.words).toEqual([]);
  });
});
