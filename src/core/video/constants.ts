/**
 * Canvas geometry, aspect ratios and the scaling rule that lets one style
 * definition serve every output shape.
 */

export const ASPECT_RATIOS = ["reel", "square", "landscape"] as const;
export type AspectRatioId = (typeof ASPECT_RATIOS)[number];

export interface AspectSpec {
  readonly id: AspectRatioId;
  readonly label: string;
  readonly ratioLabel: string;
  readonly hint: string;
  /** width / height */
  readonly ratio: number;
}

export const ASPECTS: Readonly<Record<AspectRatioId, AspectSpec>> = {
  reel: {
    id: "reel",
    label: "Reel",
    ratioLabel: "9:16",
    hint: "Instagram Reels, YouTube Shorts",
    ratio: 9 / 16,
  },
  square: {
    id: "square",
    label: "Square",
    ratioLabel: "1:1",
    hint: "Feed posts",
    ratio: 1,
  },
  landscape: {
    id: "landscape",
    label: "Landscape",
    ratioLabel: "16:9",
    hint: "YouTube, podcasts, courses",
    ratio: 16 / 9,
  },
};

export const ASPECT_LIST: readonly AspectSpec[] = ASPECT_RATIOS.map(
  (id) => ASPECTS[id],
);

export const DEFAULT_ASPECT: AspectRatioId = "reel";

/**
 * The canvas every caption style is authored against.
 *
 * Style values in the registry (`fontSizePx`, `wordGapPx`, `strokeWidthPx`, …)
 * are numbers *on this canvas*. `canvasScale` converts them for the real
 * output. Nothing downstream should ever compare a style px value against an
 * actual pixel without going through that function.
 */
export const REFERENCE_WIDTH = 1080;
export const REFERENCE_HEIGHT = 1920;

export const VIDEO_FPS = 30;

export type ExportResolution = "720p" | "1080p" | "4k";

/**
 * Resolution tiers name the *short* side, which is how every platform labels
 * them: 1080p is 1080x1920 in portrait and 1920x1080 in landscape.
 */
export const RESOLUTION_SHORT_SIDE: Readonly<
  Record<ExportResolution, number>
> = {
  "720p": 720,
  "1080p": 1080,
  "4k": 2160,
};

export interface ResolutionSpec {
  readonly id: ExportResolution;
  readonly label: string;
  /** Rough peak heap the WebCodecs encoder needs; used to gate 4K. */
  readonly approxMemoryMb: number;
  readonly desktopOnly: boolean;
}

export const RESOLUTIONS: Readonly<Record<ExportResolution, ResolutionSpec>> = {
  "720p": { id: "720p", label: "720p", approxMemoryMb: 256, desktopOnly: false },
  "1080p": { id: "1080p", label: "1080p", approxMemoryMb: 512, desktopOnly: false },
  "4k": { id: "4k", label: "4K", approxMemoryMb: 2048, desktopOnly: true },
};

export const DEFAULT_RESOLUTION: ExportResolution = "1080p";

export interface CanvasSize {
  readonly width: number;
  readonly height: number;
}

/** Video encoders reject odd dimensions on most codecs. */
const even = (n: number): number => Math.round(n / 2) * 2;

export const canvasSize = (
  aspect: AspectRatioId,
  resolution: ExportResolution,
): CanvasSize => {
  const short = RESOLUTION_SHORT_SIDE[resolution];
  const long = even((short * 16) / 9);

  switch (aspect) {
    case "reel":
      return { width: short, height: long };
    case "square":
      return { width: short, height: short };
    case "landscape":
      return { width: long, height: short };
  }
};

/**
 * Output canvas for a source video, preserving its exact aspect ratio.
 *
 * This is the path real uploads take from Phase 2 on: we read the file's
 * intrinsic dimensions and derive the canvas from them, rather than snapping to
 * one of the three presets. A 4:3 or 2.39:1 source therefore exports at its own
 * shape instead of being letterboxed into 16:9. `aspectFromSize` is only used
 * to *label* that shape in the UI and to pick the caption size boost.
 */
export const canvasForSource = (
  source: CanvasSize,
  resolution: ExportResolution,
): CanvasSize => {
  const short = RESOLUTION_SHORT_SIDE[resolution];
  const ratio = source.width / source.height;

  return ratio >= 1
    ? { width: even(short * ratio), height: short }
    : { width: short, height: even(short / ratio) };
};

export const aspectFromSize = ({ width, height }: CanvasSize): AspectRatioId => {
  const ratio = width / height;
  if (ratio > 1.15) return "landscape";
  if (ratio < 0.85) return "reel";
  return "square";
};

/**
 * Captions are sized against canvas *height*, not width.
 *
 * Height is what governs how large text reads to a viewer regardless of shape —
 * sizing off width would make a 16:9 frame render captions ~1.8x too large.
 *
 * The per-aspect boost then corrects for perceptual, not geometric, difference:
 * held at a constant fraction of height, captions read noticeably smaller on a
 * wide frame because the eye compares them against the full width. 1.25x on
 * landscape lands it at roughly 5% of height, which is where hand-tuned
 * burned-in captions on YouTube sit.
 */
const ASPECT_SIZE_BOOST: Readonly<Record<AspectRatioId, number>> = {
  reel: 1,
  square: 1.1,
  landscape: 1.25,
};

export const canvasScale = (size: CanvasSize): number =>
  (size.height / REFERENCE_HEIGHT) * ASPECT_SIZE_BOOST[aspectFromSize(size)];

/**
 * Widest a caption line may run, in real pixels.
 *
 * Landscape is capped harder than the style asks for: a 16:9 frame is wide
 * enough that a full-width line forces the eye to track across the whole
 * screen, which is why broadcast subtitles are boxed to the middle ~70%.
 */
export const captionMaxWidthPx = (
  size: CanvasSize,
  maxLineWidthPct: number,
): number => {
  const pct =
    aspectFromSize(size) === "landscape"
      ? Math.min(maxLineWidthPct, 75)
      : maxLineWidthPct;
  return size.width * (pct / 100);
};

/** 1 credit buys 12 seconds of transcription. */
export const SECONDS_PER_CREDIT = 12;

export const msToFrames = (ms: number, fps: number): number =>
  Math.round((ms / 1000) * fps);

export const framesToMs = (frames: number, fps: number): number =>
  (frames / fps) * 1000;
