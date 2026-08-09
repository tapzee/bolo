import { memo } from "react";
import {
  ENTER_BOUNCY,
  ENTER_SMOOTH,
  tokenEnter,
  tokenHighlight,
  tokenPulse,
} from "../captions/animation";
import {
  HERO_SMALL_RATIO,
  annotationFontId,
  displayText,
  getHash,
  heroFontStyle,
  tokenGlyphStyle,
  tokenShellStyle,
  type TokenViewProps,
} from "../captions/primitives";
import { FONT_FAMILY } from "../fonts";

/**
 * Roughly 1 in 3 pages render as a poster instead of a stack: the hero word
 * blown up into a soft, oversized backdrop with the rest of the line set
 * bold and small centered on top of it. The other 2 in 3 keep the plain
 * stacked layout below. Both are "Hero Mixed" — the scene-to-scene variety
 * is the point, the same way `heroFontStyle` already varies individual
 * words within a page.
 *
 * Keyed off `pageSeed` rather than `heroIndex`/`totalTokens` so the choice
 * doesn't just repeat for every page with the same word count, and off the
 * page's own id rather than per-token state so every word on the page
 * agrees on which layout it's part of.
 */
const isBackdropScene = (pageSeed: number): boolean => pageSeed % 3 === 0;

export const HeroMixedToken = memo(function HeroMixedToken({
  token,
  frame,
  fps,
  fromFrame,
  toFrame,
  config,
  textStyle,
  index = 0,
  heroIndex = 0,
  totalTokens = 1,
  pageSeed = 0,
}: TokenViewProps) {
  const timing = { frame, fps, fromFrame, toFrame };
  const enter = tokenEnter(timing, ENTER_BOUNCY);
  const highlight = tokenHighlight(timing, ENTER_SMOOTH);
  const pulse = tokenPulse(timing, ENTER_BOUNCY);

  const text = displayText(token);
  const isHero = index === heroIndex;
  const isSpoken = fromFrame <= frame;

  if (isBackdropScene(pageSeed)) {
    if (isHero) {
      // The backdrop. Removed from flow (`position: absolute`, centered on
      // the anchor box) exactly like EditorialOverlay's hero, so the bold
      // overlay words below aren't pushed around by a word this large.
      const scale = 0.94 + pulse * 0.04;
      return (
        <span
          style={{
            ...tokenShellStyle,
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              ...textStyle,
              ...tokenGlyphStyle,
              fontFamily: textStyle?.fontFamily,
              fontSize: `${config.fontSizePx * 2.1}px`,
              letterSpacing: `${config.fontSizePx * 2.1 * -0.02}px`,
              textTransform: "uppercase",
              color: highlight > 0.01 ? config.activeColor : config.baseColor,
              WebkitTextStroke: "none",
              whiteSpace: "nowrap",
              opacity: 0.82 * enter,
              transform: `scale(${scale})`,
              filter: [
                `blur(${(1 - enter) * 10}px)`,
                config.dropShadow
                  ? `drop-shadow(0px ${config.fontSizePx * 0.06}px ${config.fontSizePx * 0.14}px rgba(0,0,0,0.45))`
                  : "",
              ]
                .filter(Boolean)
                .join(" "),
            }}
          >
            {text}
          </span>
        </span>
      );
    }

    // Bold overlay: a normal caption-weight read sitting on top of the
    // backdrop, not the thin annotation text the stacked layout uses — the
    // whole point of this scene is that this text is what actually gets
    // read, and the giant word behind it is texture.
    const overlaySize = config.fontSizePx * 0.52;
    const overlayAlpha = isSpoken
      ? highlight > 0.01
        ? 1
        : Math.max(0.75, config.upcomingOpacity)
      : config.upcomingOpacity;

    return (
      <span
        style={{
          ...tokenShellStyle,
          zIndex: 10,
          opacity: overlayAlpha,
          transform: `translateY(${(1 - enter) * 8}px)`,
          transition: "opacity 0.1s ease-out",
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize: `${overlaySize}px`,
            fontWeight: 800,
            color: highlight > 0.01 ? config.activeColor : config.baseColor,
            WebkitTextStroke: `${Math.max(
              overlaySize * 0.085,
              config.strokeWidthPx * 0.52 * 1.4,
            )}px ${config.strokeColor}`,
            textShadow: "0 2px 10px rgba(0,0,0,0.55)",
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  // The hero borrows one of four faces per page (see `heroFontStyle`), so a
  // reel doesn't read as the same headline font over and over.
  const heroStyle = isHero ? heroFontStyle(text) : "primary";

  // Shrinks the annotation text when its own side of the hero (above or
  // below) is carrying more words, so that side stays on one row instead of
  // wrapping to a second — a wrapped annotation line breaks the "headline
  // with a caption above and below it" read this engine is going for.
  // Word count rather than a real width measurement: nothing else in this
  // engine measures text either (see `heroWordIndex`'s own note on why), and
  // a word-count heuristic is enough headroom for the difference between a
  // 2-word and a 4-word side.
  const clusterSize = index < heroIndex ? heroIndex : totalTokens - heroIndex - 1;
  const fitScale = clusterSize <= 2 ? 1 : clusterSize === 3 ? 0.88 : 0.78;

  const smallRatio =
    (config.annotationSizeRatio > 0 ? config.annotationSizeRatio : HERO_SMALL_RATIO) *
    fitScale;

  if (!isHero) {
    const smallAlpha = isSpoken
      ? highlight > 0.01
        ? 1
        : Math.max(0.7, config.upcomingOpacity)
      : config.upcomingOpacity;

    // Deterministic per-word jitter (rotation, drift, size) so the
    // annotation cluster reads as loosely handset rather than a single
    // uniform line of identically-sized text — hashed off the word itself so
    // it is stable frame to frame and the DOM preview and Canvas2D export
    // land on the same wobble for the same word. Different modulo bases off
    // the same hash rather than three separate hashes: cheap, and the three
    // outputs land on different words often enough that no one word gets
    // shifted, rotated and shrunk in visible lockstep.
    //
    // Hashed off the lowercased text, not `text` itself: the export path
    // only ever sees the already-lowercased string (this engine forces
    // annotation words to lowercase), and hashing different casings would
    // desync the wobble between preview and export for the same word.
    const wordHash = getHash(text.toLowerCase());
    const smallFontPx = config.fontSizePx * smallRatio;
    const jitterYPx = ((wordHash % 5) - 2) * smallFontPx * 0.1; // ~-20%..+20% of glyph size
    const jitterRotateDeg = (((wordHash >> 2) % 7) - 3) * 1.4; // ~-4.2deg..+4.2deg
    const jitterScale = 0.9 + (((wordHash >> 5) % 5) / 5) * 0.2; // 0.9x..1.1x

    return (
      <span
        style={{
          ...tokenShellStyle,
          opacity: smallAlpha,
          transform: `translateY(${(1 - enter) * 6 + jitterYPx}px) rotate(${jitterRotateDeg}deg) scale(${jitterScale})`,
          transition: "opacity 0.1s ease-out",
          // A dark chip behind the glyphs, not just colour/stroke tuning —
          // stroke and colour both depend on what's *behind* the word, and a
          // busy or light frame can wash either one out regardless of how
          // they're tuned. A solid backdrop is the only guarantee that holds
          // for arbitrary footage.
          background: "rgba(8, 8, 14, 0.42)",
          padding: `${smallFontPx * 0.2}px ${smallFontPx * 0.42}px`,
          borderRadius: smallFontPx * 0.5,
        }}
      >
        <span
          style={{
            ...textStyle,
            ...tokenGlyphStyle,
            fontSize: `${config.fontSizePx * smallRatio}px`,
            fontWeight: config.annotationWeight > 0 ? config.annotationWeight : 500,
            letterSpacing: `${config.fontSizePx * smallRatio * 0.02}px`,
            color: config.annotationColor || "#ececec",
            WebkitTextStroke: `${Math.max(
              config.fontSizePx * smallRatio * 0.085,
              config.strokeWidthPx * smallRatio * 1.4,
            )}px ${config.strokeColor}`,
            textTransform: "lowercase",
            // Alternates between two condensed sans faces per word (hashed off
            // the word itself), instead of always Montserrat, for the "few
            // different big/small texts across a page" variety this engine
            // was asked for — restricted to legible faces since this text
            // renders as small as ~20px on a phone.
            fontFamily: FONT_FAMILY[annotationFontId(text)],
            // Matches HeroStack's supporting text: without it the small words
            // wash out against busy footage even with the stroke in place.
            textShadow: "0 2px 10px rgba(0,0,0,0.55)",
          }}
        >
          {text}
        </span>
      </span>
    );
  }

  // HERO WORD
  const scale = 1 + pulse * 0.2 * config.emphasisScale + highlight * 0.05;

  // Base font follows the template's own choice (`textStyle.fontFamily`),
  // not a hardcoded face — the canvas export already does this, so hardcoding
  // Montserrat here silently disagreed with the export for any template that
  // picks a different `fontId`.
  let fontFamily = textStyle?.fontFamily as string | undefined;
  let color = highlight > 0.01 ? (token.color ?? config.activeColor) : (token.color ?? config.baseColor);
  let textTransform = textStyle?.textTransform || "uppercase";
  let fontWeight = config.fontWeight;
  let strokeWidth = config.strokeWidthPx;

  // "primary" leaves every one of these at the template's own default —
  // only the other three borrow a face and adjust weight/case/stroke to
  // suit it.
  if (heroStyle === "cursive") {
    fontFamily = FONT_FAMILY.caveat;
    // The template's accent color, not a hardcoded white — otherwise a
    // template's `accentColor` had nowhere in this engine it ever rendered.
    color = token.color ?? config.accentColor;
    textTransform = "lowercase";
    fontWeight = 700;
    strokeWidth = Math.max(2, config.strokeWidthPx * 0.5); // Thinner stroke for cursive
  } else if (heroStyle === "impact") {
    fontFamily = FONT_FAMILY.anton;
    textTransform = "uppercase";
    fontWeight = 400; // Anton only ships one weight; anything heavier is synthetic.
  } else if (heroStyle === "serif") {
    fontFamily = FONT_FAMILY.playfair;
    // Sentence case, not the shouted uppercase every other variant uses —
    // an all-caps italic serif reads as a mistake, not as elegant.
    textTransform = "none";
    fontWeight = 700;
    color = token.color ?? config.accentColor;
    strokeWidth = Math.max(2, config.strokeWidthPx * 0.6);
  }

  return (
    <span
      style={{
        ...tokenShellStyle,
        flexBasis: "100%",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...textStyle,
          ...tokenGlyphStyle,
          transform: `translateY(${(1 - enter) * -10}px) scale(${scale})`,
          transformOrigin: "center bottom",
          color,
          fontFamily,
          textTransform: textTransform as "uppercase" | "lowercase" | "capitalize" | "none",
          fontWeight,
          fontStyle: heroStyle === "serif" ? "italic" : undefined,
          WebkitTextStroke: `${strokeWidth}px ${config.strokeColor}`,
          filter: config.dropShadow
            ? `drop-shadow(0px ${config.fontSizePx * 0.06}px ${config.fontSizePx * 0.12}px rgba(0,0,0,0.5))`
            : undefined,
        }}
      >
        {text}
      </span>
    </span>
  );
});
