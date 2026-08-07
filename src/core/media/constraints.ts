/**
 * Upload rules. Pure and DOM-free — takes a plain descriptor rather than a
 * `File`, so the same rules can validate an upload in the browser, a picked
 * asset in a Capacitor/Android shell, or a request body on the server.
 */

/** Spec limit. Note the practical ffmpeg.wasm ceiling below is much lower. */
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Above this, browser-side extraction usually fails.
 *
 * ffmpeg.wasm is a 32-bit build: its whole address space is ~4GB and in
 * practice a tab dies well before that, because the source file, the decoded
 * working set and the output all live in the same linear memory at once. We
 * warn rather than block — a highly compressed 700MB file often still works,
 * and refusing it outright would be wrong.
 */
export const SOFT_EXTRACTION_LIMIT_BYTES = 600 * 1024 * 1024;

export const MAX_VIDEO_DURATION_SECONDS = 30 * 60;

/**
 * Serverless request-body ceiling, minus room for multipart framing.
 *
 * Vercel caps a serverless function's request body at 4.5MB, and the cap is
 * enforced by the platform *before* the route runs — the request never reaches
 * our code, so there is nothing we can do about it there and no message we can
 * put on it. The client has to keep the upload under this on its own.
 */
export const MAX_UPLOAD_AUDIO_BYTES = 4_300_000;

/**
 * Bytes per second of extracted audio: 32kbps Opus, mono, 16kHz.
 *
 * Mirrors `-b:a 32k` in `src/lib/media/extract-audio.ts`. Opus holds its
 * nominal bitrate closely on speech, so predicting the size from the duration
 * is accurate to within a few percent — accurate enough to refuse a video
 * *before* extraction rather than after, which is the whole point. Raising the
 * encoder's bitrate without raising this number would make the prediction
 * optimistic, and an optimistic prediction lets a doomed upload through.
 */
export const AUDIO_BYTES_PER_SECOND = 32_000 / 8;

/**
 * The longest video whose audio still fits in one request.
 *
 * Derived rather than typed out, at roughly 17.9 minutes. It is well under the
 * 30-minute limit above, and that gap is real: `MAX_VIDEO_DURATION_SECONDS` is
 * what the *editor* can handle, this is what the *transcription upload* can
 * handle, and only one of them is bounded by someone else's platform.
 */
export const MAX_TRANSCRIBABLE_SECONDS = Math.floor(
  MAX_UPLOAD_AUDIO_BYTES / AUDIO_BYTES_PER_SECOND,
);

/** Predicted upload size for a video of `seconds`, in bytes. */
export const predictedAudioBytes = (seconds: number): number =>
  Math.max(0, Math.ceil(seconds * AUDIO_BYTES_PER_SECOND));

export const ACCEPTED_VIDEO_TYPES: readonly string[] = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-m4v",
  "video/mpeg",
  "video/3gpp",
  "video/x-msvideo",
];

export const ACCEPTED_VIDEO_EXTENSIONS: readonly string[] = [
  ".mp4",
  ".mov",
  ".webm",
  ".mkv",
  ".m4v",
  ".avi",
  ".3gp",
];

export type UploadRejectionCode =
  | "empty"
  | "too_large"
  | "unsupported_type"
  | "too_long"
  /** Fits our own duration limit, but its audio exceeds the upload ceiling. */
  | "too_long_to_upload";

export interface UploadRejection {
  code: UploadRejectionCode;
  message: string;
}

export interface FileDescriptor {
  name: string;
  size: number;
  type: string;
}

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

/**
 * Validates a picked file before any expensive work happens.
 *
 * Type is checked against the extension as well as the MIME type: browsers
 * report an empty or wrong `type` for plenty of real files, especially `.mkv`
 * and files arriving from Android share sheets, and rejecting a valid video on
 * that basis alone is a bug users cannot work around.
 */
export const validateVideoFile = (
  file: FileDescriptor,
): UploadRejection | null => {
  if (file.size <= 0) {
    return { code: "empty", message: "That file is empty." };
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return {
      code: "too_large",
      message: "That video is over 2GB. Try trimming it first.",
    };
  }

  const typeOk = ACCEPTED_VIDEO_TYPES.includes(file.type);
  const extOk = ACCEPTED_VIDEO_EXTENSIONS.includes(extensionOf(file.name));

  if (!typeOk && !extOk) {
    return {
      code: "unsupported_type",
      message: "That doesn't look like a video. Try MP4, MOV, WebM or MKV.",
    };
  }

  return null;
};

/**
 * Whether a video can be transcribed at all, checked from its duration alone.
 *
 * Two ceilings apply and the *lower* one binds. `MAX_VIDEO_DURATION_SECONDS` is
 * ours and generous; `MAX_TRANSCRIBABLE_SECONDS` is the hosting platform's
 * request-body cap converted into seconds of audio, and it is what actually
 * stops a long video today.
 *
 * Checked here — from duration, before extraction — rather than by measuring
 * the finished audio, because measuring it means the user has already waited
 * through a 31MB wasm download and a full decode to be told no. The prediction
 * is a few percent pessimistic at worst, which is the safe direction: it can
 * refuse a video that would just barely have fitted, never accept one that
 * cannot.
 */
export const validateDuration = (
  durationSeconds: number,
): UploadRejection | null => {
  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    const minutes = Math.floor(MAX_VIDEO_DURATION_SECONDS / 60);
    return {
      code: "too_long",
      message: `That video is longer than ${minutes} minutes. Try a shorter clip.`,
    };
  }

  if (durationSeconds > MAX_TRANSCRIBABLE_SECONDS) {
    const minutes = Math.floor(MAX_TRANSCRIBABLE_SECONDS / 60);
    return {
      code: "too_long_to_upload",
      message: `Transcription currently handles clips up to about ${minutes} minutes. Try trimming this one.`,
    };
  }

  return null;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Length in words rather than as a timecode — "1 min 36 sec", "24 sec".
 *
 * `formatDuration` above is a player timecode; this one is for prose about an
 * allowance or a balance, where the seconds have to survive. Rounding a credit
 * balance to whole minutes lies in both directions: 2 credits (24s) renders as
 * "0 min left" while transcription still works, and 8 credits (1:36) renders as
 * "2 min left", promising more than the balance can buy.
 *
 * Truncates for that reason — a balance may under-promise, never over-promise.
 */
export const formatMinutesSeconds = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
};

/**
 * The same figure, but in hours once there are hours to speak of.
 *
 * `formatMinutesSeconds` above was written when the largest number it had to
 * render was 480 minutes' worth of allowance, and "480 min" was already
 * borderline. The top plan now grants ten hours, and "600 min" is not a
 * quantity anyone can feel — a reader has to divide before they know whether it
 * is a lot.
 *
 * Below an hour it delegates, so short balances keep their seconds: the reason
 * that function refuses to round is that a balance of 24 seconds must not
 * render as "0 min", and that reason does not stop applying here.
 *
 * Truncates in the same direction and for the same reason — a figure describing
 * what you can still transcribe may under-promise, never over-promise.
 */
export const formatAllowance = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 3600) return formatMinutesSeconds(total);

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};
