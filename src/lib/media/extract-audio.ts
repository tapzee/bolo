"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/**
 * Browser-side audio extraction.
 *
 * WHERE THIS RUNS — worth being precise, because the requirement is that the UI
 * never blocks. `@ffmpeg/ffmpeg` v0.12's `FFmpeg` class is a thin RPC proxy: it
 * spawns its own dedicated Web Worker and every `exec`/`writeFile`/`readFile`
 * is a postMessage into it. All wasm decoding and encoding therefore happens
 * off the main thread already. Wrapping it in a *second* worker of our own
 * would only add a nested-worker dependency for no scheduling benefit.
 *
 * The only main-thread work left is `file.arrayBuffer()`, which is async, and
 * handing the result to `writeFile`, which transfers the buffer rather than
 * copying it. Neither blocks paint.
 *
 * PRIVACY — this is the core architectural promise. The video is read from the
 * user's disk into this tab's memory and never touches the network. Only the
 * extracted audio is uploaded, and only to our own API route.
 */

export type ExtractionPhase =
  | "loading-core"
  | "reading"
  | "extracting"
  | "finalising";

export interface ExtractionProgress {
  phase: ExtractionPhase;
  /** 0–1 within the current phase. -1 when the phase is indeterminate. */
  ratio: number;
}

export interface ExtractedAudio {
  blob: Blob;
  mime: string;
  bytes: number;
}

export class ExtractionError extends Error {
  readonly code: "core_load" | "no_audio_track" | "out_of_memory" | "failed";

  constructor(
    code: "core_load" | "no_audio_track" | "out_of_memory" | "failed",
    message: string,
  ) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
  }
}

const CORE_BASE = "/ffmpeg";
const OUTPUT_NAME = "bolo-audio.ogg";
const OUTPUT_MIME = "audio/ogg";

/**
 * 16kHz mono Opus at 32kbps.
 *
 * - `-vn` drops the video stream, which is the entire point: it is what keeps
 *   the upload at a few hundred KB instead of hundreds of MB.
 * - 16kHz mono is the standard ASR input rate. Higher rates and a second
 *   channel cost bandwidth and buy no transcription accuracy, since speech
 *   models downmix and resample to this anyway.
 * - Opus is dramatically smaller than PCM at equal intelligibility: a 60s reel
 *   lands near 240KB against roughly 2MB for 16-bit WAV.
 */
const FFMPEG_ARGS = (input: string): string[] => [
  "-i",
  input,
  "-vn",
  "-ac",
  "1",
  "-ar",
  "16000",
  "-c:a",
  "libopus",
  "-b:a",
  "32k",
  OUTPUT_NAME,
];

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/**
 * Loads the ~31MB wasm core once per session, on first use.
 *
 * Deliberately not loaded at startup: it would dominate the initial page weight
 * for every visitor including those who never upload anything.
 */
const loadFFmpeg = async (
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<FFmpeg> => {
  if (instance !== null) return instance;
  if (loading !== null) return loading;

  loading = (async () => {
    const ffmpeg = new FFmpeg();

    try {
      // Fetched to blob URLs rather than passed as paths so the core download
      // is observable — a silent 31MB wait reads as a frozen app.
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      ]);

      onProgress?.({ phase: "loading-core", ratio: 0.8 });
      await ffmpeg.load({ coreURL, wasmURL });
    } catch (error) {
      loading = null;
      throw new ExtractionError(
        "core_load",
        error instanceof Error
          ? "Couldn't load the audio engine. Check your connection and retry."
          : "Couldn't load the audio engine.",
      );
    }

    instance = ffmpeg;
    return ffmpeg;
  })();

  return loading;
};

/** Frees the wasm instance and its memory. */
export const disposeFFmpeg = (): void => {
  try {
    instance?.terminate();
  } catch {
    // Already terminated or never loaded — nothing to release.
  }
  instance = null;
  loading = null;
};

const inputNameFor = (fileName: string): string => {
  const dot = fileName.lastIndexOf(".");
  const ext = dot === -1 ? ".mp4" : fileName.slice(dot).toLowerCase();
  // Fixed stem: ffmpeg.wasm's virtual FS is not forgiving about spaces,
  // Devanagari filenames or shell metacharacters, all of which are common here.
  return `bolo-input${ext}`;
};

export interface ExtractOptions {
  onProgress?: (progress: ExtractionProgress) => void;
  signal?: AbortSignal;
}

/**
 * Strips a video down to a small speech-optimised audio blob.
 *
 * `durationSeconds` is used only to convert ffmpeg's time-based progress into a
 * 0–1 ratio; extraction works without it, the bar is just indeterminate.
 */
export const extractAudio = async (
  file: File,
  durationSeconds: number,
  { onProgress, signal }: ExtractOptions = {},
): Promise<ExtractedAudio> => {
  onProgress?.({ phase: "loading-core", ratio: -1 });
  const ffmpeg = await loadFFmpeg(onProgress);

  if (signal?.aborted) throw new ExtractionError("failed", "Cancelled.");

  const inputName = inputNameFor(file.name);

  const handleProgress = ({ progress }: { progress: number }): void => {
    // ffmpeg reports a ratio that can overshoot slightly past the end.
    const ratio = Number.isFinite(progress)
      ? Math.min(1, Math.max(0, progress))
      : -1;
    onProgress?.({ phase: "extracting", ratio });
  };

  ffmpeg.on("progress", handleProgress);

  const onAbort = (): void => {
    // The wasm instance has no cancel; terminating is the only way out, and it
    // leaves the instance unusable, so it is discarded.
    disposeFFmpeg();
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    onProgress?.({ phase: "reading", ratio: -1 });
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (signal?.aborted) throw new ExtractionError("failed", "Cancelled.");

    await ffmpeg.writeFile(inputName, bytes);

    onProgress?.({ phase: "extracting", ratio: 0 });
    const exitCode = await ffmpeg.exec(FFMPEG_ARGS(inputName));

    if (exitCode !== 0) {
      throw new ExtractionError(
        "no_audio_track",
        "We couldn't find an audio track in that video.",
      );
    }

    onProgress?.({ phase: "finalising", ratio: -1 });
    const output = await ffmpeg.readFile(OUTPUT_NAME);

    // Free the virtual FS immediately — these two files are the largest
    // allocations in the tab, and leaving them costs the next extraction.
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(OUTPUT_NAME).catch(() => undefined);

    if (typeof output === "string") {
      throw new ExtractionError("failed", "Audio extraction returned no data.");
    }

    const blob = new Blob([output as unknown as BlobPart], {
      type: OUTPUT_MIME,
    });

    if (blob.size === 0) {
      throw new ExtractionError(
        "no_audio_track",
        "We couldn't find an audio track in that video.",
      );
    }

    void durationSeconds;
    return { blob, mime: OUTPUT_MIME, bytes: blob.size };
  } catch (error) {
    if (error instanceof ExtractionError) throw error;

    const message = error instanceof Error ? error.message : "";
    // wasm OOM surfaces as an unhelpful abort/memory message; give the user
    // something actionable instead of the raw text.
    if (/memory|allocat|abort/i.test(message)) {
      disposeFFmpeg();
      throw new ExtractionError(
        "out_of_memory",
        "That video is too large for your browser to process. Try a shorter clip.",
      );
    }

    throw new ExtractionError(
      "failed",
      "We couldn't get the audio out of that video.",
    );
  } finally {
    ffmpeg.off?.("progress", handleProgress);
    signal?.removeEventListener("abort", onAbort);
  }
};
