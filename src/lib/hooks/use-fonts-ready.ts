"use client";

import { useEffect, useState } from "react";

/**
 * Resolves once every declared webfont has finished loading.
 *
 * Caption faces are loaded with `display: swap`, so without this gate the
 * Player's first frames paint in a fallback face and then visibly reflow when
 * Anton or Noto Sans Devanagari arrives. Holding the skeleton until fonts are
 * ready trades a few hundred milliseconds for a preview that never jumps —
 * and it matters more than usual here, because the same swap during a
 * WebCodecs export would be baked into the exported file.
 */
export const useFontsReady = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (typeof document === "undefined" || !("fonts" in document)) {
      setReady(true);
      return;
    }

    void document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
};
