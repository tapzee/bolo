"use client";

import { Check, CloudOff, Redo2, Subtitles, Undo2 } from "lucide-react";
import type { ExportResolution } from "@/core";
import { formatDuration } from "@/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EditorTopBarProps {
  title: string;
  durationSeconds: number;
  resolution: ExportResolution;
  onResolutionChange: (resolution: ExportResolution) => void;
  /** Tiers this device can actually handle. */
  allowedResolutions: readonly ExportResolution[];
  saveStatus: string;
  saveError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownloadSrt: () => void;
  onExport: () => void;
  exporting: boolean;
  watermark?: boolean;
}

/**
 * Editor top bar.
 *
 * Export lives here rather than buried in a side rail because it is the one
 * action the whole tool exists to produce — it should be reachable without
 * scrolling, from any point in the edit.
 */
export function EditorTopBar({
  title,
  durationSeconds,
  resolution,
  onResolutionChange,
  allowedResolutions,
  saveStatus,
  saveError,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDownloadSrt,
  onExport,
  exporting,
}: EditorTopBarProps) {
  return (
    // top-0: the sidebar is now the only chrome, and it is a sibling column
    // rather than a bar above this one.
    <div className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-[1800px] items-center gap-3 px-4 xl:px-6">
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={title}>
          {title}
        </p>

        <span className="hidden rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">
          {formatDuration(durationSeconds)}
        </span>

        <div className="hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 md:flex">
          {(["720p", "1080p", "4k"] as const).map((tier) => {
            const allowed = allowedResolutions.includes(tier);
            return (
              <button
                key={tier}
                type="button"
                disabled={!allowed}
                aria-pressed={resolution === tier}
                title={allowed ? undefined : "Not available on this device"}
                onClick={() => onResolutionChange(tier)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium",
                  resolution === tier
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                  !allowed && "cursor-not-allowed opacity-35",
                )}
              >
                {tier === "4k" ? "4K" : tier}
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-0.5 lg:flex">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Ctrl/Cmd+Z)"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>

        <span className="hidden min-w-14 text-[11px] text-muted-foreground sm:inline">
          {saveStatus === "error" ? (
            <span
              title={saveError ?? undefined}
              className="flex items-center gap-1 text-destructive"
            >
              <CloudOff className="size-3" />
              Not saved
            </span>
          ) : saveStatus === "saved" ? (
            <span className="flex items-center gap-1">
              <Check className="size-3 text-success" />
              Saved
            </span>
          ) : saveStatus === "saving" || saveStatus === "pending" ? (
            <span className="text-muted-foreground/60">Saving…</span>
          ) : null}
        </span>

        <Button variant="ghost" size="sm" onClick={onDownloadSrt} title="Download .srt">
          <Subtitles className="size-3.5" />
          <span className="hidden sm:inline">SRT</span>
        </Button>

        <Button size="sm" onClick={onExport} disabled={exporting}>
          {exporting ? "Exporting…" : "Export"}
        </Button>
      </div>
    </div>
  );
}
