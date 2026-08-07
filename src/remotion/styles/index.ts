import type { ComponentType } from "react";
import type { StyleId } from "@/core";
import type { TokenViewProps } from "../captions/primitives";
import { BoldYellowToken } from "./BoldYellow";
import { BoxToken } from "./Box";
import { CleanToken } from "./Clean";
import { DualToken } from "./DualToken";
import { GlowToken } from "./Glow";
import { PopToken } from "./Pop";
import { SplashToken } from "./Splash";

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
  glow: GlowToken,
  clean: CleanToken,
  splash: SplashToken,
  dual: DualToken,
};

