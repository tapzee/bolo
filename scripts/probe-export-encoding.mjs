/**
 * Measures what the H.264 encoder actually does with the config Remotion hands
 * it, versus the one `src/lib/export/encoder-config.ts` substitutes.
 *
 * The phone report was "the exported video plays with a judder", and the
 * suspicion is the bitrate: Remotion pins 3 Mbit/s on Safari and passes nothing
 * at all elsewhere, so this encodes the same moving frames three ways and reports
 * the bitrate each one really produced. Run it on a desktop to confirm the PC
 * path is not also being starved.
 *
 *   node scripts/probe-export-encoding.mjs
 *
 * No dev server needed — it drives WebCodecs directly in Chromium.
 */
import { chromium } from "playwright";

const FRAMES = 90;
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");

const results = await page.evaluate(
  async ({ frames, fps, width, height }) => {
    if (typeof VideoEncoder === "undefined") return { error: "no WebCodecs" };

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Real motion, or the rate controller has nothing to spend bits on and every
    // config looks identical. A panning gradient plus moving noise blocks is
    // roughly as hard to encode as hand-held phone footage.
    const paint = (i) => {
      const t = i / frames;
      const grad = ctx.createLinearGradient(0, t * height, width, height);
      grad.addColorStop(0, "#123");
      grad.addColorStop(1, "#c94");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (let n = 0; n < 220; n++) {
        const seed = (n * 9301 + i * 49297) % 233280;
        const rand = seed / 233280;
        ctx.fillStyle = `hsl(${(rand * 360) | 0} 80% ${40 + rand * 40}%)`;
        ctx.fillRect(
          (rand * width + i * 11) % width,
          (rand * height + i * 23) % height,
          90,
          90,
        );
      }

      ctx.fillStyle = "#fff";
      ctx.font = "700 120px sans-serif";
      ctx.fillText(`frame ${i}`, 60, 300 + Math.sin(i / 4) * 120);
    };

    const measure = async (label, config) => {
      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported) return { label, supported: false };

      let bytes = 0;
      let chunks = 0;
      let keyframes = 0;
      let error = null;

      const encoder = new VideoEncoder({
        output: (chunk) => {
          bytes += chunk.byteLength;
          chunks += 1;
          if (chunk.type === "key") keyframes += 1;
        },
        error: (err) => {
          error = String(err);
        },
      });

      encoder.configure(config);

      const started = performance.now();
      for (let i = 0; i < frames; i++) {
        paint(i);
        const frame = new VideoFrame(canvas, {
          timestamp: Math.round((i / fps) * 1_000_000),
          duration: Math.round(1_000_000 / fps),
        });
        // Same 40-frame keyframe cadence Remotion forces.
        encoder.encode(frame, { keyFrame: i % 40 === 0 });
        frame.close();
        if (encoder.encodeQueueSize > 10) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      await encoder.flush();
      const elapsedMs = performance.now() - started;
      encoder.close();

      return {
        label,
        supported: true,
        error,
        codec: config.codec,
        requestedBitrate: config.bitrate ?? null,
        chunks,
        keyframes,
        bytes,
        measuredBitrate: Math.round((bytes * 8) / (frames / fps)),
        elapsedMs: Math.round(elapsedMs),
      };
    };

    const base = { width, height, framerate: fps };

    return {
      hardware: await VideoEncoder.isConfigSupported({
        ...base,
        codec: "avc1.640034",
        hardwareAcceleration: "prefer-hardware",
      }),
      results: [
        await measure("remotion / desktop (no bitrate, level 5.2)", {
          ...base,
          codec: "avc1.640034",
        }),
        await measure("remotion / iPhone (3 Mbit/s, level 5.2)", {
          ...base,
          codec: "avc1.640034",
          bitrate: 3_000_000,
        }),
        await measure("bolo tuned (7.5 Mbit/s VBR, level 4.0)", {
          ...base,
          codec: "avc1.640028",
          bitrate: Math.round(width * height * fps * 0.12),
          bitrateMode: "variable",
        }),
      ],
    };
  },
  { frames: FRAMES, fps: FPS, width: WIDTH, height: HEIGHT },
);

await browser.close();

if (results.error) {
  console.error(results.error);
  process.exit(1);
}

console.log(`\n${WIDTH}x${HEIGHT} @ ${FPS}fps, ${FRAMES} frames (${FRAMES / FPS}s)\n`);
console.log(
  `prefer-hardware supported: ${results.hardware.supported === true ? "yes" : "no (software encode)"}\n`,
);

for (const row of results.results) {
  if (row.supported !== true) {
    console.log(`${row.label}\n  unsupported on this machine\n`);
    continue;
  }
  const mbit = (row.measuredBitrate / 1_000_000).toFixed(2);
  const asked =
    row.requestedBitrate === null
      ? "unset (browser default)"
      : `${(row.requestedBitrate / 1_000_000).toFixed(2)} Mbit/s`;
  console.log(
    `${row.label}\n` +
      `  codec ${row.codec}, asked ${asked}\n` +
      `  produced ${mbit} Mbit/s (${(row.bytes / 1_048_576).toFixed(1)} MiB), ` +
      `${row.chunks} chunks, ${row.keyframes} keyframes, ${row.elapsedMs} ms` +
      (row.error === null ? "" : `\n  encoder error: ${row.error}`) +
      "\n",
  );
}
