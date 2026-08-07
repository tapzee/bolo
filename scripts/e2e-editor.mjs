/**
 * End-to-end check of the editor and the export pipeline.
 *
 * The transcription API is stubbed — it is verified separately by unit tests and
 * a live smoke test. Stubbing makes the editor reachable without real speech
 * audio and makes the run deterministic: the same words with the same timings
 * every time, so a failure means the editor changed rather than the model.
 *
 *   npm run build && npm run start
 *   node scripts/e2e-editor.mjs <outDir> [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? "./e2e";
const BASE = process.argv[3] ?? "http://127.0.0.1:3111";
const CLIP = join(OUT, "editor-clip.webm");

await mkdir(OUT, { recursive: true });

const WORDS = [
  ["नमस्ते", 240, 660, 0.97],
  ["दोस्तों", 720, 1200, 0.95],
  ["आज", 1520, 1780, 0.93],
  ["मैं", 1820, 2040, 0.91],
  ["आपको", 2070, 2370, 0.96],
  ["बताऊंगा", 2410, 2930, 0.88],
  ["income", 3000, 3420, 0.52],
  ["कैसे", 3460, 3760, 0.94],
  ["double", 3800, 4200, 0.9],
  ["करें", 4240, 4560, 0.92],
].map(([text, startMs, endMs, confidence]) => ({
  text,
  startMs,
  endMs,
  timestampMs: Math.round((startMs + endMs) / 2),
  confidence,
}));

const FAKE = {
  ok: true,
  languageCode: "hi",
  languageProbability: 0.98,
  text: WORDS.map((w) => w.text).join(" "),
  words: WORDS,
  durationSeconds: 6,
  creditsCharged: 1,
};

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1150 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${String(e)}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.route("**/api/transcribe", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(FAKE),
  }),
);

// `domcontentloaded`, not `networkidle`: Firebase auth holds an open connection
// once configured, so the network never goes idle and networkidle would hang.
await page.goto(`${BASE}/create`, { waitUntil: "domcontentloaded" });

// --- Produce a clip with a real audio track, if we do not have one ----------
if (!existsSync(CLIP)) {
  console.log("recording clip…");
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = `hsl(${(frame * 3) % 360} 40% 25%)`;
      ctx.fillRect(0, 0, 720, 1280);
      frame += 1;
    }, 1000 / 30);

    const audioCtx = new AudioContext();
    await audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const dest = audioCtx.createMediaStreamDestination();
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
    await new Promise((r) => setTimeout(r, 6000));
    rec.stop();
    await done;
    clearInterval(timer);
    osc.stop();
    await audioCtx.close();

    const buf = await new Blob(chunks, { type: "video/webm" }).arrayBuffer();
    let s = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  });
  await writeFile(CLIP, Buffer.from(base64, "base64"));
}

// --- Drive the editor -------------------------------------------------------
console.log("uploading…");
await page.setInputFiles('input[type="file"]', CLIP);

// Caption line chips only exist once the pipeline is done and pages are built.
// Deliberately not keyed to a button label — those move whenever the rail is
// restructured, and this check should survive a redesign.
await page.waitForSelector("[data-word-index]", { timeout: 120_000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/editor-1-loaded.png` });

const check = (label, actual, expected) => {
  const pass = actual === expected;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}: ${actual}`);
  return pass;
};

let ok = true;

const wordCount = await page.locator('[title*="ms"]').count();
ok = check("words on timeline", wordCount, WORDS.length) && ok;

// Wording-tolerant: this asserts the low-confidence signal exists, not the
// exact copy, which has already been reworded once mid-project.
const toCheck = await page
  .getByText(/low-confidence|to (check|verify)/i)
  .count();
ok = check("low-confidence flagged", toCheck > 0, true) && ok;

await page.locator('[title^="बताऊंगा"]').click();
await page.waitForTimeout(400);
// Keyed to the input itself, not a heading — headings move when the rail is
// restructured, and this should be testing the inspector, not its label.
const inspectorVisible = await page.getByTestId("word-text-input").count();
ok = check("inspector opened", inspectorVisible > 0, true) && ok;

await page.screenshot({ path: `${OUT}/editor-2-selected.png` });

// Located structurally, not by value: React updates the value *property* rather
// than the attribute, so `input[value=…]` stops matching once anything is typed.
const textInput = page.getByTestId("word-text-input");
await textInput.fill("समझाऊंगा");
await page.keyboard.press("Enter");
await page.waitForTimeout(600);

const renamed = await page.locator('[title^="समझाऊंगा"]').count();
ok = check("text edit applied to timeline", renamed, 1) && ok;

await page.locator('button[aria-label="Mint"]').click();
await page.waitForTimeout(400);
const pressed = await page
  .locator('button[aria-label="Mint"][aria-pressed="true"]')
  .count();
ok = check("colour override set", pressed, 1) && ok;

await page.screenshot({ path: `${OUT}/editor-3-edited.png` });

await page.keyboard.press("Control+z");
await page.waitForTimeout(300);
await page.keyboard.press("Control+z");
await page.waitForTimeout(500);
const restored = await page.locator('[title^="बताऊंगा"]').count();
ok = check("undo restored original text", restored, 1) && ok;

await page.keyboard.press("Control+Shift+z");
await page.waitForTimeout(500);
const redone = await page.locator('[title^="समझाऊंगा"]').count();
ok = check("redo reapplied edit", redone, 1) && ok;

await page.locator('[title^="income"]').click();
await page.waitForTimeout(300);
await page.locator("text=Delete word").click();
await page.waitForTimeout(500);
const afterDelete = await page.locator('[title*="ms"]').count();
ok = check("delete removed a word", afterDelete, WORDS.length - 1) && ok;

await page.waitForTimeout(3000);
const saved = await page.locator("text=Saved").count();
ok = check("autosave reported", saved > 0, true) && ok;

const lineChips = await page.locator("[data-word-index]").count();
ok = check("caption lines panel rendered", lineChips > 0, true) && ok;

// Playback must actually drive the playhead. This regressed silently once: the
// Player mounts behind a dynamic import, so the ref was null when the listener
// effect ran and — a ref's identity never changing — it never re-ran.
const playheadBefore = await page.evaluate(
  () => document.querySelector(".will-change-transform")?.style.transform ?? "",
);
await page.getByTitle(/^Play/).click();
await page.waitForTimeout(1800);
const playheadAfter = await page.evaluate(
  () => document.querySelector(".will-change-transform")?.style.transform ?? "",
);
ok =
  check(
    "playhead follows playback",
    playheadAfter !== playheadBefore && playheadAfter !== "",
    true,
  ) && ok;
await page.getByTitle(/^Pause/).click().catch(() => undefined);

await page.screenshot({ path: `${OUT}/editor-4-final.png`, fullPage: true });

// --- Real export ------------------------------------------------------------
// Encodes an actual MP4 through WebCodecs. The only check that proves the canvas
// caption renderer, the frame contract and the muxer work together.
console.log("");
console.log("exporting…");

const downloadPromise = page.waitForEvent("download", { timeout: 180_000 });
await page.getByRole("button", { name: "Export", exact: true }).click();

let exported = null;
try {
  const download = await downloadPromise;
  exported = join(OUT, "exported.mp4");
  await download.saveAs(exported);
} catch (error) {
  console.log("  FAIL  export produced no download:", String(error).slice(0, 200));
  ok = false;
}

if (exported !== null) {
  const { size } = await stat(exported);
  ok = check("exported file is non-trivial", size > 20_000, true) && ok;
  console.log(`        ${(size / 1024).toFixed(0)} KB`);

  const bytes = Array.from(await readFile(exported));

  const probe = await page.evaluate(async (data) => {
    const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const result = await new Promise((resolve) => {
      video.onloadedmetadata = () =>
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      video.onerror = () => resolve(null);
      video.src = url;
      setTimeout(() => resolve(null), 15000);
    });

    URL.revokeObjectURL(url);
    return result;
  }, bytes);

  if (probe === null) {
    console.log("  FAIL  exported MP4 could not be decoded");
    ok = false;
  } else {
    console.log(
      `        decoded ${probe.width}x${probe.height} · ${probe.duration.toFixed(2)}s`,
    );
    ok = check("exported MP4 decodes", probe.width > 0, true) && ok;
    ok =
      check(
        "exported duration is sane",
        probe.duration > 1 && probe.duration < 30,
        true,
      ) && ok;
  }

  // THE check that matters. A file that decodes proves nothing about whether
  // captions were burned in — Remotion silently copying the video track once
  // produced a perfectly valid MP4 with no captions at all.
  //
  // Several times are sampled because the test deletes a word, opening a gap in
  // the transcript that a single fixed timestamp can land in.
  const pixels = await page.evaluate(async (data) => {
    const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.src = url;

    await new Promise((resolve) => {
      video.onloadeddata = resolve;
      video.onerror = resolve;
      setTimeout(resolve, 10000);
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    const samples = [];
    let best = { bright: 0, dump: "" };

    for (const t of [1.0, 2.6, 4.0]) {
      video.currentTime = t;
      await new Promise((resolve) => {
        video.onseeked = resolve;
        setTimeout(resolve, 5000);
      });

      ctx.drawImage(video, 0, 0);
      const half = Math.floor(canvas.height / 2);
      const pix = ctx.getImageData(0, half, canvas.width, canvas.height - half)
        .data;

      let bright = 0;
      for (let i = 0; i < pix.length; i += 4) {
        if (pix[i] > 200 && pix[i + 1] > 200 && pix[i + 2] > 200) bright += 1;
      }

      samples.push({ t, bright });
      if (bright > best.bright) {
        best = { bright, dump: canvas.toDataURL("image/png") };
      }
    }

    URL.revokeObjectURL(url);
    return { bright: best.bright, dump: best.dump, samples };
  }, bytes);

  console.log(
    `        samples: ${pixels.samples
      .map((s) => `${s.t}s=${s.bright}px`)
      .join("  ")}`,
  );

  if (pixels.dump) {
    await writeFile(
      join(OUT, "exported-frame.png"),
      Buffer.from(pixels.dump.split(",")[1], "base64"),
    );
  }

  ok =
    check("CAPTIONS ARE BURNED INTO THE PIXELS", pixels.bright > 500, true) && ok;
}

console.log("");
console.log(ok ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
console.log("PAGE ERRORS:", errors.length ? errors.join("\n") : "none");

await browser.close();
process.exit(ok ? 0 : 1);
