"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import type { CaptionPage, CaptionWord } from "@/core";
import { cn } from "@/lib/utils";

const formatTime = (ms: number): string => {
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
};

export interface CaptionLinesProps {
  pages: readonly CaptionPage[];
  words: readonly CaptionWord[];
  selectedIndex: number | null;
  onSelectWord: (index: number) => void;
  onSetText: (index: number, text: string) => void;
  onSplitAt: (index: number) => void;
}

/**
 * Line-by-line caption editor.
 *
 * This is the primary editing surface, not the timeline. Creators read and fix
 * captions as sentences — spotting a wrong word in context and typing over it —
 * whereas the timeline is for timing. Editing purely through a timeline means
 * hunting for a word by its position in time, which is far slower for the most
 * common task by a wide margin.
 *
 * Each word is its own chip so a single click selects exactly one word, and a
 * double click edits it in place. Words the model was unsure about are tinted,
 * so the eye lands on what actually needs review instead of re-reading
 * everything.
 */
export function CaptionLines({
  pages,
  words,
  selectedIndex,
  onSelectWord,
  onSetText,
  onSplitAt,
}: CaptionLinesProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Maps each page's tokens back to indices in the flat word list.
   *
   * Page building never drops or reorders words, so a running cursor is exact —
   * and far cheaper than matching on text, which would break on repeated words.
   */
  const pageOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cursor = 0;
    for (const page of pages) {
      offsets.push(cursor);
      cursor += page.tokens.length;
    }
    return offsets;
  }, [pages]);

  // Keeps the selection visible when it moves from the timeline or a shortcut.
  useEffect(() => {
    if (selectedIndex === null) return;
    const node = listRef.current?.querySelector(
      `[data-word-index="${selectedIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  const commit = (index: number): void => {
    const trimmed = draft.trim();
    const current = words[index];
    if (trimmed.length > 0 && current !== undefined && trimmed !== current.text) {
      onSetText(index, trimmed);
    }
    setEditing(null);
  };

  if (pages.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card/40 p-4 text-sm text-muted-foreground">
        No captions yet.
      </p>
    );
  }

  return (
    <div ref={listRef} className="space-y-2">
      {pages.map((page, pageIndex) => {
        const offset = pageOffsets[pageIndex] ?? 0;
        const containsSelection =
          selectedIndex !== null &&
          selectedIndex >= offset &&
          selectedIndex < offset + page.tokens.length;

        return (
          <div
            key={page.id}
            className={cn(
              "rounded-xl border p-2.5 transition-colors",
              containsSelection
                ? "border-brand/50 bg-brand-soft"
                : "bg-card/50 hover:bg-card",
            )}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground/70">
                {pageIndex + 1}
                <span className="mx-1.5 opacity-40">·</span>
                {formatTime(page.startMs)} → {formatTime(page.startMs + page.durationMs)}
              </span>
              {offset > 0 ? (
                <button
                  type="button"
                  title="Split: start a new line here"
                  onClick={() => onSplitAt(offset)}
                  className="text-muted-foreground/50 transition-colors hover:text-foreground"
                >
                  <Scissors className="size-3" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-1">
              {page.tokens.map((token, tokenIndex) => {
                const wordIndex = offset + tokenIndex;
                const word = words[wordIndex];
                const isSelected = wordIndex === selectedIndex;
                const isWeak =
                  word?.confidence !== null &&
                  word?.confidence !== undefined &&
                  word.confidence < 0.6;

                if (editing === wordIndex) {
                  return (
                    <input
                      key={wordIndex}
                      autoFocus
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onBlur={() => commit(wordIndex)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commit(wordIndex);
                        }
                        if (event.key === "Escape") setEditing(null);
                      }}
                      // Sized to its content so the line does not reflow while
                      // typing, which would make neighbouring chips jump.
                      style={{ width: `${Math.max(3, draft.length + 1)}ch` }}
                      className="rounded-md border border-brand bg-background px-1.5 py-0.5 text-sm outline-none"
                    />
                  );
                }

                return (
                  <button
                    key={wordIndex}
                    type="button"
                    data-word-index={wordIndex}
                    onClick={() => onSelectWord(wordIndex)}
                    onDoubleClick={() => {
                      setDraft(token.text);
                      setEditing(wordIndex);
                    }}
                    title={
                      word?.confidence != null
                        ? `${Math.round(word.confidence * 100)}% confident · double-click to edit`
                        : "Double-click to edit"
                    }
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-sm transition-colors",
                      isSelected
                        ? "bg-brand text-brand-foreground"
                        : isWeak
                          ? "bg-warning/20 text-foreground hover:bg-warning/30"
                          : "hover:bg-accent",
                    )}
                    style={
                      token.color !== undefined && !isSelected
                        ? { color: token.color }
                        : undefined
                    }
                  >
                    {token.text}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
