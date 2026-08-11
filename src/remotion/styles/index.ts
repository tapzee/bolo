import type { ComponentType } from "react";
import type { StyleId } from "@/core";
import type { TokenViewProps } from "../captions/primitives";
import { BoldYellowToken } from "./BoldYellow";
import { BoxToken } from "./Box";
import { CleanToken } from "./Clean";
import { DualToken } from "./DualToken";
import { GlowToken } from "./Glow";
import { HeroStackToken } from "./HeroStack";
import { PopToken } from "./Pop";
import { SplashToken } from "./Splash";
import { DynamicToken } from "./Dynamic";
import { DynamicHighlightToken } from "./DynamicHighlight";
import { HeroMixedToken } from "./HeroMixed";
import { EditorialOverlayToken } from "./EditorialOverlay";
import { KineticToken } from "./Kinetic";
import { UnderlinePunchToken } from "./UnderlinePunch";
import { HighlightMarkerToken } from "./HighlightMarker";
import { MixedWeightToken } from "./MixedWeight";
import { KineticSplitToken } from "./KineticSplit";
import { CenterPunchToken } from "./CenterPunch";
import { VerticalImpactToken } from "./VerticalImpact";
import { EditorialStackToken } from "./EditorialStack";
import { MagazineCutToken } from "./MagazineCut";
import { MinimalLuxuryToken } from "./MinimalLuxury";
import { LayeredDepthToken } from "./LayeredDepth";
import { PopScaleToken } from "./PopScale";
import { SlideInToken } from "./SlideIn";
import { BlurFocusToken } from "./BlurFocus";
import { TypewriterToken } from "./Typewriter";
import { RotateRevealToken } from "./RotateReveal";
import { WipeUpToken } from "./WipeUp";
import { StrokeFillToken } from "./StrokeFill";
import { BounceWordToken } from "./BounceWord";
import { GlitchToken } from "./Glitch";
import { HighlightWordToken } from "./HighlightWord";
import { ZoomFocusToken } from "./ZoomFocus";
import { GradientFlowToken } from "./GradientFlow";
import { MaskRevealToken } from "./MaskReveal";
import { DrawOnToken } from "./DrawOn";
import { Depth3DToken } from "./Depth3D";
import { EditorialKineticToken, EditorialKineticPopToken } from "./EditorialKinetic";
import { DynamicSlideStackToken } from "./DynamicSlideStack";
import { GlassHighlightToken } from "./GlassHighlight";
import { SplitTextToken } from "./SplitText";
import { LiquidFlowToken } from "./LiquidFlow";
import { LightSweepToken } from "./LightSweep";
import { PaperCutToken } from "./PaperCut";
import { FlipCardToken } from "./FlipCard";
import { RibbonSlideToken } from "./RibbonSlide";
import { SpiralRevealToken } from "./SpiralReveal";
import { FloatingBubbleToken } from "./FloatingBubble";
import { DynamicTypographyToken } from "./DynamicTypography";
import { EditorialStackHeroToken } from "./EditorialStackHero";
import { StackToken } from "./Stack";

/**
 * Style id → word renderer.
 *
 * A lookup table rather than a switch so the set of styles stays exhaustive by
 * type: adding an id to `STYLE_IDS` without adding a renderer here is a compile
 * error, not a blank caption discovered at export time.
 */
export const TOKEN_RENDERERS: Readonly<
  Record<StyleId, ComponentType<TokenViewProps>>
> = {
  "bold-yellow": BoldYellowToken,
  pop: PopToken,
  box: BoxToken,
  splash: SplashToken,
  clean: CleanToken,
  glow: GlowToken,
  dual: DualToken,
  hero: HeroStackToken,
  dynamic: DynamicToken,
  heroMixed: HeroMixedToken,
  dynamicHighlight: DynamicHighlightToken,
  editorialOverlay: EditorialOverlayToken,
  kinetic: KineticToken,
  underlinePunch: UnderlinePunchToken,
  highlightMarker: HighlightMarkerToken,
  mixedWeight: MixedWeightToken,
  kineticSplit: KineticSplitToken,
  centerPunch: CenterPunchToken,
  verticalImpact: VerticalImpactToken,
  editorialStack: EditorialStackToken,
  magazineCut: MagazineCutToken,
  minimalLuxury: MinimalLuxuryToken,
  layeredDepth: LayeredDepthToken,
  // 15 Premium Templates
  popScale: PopScaleToken,
  slideIn: SlideInToken,
  blurFocus: BlurFocusToken,
  typewriter: TypewriterToken,
  rotateReveal: RotateRevealToken,
  wipeUp: WipeUpToken,
  strokeFill: StrokeFillToken,
  bounceWord: BounceWordToken,
  glitch: GlitchToken,
  highlightWord: HighlightWordToken,
  zoomFocus: ZoomFocusToken,
  gradientFlow: GradientFlowToken,
  maskReveal: MaskRevealToken,
  drawOn: DrawOnToken,
  depth3d: Depth3DToken,
  editorialKinetic: EditorialKineticToken,
  editorialKineticPop: EditorialKineticPopToken,
  dynamicSlideStack: DynamicSlideStackToken,
  glassHighlight: GlassHighlightToken,
  splitText: SplitTextToken,
  liquidFlow: LiquidFlowToken,
  lightSweep: LightSweepToken,
  paperCut: PaperCutToken,
  flipCard: FlipCardToken,
  ribbonSlide: RibbonSlideToken,
  spiralReveal: SpiralRevealToken,
  floatingBubble: FloatingBubbleToken,
  dynamicTypography: DynamicTypographyToken,
  editorialStackHero: EditorialStackHeroToken,
  stack: StackToken,
};

