/**
 * Visual QA capture.
 *
 * Screenshots the deterministic /dev/frames grid across backdrops and aspects,
 * plus the studio UI in both themes. Run against a built server so what is
 * captured is what ships:
 *
 *   npm run build && npm run start
 *   node scripts/visual-qa.mjs <outputDir> [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "./visual-qa";
const BASE = process.argv[3] ?? "http://127.0.0.1:3111";

mkdirSync(OUT, { recursive: true });

const FRAME_SHOTS = [
  { name: "01-reel-studio", url: "/dev/frames?aspect=reel&backdrop=studio" },
  { name: "02-reel-bright", url: "/dev/frames?aspect=reel&backdrop=bright" },
  { name: "03-reel-busy", url: "/dev/frames?aspect=reel&backdrop=busy" },
  {
    name: "04-landscape-studio",
    url: "/dev/frames?aspect=landscape&backdrop=studio&t=5000",
  },
  { name: "05-square-busy", url: "/dev/frames?aspect=square&backdrop=busy&t=2700" },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1500, height: 1200 },
  deviceScaleFactor: 2,
});

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

for (const shot of FRAME_SHOTS) {
  await page.goto(BASE + shot.url, { waitUntil: "networkidle" });
  // Webfonts must resolve before glyph rendering can be judged — otherwise we
  // would be screenshotting the fallback face and calling it a pass.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
  console.log("shot", shot.name);
}

await page.goto(`${BASE}/styles`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/10-studio-dark.png` });
console.log("shot 10-studio-dark");

await page.evaluate(() => document.documentElement.classList.remove("dark"));
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/11-studio-light.png` });
console.log("shot 11-studio-light");

console.log("PAGE ERRORS:", errors.length ? errors.join("\n") : "none");

await browser.close();
