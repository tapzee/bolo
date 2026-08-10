import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter, tokenPulse } from "../captions/animation";
import {
  displayText,
  isMaskRevealHero,
  maskRevealFontScale,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Mask Reveal.
 *
 * The reference concept is the video showing through the glyph shapes.
 * `mix-blend-mode: overlay` on the hero word achieves that directly: the
 * blend is computed per-pixel only where the glyph is opaque, so the
 * footage's own tone and detail show through the letterforms while the area
 * around them is untouched — genuinely different from a plain scale-up, and
 * portable to the Canvas2D export as `globalCompositeOperation`.
 *
 * The fill is mid-grey (`#808080`), not white — verified against a rendered
 * frame, not assumed. Overlay blend's neutral point is 50% grey, where the
 * blend leaves the base almost unchanged (near pass-through); a white fill
 * only lightens, which reads as a plain glow over dark footage and washes
 * out to solid white over bright footage. Grey is what actually lets the
 * footage's own detail show inside the letterforms at any brightness.
 */
export const MaskRevealToken = memo(function MaskRevealToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isHero = isMaskRevealHero(role);
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_SMOOTH);
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const fontSize = (textStyle.fontSize as number) * maskRevealFontScale(role);
  const scale = isHero ? 0.82 + Math.min(1.1, pulse) * 0.18 : 1;

  return (
    <span style={{ ...tokenShellStyle, opacity: enter, transform: `scale(${scale})` }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontSize,
          color: token.color ?? (isHero ? "#808080" : config.baseColor),
          WebkitTextStroke: isHero ? textStyle.WebkitTextStroke : "0px transparent",
          mixBlendMode: isHero ? "overlay" : "normal",
          textShadow: isHero ? "0 0 18px rgba(255,255,255,0.25)" : undefined,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
