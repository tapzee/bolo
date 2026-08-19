"use client";

import { useState } from "react";
import { Sparkles, Languages, Check, ArrowRight, Volume2, Globe2, Wand2, Copy, CheckCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

interface LanguageItem {
  id: string;
  name: string;
  native: string;
  script: string;
  sampleNative: string;
  sampleHinglish: string;
  tag?: string;
  speakers?: string;
}

const INDIAN_LANGUAGES: LanguageItem[] = [
  {
    id: "hinglish",
    name: "Hinglish",
    native: "Hinglish (Latin)",
    script: "Latin",
    sampleNative: "ये ट्रिक आपके रील्स को 10X वायरल करेगी",
    sampleHinglish: "Yeh trick aapke reels ko 10X viral karegi",
    tag: "🔥 Most Popular",
    speakers: "500M+ Speech Speakers",
  },
  {
    id: "hindi",
    name: "Hindi",
    native: "हिन्दी",
    script: "Devanagari",
    sampleNative: "हर शब्द पर सटीक टाइमिंग और खूबसूरत स्टाइल",
    sampleHinglish: "Har shabd par sateek timing aur khoobsurat style",
    tag: "Primary",
    speakers: "600M+ Native Speakers",
  },
  {
    id: "marathi",
    name: "Marathi",
    native: "मराठी",
    script: "Devanagari",
    sampleNative: "तुमच्या व्हिडिओसाठी सुंदर आणि अचूक कॅप्शन",
    sampleHinglish: "Tumchya video sathi sundar ani achuk caption",
    speakers: "95M+ Speakers",
  },
  {
    id: "gujarati",
    name: "Gujarati",
    native: "ગુજરાતી",
    script: "Gujarati",
    sampleNative: "તમારા રીલ્સ માટે શ્રેષ્ઠ અને સચોટ કેપ્શન",
    sampleHinglish: "Tamara reels mate shreshth ane sachot caption",
    speakers: "60M+ Speakers",
  },
  {
    id: "punjabi",
    name: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    script: "Gurmukhi",
    sampleNative: "ਤੁਹਾਡੇ ਵੀਡੀਓ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਕੈਪਸ਼ਨ",
    sampleHinglish: "Tuhade video layi sab to vadiya caption",
    speakers: "125M+ Speakers",
  },
  {
    id: "bengali",
    name: "Bengali",
    native: "বাংলা",
    script: "Bengali",
    sampleNative: "আপনার রিলসের জন্য অসাধারণ ক্যাপশন",
    sampleHinglish: "Aponar reels er jonno osadharon caption",
    speakers: "230M+ Speakers",
  },
  {
    id: "tamil",
    name: "Tamil",
    native: "தமிழ்",
    script: "Tamil",
    sampleNative: "உங்கள் ரீல்ஸ்களுக்கான சிறந்த தலைப்புகள்",
    sampleHinglish: "Ungal reels-kkana sirandha thalaippugal",
    speakers: "85M+ Speakers",
  },
  {
    id: "telugu",
    name: "Telugu",
    native: "తెలుగు",
    script: "Telugu",
    sampleNative: "మీ రీల్స్ కోసం అద్భుతమైన క్యాప్షన్లు",
    sampleHinglish: "Mee reels kosam adbhutamaina captions",
    speakers: "90M+ Speakers",
  },
  {
    id: "kannada",
    name: "Kannada",
    native: "ಕನ್ನಡ",
    script: "Kannada",
    sampleNative: "ನಿಮ್ಮ ವೀಡಿಯೊಗಳಿಗೆ ಸುಂದರವಾದ ಶೀರ್ಷಿಕೆಗಳು",
    sampleHinglish: "Nimma video-galige sundaravada sheershikegalu",
    speakers: "50M+ Speakers",
  },
  {
    id: "malayalam",
    name: "Malayalam",
    native: "മലയാളം",
    script: "Malayalam",
    sampleNative: "നിങ്ങളുടെ റീലുകൾക്കായി മികച്ച അടിക്കുറിപ്പുകൾ",
    sampleHinglish: "Ningalude reelukalkkayi mikacha adikkurippukal",
    speakers: "40M+ Speakers",
  },
];

export function LanguageShowcase() {
  const [selectedLang, setSelectedLang] = useState<LanguageItem>(INDIAN_LANGUAGES[0]!);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      {/* Background radial highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="size-[500px] rounded-full bg-emerald-500/10 blur-[130px] dark:bg-emerald-500/15" />
      </div>

      {/* Header */}
      <div className="mx-auto max-w-3xl text-center space-y-4 mb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Globe2 className="size-3.5" />
          Native Indian Language Engine
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance">
          15+ Indian Languages & Hinglish Romanization
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Switch between native Devanagari scripts and English alphabet Hinglish transliteration with a single click. Zero broken glyphs or tofu characters.
        </p>
      </div>

      {/* Interactive Language Matrix Stage */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Language Selection Pills (Scrollable / Grid) */}
        <div className="lg:col-span-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1 flex items-center justify-between">
            <span>Select Speech Language:</span>
            <span className="text-emerald-500">15+ Supported</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {INDIAN_LANGUAGES.map((lang) => {
              const isSelected = selectedLang.id === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang)}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-md ring-1 ring-emerald-500"
                      : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted font-bold text-xs text-foreground">
                      {lang.native.slice(0, 2)}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                        {lang.name}
                        {lang.tag && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-normal">
                            {lang.tag}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {lang.native} · {lang.script}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    {lang.speakers}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Script Transliteration Preview Card */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider">
                  Script Transliteration Engine
                </span>
                <h3 className="text-xl font-extrabold text-foreground mt-0.5">
                  {selectedLang.name} ({selectedLang.native})
                </h3>
              </div>

              <button
                onClick={() => handleCopy(selectedLang.sampleHinglish)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {copied ? <CheckCheck className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Script Comparison Boxes */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Native Script Box */}
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    1. Native Script ({selectedLang.script})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-background text-foreground font-semibold">
                    Original
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground pt-1 leading-relaxed">
                  {selectedLang.sampleNative}
                </p>
              </div>

              {/* Phonetic Hinglish Latin Box */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    2. Romanized Hinglish (Latin)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold">
                    Viral Mode
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground pt-1 leading-relaxed">
                  {selectedLang.sampleHinglish}
                </p>
              </div>
            </div>

            {/* Feature Checkpoints */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Check className="size-4 text-emerald-500 shrink-0" />
                <span>Automatic Hindi Schwa Deletion</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Check className="size-4 text-emerald-500 shrink-0" />
                <span>Loanword normalization (Subscribe, Video)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Check className="size-4 text-emerald-500 shrink-0" />
                <span>Indian Accent Slang Recognition</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Check className="size-4 text-emerald-500 shrink-0" />
                <span>Noto Sans Devanagari Clean Fallback</span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="pt-2">
              <Link
                href="/create"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-foreground text-background py-3.5 text-xs sm:text-sm font-bold shadow-lg hover:opacity-90 transition-all"
              >
                <Wand2 className="size-4" />
                <span>Transcribe Your {selectedLang.name} Video Now</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
