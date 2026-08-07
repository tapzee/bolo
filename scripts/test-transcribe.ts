/**
 * End-to-end check of /api/transcribe against a real audio file.
 *
 * Deliberately goes through the HTTP route rather than calling ElevenLabs
 * directly, so it exercises the validation, error mapping, credit charge and
 * transform exactly as the browser will.
 *
 *   npm run dev              # in another terminal
 *   npm run test:transcribe -- ./sample.m4a
 *   npm run test:transcribe -- ./sample.m4a hi http://localhost:3000
 */
import { basename, extname } from "node:path";
import { readFile, stat } from "node:fs/promises";

interface TranscribedWord {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: number | null;
}

interface SuccessBody {
  ok: true;
  languageCode: string;
  languageProbability: number;
  text: string;
  words: TranscribedWord[];
  durationSeconds: number;
  creditsCharged: number;
}

interface FailureBody {
  ok: false;
  code: string;
  message: string;
  retryAfterMs?: number;
}

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
};

/** Rough Scribe list price, matching the route's server-side estimate. */
const USD_PER_AUDIO_HOUR = 0.4;

const fmt = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;

const main = async (): Promise<void> => {
  const [filePath, language = "hi", baseUrl = "http://localhost:3000"] =
    process.argv.slice(2);

  if (!filePath) {
    console.error(
      "Usage: npm run test:transcribe -- <audio-file> [languageCode] [baseUrl]",
    );
    process.exit(1);
  }

  const info = await stat(filePath).catch(() => null);
  if (info === null || !info.isFile()) {
    console.error(`No such file: ${filePath}`);
    process.exit(1);
  }

  const ext = extname(filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const bytes = await readFile(filePath);

  console.log("→ file      ", basename(filePath));
  console.log("→ size      ", `${(info.size / 1024 / 1024).toFixed(2)} MB`);
  console.log("→ mime      ", mime);
  console.log("→ language  ", language);
  console.log("→ endpoint  ", `${baseUrl}/api/transcribe`);
  console.log("");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), basename(filePath));
  form.append("language_code", language);

  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/api/transcribe`, {
    method: "POST",
    body: form,
  }).catch((error: unknown) => {
    console.error("Request failed. Is the dev server running?", error);
    process.exit(1);
  });

  const elapsedMs = Date.now() - startedAt;
  const body = (await response.json()) as SuccessBody | FailureBody;

  if (!body.ok) {
    console.error(`✗ ${response.status} ${body.code}`);
    console.error(`  ${body.message}`);
    if (body.retryAfterMs !== undefined) {
      console.error(`  retry after ${fmt(body.retryAfterMs)}`);
    }
    process.exit(1);
  }

  const estimatedUsd = (body.durationSeconds / 3600) * USD_PER_AUDIO_HOUR;
  const withConfidence = body.words.filter((w) => w.confidence !== null);

  console.log("✓ transcribed in", fmt(elapsedMs));
  console.log("");
  console.log("  detected language ", body.languageCode, `(p=${body.languageProbability.toFixed(3)})`);
  console.log("  total words       ", body.words.length);
  console.log("  audio duration    ", `${body.durationSeconds.toFixed(2)}s`);
  console.log("  credits charged   ", body.creditsCharged);
  console.log("  estimated cost    ", `$${estimatedUsd.toFixed(4)}`);
  console.log("");

  console.log("  first 10 words:");
  for (const w of body.words.slice(0, 10)) {
    const confidence =
      w.confidence === null ? "  —  " : w.confidence.toFixed(3);
    console.log(
      `    ${String(w.startMs).padStart(7)}ms → ${String(w.endMs).padStart(7)}ms` +
        `  conf ${confidence}  ${w.text}`,
    );
  }

  console.log("");
  if (withConfidence.length === 0) {
    console.log("  note: no per-word confidence reported for this response.");
  } else {
    const mean =
      withConfidence.reduce((sum, w) => sum + (w.confidence ?? 0), 0) /
      withConfidence.length;
    console.log(`  mean confidence   ${mean.toFixed(3)}`);
    const weak = withConfidence.filter((w) => (w.confidence ?? 1) < 0.6);
    console.log(`  low-confidence    ${weak.length} word(s) below 0.60`);
    if (weak.length > 0) {
      console.log(`                    ${weak.slice(0, 12).map((w) => w.text).join(", ")}`);
    }
  }

  console.log("");
  console.log("  full text:");
  console.log(`    ${body.text}`);
};

void main();
