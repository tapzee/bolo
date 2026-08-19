"use client";

import { useMemo } from "react";
import { Player } from "@remotion/player";
import { CaptionScene } from "@/remotion/compositions/CaptionScene";
import type { CaptionStyleConfig, CaptionPage } from "@/core";

const dummyPages: CaptionPage[] = [{
  id: "p1",
  text: "Bolo बोलो",
  startMs: 0,
  durationMs: 2000,
  tokens: [
    { text: "Bolo", fromMs: 0, toMs: 1000, role: "anchor" },
    { text: "बोलो", fromMs: 1000, toMs: 2000, role: "accent" }
  ]
}];

export default function TemplatePreviewPlayer({ config }: { config: CaptionStyleConfig }) {
  const inputProps = useMemo(() => ({
    pages: dummyPages,
    config,
    videoSrc: null,
    backdrop: "studio" as const
  }), [config]);

  return (
    <Player
      component={CaptionScene}
      inputProps={inputProps}
      durationInFrames={60}
      fps={30}
      compositionWidth={1000}
      compositionHeight={250}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      autoPlay
      loop
      controls={false}
      acknowledgeRemotionLicense
    />
  );
}
