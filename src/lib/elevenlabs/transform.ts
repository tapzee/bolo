import type { CaptionWord } from "@/core";
import type { ScribeResponse, ScribeWord } from "./types";

/**
 * Pure ElevenLabs → Remotion transform.
 *
 * No I/O, no clock, no randomness — same input always yields the same output,
 * which is what makes it unit-testable and safe to reuse in a future PWA or
 * Android shell.
 */

/** Below this, a "word" is a timing artefact rather than speech. */
const MIN_WORD_DURATION_MS = 20;

/**
 * ElevenLabs reports a natural-log probability, not a 0–1 confidence.
 * Exponentiating recovers the probability. Absent on some responses, so this
 * returns `null` rather than inventing a value — a fabricated 1.0 would make
 * the editor's low-confidence review flow silently useless.
 */
const toConfidence = (logprob: number | undefined): number | null => {
  if (logprob === undefined || !Number.isFinite(logprob)) return null;
  const p = Math.exp(logprob);
  return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : null;
};

const secondsToMs = (seconds: number): number => Math.round(seconds * 1000);

/**
 * Keeps only real speech.
 *
 * `spacing` entries carry the whitespace between words and `audio_event`
 * entries carry things like `(laughter)`; rendering either as a caption token
 * produces blank or bracketed words on screen.
 */
export const isSpeechWord = (word: ScribeWord): boolean =>
  word.type === "word" && word.text.trim().length > 0;

/**
 * Converts Scribe words into Remotion-compatible captions.
 *
 * Three conversions matter:
 *  1. Non-speech entries are dropped.
 *  2. Seconds become milliseconds — Remotion's entire caption model is in ms,
 *     and feeding it seconds silently renders every word in the first 60ms of
 *     the video.
 *  3. Values are rounded to integers. Float seconds accumulate drift once
 *     multiplied by 1000, and fractional milliseconds turn into fractional
 *     frames, which makes `spring()` inputs differ between preview and export.
 *
 * Also repairs two things real ASR output does that break rendering:
 *  - zero-length or inverted spans, which would make a word never register as
 *    active and skip its animation entirely
 *  - overlapping spans, where one word's end runs past the next word's start,
 *    which would light two words at once
 */
export const transformScribeWords = (
  words: readonly ScribeWord[],
): CaptionWord[] => {
  const speech = words.filter(isSpeechWord);
  const out: CaptionWord[] = [];

  for (const word of speech) {
    const startMs = secondsToMs(word.start);
    const rawEndMs = secondsToMs(word.end);

    // Guarantee a positive, non-trivial span.
    const endMs = Math.max(rawEndMs, startMs + MIN_WORD_DURATION_MS);

    const previous = out[out.length - 1];
    if (previous !== undefined && previous.endMs > startMs) {
      // Trim the previous word rather than pushing this one later: shifting
      // start times would desync captions from the audio, and drift compounds
      // across a long transcript.
      previous.endMs = Math.max(
        previous.startMs + MIN_WORD_DURATION_MS,
        startMs,
      );
      previous.timestampMs = Math.round(
        (previous.startMs + previous.endMs) / 2,
      );
    }

    out.push({
      text: word.text.trim(),
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      confidence: toConfidence(word.logprob),
    });
  }

  return out;
};

export interface TransformedTranscript {
  languageCode: string;
  languageProbability: number;
  text: string;
  words: CaptionWord[];
  /** Derived from the last word, not from the file — see below. */
  durationSeconds: number;
}

/**
 * Full response transform.
 *
 * `durationSeconds` comes from the last word's end time, which is *speech*
 * duration and can be shorter than the file. Billing must use the decoded file
 * duration instead, or a video with a long silent tail would be undercharged.
 */
export const transformScribeResponse = (
  response: ScribeResponse,
): TransformedTranscript => {
  const words = transformScribeWords(response.words ?? []);
  const last = words[words.length - 1];

  return {
    languageCode: response.language_code,
    languageProbability: response.language_probability,
    text: response.text,
    words,
    durationSeconds: last === undefined ? 0 : last.endMs / 1000,
  };
};
