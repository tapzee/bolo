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
  ...INDIAN_LANGUAGES,
  ...WORLD_LANGUAGES,
];

const CODES = new Set(ALL_LANGUAGES.map((language) => language.code));

export const isSupportedLanguage = (code: string): boolean => CODES.has(code);

export const languageLabel = (code: string): string =>
  ALL_LANGUAGES.find((language) => language.code === code)?.label ?? code;
