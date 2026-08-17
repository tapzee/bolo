"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  LayoutGrid,
  Palette,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import type {
  CaptionPlacement,
  CaptionStyleConfig,
  CaptionTemplate,
  FontId,
  TemplateCategory,
} from "@/core";
import {
  CAPTION_TEMPLATES,
  FONTS,
  TEMPLATE_CATEGORIES,
  resolveTemplate,
} from "@/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { TemplateCard } from "./TemplateCard";

const PRESET_KEY = "bolo:presets";

interface SavedPreset {
  id: string;
  name: string;
  config: CaptionStyleConfig;
}

const loadPresets = (): SavedPreset[] => {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    return raw === null ? [] : (JSON.parse(raw) as SavedPreset[]);
  } catch {
    return [];
  }
};

const savePresets = (presets: SavedPreset[]): void => {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  } catch {
    // Storage blocked or full — presets are a convenience, not the document.
  }
};

const CURATED_COLOR_THEMES = [
  {
    id: "neon-yellow",
    name: "Neon Yellow",
    base: "#ffffff",
    active: "#ffdd00",
    accent: "#ffe600",
    stroke: "#000000",
  },
  {
    id: "cyber-pink",
    name: "Cyber Pink",
    base: "#ffffff",
    active: "#ff1493",
    accent: "#ff007f",
    stroke: "#1a0010",
  },
  {
    id: "cyan-frost",
    name: "Cyan Frost",
    base: "#e0ffff",
    active: "#00ffff",
    accent: "#00ced1",
    stroke: "#002233",
  },
  {
    id: "golden-sunrise",
    name: "Golden Sunrise",
    base: "#fffaf0",
    active: "#ffae00",
    accent: "#ff7700",
    stroke: "#331800",
  },
  {
    id: "matrix-emerald",
    name: "Matrix Green",
    base: "#f0fff0",
    active: "#00ff66",
    accent: "#00cc44",
    stroke: "#003316",
  },
  {
    id: "electric-purple",
    name: "Electric Purple",
    base: "#f8f0ff",
    active: "#c22cfb",
    accent: "#9b11eb",
    stroke: "#1d002e",
  },
] as const;

const PLACEMENTS: readonly { value: CaptionPlacement; label: string; desc: string }[] = [
  { value: "top", label: "Top", desc: "Above center frame" },
  { value: "center", label: "Center", desc: "Mid-screen kinetic focus" },
  { value: "bottom-third", label: "Bottom Third", desc: "Standard reels zone" },
  { value: "bottom", label: "Bottom", desc: "Lower screen border" },
];

export interface TemplatesPanelProps {
  config: CaptionStyleConfig;
  activeTemplateId: string | null;
  onApply: (config: CaptionStyleConfig, templateId: string | null) => void;
  patch?: (next: Partial<CaptionStyleConfig>) => void;
}

type TabType = "built-in" | "layout" | "colors" | "emphasis" | "mine";

export function TemplatesPanel({
  config,
  activeTemplateId,
  onApply,
  patch,
}: TemplatesPanelProps) {
  const [tab, setTab] = useState<TabType>("built-in");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [presets, setPresets] = useState<SavedPreset[]>([]);

  // localStorage is unavailable during SSR, so presets load after mount.
  useEffect(() => setPresets(loadPresets()), []);

  const updateConfig = useCallback(
    (next: Partial<CaptionStyleConfig>) => {
      if (patch) {
        patch(next);
      } else {
        onApply({ ...config, ...next }, activeTemplateId);
      }
    },
    [patch, onApply, config, activeTemplateId],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CAPTION_TEMPLATES.filter((template) => {
      if (category !== "all" && template.category !== category) return false;
      if (needle.length === 0) return true;
      return (
        template.name.toLowerCase().includes(needle) ||
        template.category.includes(needle) ||
        (template.tag && template.tag.toLowerCase().includes(needle))
      );
    });
  }, [category, query]);

  const resolved = useMemo(() => {
    const map = new Map<string, CaptionStyleConfig>();
    for (const template of CAPTION_TEMPLATES) {
      map.set(template.id, resolveTemplate(template));
    }
    return map;
  }, []);

  const apply = useCallback(
    (template: CaptionTemplate) => {
      const next = resolved.get(template.id);
      if (next !== undefined) onApply(next, template.id);
    },
    [resolved, onApply],
  );

  const saveCurrent = useCallback(() => {
    const name = window.prompt("Name this custom preset", "My viral style");
    if (name === null || name.trim().length === 0) return;

    const next: SavedPreset = {
      id: `preset-${Date.now()}`,
      name: name.trim().slice(0, 40),
      config,
    };
    const updated = [next, ...presets].slice(0, 40);
    setPresets(updated);
    savePresets(updated);
    setTab("mine");
  }, [config, presets]);

  const removePreset = useCallback(
    (id: string) => {
      const updated = presets.filter((preset) => preset.id !== id);
      setPresets(updated);
      savePresets(updated);
    },
    [presets],
  );

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "built-in", label: "Templates", icon: <LayoutGrid className="size-3" /> },
    { id: "layout", label: "Layout", icon: <Sliders className="size-3" /> },
    { id: "colors", label: "Colors", icon: <Palette className="size-3" /> },
    { id: "emphasis", label: "Emphasis", icon: <Sparkles className="size-3" /> },
    {
      id: "mine",
      label: `Presets (${presets.length})`,
      icon: <BookmarkPlus className="size-3" />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Top Main Navigation Tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors",
              tab === item.id
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/30"
                : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: BUILT-IN TEMPLATES */}
      {tab === "built-in" ? (
        <>
          <div className="flex gap-1.5">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search viral, hindi, neon, minimal..."
                className="w-full rounded-lg border bg-background py-1.5 pr-2 pl-8 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-brand/40 text-[11px] font-semibold text-brand hover:bg-brand/10"
              onClick={saveCurrent}
              title="Save the current custom style as a preset"
            >
              <BookmarkPlus className="size-3 mr-1" />
              Save
            </Button>
          </div>

          <div className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-1">
            {(["all", ...TEMPLATE_CATEGORIES.map((c) => c.id)] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value as TemplateCategory | "all")}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-all",
                    category === value
                      ? "bg-brand font-semibold text-brand-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  {value === "all" ? `All (${CAPTION_TEMPLATES.length})` : value}
                </button>
              ),
            )}
          </div>

          <div
            role="radiogroup"
            aria-label="Caption template"
            className="grid max-h-[calc(100vh-22rem)] grid-cols-2 gap-2.5 overflow-y-auto pr-1"
          >
            {visible.map((template) => {
              const templateConfig = resolved.get(template.id);
              if (templateConfig === undefined) return null;
              return (
                <TemplateCard
                  key={template.id}
                  template={template}
                  config={templateConfig}
                  selected={template.id === activeTemplateId}
                  onSelect={() => apply(template)}
                />
              );
            })}
            {visible.length === 0 ? (
              <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                No templates match “{query}”. Try another term or category.
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {/* TAB 2: LAYOUT CUSTOMIZER */}
      {tab === "layout" ? (
        <div className="space-y-5 py-1 text-xs">
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Casing & Case Styling</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateConfig({ uppercase: false })}
                className={cn(
                  "rounded-lg border p-2 text-center font-medium transition-all",
                  !config.uppercase
                    ? "border-brand bg-brand/10 text-brand font-bold shadow-sm"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
                )}
              >
                Standard Case
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ uppercase: true })}
                className={cn(
                  "rounded-lg border p-2 text-center font-bold tracking-wider uppercase transition-all",
                  config.uppercase
                    ? "border-brand bg-brand/10 text-brand shadow-sm"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
                )}
              >
                ALL CAPS
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Screen Position</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map((p) => {
                const isSelected = config.placement === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateConfig({ placement: p.value })}
                    className={cn(
                      "flex flex-col rounded-lg border p-2.5 text-left transition-all",
                      isSelected
                        ? "border-brand bg-brand/10 ring-1 ring-brand"
                        : "border-border/60 bg-card/40 hover:border-border hover:bg-card",
                    )}
                  >
                    <span className={cn("font-medium text-xs", isSelected ? "text-brand" : "text-foreground")}>
                      {p.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-foreground">Words Per Page (Kinetic Pace)</Label>
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-brand">
                {config.maxWordsPerPage} {config.maxWordsPerPage === 1 ? "word" : "words"}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateConfig({ maxWordsPerPage: num })}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-center font-mono text-xs transition-all",
                    config.maxWordsPerPage === num
                      ? "border-brand bg-brand text-brand-foreground font-bold shadow"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              💡 <strong className="text-foreground">Pro-tip:</strong> Use 1-3 words per screen for fast-paced TikTok & Reel kinetic typography.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-foreground">Lines Per Page</Label>
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-brand">
                {config.linesPerPage === 0 ? "Auto" : `${config.linesPerPage} ${config.linesPerPage === 1 ? "line" : "lines"}`}
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateConfig({ linesPerPage: num })}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-center font-mono text-xs transition-all",
                    config.linesPerPage === num
                      ? "border-brand bg-brand text-brand-foreground font-bold shadow"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {num === 0 ? "Auto" : num}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              💡 Caps how many wrapped rows a page can use — independent of word count. A page
              closes as soon as either this or the word cap above is hit, whichever comes first.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-foreground">Speech Merge Window</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {config.combineWithinMs}ms
              </span>
            </div>
            <Slider
              value={[config.combineWithinMs]}
              min={0}
              max={800}
              step={25}
              onValueChange={([v]) => {
                if (v !== undefined) updateConfig({ combineWithinMs: v });
              }}
            />
            <p className="text-[10px] text-muted-foreground/70">
              Combines rapidly spoken words into a single display slide if the pause between them is shorter than this threshold.
            </p>
          </div>
        </div>
      ) : null}

      {/* TAB 3: COLOR CUSTOMIZER & CURATED THEMES */}
      {tab === "colors" ? (
        <div className="space-y-5 py-1 text-xs">
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">One-Click Viral Palettes</Label>
            <div className="grid grid-cols-2 gap-2">
              {CURATED_COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() =>
                    updateConfig({
                      baseColor: theme.base,
                      activeColor: theme.active,
                      accentColor: theme.accent,
                      strokeColor: theme.stroke,
                    })
                  }
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-2.5 transition-all hover:scale-[1.02] hover:border-border hover:shadow"
                >
                  <span className="font-medium text-xs text-foreground">{theme.name}</span>
                  <div className="flex -space-x-1 overflow-hidden rounded-full border border-border/40 p-0.5">
                    <span
                      className="size-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: theme.base }}
                    />
                    <span
                      className="size-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: theme.active }}
                    />
                    <span
                      className="size-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 bg-card/30 p-3.5">
            <Label className="font-semibold text-foreground">Custom Color Swatches</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer">
                <span>Base Text Color</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={config.baseColor || "#ffffff"}
                    onChange={(e) => updateConfig({ baseColor: e.target.value })}
                    className="size-5 shrink-0 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-foreground uppercase truncate">
                    {config.baseColor || "#FFFFFF"}
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer">
                <span>Active Highlight</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={config.activeColor || "#ffff00"}
                    onChange={(e) => updateConfig({ activeColor: e.target.value })}
                    className="size-5 shrink-0 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-foreground uppercase truncate">
                    {config.activeColor || "#FFFF00"}
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer">
                <span>Accent / Box Fill</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={config.accentColor || "#ff0000"}
                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                    className="size-5 shrink-0 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-foreground uppercase truncate">
                    {config.accentColor || "#FF0000"}
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer">
                <span>Outline & Stroke</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={config.strokeColor || "#000000"}
                    onChange={(e) => updateConfig({ strokeColor: e.target.value })}
                    className="size-5 shrink-0 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-foreground uppercase truncate">
                    {config.strokeColor || "#000000"}
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer">
                <span>Secondary Text</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={config.annotationColor || config.baseColor || "#ececec"}
                    onChange={(e) => updateConfig({ annotationColor: e.target.value })}
                    className="size-5 shrink-0 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-foreground uppercase truncate">
                    {config.annotationColor || config.baseColor || "#ECECEC"}
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer">
                <span>Neon Glow Bloom</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                  <input
                    type="color"
                    value={config.glowColor || config.accentColor || "#ffd60a"}
                    onChange={(e) => updateConfig({ glowColor: e.target.value, glowEnabled: true })}
                    className="size-5 shrink-0 cursor-pointer rounded border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-foreground uppercase truncate">
                    {config.glowColor || config.accentColor || "#FFD60A"}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 4: EMPHASIS & KINETIC TYPOGRAPHY */}
      {tab === "emphasis" ? (
        <div className="space-y-5 py-1 text-xs">
          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Primary Font</Label>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {FONTS.map((font) => {
                const isSelected = config.fontId === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => updateConfig({ fontId: font.id as FontId })}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-1.5 text-left transition-all text-xs",
                      isSelected
                        ? "border-brand bg-brand/10 font-bold text-brand shadow-sm ring-1 ring-brand"
                        : "border-border/60 bg-card/40 font-medium hover:border-border hover:bg-card",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Type className={cn("size-3.5", isSelected ? "text-brand" : "text-muted-foreground")} />
                      <span>{font.label}</span>
                    </div>
                    {font.nativeDevanagari ? (
                      <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        देवनागरी
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Secondary / Supporting Font</Label>
            <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateConfig({ secondaryFontId: undefined })}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-1.5 text-left transition-all text-xs",
                  !config.secondaryFontId
                    ? "border-brand bg-brand/10 font-bold text-brand shadow-sm ring-1 ring-brand"
                    : "border-border/60 bg-card/40 font-medium hover:border-border hover:bg-card text-muted-foreground",
                )}
              >
                <span>Auto (Same as primary)</span>
              </button>
              {FONTS.map((font) => {
                const isSelected = config.secondaryFontId === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => updateConfig({ secondaryFontId: font.id as FontId })}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-1.5 text-left transition-all text-xs",
                      isSelected
                        ? "border-brand bg-brand/10 font-bold text-brand shadow-sm ring-1 ring-brand"
                        : "border-border/60 bg-card/40 font-medium hover:border-border hover:bg-card",
                    )}
                  >
                    <span>{font.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-foreground">3rd / Script Accent Font</Label>
            <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateConfig({ specialFontId: undefined })}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-1.5 text-left transition-all text-xs",
                  !config.specialFontId
                    ? "border-brand bg-brand/10 font-bold text-brand shadow-sm ring-1 ring-brand"
                    : "border-border/60 bg-card/40 font-medium hover:border-border hover:bg-card text-muted-foreground",
                )}
              >
                <span>Auto (Script preset)</span>
              </button>
              {FONTS.map((font) => {
                const isSelected = config.specialFontId === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => updateConfig({ specialFontId: font.id as FontId })}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-1.5 text-left transition-all text-xs",
                      isSelected
                        ? "border-brand bg-brand/10 font-bold text-brand shadow-sm ring-1 ring-brand"
                        : "border-border/60 bg-card/40 font-medium hover:border-border hover:bg-card",
                    )}
                  >
                    <span>{font.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Font Weight</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { weight: 600, label: "Semi" },
                { weight: 700, label: "Bold" },
                { weight: 800, label: "Extra" },
                { weight: 900, label: "Black" },
              ].map((w) => (
                <button
                  key={w.weight}
                  type="button"
                  onClick={() => updateConfig({ fontWeight: w.weight })}
                  className={cn(
                    "rounded-lg border py-2 text-center text-xs font-semibold transition-all",
                    config.fontWeight === w.weight
                      ? "border-brand bg-brand text-brand-foreground font-extrabold shadow-sm"
                      : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-foreground">Letter Spacing (Tracking)</Label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {config.letterSpacingPx > 0 ? `+${config.letterSpacingPx}` : config.letterSpacingPx}px
              </span>
            </div>
            <Slider
              value={[config.letterSpacingPx]}
              min={-2}
              max={6}
              step={0.5}
              onValueChange={([v]) => {
                if (v !== undefined) updateConfig({ letterSpacingPx: v });
              }}
            />
          </div>
        </div>
      ) : null}

      {/* TAB 5: MY PRESETS */}
      {tab === "mine" ? (
        <div className="space-y-3 py-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Your Customized Presets</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] font-semibold text-brand"
              onClick={saveCurrent}
            >
              <BookmarkPlus className="size-3 mr-1" />
              Save Current
            </Button>
          </div>

          {presets.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/30 p-6 text-center text-xs leading-relaxed text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">No custom presets saved yet.</p>
              <p>
                Tune any template using the <strong className="text-brand">Layout</strong>,{" "}
                <strong className="text-brand">Colors</strong>, and <strong className="text-brand">Emphasis</strong> tabs, then hit <strong className="text-foreground">Save</strong> to store your signature video branding!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-2 rounded-xl border bg-card/60 p-3 shadow-sm hover:border-border-strong transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onApply(preset.config, null)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-xs font-bold text-foreground hover:text-brand transition-colors">
                      {preset.name}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                      <span className="capitalize">{preset.config.styleId}</span>
                      <span>·</span>
                      <span className="capitalize">{preset.config.fontId}</span>
                      <span>·</span>
                      <span className="font-mono">{preset.config.fontSizePx}px</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex -space-x-1 overflow-hidden rounded-full border border-border/40 p-0.5">
                      <span
                        className="size-3 rounded-full border border-black/20"
                        style={{ backgroundColor: preset.config.baseColor || "#fff" }}
                      />
                      <span
                        className="size-3 rounded-full border border-black/20"
                        style={{ backgroundColor: preset.config.activeColor || "#ff0" }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePreset(preset.id)}
                      aria-label={`Delete ${preset.name}`}
                      className="rounded p-1 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
