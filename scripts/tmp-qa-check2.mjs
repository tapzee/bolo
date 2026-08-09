import { chromium } from "playwright";

const OUT_DIR = "C:\\Users\\jayan\\AppData\\Local\\Temp\\claude\\f--bolo\\58df5577-ee36-4764-a4ca-9c91877a580a\\scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.goto("http://localhost:3111/dev/frames?w=380&t=5000", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

for (const label of ["Bold Yellow", "Pop", "Glow"]) {
  const fig = page.locator("figure", { hasText: label }).first();
  if ((await fig.count()) === 0) {
    console.log(`MISSING: ${label}`);
    continue;
  }
  const safe = label.replace(/\s+/g, "-").toLowerCase();
  await fig.screenshot({ path: `${OUT_DIR}\\qa-orig-${safe}.png` });
  console.log(`OK: ${label}`);
}

await browser.close();
