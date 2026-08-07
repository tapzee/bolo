/**
 * Caption data model.
 *
 * `CaptionWord` is structurally identical to Remotion's `Caption`
 * (`@remotion/captions`) but is declared here so that `src/core` stays free of
 * every framework dependency. That is what lets the same logic back a future
 * PWA shell or a Capacitor/Android build without dragging Remotion or Next in.
 * Because the shapes match structurally, a `CaptionWord[]` is assignable to a
 * `Caption[]` with no adapter.
 */
export interface CaptionWord {
  /** Includes any leading space, matching Remotion's convention. */
  text: string;
  startMs: number;
  endMs: number;
  /** Midpoint of the word; `null` when the provider gives no point estimate. */
  timestampMs: number | null;
  /** 0–1 from the ASR provider, or `null` when unreported. */
  confidence: number | null;

  /**
   * Per-word colour set in the editor. Overrides the style's active colour.
   * Optional so the extra fields below stay absent on untouched transcripts,
   * which keeps the autosave payload small.
   */
  color?: string;

  /**
   * Manual page-break override, set by split/merge in the editor.
   *
   * `force`  — this word starts a new caption page
   * `never`  — this word may not start a page; it merges into the previous one
   * absent   — automatic grouping decides
   *
   * Stored on the word rather than as a separate list of indices so that
   * inserting or deleting a word cannot silently shift every later break.
   */
  pageBreak?: "force" | "never";
}

/** One rendered word on screen, after grouping. */
export interface CaptionToken {
  text: string;
  fromMs: number;
  toMs: number;
  /** Per-word colour override set in the editor. Overrides the style's active colour. */
  color?: string;
}

/** A group of words shown together as a single on-screen line/block. */
export interface CaptionPage {
  id: string;
  text: string;
  startMs: number;
  durationMs: number;
  tokens: CaptionToken[];
}

/** Where a word sits relative to playhead time. */
export type TokenPhase = "upcoming" | "active" | "spoken";
