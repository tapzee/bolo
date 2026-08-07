import type { CSSProperties } from "react";
import { memo } from "react";
import { AbsoluteFill } from "remotion";
import type { BackdropId } from "./backdrop-options";

export type { BackdropId, BackdropOption } from "./backdrop-options";
export { BACKDROPS, BACKDROP_IDS, isBackdropId } from "./backdrop-options";

/**
 * Stand-in footage for Phase 1, before real video upload exists.
 *
 * These are not decoration. Each one is a legibility test: white captions are
 * trivially readable on `studio` and fall apart on `bright` and `busy` unless
 * the mandatory black text stroke is actually working. Checking all five styles
 * against all three is the visual acceptance test for this phase.
 *
 * Deliberately static — no `useCurrentFrame()`. An animated backdrop would
 * re-render the full canvas every frame and mask exactly the caption stutter
 * this phase is supposed to expose.
 */
const BACKDROP_STYLE: Readonly<Record<BackdropId, CSSProperties>> = {
  studio: {
    background: [
      "radial-gradient(120% 80% at 50% 12%, #2b2f3a 0%, rgba(43,47,58,0) 60%)",
      "radial-gradient(90% 60% at 78% 88%, #1c2330 0%, rgba(28,35,48,0) 55%)",
      "linear-gradient(168deg, #14161c 0%, #0b0d12 55%, #05060a 100%)",
    ].join(", "),
  },
  bright: {
    background: [
      "radial-gradient(70% 45% at 62% 22%, #fffdf4 0%, rgba(255,253,244,0) 62%)",
      "radial-gradient(85% 55% at 22% 78%, #ffd9a8 0%, rgba(255,217,168,0) 60%)",
      "linear-gradient(172deg, #eaf3ff 0%, #fdf3e0 48%, #f6d9b4 100%)",
    ].join(", "),
  },
  busy: {
    background: [
      "repeating-linear-gradient(58deg, rgba(255,255,255,0.92) 0px, rgba(255,255,255,0.92) 46px, rgba(6,8,14,0.94) 46px, rgba(6,8,14,0.94) 92px)",
      "radial-gradient(60% 40% at 30% 30%, #ff3b6b 0%, rgba(255,59,107,0) 70%)",
      "linear-gradient(90deg, #06d6a0 0%, #118ab2 100%)",
    ].join(", "),
  },
};

export const PreviewBackdrop = memo(function PreviewBackdrop({
  backdrop,
}: {
  backdrop: BackdropId;
}) {
  return <AbsoluteFill style={BACKDROP_STYLE[backdrop]} />;
});
