/**
 * Undo/redo stack.
 *
 * Generic and pure. Because every editing operation returns a new immutable
 * array rather than mutating, a history entry is just a reference to a previous
 * version — no deep cloning, no serialisation, and O(1) to push. On a 600-word
 * transcript a 100-deep stack costs a few hundred pointers, not 100 copies of
 * the transcript.
 */

export interface History<T> {
  past: readonly T[];
  present: T;
  future: readonly T[];
  /**
   * Groups consecutive edits into one undo step. Typing five characters into a
   * word should be one Cmd+Z, not five.
   */
  lastLabel: string | null;
}

/** Bounds memory on a long session. Well past any realistic undo reach. */
const MAX_DEPTH = 100;

export const initHistory = <T>(present: T): History<T> => ({
  past: [],
  present,
  future: [],
  lastLabel: null,
});

export interface PushOptions {
  /**
   * When the incoming label matches the previous one, the new value replaces
   * the current entry instead of pushing a new one. Callers should make the
   * label identify the *target* as well as the action — `text:12` rather than
   * `text` — so edits to two different words never collapse into one step.
   */
  coalesceLabel?: string;
}

export const pushHistory = <T>(
  history: History<T>,
  present: T,
  { coalesceLabel }: PushOptions = {},
): History<T> => {
  if (Object.is(history.present, present)) return history;

  const shouldCoalesce =
    coalesceLabel !== undefined && coalesceLabel === history.lastLabel;

  if (shouldCoalesce) {
    // Replace in place: the past is untouched, so undo jumps over the whole run.
    return { ...history, present, future: [], lastLabel: coalesceLabel };
  }

  const past = [...history.past, history.present];

  return {
    past: past.length > MAX_DEPTH ? past.slice(past.length - MAX_DEPTH) : past,
    present,
    // Any new edit invalidates the redo branch — standard linear-history
    // behaviour, and the only model users actually predict.
    future: [],
    lastLabel: coalesceLabel ?? null,
  };
};

export const canUndo = <T>(history: History<T>): boolean =>
  history.past.length > 0;

export const canRedo = <T>(history: History<T>): boolean =>
  history.future.length > 0;

export const undo = <T>(history: History<T>): History<T> => {
  const previous = history.past[history.past.length - 1];
  if (previous === undefined) return history;

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    // Cleared so a subsequent edit cannot coalesce into a step the user has
    // already undone past.
    lastLabel: null,
  };
};

export const redo = <T>(history: History<T>): History<T> => {
  const next = history.future[0];
  if (next === undefined) return history;

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
    lastLabel: null,
  };
};

/** Drops history while keeping the current value — used after a fresh load. */
export const resetHistory = <T>(present: T): History<T> => initHistory(present);
