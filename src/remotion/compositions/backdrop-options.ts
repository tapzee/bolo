/**
 * Backdrop identifiers and labels, with no Remotion import.
 *
 * Split out from `PreviewBackdrop.tsx` so Server Components can reference the
 * ids — importing the component instead drags `remotion` into the RSC graph,
 * where `React.createContext` is undefined and the build fails at page-data
 * collection with a misleading error.
 */

export const BACKDROP_IDS = ["studio", "bright", "busy"] as const;
export type BackdropId = (typeof BACKDROP_IDS)[number];

export interface BackdropOption {
  readonly id: BackdropId;
  readonly label: string;
  readonly hint: string;
}

export const BACKDROPS: readonly BackdropOption[] = [
  { id: "studio", label: "Studio", hint: "Dark, even footage" },
  { id: "bright", label: "Daylight", hint: "Blown-out outdoor shot" },
  { id: "busy", label: "Busy", hint: "Worst case for legibility" },
];

export const isBackdropId = (value: string): value is BackdropId =>
  (BACKDROP_IDS as readonly string[]).includes(value);
