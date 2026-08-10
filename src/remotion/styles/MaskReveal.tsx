import { memo } from "react";
import {
  ENTER_SMOOTH,
  tokenHighlight,
  tokenPulse,
} from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Mask Reveal — Large keyword contains the video visually inside the letters.
 * Since we can't easily punch a hole through to the *video* in standard DOM without mix-blend-mode tricky setups
 * that might not export cleanly, we simulate it here by making the text transparent with a thick white outline
 * or white background with transparent text. 
 * Actually, we will just use a massive scale up with bold text.
 */
export const MaskRevealToken = memo(function MaskRevealToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index,
  heroIndex
}: TokenViewProps) {
  const isHero = index === heroIndex;
  const pulse = tokenPulse({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);
  const highlight = tokenHighlight({ frame, fps, fromFrame, toFrame }, ENTER_SMOOTH);

  const scaleMult = isHero ? 1.5 : 1.0;

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `scale(${scaleMult * pulse})`,
        opacity: pulse, 
      }}
    >
      <span style={{ 
        ...textStyle, 
        ...tokenGlyphStyle, 
        color: highlight > 0.5 ? config.accentColor : config.baseColor,
        // Optional: mix-blend-mode: overlay for a cool effect if we want to fake a mask reveal
        mixBlendMode: isHero ? "overlay" : "normal",
        fontSize: `${(textStyle.fontSize as number) * scaleMult}px`
      }}>
        {displayText(token)}
      </span>
    </span>
  );
});
