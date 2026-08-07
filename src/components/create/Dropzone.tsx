"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileVideo, ShieldCheck, Upload } from "lucide-react";
import {
  ACCEPTED_VIDEO_EXTENSIONS,
  formatBytes,
  MAX_TRANSCRIBABLE_SECONDS,
  MAX_VIDEO_BYTES,
} from "@/core";
import { cn } from "@/lib/utils";

export function Dropzone({
  onFile,
  disabled = false,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // Nested dragenter/dragleave pairs fire for every child element, so a boolean
  // flag flickers as the pointer crosses inner nodes. Counting depth is the
  // only reliable way to know when the pointer has truly left.
  const dragDepth = useRef(0);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (disabled) return;

      const file = event.dataTransfer.files.item(0);
      if (file !== null) onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-2xl"
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed px-8 py-16 text-center",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Only transform and opacity animate here — animating the border or
          // background on a full-width panel repaints it on every pointer move.
          "transition-colors duration-200",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-brand/50 hover:bg-accent/40",
          dragging
            ? "border-brand bg-brand-soft"
            : "border-border bg-card/40",
        )}
      >
        <motion.div
          animate={{ scale: dragging ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft ring-hairline"
        >
          {dragging ? (
            <FileVideo className="size-6 text-brand" />
          ) : (
            <Upload className="size-6 text-brand" />
          )}
        </motion.div>

        <div className="space-y-1.5">
          <p className="text-base font-medium">
            {dragging ? "Drop it here" : "Drop a video, or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            {ACCEPTED_VIDEO_EXTENSIONS.join("  ·  ")}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Up to {formatBytes(MAX_VIDEO_BYTES)} ·{" "}
            {Math.floor(MAX_TRANSCRIBABLE_SECONDS / 60)} minutes max
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.item(0);
            if (file) onFile(file);
            // Reset so picking the same file twice still fires onChange.
            event.target.value = "";
          }}
        />
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" />
        Your video never leaves this browser. Only the extracted audio is sent
        for transcription.
      </p>
    </motion.div>
  );
}
