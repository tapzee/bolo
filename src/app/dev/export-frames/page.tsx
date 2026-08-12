import dynamic from "next/dynamic";
import type { AspectRatioId } from "@/core";
import { ASPECT_RATIOS } from "@/core";
import {
  BACKDROP_IDS,
  type BackdropId,
} from "@/remotion/compositions/backdrop-options";

const ExportFrameGrid = dynamic(
  () => import("@/components/dev/ExportFrameGrid"),
  {
    loading: () => (
      <p className="font-mono text-xs text-muted-foreground">Rendering frames…</p>
    ),
  },
);

/**
 * Internal parity surface: the DOM preview and the Canvas2D export, same style,
 * same playhead, side by side. Gated by `ENABLE_DEV_ROUTES=1` like the rest of
 * `/dev`. See `components/dev/ExportFrameGrid.tsx` for why this exists.
 *
 *   /dev/export-frames?styles=focus,stack&t=2700,5000&w=300
 *
 * `styles` omitted compares the whole catalogue, which is slow — pass the ones
 * you changed.
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

export default async function DevExportFramesPage({
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
  const styleIds = (first("styles") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const rawWidth = Number.parseInt(first("w") ?? "", 10);
  const tileWidth =
    Number.isFinite(rawWidth) && rawWidth >= 120 && rawWidth <= 1080 ? rawWidth : undefined;

  return (
    <div className="min-h-dvh bg-background p-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-sm font-semibold">Preview vs export parity</h1>
        <p className="font-mono text-xs text-muted-foreground">
          aspect={aspect} · backdrop={backdrop} · t={times.join(",")} · styles=
          {styleIds.length > 0 ? styleIds.join(",") : "all"} · w={tileWidth ?? "auto"}
        </p>
      </header>
      <ExportFrameGrid
        aspect={aspect}
        backdrop={backdrop}
        timesMs={times}
        styleIds={styleIds}
        tileWidth={tileWidth}
      />
    </div>
  );
}
