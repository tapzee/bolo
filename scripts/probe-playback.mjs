/**
 * Reproduces "video freezes while captions keep animating when a word is edited".
 *
 * Starts playback, samples the <video> element's currentTime and the Remotion
 * frame together, then types into a word and samples again. If the frame keeps
 * advancing while currentTime stalls, the caption clock and the video element
 * have desynced — which is exactly what the user sees.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? "./probe";
const BASE = process.argv[3] ?? "http://127.0.0.1:3111";
const CLIP = join(OUT, "probe-clip.webm");
await mkdir(OUT, { recursive: true });

const WORDS = [
  ["नमस्ते", 240, 900, 0.97],
  ["दोस्तों", 1000, 1800, 0.95],
  ["आज", 1900, 2600, 0.93],
  ["मैं", 2700, 3400, 0.91],
  ["आपको", 3500, 4200, 0.96],
  ["बताऊंगा", 4300, 5200, 0.88],
].map(([text, startMs, endMs, confidence]) => ({
  text,
  startMs,
  endMs,
  timestampMs: Math.round((startMs + endMs) / 2),
  confidence,
}));

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1150 } });

await page.route("**/api/transcribe", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      languageCode: "hi",
      languageProbability: 0.98,
      text: WORDS.map((w) => w.text).join(" "),
      words: WORDS,
      durationSeconds: 6,
      creditsCharged: 1,
    }),
  }),
);

await page.goto(`${BASE}/create`, { waitUntil: "domcontentloaded" });

if (!existsSync(CLIP)) {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext("2d");
    let f = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = `hsl(${(f * 4) % 360} 45% 30%)`;
      ctx.fillRect(0, 0, 720, 1280);
      f += 1;
    }, 33);
    const ac = new AudioContext();
    await ac.resume();
    const osc = ac.createOscillator();
    const dest = ac.createMediaStreamDestination();
    osc.connect(dest);
    osc.start();
    const stream = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    await new Promise((r) => setTimeout(r, 7000));
    rec.stop();
    await done;
    clearInterval(timer);
    osc.stop();
    await ac.close();
    const buf = await new Blob(chunks, { type: "video/webm" }).arrayBuffer();
    let s = "";
    const b = new Uint8Array(buf);
    for (let i = 0; i < b.length; i += 1) s += String.fromCharCode(b[i]);
    return btoa(s);
  });
  await writeFile(CLIP, Buffer.from(base64, "base64"));
}

await page.setInputFiles('input[type="file"]', CLIP);
await page.waitForSelector("[data-word-index]", { timeout: 120_000 });
await page.waitForTimeout(1500);

const sample = () =>
  page.evaluate(() => {
    const v = document.querySelector("video");
    return {
      currentTime: v ? Number(v.currentTime.toFixed(3)) : null,
      paused: v ? v.paused : null,
      readyState: v ? v.readyState : null,
      videoCount: document.querySelectorAll("video").length,
    };
  });

console.log("--- baseline (before play) ---");
console.log(await sample());

await page.getByTitle(/^Play/).click();
await page.waitForTimeout(1200);

const during = await sample();
console.log("--- playing ---");
console.log(during);

// Select a word, then restart playback from the top — clicking a word seeks,
// which would otherwise be mistaken for the video advancing on its own.
await page.locator('[title^="बताऊंगा"]').click();
await page.waitForTimeout(300);
await page.evaluate(() => {
  const v = document.querySelector("video");
  if (v) v.currentTime = 0.5;
});
await page.getByTitle(/^Play/).click().catch(() => undefined);
await page.waitForTimeout(800);

// Type character by character, sampling throughout. `fill()` sets the value in
// one shot and misses the per-keystroke re-render storm entirely.
const input = page.getByTestId("word-text-input");
await input.click();
const trace = [];
for (const ch of "समझाऊंगा") {
  await input.press(ch).catch(async () => {
    await input.type(ch);
  });
  await page.waitForTimeout(180);
  trace.push(await sample());
}

console.log("--- currentTime during per-keystroke typing ---");
for (const t of trace) {
  console.log(`   t=${t.currentTime}  paused=${t.paused}`);
}

await page.waitForTimeout(900);
const after = await sample();
console.log("--- after editing a word ---");
console.log(after);

const stalls = trace.filter((t, i) => i > 0 && t.currentTime === trace[i - 1].currentTime);
console.log(`   stalled samples: ${stalls.length} / ${trace.length - 1}`);

const advanced =
  during.currentTime !== null &&
  after.currentTime !== null &&
  after.currentTime > during.currentTime + 0.2;

console.log("");
console.log(
  advanced
    ? "OK   video kept playing through the edit"
    : "BUG  video stalled: currentTime did not advance after the edit",
);
console.log(`     paused before=${during.paused} after=${after.paused}`);
console.log(
  `     <video> elements: before=${during.videoCount} after=${after.videoCount}`,
);

await browser.close();
