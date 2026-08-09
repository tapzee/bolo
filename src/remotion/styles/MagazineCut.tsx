import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  isMagazineCutKeyword,
  magazineCutFontScale,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import { hasDevanagari } from "@/core";
import { ENTER_SMOOTH, ENTER_SUBTLE, maskRevealX, layeredDepthDrift, tokenEnter } from "../captions/animation";

/**
 * Magazine Cut — Template 04.
 *
 * A magazine-headline keyword that reveals via a left→right wipe (not a
 * slide) and keeps a slow horizontal drift for as long as it's on screen —
 * oversized, tight tracking, deliberately not a basic fade/slide entrance.
 * Hindi emphasis and supporting text stay quiet so the keyword reads as the
 * one loud element on the page.
 */
export const MagazineCutToken: React.FC<TokenViewProps> = ({
  token,
  frame,
  fps,
  fromFrame,
  config,
  textStyle,
}) => {
  const role = token.role ?? "normal";
  const isDevanagariWord = hasDevanagari(token.text);
  const isKeyword = isMagazineCutKeyword(role);
  const timing = { frame, fps, fromFrame };
  const fontSize = (textStyle.fontSize as number) * magazineCutFontScale(role, isDevanagariWord);

  if (isKeyword) {
    const reveal = maskRevealX(timing, ENTER_SMOOTH);
    const drift = layeredDepthDrift(frame, fps, 6, 9);
    return (
      <span style={tokenShellStyle}>
        <span
          style={{
            ...textStyle,
            fontFamily: FONT_FAMILY[config.fontId],
            fontSize,
            color: token.color ?? config.baseColor,
            fontWeight: 800,
            letterSpacing: -fontSize * 0.02,
            transform: `translateX(${drift}px)`,
            clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
            opacity: Math.min(1, reveal * 3),
            zIndex: 2,
          }}
        >
          {displayText(token)}
        </span>
      </span>
    );
  }

  if (isDevanagariWord) {
    const enter = tokenEnter(timing, ENTER_SUBTLE);
    return (
      <span style={tokenShellStyle}>
        <span
          style={{
            ...textStyle,
            fontFamily: FONT_FAMILY.notoSerifDevanagari,
            fontSize,
            color: token.color ?? config.accentColor,
            fontWeight: 600,
            opacity: enter,
            zIndex: 1,
          }}
        >
          {displayText(token)}
        </span>
      </span>
    );
  }

  const enter = tokenEnter(timing, ENTER_SMOOTH);
  return (
    <span style={tokenShellStyle}>
      <span
        style={{
          ...textStyle,
          fontFamily: FONT_FAMILY[config.secondaryFontId ?? "inter"],
          fontSize,
          color: token.color ?? "#ffffff",
          opacity: enter,
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};
