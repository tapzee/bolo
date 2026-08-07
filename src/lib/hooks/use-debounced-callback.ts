"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Debounces a callback, with the latest arguments winning.
 *
 * Used for text edits in the caption editor. Committing on every keystroke
 * rebuilds every caption page and hands Remotion a fresh `inputProps` object,
 * so at normal typing speed the composition re-renders ~10 times a second on
 * top of the 30fps playback loop. The caption layer is cheap DOM and keeps
 * animating through that, but the video element's decode and paint get starved
 * — which reads exactly like "the captions run but the video freezes".
 *
 * Debouncing means the preview updates shortly after you stop typing instead of
 * during it, which is also what you actually want to look at.
 */
export const useDebouncedCallback = <A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs: number,
): ((...args: A) => void) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Held in a ref so the returned function keeps a stable identity even when
  // the callback closes over changing state — otherwise every render would
  // create a new debouncer and the timer would never fire.
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  return useCallback(
    (...args: A) => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), delayMs);
    },
    [delayMs],
  );
};
