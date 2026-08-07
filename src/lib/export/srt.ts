"use client";

import { serializeSrt } from "@remotion/captions";
import type { CaptionPage } from "@/core";

/**
 * Exports the current caption pages as an SRT file.
 *
 * Uses the same page grouping the video export burns in, so the sidecar file
 * and the burned-in captions break lines identically — a subtitle track that
 * disagrees with the picture is worse than no subtitle track.
 *
 * Worth offering even though the whole point of the app is burned-in captions:
 * YouTube ranks and searches uploaded SRT text, so creators want both.
 */
export const pagesToSrt = (pages: readonly CaptionPage[]): string =>
  serializeSrt({
    lines: pages.map((page) =>
      page.tokens.map((token) => ({
        text: token.text,
        startMs: token.fromMs,
        endMs: token.toMs,
        timestampMs: Math.round((token.fromMs + token.toMs) / 2),
        confidence: null,
      })),
    ),
  });

export const downloadSrt = (
  pages: readonly CaptionPage[],
  sourceName: string,
): void => {
  const stem = sourceName.replace(/\.[^.]+$/, "").slice(0, 60) || "captions";
  // BOM so Windows tools open the Devanagari correctly instead of as mojibake.
  const blob = new Blob(["﻿", pagesToSrt(pages)], {
    type: "text/srt;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${stem}.srt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
