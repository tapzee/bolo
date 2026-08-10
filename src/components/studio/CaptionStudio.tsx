"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Info, Type } from "lucide-react";
import {
  ASPECT_LIST,
  CAPTION_STYLE_LIST,
  DEFAULT_ASPECT,
  DEFAULT_STYLE_ID,
  FONTS,
  SAMPLE_CAPTIONS,
  SAMPLE_DURATION_MS,
  VIDEO_FPS,
  canvasSize,
  getStyleDefaults,
  isStyleId,
  msToFrames,
  type AspectRatioId,
  type CaptionPlacement,
  type CaptionStyleConfig,
  type FontId,
  type StyleId,
} from "@/core";
import { buildCaptionPages } from "@/remotion/captions/build-pages";
import {
  BACKDROPS,
  type BackdropId,
} from "@/remotion/compositions/PreviewBackdrop";
import { ErrorBoundary } from "@/components/error-boundary";
import { Label } from "@/components/ui/label";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StyleCard } from "./StyleCard";

// The Player reaches for `window` during module init, so it can never render on
// the server. Loading it dynamically also keeps Remotion out of the initial
// bundle, which is what gets the first paint under the 2s target.
const PlayerStage = dynamic(() => import("./PlayerStage"), {
  ssr: false,
  loading: () => <StageSkeleton />,
});

function StageSkeleton() {
  return (
    <div className="absolute inset-0 animate-pulse rounded-2xl bg-surface-inset ring-hairline" />
  );
}

const PLACEMENTS: readonly { value: CaptionPlacement; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom-third", label: "Bottom third" },
  { value: "bottom", label: "Bottom" },
];

const ASPECT_OPTIONS: readonly SegmentedOption<AspectRatioId>[] =
  ASPECT_LIST.map((a) => ({
    value: a.id,
    label: a.ratioLabel,
    hint: `${a.label} — ${a.hint}`,
  }));

const BACKDROP_OPTIONS: readonly SegmentedOption<BackdropId>[] = BACKDROPS.map(
  (b) => ({ value: b.id, label: b.label, hint: b.hint }),
);

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        {hint ? (
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function CaptionStudio() {
  const [styleId, setStyleId] = useState<StyleId>(DEFAULT_STYLE_ID);
  const [aspect, setAspect] = useState<AspectRatioId>(DEFAULT_ASPECT);
  const [backdrop, setBackdrop] = useState<BackdropId>("studio");
  const [overrides, setOverrides] = useState<Partial<CaptionStyleConfig>>({});

  const config = useMemo<CaptionStyleConfig>(() => {
    const validStyleId = isStyleId(styleId) ? styleId : "bold-yellow";
    return { ...getStyleDefaults(validStyleId), ...overrides };
  }, [styleId, overrides]);

  // Switching preset discards tweaks — carrying Anton's 84px size onto Clean
  // would misrepresent what the preset actually looks like.
  const selectStyle = useCallback((id: StyleId) => {
    setStyleId(id);
    setOverrides({});
  }, []);

  const patch = useCallback((next: Partial<CaptionStyleConfig>) => {
    setOverrides((prev) => ({ ...prev, ...next }));
  }, []);

  // Memoised on the fields that actually affect grouping (page-fit is now
  // style-aware), so a pure colour edit does not rebuild every page.
  const pages = useMemo(
    () =>
      buildCaptionPages(SAMPLE_CAPTIONS, {
        styleId: config.styleId,
        combineWithinMs: config.combineWithinMs,
        maxWordsPerPage: config.maxWordsPerPage,
        fontSizePx: config.fontSizePx,
        letterSpacingPx: config.letterSpacingPx,
        wordGapPx: config.wordGapPx,
        lineHeight: config.lineHeight,
        maxLineWidthPct: config.maxLineWidthPct,
        maxBlockHeightPct: config.maxBlockHeightPct,
        annotationSizeRatio: config.annotationSizeRatio,
      }),
    [
      config.styleId,
      config.combineWithinMs,
      config.maxWordsPerPage,
      config.fontSizePx,
      config.letterSpacingPx,
      config.wordGapPx,
      config.lineHeight,
      config.maxLineWidthPct,
      config.maxBlockHeightPct,
      config.annotationSizeRatio,
    ],
  );

  // Keeps slider drags at input framerate: the control updates immediately
  // while React re-renders the preview at lower priority. Better than a
  // debounce here — a debounce would make the preview visibly lag the thumb.
  const previewConfig = useDeferredValue(config);

  const durationInFrames = useMemo(
    () => Math.max(1, msToFrames(SAMPLE_DURATION_MS, VIDEO_FPS)),
    [],
  );

  const stageSize = useMemo(() => canvasSize(aspect, "1080p"), [aspect]);

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_384px] lg:px-8 lg:py-10">
      {/* Stage */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-w-0 flex-col items-center gap-5"
        style={{ ["--stage-h" as string]: "min(66vh, 660px)" }}
      >
        <div
          className="relative w-full shadow-lift"
          style={{
            aspectRatio: `${stageSize.width} / ${stageSize.height}`,
            maxWidth: `calc(var(--stage-h) * ${stageSize.width / stageSize.height})`,
          }}
        >
          <ErrorBoundary label="Preview">
            <PlayerStage
              pages={pages}
              config={previewConfig}
              backdrop={backdrop}
              canvasWidth={stageSize.width}
              canvasHeight={stageSize.height}
              durationInFrames={durationInFrames}
            />
          </ErrorBoundary>
        </div>

        <div className="w-full max-w-lg space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            {pages.length} caption pages · {SAMPLE_CAPTIONS.length} words ·{" "}
            {(SAMPLE_DURATION_MS / 1000).toFixed(1)}s · {VIDEO_FPS}fps
          </p>
          <div className="rounded-xl border bg-card/60 p-4 text-left">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Info className="size-3" />
              Sample script
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">
              {SAMPLE_CAPTIONS.map((w) => w.text).join(" ")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Control rail */}
      <motion.aside
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="min-w-0 space-y-7 lg:sticky lg:top-24 lg:self-start"
      >
        <Section title="Caption style">
          <div role="radiogroup" aria-label="Caption style" className="space-y-1">
            {CAPTION_STYLE_LIST.map((definition) => (
              <StyleCard
                key={definition.id}
                definition={definition}
                selected={definition.id === styleId}
                onSelect={() => selectStyle(definition.id)}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Format"
          hint="From Phase 2 this is read from your uploaded file automatically. Here it simulates what detection would return."
        >
          <Segmented
            options={ASPECT_OPTIONS}
            value={aspect}
            onChange={setAspect}
            layoutId="aspect-pill"
            label="Aspect ratio"
          />
        </Section>

        <Section
          title="Footage"
          hint="Stand-in backgrounds. Every style has to stay readable on all three — that is what the black stroke is for."
        >
          <Segmented
            options={BACKDROP_OPTIONS}
            value={backdrop}
            onChange={setBackdrop}
            layoutId="backdrop-pill"
            label="Backdrop"
          />
        </Section>

        <Section title="Typography">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Font</Label>
              <Select
                value={config.fontId}
                onValueChange={(v) => patch({ fontId: v as FontId })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      <span className="flex items-center gap-2">
                        {font.label}
                        {font.nativeDevanagari ? (
                          <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                            देवनागरी
                          </span>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                Fonts without the badge fall back to Noto Sans Devanagari for
                Hindi glyphs.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Size</Label>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {config.fontSizePx}px
                </span>
              </div>
              <Slider
                value={[config.fontSizePx]}
                min={36}
                max={140}
                step={2}
                onValueChange={([v]) => {
                  if (v !== undefined) patch({ fontSizePx: v });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Placement</Label>
              <Select
                value={config.placement}
                onValueChange={(v) =>
                  patch({ placement: v as CaptionPlacement })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Words per page
                </Label>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {config.maxWordsPerPage}
                </span>
              </div>
              <Slider
                value={[config.maxWordsPerPage]}
                min={1}
                max={8}
                step={1}
                onValueChange={([v]) => {
                  if (v !== undefined) patch({ maxWordsPerPage: v });
                }}
              />
            </div>
          </div>
        </Section>

        <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <Type className="mt-0.5 size-3 shrink-0" />
          Sizes are authored against a 1080×1920 reference canvas and scaled to
          the real output, so one style definition renders identically at 9:16,
          1:1 and 16:9 — and at 720p through 4K.
        </p>
      </motion.aside>
    </div>
  );
}
