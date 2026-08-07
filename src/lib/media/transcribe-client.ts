"use client";

import type { CaptionWord } from "@/core";
import type {
  CreditShortfall,
  LanguageCode,
  TranscribeFailure,
  TranscribeSuccess,
} from "@/lib/elevenlabs/types";

export class TranscriptionError extends Error {
  readonly code: string;
  readonly retryAfterMs: number | null;
  /** Set only for `insufficient_credits`. Drives the top-up offer. */
  readonly shortfall: CreditShortfall | null;

  constructor(
    code: string,
    message: string,
    retryAfterMs: number | null,
    shortfall: CreditShortfall | null = null,
  ) {
    super(message);
    this.name = "TranscriptionError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
    this.shortfall = shortfall;
  }
}

export interface TranscriptionResult {
  words: CaptionWord[];
  text: string;
  languageCode: string;
  languageProbability: number;
  creditsCharged: number;
}

/**
 * Content-addressed idempotency key: SHA-256 over the audio bytes plus the
 * language.
 *
 * Deliberately derived from content rather than randomly generated per attempt.
 * A random key changes on every submit, so it would not stop the exact case
 * that costs money — the user resubmitting the same video after a lost
 * response. Hashing the bytes means a replay is recognised even after a full
 * page reload, while two different videos can never collide.
 *
 * `crypto.subtle` needs a secure context; on plain http:// beyond localhost it
 * is undefined, so this degrades to no key rather than breaking the upload.
 */
const idempotencyKeyFor = async (
  audio: Blob,
  languageCode: string,
): Promise<string | null> => {
  if (typeof crypto === "undefined" || crypto.subtle === undefined) return null;

  try {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const salt = new TextEncoder().encode(`|${languageCode}`);
    const payload = new Uint8Array(bytes.length + salt.length);
    payload.set(bytes, 0);
    payload.set(salt, bytes.length);

    const digest = await crypto.subtle.digest("SHA-256", payload);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
};

/**
 * Posts extracted audio to our own API route.
 *
 * The route holds the ElevenLabs key; the browser never sees it and never talks
 * to ElevenLabs directly. The audio blob is the only thing that leaves the
 * device — the video itself stays local, which is the whole architecture.
 */
export const requestTranscription = async (
  audio: Blob,
  durationSeconds: number,
  languageCode: LanguageCode,
  signal?: AbortSignal,
  /**
   * Firebase ID token. The server verifies it and bills credits to that uid —
   * it never trusts a uid sent in the body. Omitted when signed out, which the
   * route handles as an anonymous request.
   */
  idToken?: string | null,
): Promise<TranscriptionResult> => {
  const idempotencyKey = await idempotencyKeyFor(audio, languageCode);
  const form = new FormData();
  form.append("file", audio, "audio.ogg");
  form.append("language_code", languageCode);
  form.append("duration_seconds", String(Math.round(durationSeconds)));

  let response: Response;
  try {
    response = await fetch("/api/transcribe", {
      method: "POST",
      body: form,
      signal,
      headers: {
        ...(idempotencyKey === null
          ? {}
          : { "Idempotency-Key": idempotencyKey }),
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TranscriptionError("cancelled", "Cancelled.", null);
    }
    throw new TranscriptionError(
      "network",
      "Connection issue. Please try again.",
      null,
    );
  }

  let body: TranscribeSuccess | TranscribeFailure;
  try {
    body = (await response.json()) as TranscribeSuccess | TranscribeFailure;
  } catch {
    throw new TranscriptionError(
      "unknown",
      "Transcription is unavailable right now. Please try again.",
      null,
    );
  }

  if (!body.ok) {
    throw new TranscriptionError(
      body.code,
      body.message,
      body.retryAfterMs ?? null,
      body.shortfall ?? null,
    );
  }

  return {
    words: body.words.map((word) => ({
      text: word.text,
      startMs: word.startMs,
      endMs: word.endMs,
      timestampMs: word.timestampMs,
      confidence: word.confidence,
    })),
    text: body.text,
    languageCode: body.languageCode,
    languageProbability: body.languageProbability,
    creditsCharged: body.creditsCharged,
  };
};
