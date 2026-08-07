import { memo } from "react";
import { AbsoluteFill, Video } from "remotion";
import type { CaptionPage, CaptionStyleConfig } from "@/core";
import { CaptionOverlay } from "../captions/CaptionOverlay";
import { PreviewBackdrop } from "./PreviewBackdrop";
import type { BackdropId } from "./backdrop-options";

/**
 * Declared as a `type`, not an `interface`, on purpose: Remotion's `Player`
 * constrains its props to `Record<string, unknown>`, and TypeScript refuses to
 * treat an interface as satisfying an index signature. An interface here fails
 * to compile at the `<Player>` call site with a very unhelpful message.
 */
export type CaptionSceneProps = {
  pages: readonly CaptionPage[];
  config: CaptionStyleConfig;
  /** Object URL for the user's video. Takes precedence over `backdrop`. */
  videoSrc?: string | null;
  /** Stand-in footage, used by the style gallery where there is no upload. */
  backdrop?: BackdropId;
};

/**
 * The composition rendered by the Player and, from Phase 5, the WebCodecs
 * export path.
 *
 * The video is a local object URL — it is decoded in the tab and never
 * uploaded. Because the canvas is sized from the source's own dimensions,
 * `objectFit: cover` only ever absorbs sub-pixel rounding, never a real crop.
 */
export const CaptionScene = memo(function CaptionScene({
  pages,
  config,
  videoSrc,
  backdrop = "studio",
}: CaptionSceneProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {videoSrc ? (
        <Video
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <PreviewBackdrop backdrop={backdrop} />
      )}
      <CaptionOverlay pages={pages} config={config} />
    </AbsoluteFill>
  );
});
