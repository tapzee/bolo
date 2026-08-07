/**
 * Wire types for the ElevenLabs Speech-to-Text API (`scribe_v1`).
 *
 * These describe what the API actually returns, not what we want it to return.
 * Everything is treated as untrusted until `transform.ts` narrows it.
 */

import type { CreditShortfall } from "@/core";

/**
 * `spacing` entries carry the whitespace between words and `audio_event`
 * entries carry things like `(laughter)`. Both are dropped before rendering —
 * only `word` produces a caption token.
 */
export type ScribeWordType = "word" | "spacing" | "audio_event";

export interface ScribeWord {
  text: string;
  /** Seconds from the start of the audio. */
  start: number;
  /** Seconds from the start of the audio. */
  end: number;
  type: ScribeWordType;
  speaker_id?: string;
  /**
   * Natural-log probability, when the model reports one. Not a 0–1 confidence:
   * it must be exponentiated. Absent on some responses, which is why the
   * transformed `confidence` is nullable.
   */
  logprob?: number;
}

export interface ScribeResponse {
  language_code: string;
  language_probability: number;
  text: string;
  words: ScribeWord[];
}

/**
 * Languages the transcription route accepts.
 *
 * A plain `string` rather than a union: the catalogue lives in
 * `core/i18n/languages` and is validated at the edge with
 * `isSupportedLanguage`. Duplicating 50 codes into a TypeScript union here
 * would guarantee the two drift apart.
 */
export type LanguageCode = string;

export const DEFAULT_LANGUAGE = "hi";

export { isSupportedLanguage as isLanguageCode } from "@/core";

/** Shape returned by `/api/transcribe` on success. */
export interface TranscribeSuccess {
  ok: true;
  languageCode: string;
  languageProbability: number;
  text: string;
  words: {
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number;
    confidence: number | null;
  }[];
  durationSeconds: number;
  creditsCharged: number;
}

/** Shape returned by `/api/transcribe` on failure. Never carries API internals. */
export interface TranscribeFailure {
  ok: false;
  /** Stable machine-readable code for the client to branch on. */
  code: TranscribeErrorCode;
  /** Copy intended to be shown to the user verbatim. */
  message: string;
  /** Present on 429 so the client knows how long to wait. */
  retryAfterMs?: number;
  /**
   * Present on 402. Numbers rather than the prose in `message`, because the
   * client has to turn this into a specific offer — which pack, which upgrade —
   * and parsing that back out of a sentence would be absurd.
   */
  shortfall?: CreditShortfall;
}

/**
 * Re-exported from core rather than redeclared.
 *
 * The client now computes a shortfall of its own before extraction starts, so
 * the same shape crosses the wire on a 402 and is built locally — two
 * structurally-identical interfaces would compile fine and drift apart the
 * first time a field is added to one of them.
 */
export type { CreditShortfall };

export type TranscribeErrorCode =
  | "unauthorized"
  | "empty_audio"
  | "unsupported_format"
  | "file_too_large"
  | "too_long"
  | "no_speech"
  | "insufficient_credits"
  | "rate_limited"
  | "bad_audio"
  | "service_misconfigured"
  | "network"
  | "unknown";

export type TranscribeResult = TranscribeSuccess | TranscribeFailure;
