import { memo, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import type { CaptionPage, CaptionStyleConfig } from "@/core";
import {
  anchorFraction,
  clampAnchor,
  horizontalFraction,
  withOpacity,
  canvasScale,
  captionMaxWidthPx,
  findActivePageIndex,
  lineGapPx,
  msToFrames,
  scaleStyleConfig,
} from "@/core";
import { FONT_FAMILY } from "../fonts";
import { TOKEN_RENDERERS } from "../styles";
import { pageEntrance } from "./animation";
import { baseTextStyle, heroWordIndex } from "./primitives";

export interface CaptionOverlayProps {
  pages: readonly CaptionPage[];
  /** Authored against the 1080x1920 reference canvas; scaled here. */
  config: CaptionStyleConfig;
}

/**
 * Draws whichever caption page belongs on the current frame.
 *
 * This is the only component in the scene that calls `useCurrentFrame()`. That
 * is deliberate: in Remotion, subscribing to the frame re-renders the component
 * on every single frame, so the subscription is pushed as far down the tree as
 * it will go and the backdrop above it renders exactly once.
 *
 * Only the active page is mounted — never the whole caption list — so cost per
 * frame is bounded by words-per-page (3–6) rather than words-per-video, which
 * runs to several hundred on a 60s reel.
 */
export const CaptionOverlay = memo(function CaptionOverlay({
  pages,
  config: authoredConfig,
}: CaptionOverlayProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Every px value in the style is relative to the reference canvas, so a
  // single style definition renders proportionally identically at 9:16, 1:1 and
  // 16:9, and at 720p through 4K.
  const config = useMemo(
    () => scaleStyleConfig(authoredConfig, canvasScale({ width, height })),
    [authoredConfig, width, height],
  );

  const textStyle = useMemo(
    () => baseTextStyle(config, FONT_FAMILY[config.fontId]),
    [config],
  );

  const anchorStyle = useMemo<CSSProperties>(() => {
    const anchor = clampAnchor(
      anchorFraction(config.placement, config.verticalOffsetPct),
    );
    const x = horizontalFraction(config.horizontalOffsetPct);

    return {
      position: "absolute",
      // Anchored at a point and centred on it, so a dragged caption keeps the
      // same relative position at any resolution or aspect ratio.
      left: `${x * 100}%`,
      top: `${anchor * 100}%`,
      // Static transform, applied once — this is layout, not animation.
      transform: "translate(-50%, -50%)",
      display: "flex",
      justifyContent: "center",
    };
  }, [
    config.placement,
    config.verticalOffsetPct,
    config.horizontalOffsetPct,
  ]);

  const rowStyle = useMemo<CSSProperties>(
    () => ({
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      maxWidth: captionMaxWidthPx({ width, height }, config.maxLineWidthPct),
      gap: `${lineGapPx(config.lineHeight, config.fontSizePx)}px ${config.wordGapPx}px`,
      justifyContent:
        config.textAlign === "left"
          ? "flex-start"
          : config.textAlign === "right"
            ? "flex-end"
            : "center",
      // Plate and shadow are applied to the whole block, not per word, so they
      // read as one caption rather than a row of separate chips.
      ...(config.backgroundEnabled
        ? {
            backgroundColor: withOpacity(
              config.backgroundColor,
              config.backgroundOpacity,
            ),
            padding: `${config.fontSizePx * 0.22}px ${config.fontSizePx * 0.34}px`,
            borderRadius: config.fontSizePx * 0.22,
          }
        : null),
      ...(config.dropShadow
        ? {
            filter: `drop-shadow(0 ${config.fontSizePx * 0.06}px ${config.fontSizePx * 0.12}px rgba(0,0,0,0.55))`,
          }
        : null),
      textAlign: "center",
      willChange: "transform, opacity",
    }),
    [
      config.wordGapPx,
      config.lineHeight,
      config.fontSizePx,
      config.maxLineWidthPct,
      config.textAlign,
      config.backgroundEnabled,
      config.backgroundColor,
      config.backgroundOpacity,
      config.dropShadow,
      width,
      height,
    ],
  );

  const timeMs = (frame / fps) * 1000;
  const index = findActivePageIndex(pages, timeMs, config.holdMs);
  const page = index === -1 ? undefined : pages[index];

  if (page === undefined) return null;

  // Computed once per page rather than inside each token: the answer depends on
  // every word on the page, and this component is the only place that holds
  // them all. Cheap enough to leave unmemoised — it is a scan of 3–6 short
  // strings, against a `useMemo` whose own dependency check would cost more.
  const heroIndex = heroWordIndex(page.tokens.map((t) => t.text));

  const TokenView = TOKEN_RENDERERS[config.styleId];
  const entrance = pageEntrance(frame, fps, msToFrames(page.startMs, fps));

  return (
    <AbsoluteFill>
      <div style={anchorStyle}>
        <div
          key={page.id}
          /**
           * Marks the caption block for the editor's transform box, which
           * measures this element to draw bounds that actually contain the
           * text. Read by `CaptionDragLayer` via `querySelector`.
           *
           * Layout-neutral by construction — it is an attribute, not a style —
           * so it cannot affect the export, which never mounts this component
           * in a document the editor can see.
           */
          data-bolo-caption-block=""
          style={{
            ...rowStyle,
            opacity: entrance,
            transform: `translateY(${(1 - entrance) * 16}px)`,
          }}
        >
          {page.tokens.map((token, i) => (
            <TokenView
              key={`${page.id}-${i}`}
              token={token}
              frame={frame}
              fps={fps}
              fromFrame={msToFrames(token.fromMs, fps)}
              toFrame={msToFrames(token.toMs, fps)}
              config={config}
              textStyle={textStyle}
              index={i}
              totalTokens={page.tokens.length}
              heroIndex={heroIndex}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
});
