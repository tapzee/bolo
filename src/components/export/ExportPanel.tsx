"use client";

import { motion } from "motion/react";
import { AlertTriangle, Download, Monitor, X } from "lucide-react";
import type { CanvasSize, ExportResolution } from "@/core";
import {
  RESOLUTIONS,
  formatBytes,
  isResolutionAllowed,
  planForResolution,
} from "@/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { useVideoExport } from "@/lib/export/use-video-export";
import { cn } from "@/lib/utils";

const TIERS: readonly ExportResolution[] = ["720p", "1080p", "4k"];

export interface ExportPanelProps {
  resolution: ExportResolution;
  onResolutionChange: (resolution: ExportResolution) => void;
  availability: Record<string, { allowed: boolean; reason: string | null }> | null;
  webcodecsSupported: boolean;
  dimensions: CanvasSize;
  sourceHeight: number;
  watermark: boolean;
  /** Entitlement ceiling. Composed with `availability`, which is about hardware. */
  maxResolution: ExportResolution;
  exportState: ReturnType<typeof useVideoExport>;
}

export function ExportPanel({
  resolution,
  onResolutionChange,
  availability,
  webcodecsSupported,
  dimensions,
  sourceHeight,
  watermark,
  maxResolution,
  exportState,
}: ExportPanelProps) {
  const { phase, progress, error, result, start, cancel, redownload } =
    exportState;

  if (!webcodecsSupported) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
        <span>
          This browser can&apos;t export video. Export needs WebCodecs — try
          Chrome or Edge on desktop.
        </span>
      </div>
    );
  }

  const busy = phase === "exporting";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Resolution</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {TIERS.map((tier) => {
            // Two independent gates: what the device can encode, and what the
            // plan includes. Either one closes the tier, and the plan reason
            // wins the tooltip because it is the one the user can act on.
            const deviceAllowed = availability?.[tier]?.allowed ?? true;
            const planAllowed = isResolutionAllowed(tier, maxResolution);
            const allowed = deviceAllowed && planAllowed;
            const selected = tier === resolution;
            const reason = !planAllowed
              ? `${RESOLUTIONS[tier].label} export is on ${planForResolution(tier) ?? "a paid"} and above.`
              : (availability?.[tier]?.reason ?? undefined);

            return (
              <button
                key={tier}
                type="button"
                disabled={!allowed || busy}
                title={reason}
                onClick={() => onResolutionChange(tier)}
                className={cn(
                  "relative rounded-lg border px-2 py-2 text-xs font-medium",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-brand bg-brand-soft text-foreground"
                    : "text-muted-foreground hover:bg-accent",
                  !allowed && "cursor-not-allowed opacity-40",
                )}
              >
                {RESOLUTIONS[tier].label}
                {!allowed && RESOLUTIONS[tier].desktopOnly ? (
                  <Monitor className="absolute top-1 right-1 size-2.5" />
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          {dimensions.width}×{dimensions.height}
          {dimensions.height < sourceHeight
            ? " · scaled down from source"
            : " · matches source, never upscaled"}
        </p>

        {!isResolutionAllowed("4k", maxResolution) ? (
          <p className="text-[11px] text-muted-foreground/70">
            4K export is on Editor and Pro.{" "}
            <a href="/pricing" className="text-brand underline-offset-2 hover:underline">
              See plans
            </a>
          </p>
        ) : availability?.["4k"]?.allowed === false ? (
          <p className="text-[11px] text-muted-foreground/70">
            {availability["4k"]?.reason}
          </p>
        ) : null}
      </div>

      {watermark ? (
        <p className="rounded-lg bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Free exports carry a small &ldquo;Made with Bolo&rdquo; watermark.
        </p>
      ) : null}

      {phase === "error" ? (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-[11px] leading-relaxed text-destructive">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          {error}
        </p>
      ) : null}

      {busy ? (
        <div className="space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            {progress === null || progress.ratio < 0 ? (
              <motion.div
                className="h-full w-1/3 rounded-full bg-brand"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : (
              <motion.div
                className="h-full w-full origin-left rounded-full bg-brand"
                initial={false}
                animate={{ scaleX: Math.max(0.02, progress.ratio) }}
                transition={{ type: "spring", stiffness: 180, damping: 30 }}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {progress !== null && progress.ratio >= 0
                ? `${Math.round(progress.ratio * 100)}% · ${progress.encodedFrames} frames`
                : "Starting encoder…"}
            </span>
            <span>
              {progress !== null && progress.bytesWritten > 0
                ? formatBytes(progress.bytesWritten)
                : ""}
            </span>
          </div>
        </div>
      ) : null}

      {busy ? (
        <Button variant="outline" className="w-full" onClick={cancel}>
          <X className="size-3.5" />
          Cancel export
        </Button>
      ) : (
        <Button className="w-full" onClick={() => void start()}>
          <Download className="size-3.5" />
          {phase === "done" ? "Export again" : "Export MP4"}
        </Button>
      )}

      {phase === "done" && result !== null ? (
        <button
          type="button"
          onClick={redownload}
          className="w-full text-center text-[11px] text-muted-foreground underline-offset-4 hover:underline"
        >
          Download didn&apos;t start? Click here · {formatBytes(result.size)}
        </button>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
        Rendered on your device. Nothing is uploaded.
      </p>
    </div>
  );
}
