import React from "react";
import type { TokenViewProps } from "../captions/primitives";
import {
  tokenShellStyle,
  displayText,
  editorialKineticRole,
  editorialKineticFontScale,
  isEditorialKineticAccent,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";
import type { WordRole } from "@/core";
import { hasDevanagari } from "@/core";
import {
  ENTER_SMOOTH,
  ENTER_SUBTLE,
  tokenEnter,
} from "../captions/animation";

type EditorialKineticVariant = "classic" | "pop";

/**
 * Editorial Kinetic — a three-tier editorial typography system (bold
 * condensed display anchor, elegant italic editorial accent, tiny sans
 * support connectors) stacked one word per line so the composition reads as
 * a deliberately designed block rather than a wrapped sentence.
 *
 * Backs two `StyleId`s (`editorialKinetic` "Classic Flow" and
 * `editorialKineticPop` "Pop Editorial") that share every typography/layout
 * decision below and differ only in the `variant` prop's entrance motion —
 * per the spec's own rule that a template's animation preset must never
 * change its visual identity.
 *
 * Every word owns its row (`flexBasis: 100%`) rather than the layout being
 * decided from sibling roles: `TokenViewProps` deliberately never hands a
 * token its neighbours' data (see the doc comment on `heroIndex` in
 * `primitives.ts`) so that `React.memo` keeps working per-word. The
 * reference's occasional two-word top line (a support word sharing a row with
 * the display word right after it) is the one case this simplifies away.
 *
 * Mirrored in `lib/export/draw-captions.ts` under `case "editorialKinetic"`/
 * `case "editorialKineticPop"`, and in `remotion/captions/page-fit.ts`'s
 * box-fit estimate. All three must change together.
 */
const EditorialKineticBase: React.FC<
  TokenViewProps & { variant: EditorialKineticVariant }
> = ({ token, frame, fps, fromFrame, config, textStyle, variant }) => {
  const role: WordRole = token.role ?? "normal";
  const isDevanagariWord = hasDevanagari(token.text);
  const ekRole = editorialKineticRole(role, token.text);
  const isAccent = isEditorialKineticAccent(role);
  const timing = { frame, fps, fromFrame };

  const fontSize =
    (textStyle.fontSize as number) * editorialKineticFontScale(role, ekRole);

  const displayFamily = FONT_FAMILY[config.fontId];
  const supportFamily = FONT_FAMILY[config.secondaryFontId ?? "inter"];
  const editorialFamily = FONT_FAMILY[config.specialFontId ?? "playfair"];

  const fontFamily = isDevanagariWord
    ? ekRole === "support"
      ? FONT_FAMILY.devanagari
      : FONT_FAMILY.notoSerifDevanagari
    : ekRole === "display"
      ? displayFamily
      : ekRole === "editorial"
        ? editorialFamily
        : supportFamily;

  const fontStyle: "normal" | "italic" =
    ekRole === "editorial" && !isDevanagariWord ? "italic" : "normal";

  let fontWeight: number;
  let color: string;
  let noStroke = false;
  let enter: number;
  let yOffset = 0;
  let xOffset = 0;
  let blurPx = 0;

  if (ekRole === "display") {
    fontWeight = isDevanagariWord ? 700 : 400;
    color = isAccent
      ? (token.color ?? config.accentColor)
      : (token.color ?? config.baseColor);

    if (variant === "pop") {
      enter = tokenEnter(timing, ENTER_SMOOTH);
      blurPx = (1 - enter) * 6;
    } else {
      enter = tokenEnter(timing, ENTER_SMOOTH);
      yOffset = (1 - enter) * 26;
      blurPx = (1 - enter) * 8;
    }
  } else if (ekRole === "editorial") {
    fontWeight = isDevanagariWord ? 600 : 500;
    color = token.color ?? "#f5f5f0";
    noStroke = true;
    // Flowing, not bouncy — the spec is explicit that the editorial accent
    // must feel elegant regardless of which animation preset is active.
    enter = tokenEnter(timing, ENTER_SUBTLE);
    yOffset = (1 - enter) * 15;
    blurPx = (1 - enter) * 4;
    xOffset = fontSize * 0.03;
  } else {
    fontWeight = 600;
    color = token.color ?? "#ffffff";
    noStroke = true;
    enter = tokenEnter(timing, ENTER_SMOOTH);
    yOffset = (1 - enter) * 8;
    xOffset = -fontSize * 0.02;
  }

  // Controlled overlap: each tier tucks a little closer to the row above it
  // than a flat line-height would, without independently centering any line
  // — the whole page still shares one visual centre.
  const overlapMarginEm =
    ekRole === "display" ? -0.06 : ekRole === "editorial" ? -0.1 : -0.08;

  return (
    <span
      style={{
        ...tokenShellStyle,
        // Owns its row — this is what produces the vertical stack.
        flexBasis: "100%",
        justifyContent: "center",
        marginTop: `${overlapMarginEm}em`,
      }}
    >
      <span
        style={{
          ...textStyle,
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle,
          color,
          textTransform: ekRole === "display" ? "uppercase" : "lowercase",
          letterSpacing:
            ekRole === "display" ? textStyle.letterSpacing : 0,
          opacity: enter,
          transform: `translate(${xOffset}px, ${yOffset}px)`,
          filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
          WebkitTextStroke: noStroke
            ? "0px transparent"
            : textStyle.WebkitTextStroke,
          textShadow:
            ekRole === "display"
              ? "0 6px 20px rgba(0,0,0,0.65)"
              : "0 2px 10px rgba(0,0,0,0.6)",
          zIndex: 1,
        }}
      >
        {displayText(token)}
      </span>
    </span>
  );
};

export const EditorialKineticToken: React.FC<TokenViewProps> = (props) => (
  <EditorialKineticBase {...props} variant="classic" />
);

export const EditorialKineticPopToken: React.FC<TokenViewProps> = (props) => (
  <EditorialKineticBase {...props} variant="pop" />
);
