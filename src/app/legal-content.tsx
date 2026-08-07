import {
  MAX_TRANSCRIBABLE_SECONDS,
  PASS_CREDITS,
  PASS_PRICE_PAISE,
  PLAN_ENTITLEMENTS,
  PLAN_MONTHLY_CREDITS,
  PLAN_PRICE_PAISE,
  TOPUP_CREDITS,
  TOPUP_PRICE_PAISE,
  formatAllowance,
  formatPaise,
  secondsForCredits,
} from "@/core";

/**
 * Business details shown on legal and contact pages.
 *
 * PLACEHOLDERS BELOW MUST BE REPLACED WITH REAL DETAILS BEFORE SUBMITTING TO
 * RAZORPAY. Razorpay's merchant review verifies the registered entity name,
 * operating address and contact number against the documents you submit, and a
 * mismatch is one of the most common rejection reasons.
 *
 * They were deliberately left as obvious placeholders rather than filled with
 * plausible-looking values: a fabricated address on a live policy page is a
 * false business record, and it would fail review anyway.
 */
export const BUSINESS = {
  legalName: "[YOUR REGISTERED BUSINESS NAME]",
  tradeName: "Bolo",
  address: "[YOUR REGISTERED ADDRESS, CITY, STATE, PIN]",
  email: "[YOUR SUPPORT EMAIL]",
  phone: "[YOUR SUPPORT PHONE]",
  /** Optional — omit the row entirely if not registered. */
  gstin: "[YOUR GSTIN, IF APPLICABLE]",
  supportHours: "Monday to Friday, 10:00–18:00 IST",
} as const;

/**
 * Every transcription figure below is computed from the billing constants
 * rather than typed out.
 *
 * It used to be typed out, and it was wrong: Starter advertised "150 minutes"
 * while 150 credits at 12 seconds each buy 30. Nobody had touched the copy when
 * the constants moved, and nothing could have caught it — the numbers only
 * existed as prose. Deriving them means the pricing page cannot disagree with
 * what the API actually grants.
 *
 * The ₹9 one-off "single export" is deliberately absent. It is a *count* of
 * watermark-free exports, and export runs entirely in the browser with no
 * server call to decrement against, so there is nowhere honest to enforce "one".
 * The 7-day pass has no such problem: it is time-boxed, and time is checked
 * against a stored expiry. Selling it needs a server-side export counter first.
 */
const minutesLine = (credits: number): string =>
  `${formatAllowance(secondsForCredits(credits))} of transcription`;

export const PLANS = [
  {
    id: "pass",
    name: "7-day pass",
    price: formatPaise(PASS_PRICE_PAISE.week),
    cadence: "7 days",
    blurb: "Unlimited watermark-free exports for a week.",
    features: [
      `${minutesLine(PASS_CREDITS.week)}`,
      "Unlimited watermark-free exports",
      "All 54 caption templates",
      "SRT subtitle download",
      "No auto-renew — it just ends",
    ],
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: formatPaise(PLAN_PRICE_PAISE.starter),
    cadence: "per month",
    blurb: "For creators posting a few reels a week.",
    features: [
      `${minutesLine(PLAN_MONTHLY_CREDITS.starter)} / month`,
      "Unlimited watermark-free exports",
      "Up to 1080p export",
      `${PLAN_ENTITLEMENTS.starter.customFonts} custom fonts`,
      "Cloud-saved projects",
    ],
    highlight: false,
  },
  {
    id: "editor",
    name: "Editor",
    price: formatPaise(PLAN_PRICE_PAISE.editor),
    cadence: "per month",
    blurb: "For creators posting daily.",
    features: [
      `${minutesLine(PLAN_MONTHLY_CREDITS.editor)} / month`,
      "Unlimited watermark-free exports",
      "Up to 4K export on desktop",
      `${PLAN_ENTITLEMENTS.editor.customFonts} custom fonts · 2 devices`,
      "Email support",
    ],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: formatPaise(PLAN_PRICE_PAISE.pro),
    cadence: "per month",
    blurb: "For daily creators and small agencies.",
    features: [
      `${minutesLine(PLAN_MONTHLY_CREDITS.pro)} / month`,
      "Unlimited watermark-free exports",
      "Up to 4K export on desktop",
      `${PLAN_ENTITLEMENTS.pro.customFonts} custom fonts · 3 devices`,
      "Priority email support",
    ],
    highlight: false,
  },
] as const;

/** Shown under the plan grid — the way out when a balance runs dry mid-cycle. */
export const TOPUP_LINE = `Out mid-month? Add ${formatAllowance(
  secondsForCredits(TOPUP_CREDITS),
)} for ${formatPaise(TOPUP_PRICE_PAISE)}, any time. Or upgrade and pay only the difference.`;

export const FAQS = [
  {
    q: "Does my video get uploaded to your servers?",
    a: "No. Your video file never leaves your browser. Bolo extracts just the audio track on your device and sends only that (a few hundred kilobytes) for transcription. Rendering and export also happen entirely on your device.",
  },
  {
    q: "How well does it handle Hindi and Hinglish?",
    a: "Bolo is built for it. Transcription is tuned for Hindi and code-mixed Hinglish speech, and every caption font falls back to Noto Sans Devanagari so Hindi text never breaks — even in fonts that carry no Devanagari glyphs of their own.",
  },
  {
    q: "Which languages are supported?",
    a: "15 Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese and Urdu, plus 36 more world languages. Auto-detect is also available.",
  },
  {
    q: "What video formats can I upload?",
    a: `MP4, MOV, WebM, MKV, M4V, AVI and 3GP, up to ${Math.floor(
      MAX_TRANSCRIBABLE_SECONDS / 60,
    )} minutes. Very large files may hit your browser's memory limit — a shorter clip usually solves it.`,
  },
  {
    q: "What is the watermark?",
    a: "Free exports carry a small “Made with Bolo” mark at the bottom of the frame. Any paid plan removes it.",
  },
  {
    q: "Can I edit the captions before exporting?",
    a: "Yes. You can fix any word's text, drag its timing, recolour individual words, split and merge lines, delete or insert words, and move the caption block anywhere on the frame. Undo and redo work throughout.",
  },
  {
    q: "Do I need an account?",
    a: "No. Upload, transcribe, edit and export all work without signing in. An account adds cloud-saved projects so your work survives clearing your browser.",
  },
  {
    q: "Which browsers work for export?",
    a: "Export uses WebCodecs, which needs a recent Chrome or Edge on desktop. 4K export is desktop-only because of the memory it needs.",
  },
] as const;
