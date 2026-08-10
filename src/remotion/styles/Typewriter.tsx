import { memo } from "react";
import type { WordRole } from "@/core";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  isTypewriterAccent,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Typewriter — clean monospace caption, revealed character-by-character.
 *
 * The character count is a *discrete* step of the word's own speaking
 * window, not an eased spring — a spring would smear the mechanical "typed"
 * read this template depends on. Only the word currently mid-type shows the
 * blinking cursor, so it never lingers on already-finished words.
 */
export const TypewriterToken = memo(function TypewriterToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const role: WordRole = token.role ?? "normal";
  const isAccent = isTypewriterAccent(role);
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);

  const text = displayText(token);
  const durationFrames = Math.max(1, toFrame - fromFrame);
  const elapsed = Math.max(0, frame - fromFrame);
  const typedChars = Math.min(text.length, Math.ceil((elapsed / durationFrames) * text.length));
  const visible = text.slice(0, typedChars);
  const isTyping = typedChars < text.length && frame <= toFrame;
  const cursorOn = isTyping && Math.floor((frame / fps) * 4) % 2 === 0;

  const color = token.color ?? (isAccent ? config.accentColor : config.baseColor);

  return (
    <span style={{ ...tokenShellStyle, opacity: enter }}>
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          color,
          WebkitTextStroke: isAccent ? textStyle.WebkitTextStroke : "0px transparent",
        }}
      >
        {visible}
        {cursorOn && (
          <span aria-hidden style={{ opacity: 0.9, color: config.accentColor }}>
            |
          </span>
        )}
      </span>
    </span>
  );
});
