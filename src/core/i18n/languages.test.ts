import { describe, expect, it } from "vitest";

import {
  ALL_LANGUAGES,
  INDIAN_LANGUAGES,
  isSupportedLanguage,
  languageForScript,
  scriptAppliesTo,
  scriptForLanguage,
} from "./languages";

describe("hinglish", () => {
  /**
   * The regression this pins was silent and cost the user the whole feature:
   * `/api/transcribe` validates the incoming code with `isSupportedLanguage`
   * and falls back to `DEFAULT_LANGUAGE` ("hi") for anything unrecognised. With
   * "hinglish" missing from the catalogue, picking it in the UI transcribed in
   * Devanagari and nothing anywhere errored.
   */
  it("is a supported code, so the route does not downgrade it to Devanagari", () => {
    expect(isSupportedLanguage("hinglish")).toBe(true);
  });

  it("is not duplicated into the Indian-languages dropdown", () => {
    expect(INDIAN_LANGUAGES.map((l) => l.code)).not.toContain("hinglish");
    expect(ALL_LANGUAGES.filter((l) => l.code === "hinglish")).toHaveLength(1);
  });
});

describe("script picker", () => {
  it("round-trips both scripts", () => {
    for (const script of ["latin", "devanagari"] as const) {
      expect(scriptForLanguage(languageForScript(script))).toBe(script);
    }
  });

  it("maps Latin to hinglish and Devanagari to hi", () => {
    expect(languageForScript("latin")).toBe("hinglish");
    expect(languageForScript("devanagari")).toBe("hi");
  });

  it("only applies to Hindi audio", () => {
    expect(scriptAppliesTo("hi")).toBe(true);
    expect(scriptAppliesTo("hinglish")).toBe(true);
    expect(scriptAppliesTo("ta")).toBe(false);
    expect(scriptAppliesTo("en")).toBe(false);
    expect(scriptAppliesTo("auto")).toBe(false);
  });
});
