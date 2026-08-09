/**
 * Devanagari → Latin transliteration, tuned for Hinglish captions.
 *
 * WHY THIS EXISTS
 *
 * Scribe has no "romanized Hindi" mode. The obvious-looking trick — asking for
 * `language_code=en` on Hindi audio and hoping the model spells it out
 * phonetically — was measured against the real API and does nothing: the same
 * clip returned 2844 Devanagari characters under `en` and 2873 under `hi`.
 * Scribe transcribes in the native script of the speech it hears, and
 * `language_code` does not change that. So if we want "kya kar rahe ho" instead
 * of "क्या कर रहे हो", we have to produce it ourselves.
 *
 * Doing it here rather than asking the model for it also keeps word-level
 * timestamps exactly as they were: this is a per-word string rewrite, so a
 * caption's timing cannot drift as a side effect of changing its script.
 *
 * This targets how Indians actually type Hindi in Latin — "kya", "bahut",
 * "ghoomne" — not scholarly IAST ("kyā", "bahuta", "ghūmane"). Diacritics are
 * never emitted, and the inherent schwa is dropped where a Hindi speaker drops
 * it. It is deliberately deterministic and dependency-free.
 */

/** U+0900–U+097F. */
const DEVANAGARI_RUN = /[ऀ-ॿ]+/g;
const DEVANAGARI_ANY = /[ऀ-ॿ]/;

export const hasDevanagari = (text: string): boolean =>
  DEVANAGARI_ANY.test(text);

const VIRAMA = "्";
const NUKTA = "़";
const ANUSVARA = "ं";
const CHANDRABINDU = "ँ";
const VISARGA = "ः";
const DANDA = "।";
const DOUBLE_DANDA = "॥";

/** Consonants, carrying an inherent "a" unless a matra or virama says otherwise. */
const CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "ऩ": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ऱ": "r", "ल": "l", "ळ": "l",
  "ऴ": "l", "व": "v",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  // Precomposed nukta forms (U+0958–U+095F). The decomposed base+U+093C
  // spellings are handled by NUKTA_FORMS, because both turn up in real
  // responses and only one of them is ever byte-equal to what you typed.
  "क़": "q", "ख़": "kh", "ग़": "g", "ज़": "z",
  // U+095C/U+095D are retroflex flaps. Phonetically closer to "r", but Hinglish
  // spells them "d" — "ladka", "bada", "thoda" — and matching how people
  // actually type beats phonetic purity here.
  "ड़": "d", "ढ़": "dh", "फ़": "f", "य़": "y",
};

/** base consonant + U+093C. */
const NUKTA_FORMS: Record<string, string> = {
  "क": "q", "ख": "kh", "ग": "g", "ज": "z",
  "ड": "d", "ढ": "dh", "फ": "f", "य": "y",
};

/** Independent vowels. */
const VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ee",
  "उ": "u", "ऊ": "oo", "ऋ": "ri", "ॠ": "ri",
  "ऌ": "li",
  "ऍ": "e", "ऎ": "e", "ए": "e", "ऐ": "ai",
  "ऑ": "o", "ऒ": "o", "ओ": "o", "औ": "au",
};

/** Dependent vowel signs (matras). */
const MATRAS: Record<string, string> = {
  "ा": "aa", "ि": "i", "ी": "ee", "ु": "u",
  "ू": "oo", "ृ": "ri", "ॄ": "ri",
  "ॅ": "e", "ॆ": "e", "े": "e", "ै": "ai",
  "ॉ": "o", "ॊ": "o", "ो": "o", "ौ": "au",
};

const DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

/**
 * Long vowels shorten in the final syllable.
 *
 * Hinglish writes "kya" and "karna", not "kyaa" and "karnaa" — but keeps the
 * long vowel in the middle of a word, where "aaj" and "skool" are standard and
 * "aj"/"skul" look wrong. Applying this only to the last syllable gets both.
 */
const FINAL_SHORTENING: Record<string, string> = {
  aa: "a",
  ee: "i",
  oo: "u",
};

/** Anusvara assimilates to "m" before a labial, "n" everywhere else. */
const LABIALS = new Set(["p", "ph", "b", "bh", "m", "f"]);

/**
 * English words Indians say constantly in reels but which Scribe writes in
 * Devanagari. Transliterating these phonetically produces "sabskraib" and
 * "phrends", which reads as a mistake rather than as Hinglish.
 *
 * Intentionally small and high-frequency — this is a shortlist, not a
 * dictionary, and it is meant to be extended when a word visibly comes out
 * wrong. Keys must be exactly what Scribe emits.
 */
const LOANWORDS: Record<string, string> = {
  // Function words whose conventional Hinglish spelling is not what the rules
  // produce. "में" romanizes mechanically to "men", which reads as English.
  "में": "mein",
  "हैलो": "hello",
  "हेलो": "hello",
  "फ्रेंड": "friend",
  "फ्रेंड्स": "friends",
  "गाइस": "guys",
  "वीडियो": "video",
  "चैनल": "channel",
  "सब्सक्राइब": "subscribe",
  "लाइक": "like",
  "कमेंट": "comment",
  "शेयर": "share",
  "प्लीज": "please",
  "थैंक्स": "thanks",
  "ओके": "okay",
};

interface Syllable {
  /** Romanized onset. Empty for an independent vowel. */
  onset: string;
  /** Romanized nucleus. Empty once a schwa has been deleted. */
  vowel: string;
  /** True when a matra, virama or independent vowel set the nucleus. */
  explicit: boolean;
  /** Anusvara / chandrabindu / visarga, emitted after the vowel. */
  coda: string;
  /** Sentence punctuation rather than a sound. */
  punctuation: boolean;
}

const syllable = (onset: string, vowel: string, explicit: boolean): Syllable => ({
  onset,
  vowel,
  explicit,
  coda: "",
  punctuation: false,
});

/** Splits one Devanagari run into syllables with explicit nuclei. */
const parse = (word: string): Syllable[] => {
  const out: Syllable[] = [];
  let i = 0;

  while (i < word.length) {
    const ch = word[i];
    if (ch === undefined) break;
    const next = word[i + 1];

    const consonant = CONSONANTS[ch];
    if (consonant !== undefined) {
      const nuktaed = next === NUKTA;
      out.push(syllable((nuktaed ? NUKTA_FORMS[ch] : undefined) ?? consonant, "a", false));
      i += nuktaed ? 2 : 1;
      continue;
    }

    const vowel = VOWELS[ch];
    if (vowel !== undefined) {
      out.push(syllable("", vowel, true));
      i += 1;
      continue;
    }

    const last = out[out.length - 1];

    const matra = MATRAS[ch];
    if (matra !== undefined && last !== undefined) {
      last.vowel = matra;
      last.explicit = true;
      i += 1;
      continue;
    }

    if (ch === VIRAMA && last !== undefined) {
      // The consonant joins the next one — no vowel of its own.
      last.vowel = "";
      last.explicit = true;
      i += 1;
      continue;
    }

    if ((ch === ANUSVARA || ch === CHANDRABINDU) && last !== undefined) {
      last.coda += "n";
      i += 1;
      continue;
    }

    if (ch === VISARGA && last !== undefined) {
      last.coda += "h";
      i += 1;
      continue;
    }

    const digit = DIGITS[ch];
    if (digit !== undefined) {
      const numeral = syllable(digit, "", true);
      numeral.punctuation = true;
      out.push(numeral);
      i += 1;
      continue;
    }

    if (ch === DANDA || ch === DOUBLE_DANDA) {
      const stop = syllable(".", "", true);
      stop.punctuation = true;
      out.push(stop);
      i += 1;
      continue;
    }

    // Avagraha, stray nukta, unassigned marks: drop rather than guess.
    i += 1;
  }

  return out;
};

/** Index of the last syllable that is an actual sound. */
const lastSpokenIndex = (syllables: Syllable[]): number => {
  for (let i = syllables.length - 1; i >= 0; i--) {
    if (syllables[i]?.punctuation === false) return i;
  }
  return -1;
};

/**
 * Hindi schwa deletion.
 *
 * Without it every word gains trailing and internal "a"s — "kara", "ladakaa",
 * "karanaa" — which is the single thing that makes naive transliteration
 * unreadable. Two rules cover the vast majority of Hindi:
 *
 *  1. The word-final inherent schwa is always dropped, provided the word still
 *     has a vowel left (न stays "na", not "n").
 *  2. A non-initial inherent schwa is dropped when the *following* syllable
 *     still has a vowel — लड़का → "ladka", करना → "karna", घूमने → "ghoomne".
 *
 * Rule 2 runs right-to-left over the live state, so deletions cascade: in
 * समझना the schwa of झ goes first, which then protects म (following vowel is
 * now empty) and yields "samajhna" rather than "samjhna". The cascade is also
 * what gets सिरदर्द right — द keeps its schwa because र् has none, which frees
 * र to lose its own, giving "sirdard" instead of "siradard".
 *
 * Only syllables whose vowel was an *inherent* schwa are eligible, and the
 * first syllable is always skipped — without that guard बहुत collapses to
 * "bhut" instead of "bahut".
 */
const deleteSchwas = (syllables: Syllable[]): void => {
  const original = syllables.map((s) => ({
    vowel: s.vowel,
    explicit: s.explicit,
  }));
  const isSchwa = (i: number): boolean => {
    const o = original[i];
    return o !== undefined && !o.explicit && o.vowel === "a";
  };

  const last = lastSpokenIndex(syllables);
  const final = syllables[last];
  if (final !== undefined && final.onset !== "" && isSchwa(last)) {
    const hasAnotherVowel = syllables.some(
      (s, i) => i !== last && !s.punctuation && s.vowel !== "",
    );
    if (hasAnotherVowel) final.vowel = "";
  }

  for (let i = last - 1; i >= 1; i--) {
    const current = syllables[i];
    const following = syllables[i + 1];
    if (current === undefined || following === undefined) continue;
    if (current.punctuation || current.onset === "") continue;
    if (!isSchwa(i)) continue;
    // Reads the live vowel, not the original, so this deletion sees the one
    // made to its right.
    if (following.vowel !== "") current.vowel = "";
  }
};

const render = (syllables: Syllable[]): string => {
  const last = lastSpokenIndex(syllables);
  let out = "";

  for (let i = 0; i < syllables.length; i++) {
    const current = syllables[i];
    if (current === undefined) continue;
    const { onset, vowel, coda } = current;

    out += onset + (i === last ? FINAL_SHORTENING[vowel] ?? vowel : vowel);

    if (coda === "n") {
      // Assimilate to the following onset: "ambar", not "anbar".
      const following = syllables[i + 1]?.onset ?? "";
      out += LABIALS.has(following) ? "m" : "n";
    } else {
      out += coda;
    }
  }

  return out;
};

const romanizeWord = (word: string): string => {
  const known = LOANWORDS[word];
  if (known !== undefined) return known;

  const syllables = parse(word);
  deleteSchwas(syllables);
  return render(syllables);
};

/**
 * Transliterates every Devanagari run in `text`, leaving everything else — Latin
 * words, digits, punctuation, emoji — exactly as it was.
 *
 * Safe to call on text that contains no Devanagari at all, which is what makes
 * it safe to apply to a whole code-mixed transcript.
 */
export const romanizeDevanagari = (text: string): string =>
  text.replace(DEVANAGARI_RUN, (run) => romanizeWord(run));
