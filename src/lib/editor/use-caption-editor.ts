"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaptionWord, History } from "@/core";
import {
  canRedo,
  canUndo,
  clearPageOverride,
  deleteWord,
  initHistory,
  insertWordAfter,
  mergePageAt,
  pushHistory,
  redo,
  splitPageAt,
  undo,
  updateWordColor,
  updateWordText,
  updateWordTiming,
} from "@/core";

/**
 * Binds the pure editor core to React.
 *
 * All the logic lives in `src/core/editor`; this only owns the history state,
 * the selection, and the keyboard shortcuts. Keeping it this thin is what lets
 * the operations be unit-tested without React and reused outside the web app.
 */
export const useCaptionEditor = (initialWords: readonly CaptionWord[]) => {
  const [history, setHistory] = useState<History<CaptionWord[]>>(() =>
    initHistory([...initialWords]),
  );
  const [selected, setSelected] = useState<number | null>(null);

  // A new transcription replaces the document outright — carrying the old undo
  // stack across would let Cmd+Z restore words from a different video.
  useEffect(() => {
    setHistory(initHistory([...initialWords]));
    setSelected(null);
  }, [initialWords]);

  const words = history.present;

  const apply = useCallback(
    (
      transform: (current: CaptionWord[]) => CaptionWord[],
      coalesceLabel?: string,
    ) => {
      setHistory((current) =>
        pushHistory(current, transform(current.present), { coalesceLabel }),
      );
    },
    [],
  );

  const actions = useMemo(
    () => ({
      // Coalesced per word index, so typing a word is one undo step but editing
      // two different words stays two.
      setText: (index: number, text: string) =>
        apply((w) => updateWordText(w, index, text), `text:${index}`),

      setTiming: (index: number, startMs: number, endMs: number) =>
        apply(
          (w) => updateWordTiming(w, index, startMs, endMs),
          `timing:${index}`,
        ),

      setColor: (index: number, color: string | undefined) =>
        apply((w) => updateWordColor(w, index, color)),

      splitAt: (index: number) => apply((w) => splitPageAt(w, index)),
      mergeAt: (index: number) => apply((w) => mergePageAt(w, index)),
      clearBreak: (index: number) => apply((w) => clearPageOverride(w, index)),

      remove: (index: number) => {
        apply((w) => deleteWord(w, index));
        setSelected((current) =>
          current === null ? null : current > index ? current - 1 : null,
        );
      },

      insertAfter: (index: number, text: string) => {
        apply((w) => insertWordAfter(w, index, text));
        setSelected(index + 1);
      },
    }),
    [apply],
  );

  const undoAction = useCallback(() => setHistory(undo), []);
  const redoAction = useCallback(() => setHistory(redo), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      // Inside a text field, Cmd+Z must stay the browser's own text undo —
      // hijacking it would blow away the whole word instead of one character.
      if (
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoAction();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redoAction();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undoAction, redoAction]);

  return {
    words,
    selected,
    setSelected,
    actions,
    undo: undoAction,
    redo: redoAction,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    /** True once the document differs from what was transcribed. */
    isDirty: history.past.length > 0,
  };
};
