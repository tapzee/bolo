export type WordEmphasis = "supporting" | "normal" | "important" | "special";

/**
 * Semantic role of a word, independent of any one template's visual
 * treatment — a template decides how e.g. "keyword" renders (huge serif for
 * Editorial Stack, a highlight block for Highlight Marker), the role itself
 * stays template-agnostic.
 *
 * Deliberately richer than `WordEmphasis`: that field is a legacy 4-value
 * visual-priority knob a handful of older engines read directly, this is the
 * full taxonomy from the 10-template spec. The two are not meant to merge —
 * new engines read `role`, old ones keep reading `emphasis`.
 */
export type WordRole =
  | "connector"
  | "supporting"
  | "normal"
  | "keyword"
  | "emphasis"
  | "critical"
  | "special"
  | "question"
  | "number"
  | "cta";

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

  /** Visual priority used by dynamic templates (e.g. Dynamic Highlight). */
  emphasis?: WordEmphasis;

  /**
   * Semantic role used by the 10-template engine family. Set by
   * `analyzeWordRoles` when absent; once set (by analysis or by a manual
   * editor override) it is never overwritten by re-analysis — same contract
   * as `pageBreak` below.
   */
  role?: WordRole;

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
  emphasis?: WordEmphasis;
  role?: WordRole;
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
