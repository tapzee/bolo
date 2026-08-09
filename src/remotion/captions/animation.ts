import { spring } from "remotion";
import type { SpringConfig } from "remotion";

/**
 * Spring helpers shared by all five caption styles.
 *
 * Two rules hold everywhere in here:
 *
 * 1. Animation is always `spring()`, never a CSS transition. Remotion renders
 *    by seeking to a frame and screenshotting it — a CSS transition has no
 *    defined value at an arbitrary seeked frame, so transitions that look fine
 *    in the Player come out frozen or stuttering in the exported file.
 *
 * 2. Springs are always passed a *relative* frame (`frame - startFrame`).
 *    `springCalculation` integrates from 0 up to the frame it is given, so
 *    handing it an absolute frame turns an O(1) lookup into an O(frame) loop
 *    on every word of every rendered frame.
 */

export interface TokenAnimationInput {
  /** Absolute frame from `useCurrentFrame()`. */
  frame: number;
  fps: number;
  /** Frame this word starts being spoken. */
  fromFrame: number;
  /** Frame this word stops being spoken. */
  toFrame: number;
}

/** Snappy but soft — the default for colour and opacity ramps. */
export const ENTER_SMOOTH: Partial<SpringConfig> = {
  damping: 26,
  stiffness: 220,
  mass: 0.7,
};

/** Overshoots noticeably. Used by Pop for its bounce. */
export const ENTER_BOUNCY: Partial<SpringConfig> = {
  damping: 9,
  stiffness: 190,
  mass: 0.6,
};

/** Mild overshoot — enough to feel alive without drawing attention. */
export const ENTER_SUBTLE: Partial<SpringConfig> = {
  damping: 14,
  stiffness: 200,
  mass: 0.6,
};

/** Never overshoots, so a word can fall back to rest without a second wobble. */
export const EXIT_SETTLE: Partial<SpringConfig> = {
  damping: 30,
  stiffness: 160,
  mass: 0.8,
};

export const clamp01 = (value: number): number =>
  value < 0 ? 0 : value > 1 ? 1 : value;

/**
 * Rise-and-fall envelope for the spoken word, in 0–1.
 *
 * Built as `enter - exit` from two springs rather than a boolean flag: a flag
 * would snap the highlight off the instant a word ends, which reads as a flicker
 * at 30fps. Subtracting a non-bouncy exit spring gives a smooth release with no
 * second wobble. Clamped, so it is safe for colour and opacity.
 */
export const tokenHighlight = (
  { frame, fps, fromFrame, toFrame }: TokenAnimationInput,
  enterConfig: Partial<SpringConfig> = ENTER_SMOOTH,
): number => {
  const enter = spring({ frame: frame - fromFrame, fps, config: enterConfig });
  const exit = spring({ frame: frame - toFrame, fps, config: EXIT_SETTLE });
  return clamp01(enter - exit);
};

/**
 * Rises once at the word's onset and stays up — no fall-off.
 *
 * This is the read-along model: words already spoken remain fully lit, so the
 * viewer can still read the start of the line. Clean uses it; the karaoke-style
 * presets use `tokenHighlight` instead.
 */
export const tokenEnter = (
  { frame, fps, fromFrame }: Omit<TokenAnimationInput, "toFrame">,
  enterConfig: Partial<SpringConfig> = ENTER_SMOOTH,
): number =>
  clamp01(spring({ frame: frame - fromFrame, fps, config: enterConfig }));

/**
 * Same envelope but *unclamped*, so a bouncy `enterConfig` keeps its overshoot.
 * Use for transforms (scale, translate) where the overshoot is the whole point;
 * never for colour or opacity.
 */
export const tokenPulse = (
  { frame, fps, fromFrame, toFrame }: TokenAnimationInput,
  enterConfig: Partial<SpringConfig> = ENTER_BOUNCY,
): number => {
  const enter = spring({ frame: frame - fromFrame, fps, config: enterConfig });
  const exit = spring({ frame: frame - toFrame, fps, config: EXIT_SETTLE });
  return enter - exit;
};

/**
 * Same envelope as `tokenEnter`, under a name that reads as intent at call
 * sites — a mask/underline reveal (scaleX 0→1, or a `clip-path` inset) and a
 * fade-up are different animations that happen to share the exact same
 * spring math. Used by Underline Punch and Highlight Marker.
 */
export const maskRevealX = (
  input: Omit<TokenAnimationInput, "toFrame">,
  config: Partial<SpringConfig> = ENTER_SMOOTH,
): number => tokenEnter(input, config);

/**
 * Horizontal entrance offset (px) for a word sliding in from one screen edge,
 * for Kinetic Split. Returns the *offset to apply*, already signed — a
 * `left`-side word starts at `-distancePx` and eases to 0, `right` the mirror.
 * Callers add this straight onto a `translateX`.
 */
export const splitEntrance = (
  side: "left" | "right",
  distancePx: number,
  input: Omit<TokenAnimationInput, "toFrame">,
  config: Partial<SpringConfig> = ENTER_SMOOTH,
): number =>
  (1 - tokenEnter(input, config)) * distancePx * (side === "left" ? -1 : 1);

/**
 * Unclamped, enter-only bouncy spring — deliberately *not* `tokenPulse`.
 * `tokenPulse` subtracts an exit spring keyed to `toFrame` so a continuous
 * emphasis pulse fades once the word stops being spoken; Center Punch wants
 * the opposite — punch in past 100%, settle, and *hold* at rest for as long as
 * the word stays on screen, not fall away when its speech window ends. A bare
 * `spring()` naturally asymptotes to 1 and stays there, which is exactly that.
 *
 * Typical use: `scale = base + centerPunchScale(timing) * amplitude`.
 */
export const centerPunchScale = (
  input: Omit<TokenAnimationInput, "toFrame">,
  config: Partial<SpringConfig> = ENTER_BOUNCY,
): number => spring({ frame: input.frame - input.fromFrame, fps: input.fps, config });

/**
 * Per-character reveal, 0–1, for Vertical Impact's letter-by-letter build.
 * Each character's spring starts `staggerFrames` later than the one before
 * it, so the word builds visibly top-to-bottom (or left-to-right) rather than
 * appearing all at once.
 */
export const letterStagger = (
  charIndex: number,
  input: Omit<TokenAnimationInput, "toFrame">,
  config: Partial<SpringConfig> = ENTER_SMOOTH,
  staggerFrames = 2,
): number =>
  clamp01(
    spring({
      frame: input.frame - input.fromFrame - charIndex * staggerFrames,
      fps: input.fps,
      config,
    }),
  );

/**
 * Slow ambient parallax offset (px) for Layered Depth's oversized backdrop
 * word. A continuous `Math.sin` of the absolute clock, not a spring: this is
 * ambient motion for as long as the word is visible, not a one-shot envelope
 * reacting to speech timing — same precedent as `DynamicHighlight`'s glow
 * "breathe". Pure function of `frame`/`fps`, so it seeks deterministically
 * like everything else here.
 */
export const layeredDepthDrift = (
  frame: number,
  fps: number,
  amplitudePx = 14,
  periodSec = 6,
): number => Math.sin((frame / fps / periodSec) * Math.PI * 2) * amplitudePx;

/** Page-level entrance. Deliberately short — captions must not lag the audio. */
export const pageEntrance = (
  frame: number,
  fps: number,
  pageStartFrame: number,
): number =>
  spring({
    frame: frame - pageStartFrame,
    fps,
    config: { damping: 24, stiffness: 260, mass: 0.55 },
  });
