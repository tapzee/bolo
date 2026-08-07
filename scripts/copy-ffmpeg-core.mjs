/**
 * Copies the ffmpeg.wasm core into `public/ffmpeg/`.
 *
 * ffmpeg.wasm defaults to pulling its core from a public CDN at runtime. We
 * self-host instead for three reasons: the CDN is a third-party dependency in
 * the critical path of the app's main feature, it is slow and intermittently
 * blocked on Indian mobile networks, and pinning the bytes to the installed
 * package version stops a silent upstream change from breaking extraction.
 *
 * Runs automatically before `dev` and `build`. The output is gitignored — it is
 * a build artefact reproducible from node_modules.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "@ffmpeg", "core", "dist", "umd");
const dest = join(root, "public", "ffmpeg");

// UMD, not ESM: ffmpeg.wasm's internal worker pulls the core in with
// importScripts(), which cannot load an ES module.
const FILES = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!existsSync(src)) {
  console.error(
    "@ffmpeg/core not found. Run `npm install` first — it is a devDependency.",
  );
  process.exit(1);
}

await mkdir(dest, { recursive: true });

for (const file of FILES) {
  await copyFile(join(src, file), join(dest, file));
  console.log(`ffmpeg core → public/ffmpeg/${file}`);
}
