"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionWord } from "@/core";
import { creditShortfall, validateDuration, validateVideoFile } from "@/core";
import type { CreditShortfall, LanguageCode } from "@/lib/elevenlabs/types";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCredits } from "@/lib/credits/use-credits";
import { ExtractionError, extractAudio } from "./extract-audio";
import { probeVideo, type VideoMetadata } from "./probe-video";
import { TranscriptionError, requestTranscription } from "./transcribe-client";
import { computeWaveformPeaks } from "./waveform";
import {
  cacheVideo,
  cachedVideoToFile,
  getCachedVideo,
  projectIdForFile,
} from "@/lib/storage/video-cache";

export type PipelineStage =
  | "idle"
  | "probing"
  | "extracting"
  | "transcribing"
  | "ready"
  | "error";

export interface PipelineState {
  stage: PipelineStage;
  /** 0–1, or -1 when the current step has no measurable progress. */
  progress: number;
  /** Short line describing what is happening, shown under the progress bar. */
  detail: string;
  file: File | null;
  video: VideoMetadata | null;
  words: readonly CaptionWord[];
  transcriptText: string;
  detectedLanguage: string | null;
  audioBytes: number;
  /** Normalised 0–1 envelope for the timeline waveform. Empty if undecodable. */
  peaks: readonly number[];
  error: {
    code: string;
    message: string;
    /** Only on `insufficient_credits` — what the credit wall needs to price. */
    shortfall: CreditShortfall | null;
  } | null;
  /**
   * True when the extracted audio is still held and transcription can be
   * retried without touching the video again. See `retryTranscription`.
   */
  canRetryTranscription: boolean;
}

/** Everything needed to re-run the transcription step on its own. */
interface PendingTranscription {
  file: File;
  video: VideoMetadata;
  audio: Blob;
  audioBytes: number;
  languageCode: LanguageCode;
}

const INITIAL: PipelineState = {
  stage: "idle",
  progress: 0,
  detail: "",
  file: null,
  video: null,
  words: [],
  transcriptText: "",
  detectedLanguage: null,
  audioBytes: 0,
  peaks: [],
  error: null,
  canRetryTranscription: false,
};

const PHASE_DETAIL: Record<string, string> = {
  "loading-core": "Loading the audio engine (one time, ~31MB)…",
  reading: "Reading your video…",
  extracting: "Extracting audio…",
  finalising: "Finishing up…",
};

/**
 * Drives upload → probe → extract → transcribe.
 *
 * Ordered so the cheapest checks fail first: format and size are rejected
 * before anything is read, duration is rejected after a metadata-only probe,
 * and only then does the expensive wasm work start. That ordering is what stops
 * a wrong file from costing a 31MB core download and a wasted API call.
 */
export const useCaptionPipeline = () => {
  const [state, setState] = useState<PipelineState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  /**
   * The extracted audio, kept alive after a failed transcription.
   *
   * This is what makes the credit wall recoverable. Getting here cost a ~31MB
   * wasm download and a full decode of the video; throwing that away because
   * the balance was short would mean the user has to drop the file in and wait
   * through it all again *after* paying us, which is the worst possible moment
   * to ask for patience. The blob itself is a few hundred KB.
   */
  const pendingRef = useRef<PendingTranscription | null>(null);
  /**
   * The file a pre-flight balance check refused, so the same file can be picked
   * up after a top-up. There is no audio to hold in this case — the whole point
   * is that we stopped before extracting any — so `pendingRef` cannot carry it.
   */
  const blockedRef = useRef<{ file: File; languageCode: LanguageCode } | null>(
    null,
  );
  const { getIdToken, user } = useAuth();

  /**
   * The live balance, mirrored into a ref.
   *
   * A ref rather than a dependency of `start`: the balance changes on its own
   * (the server deducts credits when a transcription lands) and rebuilding
   * `start` on every one of those would churn every effect downstream that
   * depends on it. `start` only needs the value at the instant it is called.
   *
   * `known` is false while auth or the first snapshot is in flight, and for
   * signed-out visitors, whose zero balance is an absence of information rather
   * than an empty account. Guessing there would refuse a video to someone who
   * has plenty of credit but has not finished signing in.
   */
  const credits = useCredits();
  const balanceRef = useRef({ credits: 0, known: false });
  balanceRef.current = {
    credits: credits.creditsRemaining,
    known: user !== null && !credits.loading && credits.error === null,
  };

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // A leaked object URL pins the whole video file in memory, which on a 500MB
  // upload is immediately visible in the tab's footprint.
  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    pendingRef.current = null;
    blockedRef.current = null;
    releaseObjectUrl();
    setState(INITIAL);
  }, [releaseObjectUrl]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, stage: "idle", progress: 0, detail: "" }));
  }, []);

  /**
   * The transcription leg, split out so `start` and `retryTranscription` share
   * one code path. Two copies of this would drift, and the copy that drifted
   * would be the retry — the one that runs after the user has paid.
   */
  const runTranscription = useCallback(
    async (pending: PendingTranscription, controller: AbortController) => {
      pendingRef.current = pending;
      const { file, video, audio, audioBytes, languageCode } = pending;

      setState((prev) => ({
        ...prev,
        stage: "transcribing",
        progress: -1,
        audioBytes,
        detail: "Transcribing with ElevenLabs…",
        error: null,
      }));

      // Runs alongside the network request rather than before it — the decode
      // takes a moment and there is no reason to make the user wait twice.
      const peaksPromise = computeWaveformPeaks(audio);

      try {
        // Fetched at send time, not at mount: tokens expire after an hour and a
        // stale one would be rejected, silently billing the request as anonymous.
        const idToken = await getIdToken();

        const result = await requestTranscription(
          audio,
          video.durationSeconds,
          languageCode,
          controller.signal,
          idToken,
        );

        if (controller.signal.aborted) return;

        const peaks = await peaksPromise;
        if (controller.signal.aborted) return;

        // Cache the video locally so this project can be reopened later without
        // re-dropping the file. Deliberately not awaited: a 200MB IndexedDB
        // write takes a moment and must not delay the editor becoming usable.
        // A failure here is silent by design — caching is an enhancement, and
        // the captions themselves are already safe.
        void cacheVideo({
          id: projectIdForFile(file),
          blob: file,
          name: file.name,
          type: file.type,
          width: video.width,
          height: video.height,
          durationSeconds: video.durationSeconds,
          savedAt: Date.now(),
        });

        // The transcript is safe now, so stop holding the audio.
        pendingRef.current = null;

        setState((prev) => ({
          ...prev,
          stage: "ready",
          progress: 1,
          detail: "",
          words: result.words,
          transcriptText: result.text,
          detectedLanguage: result.languageCode,
          peaks,
          error: null,
          canRetryTranscription: false,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        const failure =
          error instanceof TranscriptionError ? error : null;
        setState((prev) => ({
          ...prev,
          stage: "error",
          error: {
            code: failure?.code ?? "unknown",
            message:
              error instanceof Error
                ? error.message
                : "Transcription failed. Please try again.",
            shortfall: failure?.shortfall ?? null,
          },
          // The audio is still held, so this is recoverable without the video —
          // true for a short balance and equally for a dropped connection.
          canRetryTranscription: true,
        }));
      }
    },
    [getIdToken],
  );

  const start = useCallback(
    async (file: File, languageCode: LanguageCode = "hi") => {
      abortRef.current?.abort();
      releaseObjectUrl();

      const controller = new AbortController();
      abortRef.current = controller;

      const rejection = validateVideoFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (rejection !== null) {
        setState({
          ...INITIAL,
          stage: "error",
          error: {
            code: rejection.code,
            message: rejection.message,
            shortfall: null,
          },
        });
        return;
      }

      setState({
        ...INITIAL,
        stage: "probing",
        progress: -1,
        detail: "Reading video details…",
        file,
      });

      let video: VideoMetadata;
      try {
        video = await probeVideo(file);
      } catch (error) {
        setState({
          ...INITIAL,
          stage: "error",
          file,
          error: {
            code: "probe_failed",
            message:
              error instanceof Error
                ? error.message
                : "Could not read that video.",
            shortfall: null,
          },
        });
        return;
      }

      objectUrlRef.current = video.objectUrl;

      const tooLong = validateDuration(video.durationSeconds);
      if (tooLong !== null) {
        setState({
          ...INITIAL,
          stage: "error",
          file,
          video,
          error: {
            code: tooLong.code,
            message: tooLong.message,
            shortfall: null,
          },
        });
        return;
      }

      /**
       * Balance check, before a single byte of the video is decoded.
       *
       * The server refuses a short balance too, and that check is the one that
       * actually protects the money — this one cannot be trusted, since the
       * balance it reads comes from a client-side subscription. What this one
       * protects is the user's time. Reaching the server's 402 means having
       * already sat through a 31MB wasm download and a full decode of the
       * video, only to be told at the end that it was never going to work. For
       * a 3-minute clip against a 2:59 balance that is several minutes of
       * someone's evening spent on a foregone conclusion.
       *
       * The file is kept, so this is recoverable in place: top up, press
       * continue, and the run picks up from the file already in the browser.
       */
      const balance = balanceRef.current;
      if (balance.known) {
        const shortfall = creditShortfall(
          balance.credits,
          video.durationSeconds,
        );

        if (shortfall !== null) {
          blockedRef.current = { file, languageCode };
          setState({
            ...INITIAL,
            stage: "error",
            file,
            video,
            error: {
              code: "insufficient_credits",
              message: `This video needs ${shortfall.requiredCredits} credits and you have ${shortfall.availableCredits}.`,
              shortfall,
            },
            // Nothing has been extracted, but the file is still here, so the
            // credit wall should offer to continue rather than send the user
            // back to the dropzone. `retryTranscription` restarts from it.
            canRetryTranscription: true,
          });
          return;
        }
      }

      blockedRef.current = null;

      setState((prev) => ({
        ...prev,
        stage: "extracting",
        video,
        progress: -1,
        detail: PHASE_DETAIL["loading-core"] ?? "",
      }));

      let audio: Awaited<ReturnType<typeof extractAudio>>;
      try {
        audio = await extractAudio(file, video.durationSeconds, {
          signal: controller.signal,
          onProgress: ({ phase, ratio }) => {
            setState((prev) =>
              prev.stage === "extracting"
                ? {
                    ...prev,
                    progress: ratio,
                    detail: PHASE_DETAIL[phase] ?? prev.detail,
                  }
                : prev,
            );
          },
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          stage: "error",
          error: {
            code: error instanceof ExtractionError ? error.code : "failed",
            message:
              error instanceof Error
                ? error.message
                : "We couldn't get the audio out of that video.",
            shortfall: null,
          },
        }));
        return;
      }

      if (controller.signal.aborted) return;

      await runTranscription(
        {
          file,
          video,
          audio: audio.blob,
          audioBytes: audio.bytes,
          languageCode,
        },
        controller,
      );
    },
    [releaseObjectUrl, runTranscription],
  );

  /**
   * Picks the run back up after a credit wall, without asking for the file.
   *
   * The one case this exists for: the balance was short, the user topped up,
   * and asking them to drop the file in again after paying would be
   * indefensible. It also happens to cover a dropped connection for free.
   *
   * Two shapes of "short balance" reach here and they resume differently. A
   * server 402 arrives after extraction, so the audio is held and resuming is a
   * single request. A pre-flight refusal stops before extraction, so there is
   * no audio — only the file — and resuming re-enters `start`, which re-probes
   * and re-checks the balance. Both are cheap and neither re-uploads anything,
   * because nothing was ever uploaded.
   *
   * Returns false when neither is held — the caller should ask for the file
   * again rather than showing a button that does nothing.
   */
  const retryTranscription = useCallback(async (): Promise<boolean> => {
    const pending = pendingRef.current;

    if (pending === null) {
      const blocked = blockedRef.current;
      if (blocked === null) return false;
      await start(blocked.file, blocked.languageCode);
      return true;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    await runTranscription(pending, controller);
    return true;
  }, [runTranscription, start]);

  /**
   * Reopens a saved project without re-transcribing.
   *
   * Pulls the video back out of IndexedDB and re-probes it locally, then drops
   * the caller's saved words straight in. No audio extraction and no API call —
   * the transcript is already known, so charging credits again to recover it
   * would be indefensible.
   *
   * Returns false when the cached video is gone (browsers evict IndexedDB under
   * storage pressure), so the caller can ask for the file again rather than
   * showing an empty editor.
   */
  const restore = useCallback(
    async (
      projectId: string,
      words: readonly CaptionWord[],
      title: string,
    ): Promise<boolean> => {
      const cached = await getCachedVideo(projectId);
      if (cached === null) return false;

      releaseObjectUrl();
      const file = cachedVideoToFile(cached);

      let video: VideoMetadata;
      try {
        video = await probeVideo(file);
      } catch {
        return false;
      }
      objectUrlRef.current = video.objectUrl;

      setState({
        ...INITIAL,
        stage: "ready",
        progress: 1,
        file,
        video,
        words: [...words],
        transcriptText: words.map((word) => word.text).join(" "),
        detail: title,
      });

      // Waveform is derived from audio we no longer hold, so it is rebuilt from
      // the video itself in the background. The editor is usable without it.
      void (async () => {
        const peaks = await computeWaveformPeaks(cached.blob).catch(() => []);
        if (peaks.length > 0) {
          setState((prev) => (prev.stage === "ready" ? { ...prev, peaks } : prev));
        }
      })();

      return true;
    },
    [releaseObjectUrl],
  );

  return { state, start, cancel, reset, restore, retryTranscription };
};
