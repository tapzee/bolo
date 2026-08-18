"use client";

import { useState } from "react";
import { Sparkles, Languages, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LanguageItem {
  name: string;
  native: string;
  code: string;
  script: string;
  sampleHindi: string;
  sampleLatin: string;
  tag?: string;
}

const LANGUAGES: LanguageItem[] = [
  {
    name: "Hinglish",
    native: "Hinglish (Latin)",
    code: "hinglish",
    script: "Latin",
    sampleHindi: "ये ट्रिक आपके रील्स को वायरल करेगी",
    sampleLatin: "Yeh trick aapke reels ko viral karegi",
    tag: "Popular",
  },
  {
    name: "Hindi",
    native: "हिन्दी",
    code: "hi",
    script: "Devanagari",
    sampleHindi: "हर शब्द पर सटीक टाइमिंग और खूबसूरत स्टाइल",
    sampleLatin: "Har shabd par sateek timing aur khoobsurat style",
    tag: "Primary",
  },
  {
    name: "Marathi",
    native: "मराठी",
    code: "mr",
    script: "Devanagari",
    sampleHindi: "तुमच्या व्हिडिओसाठी सुंदर आणि अचूक कॅप्शन",
    sampleLatin: "Tumchya video sathi sundar ani achuk caption",
  },
  {
    name: "Gujarati",
    native: "ગુજરાતી",
    code: "gu",
    script: "Gujarati",
    sampleHindi: "તમારા રીલ્સ માટે શ્રેષ્ઠ અને સચોટ કેપ્શન",
    sampleLatin: "Tamara reels mate shreshth ane sachot caption",
  },
  {
    name: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    code: "pa",
    script: "Gurmukhi",
    sampleHindi: "ਤੁਹਾਡੇ ਵੀਡੀਓ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਕੈਪਸ਼ਨ",
    sampleLatin: "Tuhade video layi sab to vadiya caption",
  },
  {
    name: "Bengali",
    native: "বাংলা",
    code: "bn",
    script: "Bengali",
    sampleHindi: "আপনার রিলসের জন্য অসাধারণ ক্যাপশন",
    sampleLatin: "Aponar reels er jonno osadharon caption",
  },
  {
    name: "Tamil",
    native: "தமிழ்",
    code: "ta",
    script: "Tamil",
    sampleHindi: "உங்கள் ரீல்ஸ்களுக்கான சிறந்த தலைப்புகள்",
    sampleLatin: "Ungal reels-kkana sirandha thalaippugal",
  },
  {
    name: "Telugu",
    native: "తెలుగు",
    code: "te",
    script: "Telugu",
    sampleHindi: "మీ రీల్స్ కోసం అద్భుతమైన క్యాప్షన్లు",
    sampleLatin: "Mee reels kosam adbhutamaina captions",
  },
  {
    name: "Kannada",
    native: "ಕನ್ನಡ",
    code: "kn",
    script: "Kannada",
    sampleHindi: "ನಿಮ್ಮ ವೀಡಿಯೊಗಳಿಗೆ ಸುಂದರವಾದ ಶೀರ್ಷಿಕೆಗಳು",
    sampleLatin: "Nimma video-galige sundaravada sheershikegalu",
  },
  {
    name: "Malayalam",
    native: "മലയാളം",
    code: "ml",
    script: "Malayalam",
    sampleHindi: "നിങ്ങളുടെ റീലുകൾക്കായി മികച്ച അടിക്കുറിപ്പുകൾ",
    sampleLatin: "Ningalude reelukalkkayi mikacha adikkurippukal",
  },
];

export function LanguageShowcase() {
  const [selectedLang, setSelectedLang] = useState<LanguageItem>(LANGUAGES[0]!);
  const [scriptMode, setScriptMode] = useState<"native" | "latin">("latin");

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <Languages className="size-3.5" />
          Native Script & Hinglish Engine
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
          15+ Indian languages, with{" "}
          <span className="italic font-serif font-normal text-brand">zero broken fonts</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Bolo accurately captures local accents, slang, and mixed code phrases.
          Toggle between native Devanagari/regional scripts and Romanized Hinglish.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left column: Interactive language pill selector */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
            Select a language:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {LANGUAGES.map((lang) => {
              const active = selectedLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    active
                      ? "border-brand bg-brand-soft/60 shadow-sm"
                      : "border-border/70 bg-card/50 hover:bg-card hover:border-foreground/20"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${active ? "text-brand" : "text-foreground"}`}>
                      {lang.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lang.native}
                    </p>
                  </div>
                  {lang.tag && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        active
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {lang.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Interactive Script & Transcription Preview Card */}
        <div className="lg:col-span-7 flex flex-col h-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{selectedLang.name}</h3>
                <span className="text-xs font-medium text-muted-foreground">
                  ({selectedLang.native})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI Voice Recognition & Word-level Synchronized Output
              </p>
            </div>

            {/* Script Toggle */}
            <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
              <button
                onClick={() => setScriptMode("latin")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  scriptMode === "latin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hinglish (Latin)
              </button>
              <button
                onClick={() => setScriptMode("native")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  scriptMode === "native"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {selectedLang.script} Script
              </button>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="my-6 rounded-2xl border border-border/60 bg-surface-inset/60 p-6 flex-1 flex flex-col justify-center">
            <span className="text-xs font-medium text-muted-foreground mb-2 block">
              Generated Caption:
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
              {scriptMode === "latin"
                ? selectedLang.sampleLatin
                : selectedLang.sampleHindi}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand font-medium">
              <Sparkles className="size-3.5" />
              <span>Full font glyph guarantee — no tofu blocks (□)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-4 text-success" />
              <span>Auto-detects Hindi, Hinglish, & regional speech</span>
            </div>

            <Link
              href="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-semibold text-brand-foreground shadow-md transition-opacity hover:opacity-90"
            >
              Try {selectedLang.name} Captions
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
