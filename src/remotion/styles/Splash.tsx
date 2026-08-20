import { memo } from "react";
import { interpolateColors } from "remotion";
import { ENTER_BOUNCY, ENTER_SMOOTH, tokenEnter, tokenHighlight, tokenPulse } from "../captions/animation";
import { FONT_FAMILY } from "../fonts";
import {
  buildGlowShadow,
  displayText,
  getSplashWordRole,
  resolveSecondaryFontSize,
  resolveSpecialFontSize,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";

/**
 * Splash — Modern kinetic typography mixing bold sans headline text, elegant
 * italic scripts, and vibrant oversized accent words. Designed for high retention
 * on Instagram Reels, YouTube Shorts, and TikTok.
 */
export const SplashToken = memo(function SplashToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  totalTokens = 1,
}: TokenViewProps) {
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const text = displayText(token);
  const role = getSplashWordRole(text, index, totalTokens);

  // Inactive words rest at lower opacity so the spoken word pulls focus like karaoke
  const inactiveOpacity = config.upcomingOpacity ?? 0.45;
  const alpha = fromFrame <= frame ? (highlight > 0.01 ? 1 : Math.max(0.65, inactiveOpacity)) : inactiveOpacity;

  // Role-specific styling
  let roleFontFamily = config.secondaryFontId ? FONT_FAMILY[config.secondaryFontId] : textStyle.fontFamily;
  let roleFontSize = resolveSecondaryFontSize(config, 1.0);
  let roleColor = token.color ?? config.baseColor;
  let roleTransform = "uppercase";
  let roleFontStyle = "normal";
  let roleWeight = config.fontWeight;

  if (role === "accent") {
    roleFontFamily = textStyle.fontFamily;
    roleColor = token.color ?? config.accentColor;
    roleFontSize = config.fontSizePx * 1.15; // 15% oversized for punchy emphasis
    roleWeight = Math.max(800, config.fontWeight);
  } else if (role === "script") {
    // Borrow special/script font or Playfair Display italic if base face is not script/serif
    if (config.specialFontId) {
      roleFontFamily = FONT_FAMILY[config.specialFontId];
    } else if (!roleFontFamily?.toString().includes("playfair") && !roleFontFamily?.toString().includes("caveat")) {
      roleFontFamily = FONT_FAMILY.playfair;
    }
    roleFontStyle = "italic";
    roleTransform = "none"; // Preserve lowercase / titlecase for natural script flow
    roleFontSize = resolveSpecialFontSize(config, 1.05); // Slightly scaled to balance serif optical x-height
  }

  // Active word animation: energetic bouncy snap & tilt
  const translateY = (1 - enter) * 12 - highlight * 4;
  const rotate = role === "accent" ? (pulse * -2.5) : role === "script" ? -2 : 0;

  const color = interpolateColors(
    highlight,
    [0, 1],
    [roleColor, role === "script" ? (token.color ?? config.activeColor) : roleColor],
  );

  const glow = buildGlowShadow(config, color, highlight > 0.01 ? 1 : 0.3);
  const dropShadow = glow ?? (highlight > 0.01
    ? `0 6px 24px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.8)`
    : `0 3px 12px rgba(0, 0, 0, 0.5)`);

  return (
    <span
      style={{
        ...tokenShellStyle,
        opacity: alpha,
        transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
        transition: "opacity 0.08s ease-out",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          fontFamily: roleFontFamily,
          fontSize: `${roleFontSize}px`,
          fontWeight: roleWeight,
          fontStyle: roleFontStyle,
          textTransform: roleTransform as "uppercase" | "none",
          color,
          textShadow: dropShadow,
        }}
      >
        {text}
      </span>
    </span>
  );
});
