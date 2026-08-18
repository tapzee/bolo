"use client";

/**
 * H.264 encoder tuning for the burn-in export.
 *
 * `convertMedia` configures the encoder itself and exposes no option for it, so
 * we take what it produces and correct two choices that are wrong for
 * phone-shaped video. Both are reasons an export can play back with a judder on
 * a phone when the preview was smooth.
 *
 * 1. **Bitrate.** Remotion hardcodes 3 Mbit/s on Safari — which is every
 *    iPhone, iOS Chrome included, since its UA sniff counts CriOS as Safari —
 *    and leaves `bitrate` unset everywhere else, taking the browser's
 *    conservative default. A phone camera records 1080p at 10–16 Mbit/s. Asking
 *    a rate controller to fit that into 3 starves exactly the frames that need
 *    bits: whip pans, hand-held shake, anything with real motion. A starved
 *    P-frame updates only part of the picture, so the result does not read as
 *    "soft", it reads as the video hitching and catching up — worst right after
 *    each keyframe, which lands every 40 frames and makes the judder periodic.
 *
 * 2. **The declared level.** Remotion picks the level by comparing frame height
 *    against *landscape* height limits, so anything taller than 1080 — i.e.
 *    every reel — falls through to level 5.2. Even 720x1280 is tagged
 *    `avc1.640034`. Android's MediaCodec matches on the declared level rather
 *    than the real frame size, and mid-range phones commonly advertise hardware
 *    AVC only to 4.2/5.0, so an over-declared file is handed to the software
 *    decoder. That is the other half of the stutter, and it is also why some
 *    apps re-encode the upload.
 *
 * Correct levels come out of the macroblock arithmetic in Annex A of the spec,
 * not from pixel dimensions: a 1080x1920@30 frame is 8,160 macroblocks and
 * 244,800 MB/s, which fits level 4.0 with room to spare.
 *
 * Safety: every config we substitute is checked with `isConfigSupported` before
 * the export starts, and anything unvalidated passes through untouched. The
 * tuning can leave the output unchanged; it can never fail the export.
 */

interface AvcLevel {
  readonly level: string;
  /** Level byte of the codec string, `avc1.6400<hex>`. */
  readonly hex: string;
  readonly maxMacroblocksPerSecond: number;
  readonly maxFrameMacroblocks: number;
  /** High-profile ceiling in bits/s (1.25x the Main-profile figure). */
  readonly maxBitrate: number;
}

/**
 * Annex A levels, ascending. Starts at 3.1 because nothing we export is small
 * enough to need lower, and 3.1 is the floor of universal hardware support.
 */
const AVC_LEVELS: readonly AvcLevel[] = [
  { level: "3.1", hex: "1F", maxMacroblocksPerSecond: 108_000, maxFrameMacroblocks: 3_600, maxBitrate: 17_500_000 },
  { level: "3.2", hex: "20", maxMacroblocksPerSecond: 216_000, maxFrameMacroblocks: 5_120, maxBitrate: 25_000_000 },
  { level: "4.0", hex: "28", maxMacroblocksPerSecond: 245_760, maxFrameMacroblocks: 8_192, maxBitrate: 25_000_000 },
  { level: "4.1", hex: "29", maxMacroblocksPerSecond: 245_760, maxFrameMacroblocks: 8_192, maxBitrate: 62_500_000 },
  { level: "4.2", hex: "2A", maxMacroblocksPerSecond: 522_240, maxFrameMacroblocks: 8_704, maxBitrate: 62_500_000 },
  { level: "5.0", hex: "32", maxMacroblocksPerSecond: 589_824, maxFrameMacroblocks: 22_080, maxBitrate: 168_750_000 },
  { level: "5.1", hex: "33", maxMacroblocksPerSecond: 983_040, maxFrameMacroblocks: 36_864, maxBitrate: 300_000_000 },
  { level: "5.2", hex: "34", maxMacroblocksPerSecond: 2_073_600, maxFrameMacroblocks: 36_864, maxBitrate: 300_000_000 },
];

const HIGHEST_AVC_LEVEL: AvcLevel = {
  level: "5.2",
  hex: "34",
  maxMacroblocksPerSecond: 2_073_600,
  maxFrameMacroblocks: 36_864,
  maxBitrate: 300_000_000,
};

const macroblocks = (width: number, height: number): number =>
  Math.ceil(width / 16) * Math.ceil(height / 16);

/**
 * Lowest level that legally carries this stream.
 *
 * Lowest, not highest, is the point: the level is a promise to the decoder about
 * the worst case it must handle, and every notch of exaggeration is another
 * chance for a phone to decline hardware decoding.
 */
export const avcCodecString = ({
  width,
  height,
  fps,
  bitrate,
}: {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}): string => {
  const frameMacroblocks = macroblocks(width, height);
  const perSecond = frameMacroblocks * fps;

  const fitting = AVC_LEVELS.find(
    (candidate) =>
      frameMacroblocks <= candidate.maxFrameMacroblocks &&
      perSecond <= candidate.maxMacroblocksPerSecond &&
      bitrate <= candidate.maxBitrate,
  );

  // Nothing fits only for streams larger than 4K, which the resolution tiers
  // never produce. Falling back to the top of the table keeps that case legal.
  const level = fitting ?? HIGHEST_AVC_LEVEL;

  // 6400 = High profile, no constraint flags. Widely supported, and what
  // Remotion already asks for — only the level byte is ours.
  return `avc1.6400${level.hex}`;
};

/**
 * Remotion's own codec string, replicated so the last-resort probe can keep it.
 *
 * Mirrors `chooseCorrectAvc1Profile` in `@remotion/webcodecs`. Kept only so that
 * if the browser rejects every level we compute, we can still validate a
 * bitrate-only override against the exact string Remotion would have used.
 */
const remotionCodecString = ({
  width,
  height,
  fps,
}: {
  width: number;
  height: number;
  fps: number | null;
}): string => {
  const table = [
    { hex: "1F", width: 1280, height: 720, fps: 30.0 },
    { hex: "20", width: 1280, height: 1024, fps: 42.2 },
    { hex: "28", width: 2048, height: 1024, fps: 30.0 },
    { hex: "29", width: 2048, height: 1024, fps: 30.0 },
    { hex: "2A", width: 2048, height: 1080, fps: 60.0 },
    { hex: "32", width: 3672, height: 1536, fps: 26.7 },
    { hex: "33", width: 4096, height: 2304, fps: 26.7 },
    { hex: "34", width: 4096, height: 2304, fps: 56.3 },
    { hex: "3C", width: 8192, height: 4320, fps: 30.2 },
    { hex: "3D", width: 8192, height: 4320, fps: 60.4 },
    { hex: "3E", width: 8192, height: 4320, fps: 120.8 },
  ];

  const match = table.find(
    (entry) =>
      width <= entry.width && height <= entry.height && (fps ?? 60) <= entry.fps,
  );

  return `avc1.6400${match?.hex ?? "34"}`;
};

/**
 * Bits per pixel per frame.
 *
 * 0.12 is the working range for H.264 without B-frames — which is what WebCodecs
 * gives us — and lands 1080x1920@30 at ~7.5 Mbit/s. That is a little under what
 * a phone camera writes and comfortably above where motion starts to fall apart.
 * Much higher buys nothing visible on a reel and costs encode time on the device.
 */
const BITS_PER_PIXEL = 0.12;

const MIN_BITRATE = 2_500_000;

/**
 * Ceilings.
 *
 * Mobile is capped well below desktop, and the reason is the low-end phone this
 * whole file exists for: bitrate cuts both ways. Too little and motion falls
 * apart; too much and a budget decoder cannot keep up with its own playback. 12
 * Mbit/s is about what a phone camera writes for 1080p60 — footage the same
 * device plays back without complaint — so it is a safe ceiling by construction.
 * Only 60fps and above reach it; 1080p30 lands at 7.5 and is never clamped.
 */
const MAX_BITRATE_MOBILE = 12_000_000;
const MAX_BITRATE_DESKTOP = 40_000_000;

export const targetBitrate = ({
  width,
  height,
  fps,
  mobile,
}: {
  width: number;
  height: number;
  fps: number;
  mobile: boolean;
}): number => {
  const raw = width * height * fps * BITS_PER_PIXEL;
  const ceiling = mobile ? MAX_BITRATE_MOBILE : MAX_BITRATE_DESKTOP;
  return Math.round(Math.min(Math.max(raw, MIN_BITRATE), ceiling));
};

/**
 * The fields we substitute into Remotion's config.
 *
 * Deliberately only two of them. `latencyMode` is left alone because its spec
 * default is already "quality", and asking for it explicitly would invite a
 * vendor encoder to start reordering frames — Remotion writes no `ctts` box and
 * sets DTS from PTS, so B-frames in the output would corrupt the timing of the
 * very file we are trying to make play smoothly. `bitrateMode` is stated only
 * because it costs nothing to be explicit about wanting variable rate.
 */
interface EncoderOverride {
  readonly codec: string;
  readonly bitrate: number;
  readonly bitrateMode?: VideoEncoderBitrateMode;
}

/**
 * Validated overrides, keyed by the shape of the config they may replace.
 *
 * Keyed rather than global because `configure` is synchronous — by the time
 * Remotion calls it we can no longer await `isConfigSupported`, so the decision
 * has to have been made already, and it has to be certain it is being applied to
 * the frame size and acceleration mode it was validated for.
 */
export type EncoderTuning = ReadonlyMap<string, EncoderOverride>;

const tuningKey = (
  width: number,
  height: number,
  acceleration: HardwareAcceleration | undefined,
): string => `${width}x${height}|${acceleration ?? "no-preference"}`;

/** Remotion's `ensureMultipleOfTwo` — floor, not round. */
const even = (value: number): number => Math.floor(value / 2) * 2;

/**
 * Output size for a `max-height-width` resize, replicating
 * `calculateNewSizeAfterResizing` exactly. A prediction that disagrees with
 * Remotion by even two pixels simply misses the key lookup and leaves the export
 * untuned, which is why the two have to match to the pixel.
 */
const fitted = ({
  width,
  height,
  maxWidth,
  maxHeight,
}: {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
}): { width: number; height: number } => {
  const boundedHeight = Math.min(height, maxHeight);
  const boundedWidth = Math.min(width, maxWidth);
  const scale = Math.min(boundedWidth / width, boundedHeight / height);
  return {
    width: even(Math.round(width * scale)),
    height: even(Math.round(height * scale)),
  };
};

const ACCELERATIONS: readonly (HardwareAcceleration | undefined)[] = [
  undefined,
  "prefer-hardware",
  "prefer-software",
];

/**
 * Builds the tuning table for one export.
 *
 * Both orientations of the coded size are probed: a rotated phone recording
 * decodes at its coded (landscape) size, and which of the two Remotion hands the
 * encoder depends on how the container declares rotation. Probing both is
 * cheaper than reasoning about it, and a key that never gets looked up costs
 * nothing.
 */
export const planEncoderTuning = async ({
  codedWidth,
  codedHeight,
  fps,
  maxWidth,
  maxHeight,
  mobile,
}: {
  codedWidth: number;
  codedHeight: number;
  fps: number | null;
  maxWidth: number;
  maxHeight: number;
  mobile: boolean;
}): Promise<EncoderTuning> => {
  const plan = new Map<string, EncoderOverride>();

  if (typeof VideoEncoder === "undefined") return plan;

  const sizes = [
    fitted({ width: codedWidth, height: codedHeight, maxWidth, maxHeight }),
    fitted({ width: codedHeight, height: codedWidth, maxWidth, maxHeight }),
  ];

  // An unknown frame rate is treated as 30 for the bitrate (the common case) but
  // 60 for the level (the safe case) — a level that promises too little is the
  // one mistake a decoder cannot recover from.
  const bitrateFps = fps ?? 30;
  const levelFps = fps ?? 60;

  for (const size of sizes) {
    if (size.width <= 0 || size.height <= 0) continue;

    const bitrate = targetBitrate({
      width: size.width,
      height: size.height,
      fps: bitrateFps,
      mobile,
    });

    const codec = avcCodecString({
      width: size.width,
      height: size.height,
      fps: levelFps,
      bitrate,
    });

    // Ordered by how much we would like to have, ending with the bitrate alone
    // over Remotion's own codec string. The bitrate is the fix that matters most
    // widely, so it is the last thing we give up.
    const candidates: readonly EncoderOverride[] = [
      { codec, bitrate, bitrateMode: "variable" },
      { codec, bitrate },
      {
        codec: remotionCodecString({
          width: size.width,
          height: size.height,
          fps,
        }),
        bitrate,
      },
    ];

    for (const acceleration of ACCELERATIONS) {
      for (const candidate of candidates) {
        try {
          const support = await VideoEncoder.isConfigSupported({
            ...candidate,
            width: size.width,
            height: size.height,
            framerate: fps ?? undefined,
            hardwareAcceleration: acceleration,
          });

          if (support.supported === true) {
            plan.set(tuningKey(size.width, size.height, acceleration), candidate);
            break;
          }
        } catch {
          // A malformed candidate throws rather than reporting unsupported.
          // Either way, on to the next one.
        }
      }
    }
  }

  return plan;
};

/**
 * Runs `job` with `VideoEncoder.configure` intercepted.
 *
 * Patching a prototype is not something to do lightly, so it is bounded as
 * tightly as it can be: installed for one export, restored in a `finally`,
 * refcounted so a second export cannot leave it installed, and applied only to
 * h264 configs whose exact frame size and acceleration mode were validated up
 * front. Everything else passes through byte for byte.
 */
let patchDepth = 0;
let originalConfigure: typeof VideoEncoder.prototype.configure | null = null;

export const withTunedVideoEncoder = async <T>(
  getTuning: () => EncoderTuning | null,
  job: () => Promise<T>,
): Promise<T> => {
  if (typeof VideoEncoder === "undefined") return job();

  if (patchDepth === 0) {
    const original = VideoEncoder.prototype.configure;
    originalConfigure = original;

    VideoEncoder.prototype.configure = function patchedConfigure(
      this: VideoEncoder,
      config: VideoEncoderConfig,
    ): void {
      const override = config.codec.startsWith("avc1")
        ? getTuning()?.get(
            tuningKey(config.width, config.height, config.hardwareAcceleration),
          )
        : undefined;

      original.call(this, override ? { ...config, ...override } : config);
    };
  }

  patchDepth += 1;

  try {
    return await job();
  } finally {
    patchDepth -= 1;
    if (patchDepth === 0 && originalConfigure !== null) {
      VideoEncoder.prototype.configure = originalConfigure;
      originalConfigure = null;
    }
  }
};
