import type { AspectRatioId } from "@/core";
import { ASPECT_RATIOS } from "@/core";
import { FrameGrid } from "@/components/dev/FrameGrid";
import {
  BACKDROP_IDS,
  type BackdropId,
} from "@/remotion/compositions/backdrop-options";

/**
 * Internal visual-QA surface. Not linked from anywhere in the product.
 *
 * Renders every caption style at fixed playhead positions so screenshots are
 * stable between runs, which is what makes them usable as a regression baseline
 * as the styles evolve through later phases.
 *
 * Default sample times stress the two hard cases:
 *   2700ms — बताऊंगा, a long Devanagari conjunct, is the active word
 *   5000ms — "income", a Latin word active inside an otherwise Hindi line
 */
const DEFAULT_TIMES: readonly number[] = [2700, 5000];

const parseAspect = (value: string | undefined): AspectRatioId =>
  (ASPECT_RATIOS as readonly string[]).includes(value ?? "")
    ? (value as AspectRatioId)
    : "reel";

const parseBackdrop = (value: string | undefined): BackdropId =>
  (BACKDROP_IDS as readonly string[]).includes(value ?? "")
    ? (value as BackdropId)
    : "studio";

const parseTimes = (value: string | undefined): readonly number[] => {
  if (value === undefined) return DEFAULT_TIMES;
  const parsed = value
    .split(",")
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return parsed.length > 0 ? parsed : DEFAULT_TIMES;
};

export default async function DevFramesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const aspect = parseAspect(first("aspect"));
  const backdrop = parseBackdrop(first("backdrop"));
  const times = parseTimes(first("t"));

  const rawWidth = Number.parseInt(first("w") ?? "", 10);
  const tileWidth =
    Number.isFinite(rawWidth) && rawWidth >= 120 && rawWidth <= 1080
      ? rawWidth
      : undefined;

  return (
    <div className="min-h-dvh bg-background p-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-sm font-semibold">Frame QA</h1>
        <p className="font-mono text-xs text-muted-foreground">
          aspect={aspect} · backdrop={backdrop} · t={times.join(",")} · w=
          {tileWidth ?? "auto"}
        </p>
      </header>
      <FrameGrid
        aspect={aspect}
        backdrop={backdrop}
        timesMs={times}
        tileWidth={tileWidth}
      />
    </div>
  );
}
