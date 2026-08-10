import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  depth3dFontScale,
  displayText,
  isDepth3dAccent,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

const DEPTH_LAYERS = 6;

/**
 * 3D Depth — extruded layered text. Depth is a spring-driven offset
 * (`enter`), never a CSS `transition` — Remotion renders by seeking to a
 * frame and screenshotting it, and a transition has no defined value at an
 * arbitrary seeked frame, so it froze/stuttered on export in the previous
 * version.
 */
export const Depth3DToken = memo(function Depth3DToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isDepth3dAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);

  const fontSize = (textStyle.fontSize as number) * depth3dFontScale(role);
  const depth = isAccent ? enter * DEPTH_LAYERS : 0;
  const color = token.color ?? "#ffffff";

  // A pure black/grey offset (the reference's literal "darkened shadow") is
  // all but invisible over this app's typically dark video backdrops —
  // verified against a rendered frame, not assumed. `accentColor` keeps the
  // extrusion legible over any footage brightness, which is the higher-
  // priority readability guarantee.
  const shadowLayers: string[] = [];
  for (let i = 1; i <= DEPTH_LAYERS; i++) {
    const t = (depth * i) / DEPTH_LAYERS;
    shadowLayers.push(`${t.toFixed(2)}px ${t.toFixed(2)}px 0 ${config.accentColor}`);
  }

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: enter,
        transform: `translateY(${-depth * 0.4}px)`,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
          textShadow: isAccent ? shadowLayers.join(", ") : undefined,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
