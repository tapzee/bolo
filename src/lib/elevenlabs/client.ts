import "server-only";

import type { LanguageCode, ScribeResponse } from "./types";

/**
 * Server-only ElevenLabs wrapper.
 *
 * The `server-only` import at the top is load-bearing: it makes the build fail
 * if any client component ever imports this module, which is a far better
 * outcome than shipping the API key in a browser bundle and finding out later.
 */

const SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const MODEL_ID = "scribe_v1";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;
const REQUEST_TIMEOUT_MS = 300_000;

export type ScribeFailureKind =
  | "unauthorized"
  | "rate_limited"
  | "bad_audio"
  | "server_error"
  | "network"
  | "timeout"
  | "unknown";

export class ScribeError extends Error {
  readonly kind: ScribeFailureKind;
  readonly status: number | null;
  readonly retryAfterMs: number | null;

  constructor(
    kind: ScribeFailureKind,
    status: number | null,
    message: string,
    retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = "ScribeError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

const kindForStatus = (status: number): ScribeFailureKind => {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status === 422 || status === 400) return "bad_audio";
  if (status >= 500) return "server_error";
  return "unknown";
};

/** Only transient failures are worth another API call — 4xx will fail again. */
const isRetryable = (kind: ScribeFailureKind): boolean =>
  kind === "rate_limited" || kind === "server_error" || kind === "network";

const parseRetryAfter = (header: string | null): number | null => {
  if (header === null) return null;
  const seconds = Number.parseFloat(header);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : null;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface ScribeRequest {
  audio: Blob;
  filename: string;
  languageCode: LanguageCode;
}

const callOnce = async (
  { audio, filename, languageCode }: ScribeRequest,
  apiKey: string,
): Promise<ScribeResponse> => {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model_id", MODEL_ID);
  form.append("timestamps_granularity", "word");
  form.append("diarize", "false");
  form.append("tag_audio_events", "false");

  // Omitting the field entirely is how Scribe is told to auto-detect; sending
  // the literal string "auto" is rejected as an unknown language.
  if (languageCode !== "auto") {
    form.append("language_code", languageCode);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(SCRIBE_URL, {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new ScribeError(
      aborted ? "timeout" : "network",
      null,
      aborted ? "Transcription timed out" : "Network request failed",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const kind = kindForStatus(response.status);
    // Read the body for server-side diagnostics only. It can echo request
    // details, so it is never forwarded to the client.
    const detail = await response.text().catch(() => "");
    throw new ScribeError(
      kind,
      response.status,
      detail.slice(0, 500) || `HTTP ${response.status}`,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }

  return (await response.json()) as ScribeResponse;
};

/**
 * Calls Scribe with exponential backoff on transient failures only.
 *
 * Backoff is 1s → 2s → 4s, and a `Retry-After` header always wins over the
 * computed delay. Deliberately does not retry 4xx: a malformed audio file will
 * be just as malformed on the third attempt, and retrying burns both latency
 * and quota for a guaranteed failure.
 */
export const transcribeAudio = async (
  request: ScribeRequest,
): Promise<ScribeResponse> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new ScribeError(
      "unauthorized",
      null,
      "ELEVENLABS_API_KEY is not set",
    );
  }

  let lastError: ScribeError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await callOnce(request, apiKey);
    } catch (error) {
      const scribeError =
        error instanceof ScribeError
          ? error
          : new ScribeError("unknown", null, "Unexpected transcription failure");

      lastError = scribeError;

      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;
      if (!isRetryable(scribeError.kind) || isLastAttempt) throw scribeError;

      const backoff = BASE_BACKOFF_MS * 2 ** attempt;
      await sleep(scribeError.retryAfterMs ?? backoff);
    }
  }

  throw lastError ?? new ScribeError("unknown", null, "Transcription failed");
};
