const { chromium } = require("playwright");
const fs = require("fs");
const zlib = require("zlib");

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let pos = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = bitDepth === 8 ? (colorType === 6 ? 4 : 3) : 1;
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++];
    const line = raw.slice(rp, rp + stride);
    const prev = y === 0 ? Buffer.alloc(stride) : out.slice((y - 1) * stride, y * stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      if (filter === 1) cur[x] = (line[x] + a) & 255;
      else if (filter === 2) cur[x] = (line[x] + b) & 255;
      else if (filter === 3) cur[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        cur[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else cur[x] = line[x];
    }
    cur.copy(out, y * stride);
    rp += stride;
  }
  return { w, h, bpp, data: out };
}

function analyze(buf) {
  const p = decodePNG(buf);
  let lit = 0, blue = 0, silver = 0, total = p.w * p.h;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const i = (y * p.w + x) * p.bpp;
      const r = p.data[i], g = p.data[i + 1], b = p.data[i + 2];
      const lum = 0.21 * r + 0.72 * g + 0.07 * b;
      if (lum > 25) lit++;
      if (b > r + 40 && b > 90 && g < 220) blue++;
      if (r > 150 && g > 150 && b > 150) silver++;
    }
  return { w: p.w, h: p.h, lit, blue, silver, total };
}

(async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  console.log("LANDING:", await page.title());

  await page.fill("input[type=text]", "Egomonk Labs");
  await page.click("button:has-text('BEGIN')");

  for (let q = 0; q < 3; q++) {
    await page.waitForSelector("h2");
    await page.click("button:has-text('A ')", { timeout: 8000 }).catch(async () => {
      const btns = await page.$$("main button");
      await btns[0].click();
    });
    await page.waitForTimeout(800);
  }

  try {
    await page.waitForSelector("text=INGESTING SIGNALS", { timeout: 5000 });
    console.log("LOADING: visible");
  } catch {
    console.log("LOADING: not visible");
  }

  // Early in the reveal: hologram phase should be glowing blue
  await page.waitForTimeout(3500);
  const holoShot = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 560 } });
  fs.writeFileSync("E:/gitprac/Egomonk/instinct-series/smoke-holo.png", holoShot);
  const h = analyze(holoShot);
  console.log("HOLOGRAM PHASE: lit=" + h.lit + "/" + h.total, "blue%=" + ((h.blue / h.total) * 100).toFixed(1) + "%");

  // All answers were 'resilience' => Cockroach archetype; let hologram fade to metal
  await page.waitForTimeout(4200);

  const header = await page.textContent("header").catch(() => "NO HEADER");
  console.log("REVEAL HEADER:", header);

  const canvasCount = await page.locator("canvas").count();
  console.log("CANVAS COUNT:", canvasCount);

  const passportText = (await page.textContent("main").catch(() => "")) || "";
  console.log("HAS INSTINCT CARD:", passportText.includes("COCKROACH") || passportText.includes("Instinct"));
  console.log("HAS QR:", await page.locator("svg").count().then((n) => n > 2));

  // Test STL download
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }).catch(() => null),
    page.click("button:has-text('.STL')").catch(() => {}),
  ]);
  if (download) console.log("STL FILENAME:", download.suggestedFilename());

  // Test PDF download
  const [pdf] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }).catch(() => null),
    page.click("button:has-text('.PDF')").catch(() => {}),
  ]);
  if (pdf) console.log("PDF FILENAME:", pdf.suggestedFilename());

  // Test RERUN reset
  await page.click("button:has-text('RERUN')");
  await page.waitForTimeout(600);
  const backToLanding = await page.locator("input[type=text]").count();
  console.log("RERUN BACK TO LANDING:", backToLanding === 1);

  console.log("ERRORS:", errors.length ? errors : "none");

  // Check applied fonts
  const fonts = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return {
      serifH1: h1 ? getComputedStyle(h1).fontFamily : "none",
      uiMono: getComputedStyle(document.body).fontFamily,
    };
  });
  console.log("FONTS:", JSON.stringify(fonts));

  // Final reveal screenshot (metallic phase)
  const full = analyze(await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 560 } }));
  console.log("FINAL SHOT: lit=" + full.lit + "/" + full.total,
    "blue%=" + ((full.blue / full.total) * 100).toFixed(1) + "%",
    "silver%=" + ((full.silver / full.total) * 100).toFixed(1) + "%");

  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error("SMOKE FAIL:", e.message);
  process.exit(1);
});