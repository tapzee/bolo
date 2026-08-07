/**
 * Proves a project can be reopened later with its video intact.
 *
 * Uploads a clip, edits a word, waits for autosave, then navigates away and
 * reopens the project from /projects. If the video comes back from IndexedDB
 * and the edited word is still there, caching works end to end.
 *
 *   npm run build && npm run start
 *   node scripts/e2e-reopen.mjs <outDir> [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? "./e2e-reopen";
const BASE = process.argv[3] ?? "http://127.0.0.1:3111";
const CLIP = join(OUT, "reopen-clip.webm");
await mkdir(OUT, { recursive: true });

const WORDS = [
  ["नमस्ते", 240, 900, 0.97],
  ["दोस्तों", 1000, 1800, 0.95],
  ["बताऊंगा", 1900, 2800, 0.88],
  ["income", 2900, 3700, 0.52],
  ["करें", 3800, 4600, 0.92],
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
// One persistent context: IndexedDB is origin-scoped, so a fresh context would
// start with an empty cache and the test would prove nothing.
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

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
      durationSeconds: 5,
      creditsCharged: 1,
    }),
  }),
);

await page.goto(`${BASE}/create`, { waitUntil: "domcontentloaded" });

if (!existsSync(CLIP)) {
  const b64 = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 1280;
    const x = c.getContext("2d");
    let f = 0;
    const t = setInterval(() => {
      x.fillStyle = `hsl(${(f * 5) % 360} 50% 30%)`;
      x.fillRect(0, 0, 720, 1280);
      f += 1;
    }, 33);
    const ac = new AudioContext();
    await ac.resume();
    const osc = ac.createOscillator();
    const dest = ac.createMediaStreamDestination();
    osc.connect(dest);
    osc.start();
    const stream = new MediaStream([
      ...c.captureStream(30).getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    await new Promise((r) => setTimeout(r, 5500));
    rec.stop();
    await done;
    clearInterval(t);
    osc.stop();
    await ac.close();
    const buf = await new Blob(chunks, { type: "video/webm" }).arrayBuffer();
    let s = "";
    const u = new Uint8Array(buf);
    for (let i = 0; i < u.length; i += 1) s += String.fromCharCode(u[i]);
    return btoa(s);
  });
  await writeFile(CLIP, Buffer.from(b64, "base64"));
}

const check = (label, ok) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  return ok;
};
let ok = true;

// --- Session 1: upload, edit, let autosave run ------------------------------
console.log("session 1: create and edit…");
await page.setInputFiles('input[type="file"]', CLIP);
await page.waitForSelector("[data-word-index]", { timeout: 120_000 });
await page.waitForTimeout(1200);

await page.locator('[title^="बताऊंगा"]').click();
await page.waitForTimeout(300);
const input = page.getByTestId("word-text-input");
await input.fill("समझाऊंगा");
await page.keyboard.press("Enter");

// Autosave is debounced at 2s; the video cache write is fire-and-forget.
await page.waitForTimeout(4000);

const cached = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const req = indexedDB.open("bolo", 1);
      req.onsuccess = () => {
        try {
          const store = req.result
            .transaction("videos", "readonly")
            .objectStore("videos");
          const all = store.getAll();
          all.onsuccess = () =>
            resolve(
              all.result.map((v) => ({ id: v.id, bytes: v.blob?.size ?? 0 })),
            );
          all.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      };
      req.onerror = () => resolve([]);
    }),
);

console.log(
  `        cached videos: ${cached.map((c) => `${(c.bytes / 1024).toFixed(0)}KB`).join(", ") || "none"}`,
);
ok = check("video written to IndexedDB", cached.length > 0 && cached[0].bytes > 10_000) && ok;

// --- Session 2: navigate away, reopen from /projects ------------------------
console.log("session 2: reopen from /projects…");
await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

const openLink = page.getByRole("link", { name: "Open" }).first();
ok = check("project appears in /projects", (await openLink.count()) > 0) && ok;

if ((await openLink.count()) > 0) {
  await openLink.click();
  await page.waitForSelector("[data-word-index]", { timeout: 60_000 });
  await page.waitForTimeout(2000);

  const videoBack = await page.evaluate(() => {
    const v = document.querySelector("video");
    return v ? { src: v.src.slice(0, 5), w: v.videoWidth, ready: v.readyState } : null;
  });
  console.log(`        restored <video>: ${JSON.stringify(videoBack)}`);
  ok =
    check(
      "video restored from cache",
      videoBack !== null && videoBack.w > 0 && videoBack.ready >= 1,
    ) && ok;

  const editKept = await page.locator('[title^="समझाऊंगा"]').count();
  ok = check("edited word survived the reopen", editKept > 0) && ok;

  await page.screenshot({ path: `${OUT}/reopened.png` });
}

console.log("");
console.log(ok ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
console.log("PAGE ERRORS:", errors.length ? errors.join("\n") : "none");

await browser.close();
process.exit(ok ? 0 : 1);
