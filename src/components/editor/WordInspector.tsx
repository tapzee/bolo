"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftToLine,
  CornerDownLeft,
  Plus,
  RotateCcw,
  Scissors,
  Trash2,
} from "lucide-react";
import type { CaptionWord } from "@/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

/** Kept small and high-contrast — these have to survive a black text stroke. */
const SWATCHES: readonly { value: string; label: string }[] = [
  { value: "#ffd60a", label: "Yellow" },
  { value: "#ff5a2c", label: "Orange" },
  { value: "#00e5a0", label: "Mint" },
  { value: "#4cc9ff", label: "Cyan" },
  { value: "#ff2d55", label: "Pink" },
  { value: "#ffffff", label: "White" },
];

export interface WordInspectorProps {
  word: CaptionWord;
  index: number;
  totalWords: number;
  onSetText: (index: number, text: string) => void;
  onSetColor: (index: number, color: string | undefined) => void;
  onSplit: (index: number) => void;
  onMerge: (index: number) => void;
  onClearBreak: (index: number) => void;
  onDelete: (index: number) => void;
  onInsertAfter: (index: number, text: string) => void;
}

export function WordInspector({
  word,
  index,
  totalWords,
  onSetText,
  onSetColor,
  onSplit,
  onMerge,
  onClearBreak,
  onDelete,
  onInsertAfter,
}: WordInspectorProps) {
  const [draft, setDraft] = useState(word.text);
  const [insertText, setInsertText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-seed when the selection moves, or the field would keep showing the
  // previous word's text.
  useEffect(() => {
    setDraft(word.text);
    setInsertText("");
  }, [index, word.text]);

  const commit = (value: string): void => {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed !== word.text) onSetText(index, trimmed);
  };

  /**
   * Commit is debounced, not immediate.
   *
   * Committing per keystroke rebuilds every caption page and hands Remotion a
   * new `inputProps` object, so typing at a normal speed re-renders the whole
   * composition ~10 times a second on top of the 30fps playback loop. The
   * caption layer is cheap DOM and keeps animating through that; the video
   * element's decode and paint do not — which is why it looked like "captions
   * run, video freezes".
   *
   * 220ms is short enough to feel live and long enough to sit between
   * keystrokes. Enter and blur still commit instantly, so nothing is ever lost.
   */
  const commitDebounced = useDebouncedCallback(commit, 220);

  const confidencePct =
    word.confidence === null ? null : Math.round(word.confidence * 100);

  return (
    <div className="space-y-4 rounded-xl border bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Word {index + 1} of {totalWords}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
            {word.startMs}–{word.endMs}ms
            {confidencePct !== null ? ` · ${confidencePct}% confident` : " · manual"}
          </p>
        </div>
        {confidencePct !== null && confidencePct < 60 ? (
          <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
            check this
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Text</Label>
        <input
          ref={inputRef}
          data-testid="word-text-input"
          value={draft}
          onChange={(event) => {
            // The field itself updates instantly; only the expensive commit
            // into the caption document waits. See `commitDebounced`.
            setDraft(event.target.value);
            commitDebounced(event.target.value);
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
              inputRef.current?.blur();
            }
            if (event.key === "Escape") {
              setDraft(word.text);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            "w-full rounded-lg border bg-background px-3 py-2 text-sm",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Colour</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={word.color === swatch.value}
              onClick={() => onSetColor(index, swatch.value)}
              style={{ background: swatch.value }}
              className={cn(
                "size-6 rounded-full ring-1 ring-black/25 transition-transform",
                "hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                word.color === swatch.value &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-card",
              )}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => onSetColor(index, undefined)}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Line breaks</Label>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={index === 0}
            onClick={() => onSplit(index)}
          >
            <Scissors className="size-3" />
            Start new line
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={index === 0}
            onClick={() => onMerge(index)}
          >
            <ArrowLeftToLine className="size-3" />
            Join previous
          </Button>
          {word.pageBreak !== undefined ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onClearBreak(index)}
            >
              <RotateCcw className="size-3" />
              Auto
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Insert after</Label>
        <div className="flex gap-1.5">
          <input
            value={insertText}
            placeholder="Missed word…"
            onChange={(event) => setInsertText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && insertText.trim().length > 0) {
                event.preventDefault();
                onInsertAfter(index, insertText);
                setInsertText("");
              }
            }}
            className={cn(
              "min-w-0 flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            disabled={insertText.trim().length === 0}
            onClick={() => {
              onInsertAfter(index, insertText);
              setInsertText("");
            }}
          >
            <Plus className="size-3.5" />
            <CornerDownLeft className="size-3 opacity-50" />
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDelete(index)}
      >
        <Trash2 className="size-3.5" />
        Delete word
      </Button>
    </div>
  );
}
