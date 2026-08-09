/**
 * Languages offered for transcription.
 *
 * ElevenLabs Scribe advertises ~99 languages; this is a curated subset covering
 * every major Indian language plus the world languages an Indian creator
 * realistically publishes in. A shorter, grouped list is more usable than 99
 * rows, and `auto` is always available as the escape hatch.
 *
 * Codes are ISO 639-1 where one exists. If a code is ever rejected upstream the
 * route maps it to a friendly error rather than crashing — so an inaccurate
 * entry here degrades to "try auto-detect", not to a broken app.
 */

export interface LanguageOption {
  readonly code: string;
  readonly label: string;
  /** Endonym, shown alongside so users can find their own language by sight. */
  readonly native?: string;
}

export const AUTO_LANGUAGE: LanguageOption = {
  code: "auto",
  label: "Auto-detect",
};

/**
 * Hindi speech written back in the Latin alphabet — "kya kar rahe ho", not
 * "क्या कर रहे हो".
 *
 * Not a language: it is a *script* choice over Hindi audio, which is why it has
 * no ISO code and why `client.ts` sends it upstream as `en`. It still has to
 * live in the catalogue, because `/api/transcribe` validates the incoming code
 * with `isSupportedLanguage` and silently falls back to `DEFAULT_LANGUAGE` for
 * anything it does not recognise. While this was missing, every Hinglish
 * request was quietly downgraded to Devanagari.
 *
 * Deliberately kept out of `INDIAN_LANGUAGES` so the "more languages" dropdown
 * does not list it twice — the script picker owns it.
 */
export const HINGLISH_LANGUAGE: LanguageOption = {
  code: "hinglish",
  label: "Hinglish",
  native: "Latin script",
};

/** Listed first — this is the audience the product is built for. */
export const INDIAN_LANGUAGES: readonly LanguageOption[] = [
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "si", label: "Sinhala", native: "සිංහල" },
  { code: "sd", label: "Sindhi", native: "سنڌي" },
];

export const WORLD_LANGUAGES: readonly LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "tl", label: "Filipino", native: "Tagalog" },
  { code: "fa", label: "Persian", native: "فارسی" },
  { code: "he", label: "Hebrew", native: "עברית" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "uk", label: "Ukrainian", native: "Українська" },
  { code: "ro", label: "Romanian", native: "Română" },
  { code: "el", label: "Greek", native: "Ελληνικά" },
  { code: "cs", label: "Czech", native: "Čeština" },
  { code: "sv", label: "Swedish", native: "Svenska" },
  { code: "da", label: "Danish", native: "Dansk" },
  { code: "fi", label: "Finnish", native: "Suomi" },
  { code: "no", label: "Norwegian", native: "Norsk" },
  { code: "hu", label: "Hungarian", native: "Magyar" },
  { code: "bg", label: "Bulgarian", native: "Български" },
  { code: "hr", label: "Croatian", native: "Hrvatski" },
  { code: "sr", label: "Serbian", native: "Српски" },
  { code: "sk", label: "Slovak", native: "Slovenčina" },
  { code: "ca", label: "Catalan", native: "Català" },
];

export const ALL_LANGUAGES: readonly LanguageOption[] = [
  AUTO_LANGUAGE,
  HINGLISH_LANGUAGE,
  ...INDIAN_LANGUAGES,
  ...WORLD_LANGUAGES,
];

/** The two ways Hindi audio can be written down. */
export type CaptionScript = "latin" | "devanagari";

/**
 * Which script picker value a spoken-language code corresponds to.
 *
 * Both directions live here rather than in the component so the export and the
 * transcribe route can agree on what "hinglish" means without importing React.
 */
export const scriptForLanguage = (code: string): CaptionScript =>
  code === "hinglish" ? "latin" : "devanagari";

export const languageForScript = (script: CaptionScript): string =>
  script === "latin" ? "hinglish" : "hi";

/** Script only has a meaning for Hindi audio — Tamil is never written in Latin here. */
export const scriptAppliesTo = (code: string): boolean =>
  code === "hi" || code === "hinglish";

const CODES = new Set(ALL_LANGUAGES.map((language) => language.code));

export const isSupportedLanguage = (code: string): boolean => CODES.has(code);

export const languageLabel = (code: string): string =>
  ALL_LANGUAGES.find((language) => language.code === code)?.label ?? code;
