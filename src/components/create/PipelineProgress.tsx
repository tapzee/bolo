"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check, Loader2, RotateCcw, X } from "lucide-react";
import { formatBytes, formatDuration } from "@/core";
import { Button } from "@/components/ui/button";
import { CreditWall } from "@/components/billing/CreditWall";
import type { PipelineStage, PipelineState } from "@/lib/media/use-caption-pipeline";
import { cn } from "@/lib/utils";

const STEPS: readonly { stage: PipelineStage; label: string }[] = [
  { stage: "probing", label: "Read video" },
  { stage: "extracting", label: "Extract audio" },
  { stage: "transcribing", label: "Transcribe" },
];

const ORDER: Record<PipelineStage, number> = {
  idle: 0,
  probing: 1,
  extracting: 2,
  transcribing: 3,
  ready: 4,
  error: -1,
};

export function PipelineProgress({
  state,
  onCancel,
  onRetry,
  onResume,
}: {
  state: PipelineState;
  onCancel: () => void;
  /** Throws the run away and starts from the file again. */
  onRetry: () => void;
  /** Re-sends the audio already held. Used after a top-up — no re-upload. */
  onResume: () => void;
}) {
  // Running out of credits is not a processing failure, and rendering it as one
  // ends the session: "Couldn't process that video · Start over" tells someone
  // who is willing to pay us that their video was the problem. It gets the
  // recovery panel instead.
  if (state.stage === "error" && state.error?.shortfall != null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-2xl"
      >
        <CreditWall
          shortfall={state.error.shortfall}
          onRetry={onResume}
          canRetry={state.canRetryTranscription}
        />
      </motion.div>
    );
  }

  if (state.stage === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-2xl rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">Couldn&apos;t process that video</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {state.error?.message}
            </p>
            {state.file ? (
              <p className="pt-1 font-mono text-xs text-muted-foreground/60">
                {state.file.name} · {formatBytes(state.file.size)}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="size-3.5" />
            Start over
          </Button>
        </div>
      </motion.div>
    );
  }

  const current = ORDER[state.stage];
  const indeterminate = state.progress < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border bg-card/50 p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">
            {state.file?.name ?? "Processing"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {state.file ? formatBytes(state.file.size) : ""}
            {state.video
              ? ` · ${state.video.width}×${state.video.height} · ${formatDuration(state.video.durationSeconds)}`
              : ""}
            {state.audioBytes > 0
              ? ` · audio ${formatBytes(state.audioBytes)}`
              : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step) => {
          const index = ORDER[step.stage];
          const done = current > index;
          const active = current === index;

          return (
            <li key={step.stage} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                  done && "bg-success/15 text-success",
                  active && "bg-brand-soft text-brand",
                  !done && !active && "bg-muted text-muted-foreground/50",
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : active ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  index
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          {indeterminate ? (
            // Animates transform only, so it stays on the compositor and cannot
            // steal frames from the work it is reporting on.
            <motion.div
              className="h-full w-1/3 rounded-full bg-brand"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <motion.div
              className="h-full origin-left rounded-full bg-brand"
              initial={false}
              animate={{ scaleX: Math.max(0.02, state.progress) }}
              transition={{ type: "spring", stiffness: 180, damping: 30 }}
              style={{ width: "100%" }}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{state.detail}</p>
      </div>
    </motion.div>
  );
}
