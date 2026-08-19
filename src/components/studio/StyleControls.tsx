"use client";

import type { ReactNode } from "react";
import {
  CAPTION_STYLE_LIST,
  FONTS,
  type CaptionPlacement,
  type CaptionStyleConfig,
  type FontId,
  type StyleId,
} from "@/core";
import { FONT_FAMILY } from "@/remotion/fonts";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StyleCard } from "./StyleCard";

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
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

export function StylePicker({
  styleId,
  onSelect,
}: {
  styleId: StyleId;
  onSelect: (id: StyleId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Caption style" className="space-y-1">
      {CAPTION_STYLE_LIST.map((definition) => (
        <StyleCard
          key={definition.id}
          definition={definition}
          selected={definition.id === styleId}
          onSelect={() => onSelect(definition.id)}
        />
      ))}
    </div>
  );
}

const PLACEMENTS: readonly { value: CaptionPlacement; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom-third", label: "Bottom third" },
  { value: "bottom", label: "Bottom" },
];

export function TypographyControls({
  config,
  patch,
}: {
  config: CaptionStyleConfig;
  patch: (next: Partial<CaptionStyleConfig>) => void;
}) {
  return (
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
                  <span className="text-sm" style={{ fontFamily: FONT_FAMILY[font.id as FontId] }}>{font.label}</span>
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
          Fonts without the badge fall back to Noto Sans Devanagari for Hindi
          glyphs.
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
          onValueChange={(v) => patch({ placement: v as CaptionPlacement })}
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
          <Label className="text-xs text-muted-foreground">Words per page</Label>
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
  );
}
