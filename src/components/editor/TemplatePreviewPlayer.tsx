"use client";

import { useMemo } from "react";
import { Thumbnail } from "@remotion/player";
import { CaptionScene } from "@/remotion/compositions/CaptionScene";
import type { CaptionStyleConfig, CaptionPage } from "@/core";

const dummyPages: CaptionPage[] = [{
  id: "p1",
  text: "Bolo बोलो",
  startMs: 0,
  durationMs: 2000,
  tokens: [
    { text: "Bolo", fromMs: 0, toMs: 1000, role: "keyword" },
    { text: "बोलो", fromMs: 1000, toMs: 2000, role: "special" }
  ]
}];

export default function TemplatePreviewPlayer({ config }: { config: CaptionStyleConfig, staticThumbnail?: boolean }) {
  const previewConfig = useMemo(() => {
    // Increase font size heavily for the preview so it's readable in a tiny card
    const scale = 5.5; 
    return {
      ...config,
      placement: "center" as const,
      verticalOffsetPct: 0,
      horizontalOffsetPct: 0,
      maxLineWidthPct: 100,
      fontSizePx: config.fontSizePx * scale,
      strokeWidthPx: config.strokeWidthPx * scale,
      wordGapPx: config.wordGapPx * scale,
      letterSpacingPx: config.letterSpacingPx * scale,
    };
  }, [config]);

  const inputProps = useMemo(() => ({
    pages: dummyPages,
    config: previewConfig,
    videoSrc: null,
    backdrop: "studio" as const
  }), [previewConfig]);

  return (
    <Thumbnail
      component={CaptionScene}
      inputProps={inputProps}
      durationInFrames={60}
      fps={30}
      compositionWidth={400}
      compositionHeight={188}
      frameToDisplay={30}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
