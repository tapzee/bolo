"use client";

import dynamic from "next/dynamic";
import type { FrameGridProps } from "./FrameGridClient";

// `ssr: false` is only permitted inside a Client Component, so the dynamic
// import lives here rather than in the page. Remotion's Thumbnail touches
// `window` on import and cannot be server-rendered.
const FrameGridClient = dynamic(() => import("./FrameGridClient"), {
  ssr: false,
  loading: () => (
    <p className="font-mono text-xs text-muted-foreground">Rendering frames…</p>
  ),
});

export function FrameGrid(props: FrameGridProps) {
  return <FrameGridClient {...props} />;
}
