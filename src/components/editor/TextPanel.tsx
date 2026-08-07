"use client";

import { useState, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, ChevronDown } from "lucide-react";
import {
  FONTS,
  TEXT_ALIGNS,
  resolveTextCase,
  type CaptionPlacement,
  type CaptionStyleConfig,
  type FontId,
  type TextAlign,
  type TextCase,
} from "@/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Patch = (next: Partial<CaptionStyleConfig>) => void;

function Group({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "size-3 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
        {title}
      </button>
      {open ? <div className="space-y-3 pb-4">{children}</div> : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="shrink-0 text-xs text-muted-foreground">{label}</Label>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );
}

/** Slider plus a live numeric readout, mirroring the reference layout. */
function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => {
          if (v !== undefined) onChange(v);
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

const PLACEMENTS: readonly { value: CaptionPlacement; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom-third", label: "Bottom third" },
  { value: "bottom", label: "Bottom" },
];

const CASES: readonly { value: TextCase; label: string; title: string }[] = [
  { value: "none", label: "Tt", title: "As written" },
  { value: "upper", label: "T", title: "UPPERCASE" },
  { value: "lower", label: "t", title: "lowercase" },
];

const ALIGN_ICON = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
} as const;

/**
 * Full text-styling panel.
 *
 * Every control here writes to `CaptionStyleConfig`, which is the single object
 * both renderers read — so anything changed in this panel appears identically
 * in the preview and in the exported file. Controls that could only be
 * implemented in one renderer are deliberately absent rather than shipped as a
 * preview-only lie.
 */
export function TextPanel({
  config,
  patch,
}: {
  config: CaptionStyleConfig;
  patch: Patch;
}) {
  const textCase = resolveTextCase(config);

  return (
    <div className="divide-y">
      <Group title="Fonts" defaultOpen>
        <Row label="Font family">
          <Select
            value={config.fontId}
            onValueChange={(v) => patch({ fontId: v as FontId })}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <span className="flex items-center gap-2">
                    {font.label}
                    {font.nativeDevanagari ? (
                      <span className="rounded bg-success/15 px-1 text-[9px] text-success">
                        देव
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row label="Weight">
          <Select
            value={String(config.fontWeight)}
            onValueChange={(v) => patch({ fontWeight: Number(v) })}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[400, 500, 600, 700, 800, 900].map((weight) => (
                <SelectItem key={weight} value={String(weight)}>
                  {weight}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <SliderRow
          label="Caption size"
          value={config.fontSizePx}
          min={28}
          max={160}
          step={2}
          suffix="px"
          onChange={(v) => patch({ fontSizePx: v })}
        />

        <p className="text-[10px] leading-relaxed text-muted-foreground/60">
          Sizes are relative to a 1080×1920 canvas and scale to your export
          resolution.
        </p>
      </Group>

      <Group title="Format">
        <Row label="Styles">
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
            {CASES.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.title}
                aria-pressed={textCase === option.value}
                onClick={() =>
                  patch({
                    textCase: option.value,
                    // Keep the legacy flag in sync so older templates and the
                    // canvas renderer agree on casing.
                    uppercase: option.value === "upper",
                  })
                }
                className={cn(
                  "min-w-8 rounded px-2 py-1 text-xs font-semibold",
                  textCase === option.value
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Alignment">
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
            {TEXT_ALIGNS.map((value) => {
              const Icon = ALIGN_ICON[value];
              return (
                <button
                  key={value}
                  type="button"
                  title={value}
                  aria-label={`Align ${value}`}
                  aria-pressed={config.textAlign === value}
                  onClick={() => patch({ textAlign: value as TextAlign })}
                  className={cn(
                    "rounded px-2 py-1",
                    config.textAlign === value
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}
          </div>
        </Row>

        <Row label="Words / line">
          <div className="w-40">
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
        </Row>
      </Group>

      <Group title="Position">
        <Row label="Anchor">
          <Select
            value={config.placement}
            onValueChange={(v) => patch({ placement: v as CaptionPlacement })}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
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
        </Row>

        <SliderRow
          label="X"
          value={Math.round(config.horizontalOffsetPct)}
          min={-45}
          max={45}
          suffix="%"
          onChange={(v) => patch({ horizontalOffsetPct: v })}
        />
        <SliderRow
          label="Y"
          value={Math.round(config.verticalOffsetPct)}
          min={-45}
          max={45}
          suffix="%"
          onChange={(v) => patch({ verticalOffsetPct: v })}
        />

        <button
          type="button"
          onClick={() =>
            patch({ horizontalOffsetPct: 0, verticalOffsetPct: 0 })
          }
          className="w-full rounded-lg border py-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Reset position
        </button>

        <p className="text-[10px] leading-relaxed text-muted-foreground/60">
          You can also drag the caption directly on the preview.
        </p>
      </Group>

      <Group title="Emphasis">
        <Row label="Spoken word">
          <input
            type="color"
            aria-label="Spoken word colour"
            value={config.activeColor}
            onChange={(event) => patch({ activeColor: event.target.value })}
            className="h-7 w-14 cursor-pointer rounded border bg-transparent"
          />
        </Row>
        <Row label="Base text">
          <input
            type="color"
            aria-label="Base text colour"
            value={config.baseColor}
            onChange={(event) => patch({ baseColor: event.target.value })}
            className="h-7 w-14 cursor-pointer rounded border bg-transparent"
          />
        </Row>
        <Row label="Accent">
          <input
            type="color"
            aria-label="Accent colour"
            value={config.accentColor}
            onChange={(event) => patch({ accentColor: event.target.value })}
            className="h-7 w-14 cursor-pointer rounded border bg-transparent"
          />
        </Row>
        <SliderRow
          label="Size boost"
          value={config.emphasisScale}
          min={1}
          max={2}
          step={0.05}
          suffix="x"
          onChange={(v) => patch({ emphasisScale: v })}
        />
        <SliderRow
          label="Upcoming opacity"
          value={config.upcomingOpacity}
          min={0.2}
          max={1}
          step={0.05}
          onChange={(v) => patch({ upcomingOpacity: v })}
        />
      </Group>

      <Group title="Spacing">
        <SliderRow
          label="Letter spacing"
          value={config.letterSpacingPx}
          min={-4}
          max={16}
          suffix="px"
          onChange={(v) => patch({ letterSpacingPx: v })}
        />
        <SliderRow
          label="Word spacing"
          value={config.wordGapPx}
          min={4}
          max={90}
          suffix="px"
          onChange={(v) => patch({ wordGapPx: v })}
        />
        <SliderRow
          label="Line spacing"
          value={config.lineHeight}
          min={0.9}
          max={2}
          step={0.02}
          onChange={(v) => patch({ lineHeight: v })}
        />
        <SliderRow
          label="Max line width"
          value={config.maxLineWidthPct}
          min={40}
          max={100}
          suffix="%"
          onChange={(v) => patch({ maxLineWidthPct: v })}
        />
      </Group>

      <Group title="Effects">
        <Toggle
          label="Drop shadow"
          checked={config.dropShadow}
          onChange={(v) => patch({ dropShadow: v })}
        />

        <Toggle
          label="Text stroke"
          checked={config.strokeWidthPx > 0}
          // Never fully off: the stroke is what keeps captions readable on
          // bright footage, so "off" is the minimum that still separates.
          onChange={(v) => patch({ strokeWidthPx: v ? 3 : 1 })}
        />
        {config.strokeWidthPx > 0 ? (
          <SliderRow
            label="Stroke width"
            value={config.strokeWidthPx}
            min={1}
            max={10}
            step={0.5}
            suffix="px"
            onChange={(v) => patch({ strokeWidthPx: v })}
          />
        ) : null}

        <Toggle
          label="Background"
          checked={config.backgroundEnabled}
          onChange={(v) => patch({ backgroundEnabled: v })}
        />
        {config.backgroundEnabled ? (
          <>
            <Row label="Colour">
              <input
                type="color"
                aria-label="Background colour"
                value={config.backgroundColor}
                onChange={(event) =>
                  patch({ backgroundColor: event.target.value })
                }
                className="h-7 w-14 cursor-pointer rounded border bg-transparent"
              />
            </Row>
            <SliderRow
              label="Opacity"
              value={config.backgroundOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => patch({ backgroundOpacity: v })}
            />
          </>
        ) : null}
      </Group>
    </div>
  );
}
