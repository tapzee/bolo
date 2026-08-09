import type { WordEmphasis, WordRole } from "./types";

/**
 * The minimal shape role analysis needs — satisfied structurally by both
 * `CaptionWord` (pre-grouping) and `CaptionToken` (post-grouping), so the
 * same analyzer runs on either without an adapter.
 */
export interface RoleAnalysisWord {
  text: string;
  role?: WordRole;
  emphasis?: WordEmphasis;
}

/**
 * Rule-based semantic word-role analysis for the 10-template engine family.
 *
 * Deterministic and dependency-free by design, same philosophy as
 * `i18n/romanize.ts`: curated closed-class dictionaries (English + Hindi/
 * Hinglish) plus a handful of regex/position heuristics, no external NLP. That
 * keeps role assignment reproducible frame-to-frame and exportable identically
 * on the Canvas2D path with zero extra dependencies.
 *
 * The one rule every caller can rely on: **a word's existing `role` is never
 * overwritten**. Re-running analysis after the user hand-picks a role for one
 * word must leave that word alone — this is what the spec calls out as
 * mandatory ("AI role detection must never destroy the user's manual edits").
 */

const NUMBER_RE = /\d|[₹$€£¥%]/;

const norm = (text: string): string => text.trim().toLowerCase();

/** Hindi (Devanagari) + English closed-class connectors/particles. */
const CONNECTOR_WORDS = new Set([
  "से", "को", "में", "के", "की", "का", "है", "हैं", "और", "या", "पर",
  "तक", "ही", "भी", "तो", "साथ", "लिए", "द्वारा", "यह", "वह",
  "the", "a", "an", "of", "to", "for", "and", "or", "but", "is", "are",
  "in", "on", "at", "with", "as", "that", "this", "it", "be", "was",
  "were", "so", "if", "from", "than", "then", "do", "does",
]);

/** Intensifiers and negation — small words that carry outsized emphasis. */
const EMPHASIS_WORDS = new Set([
  "सिर्फ", "बिल्कुल", "बहुत", "ज्यादा", "कभी", "नहीं", "हमेशा",
  "जरूर", "एकदम", "पूरी", "बस",
  "only", "just", "never", "always", "really", "very", "so", "too",
  "no", "not", "definitely", "totally",
]);

const QUESTION_WORDS = new Set([
  "क्यों", "कैसे", "क्या", "कब", "कहाँ", "कहां", "कौन", "किस",
  "कितना", "कितने",
  "why", "how", "what", "when", "where", "who", "which", "whom",
]);

const CTA_WORDS = new Set([
  "चाहिए", "करें", "करो", "सीखो", "सीखिए", "जानें", "देखो", "देखिए",
  "सुनो", "बताओ",
  "subscribe", "comment", "follow", "like", "share", "buy", "click",
  "join", "download", "swipe", "tap", "call", "visit", "register", "sign",
]);

/** A short all-caps token ("AI", "SEO") is a acronym-keyword, not filler. */
const isAcronym = (text: string): boolean =>
  text.length <= 4 && /^[A-Z]+$/.test(text);

/** First closed-class-dictionary pass. `null` means "open-class content word". */
const closedClassRole = (
  word: RoleAnalysisWord,
  text: string,
  isLastWord: boolean,
): WordRole | null => {
  if (NUMBER_RE.test(text)) return "number";

  const lower = norm(text);
  if (QUESTION_WORDS.has(lower) || (isLastWord && /\?$/.test(text))) {
    return "question";
  }
  if (CTA_WORDS.has(lower)) return "cta";
  if (CONNECTOR_WORDS.has(lower)) return "connector";
  if (EMPHASIS_WORDS.has(lower)) return "emphasis";

  // Bridge from the older, coarser emphasis field so pages authored before
  // roles existed still get a sensible role instead of defaulting to "normal".
  if (word.emphasis === "important") return "critical";
  if (word.emphasis === "special") return "special";

  if (isAcronym(text)) return "keyword";
  if (text.length <= 3) return "supporting";

  return null;
};

/**
 * Assigns a role to every word in a page/sentence.
 *
 * Two passes: the first resolves every word that a dictionary or regex can
 * decide on its own; the second looks at what's left (real content words) and
 * promotes the single most salient one per call to "critical" — the one word
 * a template should treat as the sentence's headline — with the rest becoming
 * "keyword". Mirrors `heroWordIndex`'s length-based salience scoring so the
 * two systems agree on what "the important word" means.
 */
export const analyzeWordRoles = (
  words: readonly RoleAnalysisWord[],
): WordRole[] => {
  const roles: (WordRole | null)[] = words.map((word, index) => {
    if (word.role) return word.role;
    return closedClassRole(word, word.text.trim(), index === words.length - 1);
  });

  let criticalIndex = -1;
  let bestScore = -1;
  roles.forEach((role, index) => {
    if (role !== null) return;
    const length = words[index]!.text.trim().length;
    if (length > bestScore) {
      bestScore = length;
      criticalIndex = index;
    }
  });

  return roles.map((role, index) => {
    if (role !== null) return role;
    return index === criticalIndex ? "critical" : "keyword";
  });
};
