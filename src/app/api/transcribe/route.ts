import { NextResponse } from "next/server";
import { creditsForSeconds } from "@/core";
import { ScribeError, transcribeAudio } from "@/lib/elevenlabs/client";
import { transformScribeResponse } from "@/lib/elevenlabs/transform";
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  type CreditShortfall,
  type TranscribeErrorCode,
  type TranscribeFailure,
  type TranscribeSuccess,
} from "@/lib/elevenlabs/types";
import { canAfford, creditStore } from "@/lib/credits/store";
import { creditStoreFor } from "@/lib/credits/firestore-store";
import { recordLedgerEntry } from "@/lib/credits/ledger";
import { verifyRequestUid } from "@/lib/firebase/admin";
import { recordTranscription } from "@/lib/admin/usage";
import {
  beginIdempotent,
  completeIdempotent,
  isValidIdempotencyKey,
  releaseIdempotent,
} from "@/lib/idempotency";
// Rate limiting is now keyed on the verified uid rather than IP — sign-in is
// required, so there is no anonymous caller left to identify by address.
import { rateLimit } from "@/lib/rate-limit";

// Node runtime: the edge runtime caps request body size well below the audio we
// accept, and `server-only` modules in the chain expect Node APIs.
export const runtime = "nodejs";
export const maxDuration = 300;

/** ElevenLabs hard limit. */
const MAX_FILE_BYTES = 1024 * 1024 * 1024;
/** Cost guardrail — a single request should never be able to run up a bill. */
const MAX_DURATION_SECONDS = 30 * 60;
/** Rough Scribe list price, for server-side cost logging only. */
const USD_PER_AUDIO_HOUR = 0.4;

const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const ACCEPTED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "video/mp4",
  "video/webm",
]);

const fail = (
  code: TranscribeErrorCode,
  message: string,
  status: number,
  retryAfterMs?: number,
  shortfall?: CreditShortfall,
): NextResponse<TranscribeFailure> => {
  const body: TranscribeFailure = { ok: false, code, message };
  if (retryAfterMs !== undefined) body.retryAfterMs = retryAfterMs;
  if (shortfall !== undefined) body.shortfall = shortfall;
  return NextResponse.json(body, { status });
};

/**
 * Maps a Scribe failure to user-facing copy.
 *
 * Nothing from the upstream error crosses this boundary. The raw body can echo
 * request details and, on a misconfiguration, parts of the credentials — so it
 * is logged server-side and replaced with fixed copy in the response.
 */
const mapScribeError = (error: ScribeError): NextResponse<TranscribeFailure> => {
  switch (error.kind) {
    case "unauthorized":
      return fail(
        "service_misconfigured",
        "Service configuration issue. Please contact support.",
        502,
      );
    case "rate_limited":
      return fail(
        "rate_limited",
        "Too many requests. Retrying in a moment…",
        429,
        error.retryAfterMs ?? 4000,
      );
    case "bad_audio":
      return fail(
        "bad_audio",
        "We couldn't read this audio. Try re-uploading.",
        422,
      );
    case "timeout":
    case "network":
      return fail("network", "Connection issue. Please try again.", 504);
    case "server_error":
    case "unknown":
      return fail(
        "unknown",
        "Transcription is unavailable right now. Please try again.",
        502,
      );
  }
};

export async function POST(
  request: Request,
): Promise<NextResponse<TranscribeSuccess | TranscribeFailure>> {
  // The uid comes from a *verified* ID token, never from a header or body field
  // the client controls — otherwise anyone could spend anyone else's credits.
  const uid = await verifyRequestUid(request);

  // Sign-in is required. This is the only place it can actually be enforced:
  // a client-side gate stops a person clicking through the UI, but anyone can
  // POST straight at this route, and transcription costs real money per call.
  if (uid === null) {
    return fail(
      "unauthorized",
      "Please sign in to transcribe a video.",
      401,
    );
  }

  const identity = uid;

  // Firestore ledger, always — an authenticated caller has a durable balance,
  // so there is no longer any path that bills against in-memory state.
  const ledger = creditStoreFor(uid) ?? creditStore;

  const limit = rateLimit(identity, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS);
  if (!limit.allowed) {
    return fail(
      "rate_limited",
      "Too many requests. Retrying in a moment…",
      429,
      limit.retryAfterMs,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad_audio", "We couldn't read this audio. Try re-uploading.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return fail("empty_audio", "No audio found in this video.", 400);
  }

  if (file.size > MAX_FILE_BYTES) {
    return fail("file_too_large", "That audio file is too large to process.", 413);
  }

  // An empty or generic type is normal for a Blob assembled in the browser, so
  // it is allowed through and left for Scribe to reject as bad audio. Only a
  // positively wrong type is refused here.
  const mime = file.type.split(";")[0]?.trim() ?? "";
  const typeIsKnownBad =
    mime.length > 0 &&
    mime !== "application/octet-stream" &&
    !ACCEPTED_AUDIO_TYPES.has(mime);

  if (typeIsKnownBad) {
    return fail(
      "unsupported_format",
      "That file format isn't supported. Try MP3, M4A, WAV or WebM.",
      415,
    );
  }

  const languageRaw = String(form.get("language_code") ?? DEFAULT_LANGUAGE);
  const languageCode = isLanguageCode(languageRaw)
    ? languageRaw
    : DEFAULT_LANGUAGE;

  // Client-reported duration. Treated as a hint for cheap pre-checks only —
  // billing below uses the larger of this and the transcript's own span, so
  // under-reporting it cannot buy a discount beyond the silence in the file.
  const durationHint = Number.parseFloat(
    String(form.get("duration_seconds") ?? "0"),
  );
  const hintSeconds =
    Number.isFinite(durationHint) && durationHint > 0 ? durationHint : 0;

  if (hintSeconds > MAX_DURATION_SECONDS) {
    return fail(
      "too_long",
      "That video is longer than 30 minutes. Try a shorter clip.",
      413,
    );
  }

  if (hintSeconds > 0) {
    const affordability = await canAfford(identity, hintSeconds, ledger);
    if (!affordability.ok) {
      // The message stays prose for anything that shows a raw error, but the
      // numbers travel separately so the client can price the exact top-up
      // instead of telling the user to go and work it out.
      return fail(
        "insufficient_credits",
        `You need ${affordability.required} credits for this video and have ${affordability.available}.`,
        402,
        undefined,
        {
          requiredCredits: affordability.required,
          availableCredits: affordability.available,
          requiredSeconds: Math.round(hintSeconds),
        },
      );
    }
  }

  // Claimed only now — after every cheap rejection — so a malformed request
  // never occupies a key, and only real API work is deduplicated.
  const rawKey = request.headers.get("idempotency-key");
  const idempotencyKey =
    rawKey !== null && isValidIdempotencyKey(rawKey) ? rawKey : null;

  if (idempotencyKey !== null) {
    const claim = beginIdempotent<TranscribeSuccess>(idempotencyKey);

    if (claim.status === "replay") {
      // Same audio already transcribed. Return the stored result without
      // calling the API or charging a second time.
      console.info("[transcribe] idempotent replay", { creditsCharged: 0 });
      return NextResponse.json(claim.result);
    }

    if (claim.status === "in_flight") {
      return fail(
        "rate_limited",
        "Still working on that video. Give it a moment…",
        409,
        3000,
      );
    }
  }

  const abandonClaim = (): void => {
    if (idempotencyKey !== null) releaseIdempotent(idempotencyKey);
  };

  let transcript: ReturnType<typeof transformScribeResponse>;
  try {
    const response = await transcribeAudio({
      audio: file,
      filename: file instanceof File ? file.name : "audio.webm",
      languageCode,
    });
    transcript = transformScribeResponse(response);
  } catch (error) {
    // Must release before every early return, or the user's legitimate retry
    // would be answered with `in_flight` until the pending entry expires.
    abandonClaim();

    if (error instanceof ScribeError) {
      console.error("[transcribe] scribe failure", {
        kind: error.kind,
        status: error.status,
        // The message may carry upstream detail; it stays server-side.
        message: error.message,
      });
      return mapScribeError(error);
    }
    console.error("[transcribe] unexpected failure", error);
    return fail(
      "unknown",
      "Transcription is unavailable right now. Please try again.",
      500,
    );
  }

  if (transcript.words.length === 0) {
    abandonClaim();
    // No speech is a legitimate outcome, not a failure the user should pay for.
    return fail("no_speech", "No speech detected in this video.", 422);
  }

  // Bill on the longer of the two signals so a long silent tail is not free,
  // and a missing/short client hint cannot undercut the real speech length.
  const billableSeconds = Math.max(hintSeconds, transcript.durationSeconds);
  const creditsCharged = creditsForSeconds(billableSeconds);

  try {
    const balanceAfter = await ledger.charge(identity, creditsCharged);

    // The user's own history. Written only after a charge that actually
    // succeeded, so the list can never show a deduction that did not happen.
    void recordLedgerEntry({
      uid: identity,
      kind: "spend",
      credits: -creditsCharged,
      balanceAfter,
      note: `${Math.round(billableSeconds)}s transcribed`,
    });
  } catch {
    // The API call already succeeded, so the work is done and paid for
    // upstream. Returning the transcript is the right call — refusing it would
    // charge us and give the user nothing. Logged for reconciliation.
    console.warn("[transcribe] charge failed after success", {
      identity,
      creditsCharged,
    });
  }

  // Best-effort usage ledger for the admin panel. Not awaited on the critical
  // path — the user's transcript should not wait on telemetry.
  void recordTranscription({
    seconds: billableSeconds,
    creditsCharged,
    languageCode: transcript.languageCode,
    uid,
  });

  console.info("[transcribe] ok", {
    languageCode: transcript.languageCode,
    words: transcript.words.length,
    billableSeconds: Math.round(billableSeconds),
    creditsCharged,
    estimatedUsd: Number(
      ((billableSeconds / 3600) * USD_PER_AUDIO_HOUR).toFixed(4),
    ),
  });

  const body: TranscribeSuccess = {
    ok: true,
    languageCode: transcript.languageCode,
    languageProbability: transcript.languageProbability,
    text: transcript.text,
    words: transcript.words.map((word) => ({
      text: word.text,
      startMs: word.startMs,
      endMs: word.endMs,
      timestampMs: word.timestampMs ?? Math.round((word.startMs + word.endMs) / 2),
      confidence: word.confidence,
    })),
    durationSeconds: Number(billableSeconds.toFixed(2)),
    creditsCharged,
  };

  if (idempotencyKey !== null) completeIdempotent(idempotencyKey, body);

  return NextResponse.json(body);
}
