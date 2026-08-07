/**
 * End-to-end check of the upload → extract → transcribe pipeline.
 *
 * Generates a real WebM (canvas video track + oscillator audio track) using
 * Chrome's own MediaRecorder, then drives the actual /create flow with it.
 * Using a genuinely encoded file matters: a hand-made buffer would not exercise
 * container demuxing, which is most of what ffmpeg.wasm is doing here.
 *
 * The tone is not speech, so a correct run ends at "No speech detected" —
 * that outcome still proves probe, extraction, upload and the API round trip
 * all work. Accuracy needs real Hinglish audio.
 *
 *   npm run build && npm run start
 *   node scripts/e2e-upload.mjs <outDir> [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = process.argv[2] ?? "./e2e";
const BASE = process.argv[3] ?? "http://127.0.0.1:3111";
const VIDEO_PATH = join(OUT, "test-clip.webm");

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: [
    "--autoplay-policy=no-user-gesture-required",
    "--use-fake-ui-for-media-stream",
  ],
});

const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${String(e)}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

// ---------------------------------------------------------------------------
// 1. Record a real portrait clip with an audio track.
// ---------------------------------------------------------------------------
console.log("recording test clip…");
await page.goto(`${BASE}/create`, { waitUntil: "networkidle" });

const base64 = await page.evaluate(async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");

  let frame = 0;
  const draw = () => {
    ctx.fillStyle = `hsl(${(frame * 2) % 360} 45% 22%)`;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.fillStyle = "white";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`frame ${frame}`, 360, 640);
    frame += 1;
  };
  const timer = setInterval(draw, 1000 / 30);

  const videoStream = canvas.captureStream(30);

  const audioCtx = new AudioContext();
  await audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const dest = audioCtx.createMediaStreamDestination();
  osc.type = "sine";
  osc.frequency.value = 220;
  osc.connect(dest);
  osc.start();

  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  recorder.start();
  await new Promise((r) => setTimeout(r, 4000));
  recorder.stop();
  await done;

  clearInterval(timer);
  osc.stop();
  await audioCtx.close();

  const blob = new Blob(chunks, { type: "video/webm" });
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
});

const videoBytes = Buffer.from(base64, "base64");
await writeFile(VIDEO_PATH, videoBytes);
console.log(`  wrote ${VIDEO_PATH} (${(videoBytes.length / 1024).toFixed(0)} KB)`);

// ---------------------------------------------------------------------------
// 2. Drive the real upload flow.
// ---------------------------------------------------------------------------
console.log("driving /create…");
await page.goto(`${BASE}/create`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${OUT}/1-dropzone.png` });

await page.setInputFiles('input[type="file"]', VIDEO_PATH);

// Extraction downloads a 31MB core on first use, so allow real time.
const deadline = Date.now() + 120_000;
let last = "";
let settled = false;

while (Date.now() < deadline) {
  const text = await page.locator("main").innerText().catch(() => "");
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat !== last) {
    console.log("  ·", flat.slice(0, 160));
    last = flat;
  }
  if (/No speech detected|Transcript|Couldn't process/i.test(flat)) {
    settled = true;
    break;
  }
  await page.waitForTimeout(700);
}

await page.screenshot({ path: `${OUT}/2-result.png`, fullPage: true });

console.log("");
console.log("settled:", settled);
console.log("PAGE ERRORS:", errors.length ? errors.join("\n") : "none");

await browser.close();
