import { memo } from "react";
import { ENTER_SMOOTH, tokenEnter } from "../captions/animation";
import {
  displayText,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Clean — minimal white, professional.
 *
 * Uses `tokenEnter` rather than the karaoke-style rise-and-fall: a word that
 * has been spoken stays fully lit so the viewer can still read the front of the
 * line. Only words not yet reached sit back at `upcomingOpacity`.
 *
 * No scale, no colour shift, no bounce. The restraint is the design — this is
 * the preset for brand and talking-head work, and any per-word movement here
 * immediately makes it look like the others.
 */
export const CleanToken = memo(function CleanToken({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}: TokenViewProps) {
  const enter = tokenEnter({ frame, fps, fromFrame }, ENTER_SMOOTH);

  const opacity =
    config.upcomingOpacity + (1 - config.upcomingOpacity) * enter;

  return (
    <span
      style={{
        ...tokenShellStyle,
        transform: `translateY(${(1 - enter) * 4}px)`,
        opacity,
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          color: token.color ?? config.baseColor,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
});
